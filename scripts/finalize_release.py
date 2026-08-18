#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Sundaravalli Narayanaswami and Vaibhav Sharma
"""
Replace the release placeholders everywhere at once.

Four values have to be real before the manuscript can be submitted, and each of
them appears in several files. Getting one of them out of step is the easiest
way to have a reviewer find a dead link, so set them here rather than by hand.

    python scripts/finalize_release.py --check
    python scripts/finalize_release.py \
        --repo   https://github.com/your-org/airresilience \
        --doi    https://doi.org/10.5281/zenodo.1234567 \
        --email  airresilience@iima.ac.in \
        --version 1.0.0

--check reports which placeholders are still outstanding and exits non-zero if
any remain, so it can gate the submission.

After running this, regenerate the manuscript:

    cd paper && node gen_paper.js
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

FILES = [
    "paper/gen_paper.js",
    "CITATION.cff",
    "codemeta.json",
    "pyproject.toml",
    "airresilience/__init__.py",
    "README.md",
]

# Anything matching these is still a placeholder.
PLACEHOLDERS = {
    "repository": re.compile(r"GROUP-G-IIMA"),
    "Zenodo DOI": re.compile(r"zenodo\.XXXXXXX"),
    "article DOI": re.compile(r"softx\.XXXX\.XXXXXX"),
    "AI declaration": re.compile(r"\[TOOL NAME AND VERSION\]|\[PURPOSE\]"),
    "ORCID": re.compile(r"0000-0000-0000-0000"),
}

CURRENT_REPO = "https://github.com/GROUP-G-IIMA/airresilience"
CURRENT_DOI_BARE = "10.5281/zenodo.XXXXXXX"
CURRENT_EMAIL = "sundaravallin@iima.ac.in"


def declared_versions() -> dict[str, str]:
    """Every place the version is written down, so they cannot drift apart."""
    import tomllib
    out = {}
    out["pyproject.toml"] = tomllib.loads(
        (ROOT / "pyproject.toml").read_text())["project"]["version"]
    m = re.search(r'__version__ = "([^"]+)"',
                  (ROOT / "airresilience" / "__init__.py").read_text())
    out["airresilience/__init__.py"] = m.group(1) if m else "?"
    m = re.search(r'(?m)^version: "([^"]+)"', (ROOT / "CITATION.cff").read_text())
    out["CITATION.cff"] = m.group(1) if m else "?"
    out["codemeta.json"] = json.loads(
        (ROOT / "codemeta.json").read_text())["version"]
    m = re.search(r'const VERSION= "([^"]+)";',
                  (ROOT / "paper" / "gen_paper.js").read_text())
    out["paper/gen_paper.js"] = m.group(1) if m else "?"
    return out


def check() -> int:
    outstanding = 0

    versions = declared_versions()
    if len(set(versions.values())) != 1:
        print("version mismatch:")
        for k, v in versions.items():
            print(f"  {v:12s} {k}")
        outstanding += 1
    else:
        print(f"version {next(iter(versions.values()))} consistent across "
              f"{len(versions)} files")

    for name in FILES:
        path = ROOT / name
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        for label, pattern in PLACEHOLDERS.items():
            hits = len(pattern.findall(text))
            if hits:
                print(f"{name}: {hits} unresolved {label} placeholder(s)")
                outstanding += hits
    if outstanding:
        print(f"\n{outstanding} placeholder(s) outstanding. Not ready to submit.")
        return 1
    print("No placeholders outstanding.")
    return 0


def apply(repo: str | None, doi: str | None, email: str | None,
          version: str | None) -> int:
    repo = repo.rstrip("/") if repo else None
    doi_bare = doi.replace("https://doi.org/", "").strip() if doi else None

    changed = 0
    for name in FILES:
        path = ROOT / name
        if not path.exists():
            continue
        text = original = path.read_text(encoding="utf-8")

        if repo:
            text = text.replace(CURRENT_REPO, repo)
        if doi_bare:
            text = text.replace(CURRENT_DOI_BARE, doi_bare)
        if email:
            text = text.replace(CURRENT_EMAIL, email)
        if version:
            text = re.sub(r'(?m)^version = "[^"]+"', f'version = "{version}"', text)
            text = re.sub(r'(?m)^version: "[^"]+"', f'version: "{version}"', text)
            text = re.sub(r'"version": "[^"]+"', f'"version": "{version}"', text)
            text = re.sub(r'const VERSION= "[^"]+";',
                          f'const VERSION= "{version}";', text)
            text = re.sub(r'__version__ = "[^"]+"',
                          f'__version__ = "{version}"', text)

        if text != original:
            path.write_text(text, encoding="utf-8")
            print(f"updated {name}")
            changed += 1

    if not changed:
        print("nothing to change")
    print("\nNow regenerate the manuscript:  cd paper && node gen_paper.js")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true",
                    help="report outstanding placeholders and exit")
    ap.add_argument("--repo", help="public GitHub repository URL")
    ap.add_argument("--doi", help="Zenodo DOI, with or without the doi.org prefix")
    ap.add_argument("--email", help="support email for metadata field C9")
    ap.add_argument("--version", help="release version, e.g. 1.0.0")
    args = ap.parse_args()

    if args.check:
        return check()
    if not any([args.repo, args.doi, args.email, args.version]):
        ap.print_help()
        return 2
    return apply(args.repo, args.doi, args.email, args.version)


if __name__ == "__main__":
    raise SystemExit(main())
