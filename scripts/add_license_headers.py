#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Sundaravalli Narayanaswami and Vaibhav Sharma
"""
Add an SPDX licence header to every source file that lacks one.

SoftwareX reviewers are asked directly whether licensing terms are stated in
the source package *and mentioned in each source file*, so this is not
decoration. Safe to re-run: files that already carry the marker are skipped.

    python scripts/add_license_headers.py [--check]

--check exits non-zero if any file is missing a header, which is what the CI
workflow runs.
"""
from __future__ import annotations

import sys
from pathlib import Path

SPDX = "SPDX-License-Identifier: MIT"
COPYRIGHT = "Copyright (c) 2026 Sundaravalli Narayanaswami and Vaibhav Sharma"

ROOT = Path(__file__).resolve().parent.parent

# (glob, comment style)
TARGETS = [
    ("airresilience/*.py", "hash"),
    ("adapters/*.py", "hash"),
    ("tests/*.py", "hash"),
    ("reference/*.py", "hash"),
    ("examples/*.py", "hash"),
    ("viewer/*.py", "hash"),
    ("scripts/*.py", "hash"),
    ("run.py", "hash"),
    ("paper/*.js", "block"),
    ("viewer/*.html", "html"),
]

HEADERS = {
    "hash": f"# {SPDX}\n# {COPYRIGHT}\n",
    "block": f"// {SPDX}\n// {COPYRIGHT}\n",
    "html": f"<!-- {SPDX}\n     {COPYRIGHT} -->\n",
}


def files() -> list[tuple[Path, str]]:
    out = []
    for pattern, style in TARGETS:
        for path in sorted(ROOT.glob(pattern)):
            if path.is_file() and path.stat().st_size > 0:
                out.append((path, style))
    return out


def insert(text: str, header: str, style: str) -> str:
    lines = text.split("\n")
    # Keep a shebang or an XML/doctype declaration first.
    at = 0
    if lines and lines[0].startswith("#!"):
        at = 1
    elif style == "html" and lines and lines[0].lower().startswith("<!doctype"):
        at = 1
    return "\n".join(lines[:at]) + ("\n" if at else "") + header + "\n".join(lines[at:])


def main() -> int:
    check = "--check" in sys.argv
    missing, added = [], []
    for path, style in files():
        text = path.read_text(encoding="utf-8")
        if SPDX in text:
            continue
        if check:
            missing.append(path)
            continue
        path.write_text(insert(text, HEADERS[style], style), encoding="utf-8")
        added.append(path)

    if check:
        for path in missing:
            print(f"missing SPDX header: {path.relative_to(ROOT)}")
        print(f"{len(files()) - len(missing)}/{len(files())} source files carry a header")
        return 1 if missing else 0

    for path in added:
        print(f"header added: {path.relative_to(ROOT)}")
    print(f"{len(added)} file(s) updated, {len(files()) - len(added)} already had one")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
