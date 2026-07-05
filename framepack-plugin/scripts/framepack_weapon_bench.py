#!/usr/bin/env python
"""Run Framepack weapon bench commands."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

_PLUGIN_DIR = Path(__file__).resolve().parents[1]
if str(_PLUGIN_DIR) not in sys.path:
    sys.path.insert(0, str(_PLUGIN_DIR))

from core.weapon_bench import load_bench_scorecard, render_scorecard_markdown, run_weapon_bench


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Create and inspect Framepack weapon bench artifacts")
    sub = parser.add_subparsers(dest="command", required=True)

    run = sub.add_parser("run", help="Create bench artifacts for a weapon")
    run.add_argument("weapon_id")
    run.add_argument("--project", required=True, help="Project directory")
    run.add_argument("--format", choices=["json", "text"], default="text")

    score = sub.add_parser("score", help="Print the bench scorecard for a weapon")
    score.add_argument("weapon_id")
    score.add_argument("--project", required=True, help="Project directory")
    score.add_argument("--format", choices=["markdown", "json"], default="markdown")

    args = parser.parse_args(argv)
    if args.command == "run":
        result = run_weapon_bench(args.weapon_id, args.project)
        if args.format == "json":
            print(json.dumps(result.to_dict(), ensure_ascii=False, indent=2))
        else:
            print(f"Weapon bench: {result.weapon_id}\nDemo: {result.demo_html}\nScorecard: {result.scorecard}")
        return 0

    if args.command == "score":
        card = load_bench_scorecard(args.weapon_id, args.project)
        if args.format == "json":
            print(json.dumps(card.to_dict(), ensure_ascii=False, indent=2))
        else:
            print(render_scorecard_markdown(card), end="")
        return 0

    parser.error("unknown command")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
