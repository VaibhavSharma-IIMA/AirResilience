# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Sundaravalli Narayanaswami and Vaibhav Sharma
"""
Worked analysis: calibration, attribution and structural robustness.

Reproduces the three quantitative moves the demonstration study makes, using
only the framework. Nothing here is specific to the case beyond the config file
and the choice of causes.

    python examples/analysis_demo.py            # all three, about 4 minutes
    python examples/analysis_demo.py attribute  # just one
"""
from __future__ import annotations
import copy, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from airresilience.model import load_experiment
from airresilience.calibration import CalibrationSpec, ParameterSpec, Target, fit
from airresilience.metrics import attribute, replicate, structural_sweep

CONFIG = ROOT / "configs" / "indigo_bom.yaml"
SEEDS = range(101, 109)
CONGESTION = 40.0


def benign(cfg):
    """The same operation with nothing adverse switched on."""
    c = copy.deepcopy(cfg)
    c.regulation.max_duty_minutes = 780
    c.regulation.weekly_rest_days = 1
    c.conditions = {}
    c.policy.roster_mode = "compliant"
    c.policy.standby_pct = 3
    return c


CAUSES = {
    "rule change": lambda c: (setattr(c.regulation, "max_duty_minutes", 678),
                              setattr(c.regulation, "weekly_rest_days", 2), c)[-1],
    "winter fog": lambda c: (setattr(c, "conditions", {0: ["fog"], 1: ["fog"], 2: ["fog"]}), c)[-1],
    "roster not replanned": lambda c: (setattr(c.policy, "roster_mode", "legacy"), c)[-1],
    "standby withdrawn": lambda c: (setattr(c.policy, "standby_pct", 0), c)[-1],
}


def do_calibrate(cfg):
    print("\n" + "=" * 72 + "\nCALIBRATION\n" + "=" * 72)
    print("Recover the duty cut and congestion feedback from published outcomes,\n"
          "starting from the pre-change cap so the model is not told the answer.\n")
    c = copy.deepcopy(cfg)
    c.regulation.max_duty_minutes = 780
    spec = CalibrationSpec(
        parameters=[ParameterSpec("regulation.max_duty_minutes", 640, 720, step=6,
                                  note="equivalent to the FDTL cut"),
                    ParameterSpec("congestion_minutes", 20, 60, step=10)],
        targets=[Target("cancel_pct", 28.5, 2.0, note="MIAL, 1-8 December"),
                 Target("otp_pct.0", 49.5, 8.0), Target("otp_pct.1", 35.0, 8.0),
                 Target("otp_pct.2", 19.7, 8.0),
                 Target("cancel_pct.3", 27.6, 5.0, fitted=False,
                        note="never optimised against")],
        seeds=range(101, 107), max_evaluations=120)
    print(fit(c, spec, method="grid").report())


def do_attribute(cfg):
    print("\n" + "=" * 72 + "\nATTRIBUTION\n" + "=" * 72)
    b = benign(cfg)
    r = replicate(b, SEEDS, "cancel_pct", congestion_minutes=CONGESTION)
    print(f"Benign baseline: {r.describe()}\n")
    a = attribute(b, CAUSES, seeds=SEEDS, metric="cancel_pct", congestion_minutes=CONGESTION)
    print(a.report())
    print("\n  coalitions worth reading:")
    for row in a.coalition_table():
        on = [c for c in a.causes if row[c]]
        if len(on) in (0, 1, 4) or (len(on) == 3 and "standby withdrawn" not in on) \
           or set(on) == {"rule change", "winter fog"} \
           or set(on) == {"rule change", "winter fog", "standby withdrawn"}:
            print(f"    {row['outcome']:>7.2f}%   {' + '.join(on) if on else 'nothing adverse'}")
    print("\n  Note the ordering: failing to replan the roster nearly triples a")
    print("  survivable week, while withdrawing standby from a replanned airline")
    print("  costs little. Standby protects a compliant roster; it does not")
    print("  substitute for one.")


def do_sweep(cfg):
    print("\n" + "=" * 72 + "\nSTRUCTURAL ROBUSTNESS\n" + "=" * 72)
    print("Vary an invented assumption, refit to the same target, ask what holds.\n")
    spec = CalibrationSpec(
        parameters=[ParameterSpec("regulation.max_duty_minutes", 600, 740, step=10)],
        targets=[Target("cancel_pct", 28.5, 2.0)],
        seeds=range(101, 105), max_evaluations=40)
    def both(field, value):
        """Apply to the rules in force and the rules the roster was built under.

        In legacy mode duties are constructed from the baseline rule set, so a
        variant that only touched `regulation` would silently do nothing to the
        roster. This is the kind of thing a sweep exists to catch.
        """
        def f(c):
            setattr(c.regulation, field, value)
            if c.baseline_regulation:
                setattr(c.baseline_regulation, field, value)
            return c
        return f

    variants = {
        "3 legs per duty": both("max_legs_per_duty", 3),
        "5 legs per duty": both("max_legs_per_duty", 5),
        "roster 1h inside cap": both("roster_headroom_minutes", 60),
        "roster 3h inside cap": both("roster_headroom_minutes", 180),
        "repositioning 2/night": lambda c: (setattr(c.policy, "repositioning_per_night", 2), c)[-1],
        "repositioning 12/night": lambda c: (setattr(c.policy, "repositioning_per_night", 12), c)[-1],
    }
    sw = structural_sweep(cfg, variants, seeds=range(101, 105),
                          calibration_spec=spec, refit_kw={"method": "grid"},
                          congestion_minutes=CONGESTION)
    print(sw.report(["cancel_pct", "cascade_multiplier", "duties_per_day"]))


if __name__ == "__main__":
    cfg = load_experiment(CONFIG)
    which = sys.argv[1:] or ["calibrate", "attribute", "sweep"]
    for w in which:
        {"calibrate": do_calibrate, "attribute": do_attribute, "sweep": do_sweep}[w](cfg)
