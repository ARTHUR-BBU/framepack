#!/usr/bin/env python
"""Print Framepack's built-in HyperFrames capability radar."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

script_parent = Path(__file__).resolve().parent.parent
if str(script_parent) not in sys.path:
    sys.path.insert(0, str(script_parent))

from core.hyperframes_capabilities import capability_map, render_capability_markdown, to_json


def main() -> int:
    parser = argparse.ArgumentParser(description="Framepack HyperFrames capability radar")
    parser.add_argument("--format", choices=("json", "markdown"), default="markdown")
    args = parser.parse_args()

    data = capability_map()
    if args.format == "json":
        print(to_json(data), end="")
    else:
        print(render_capability_markdown(data), end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
