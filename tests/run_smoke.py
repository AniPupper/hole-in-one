#!/usr/bin/env python3
"""Run the dependency-free Node smoke suite with a working local Node binary."""
import os
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CUSTOM = os.environ.get("HOLE_IN_ONE_NODE")
BUNDLED = pathlib.Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
CANDIDATES = [CUSTOM, shutil.which("node"), str(BUNDLED)]

for candidate in dict.fromkeys(item for item in CANDIDATES if item):
    try:
        probe = subprocess.run([candidate, "-e", "process.exit(0)"],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except (OSError, ValueError):
        continue
    if probe.returncode == 0:
        raise SystemExit(subprocess.call([candidate, str(ROOT / "tests/smoke.cjs"), *sys.argv[1:]], cwd=ROOT))

print("No working Node.js found. Set HOLE_IN_ONE_NODE to a working Node binary.", file=sys.stderr)
raise SystemExit(2)
