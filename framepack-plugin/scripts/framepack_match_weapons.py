#!/usr/bin/env python
"""Run Framepack Weapon Matching Pass for a project."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

_PLUGIN_DIR = Path(__file__).resolve().parents[1]
if str(_PLUGIN_DIR) not in sys.path:
    sys.path.insert(0, str(_PLUGIN_DIR))

from core.weapon_load_plan import render_weapon_load_plan_markdown, write_weapon_load_plan
from core.weapon_matcher import match_weapons_for_project


def _format_text(plan) -> str:
    matched = sum(1 for scene in plan.scenes if not scene.handwrite)
    waivers = sum(1 for scene in plan.scenes if scene.handwrite)
    loads = []
    for load in plan.required_skill_loads:
        suffix = f" / {load.file_path}" if load.file_path else ""
        loads.append(f"  - {load.name}{suffix}: {load.reason}")
    lines = [
        "Framepack Weapon Matching Pass",
        "================================",
        f"Scenes: {len(plan.scenes)}",
        f"Matched: {matched}",
        f"HANDWRITE waivers: {waivers}",
        "",
        "Required loads:",
        *(loads or ["  - (none)"]),
    ]
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Match script scenes to HyperFrames/Framepack weapons before HTML authoring")
    parser.add_argument("project", help="Project directory")
    parser.add_argument("--prompt", default=None, help="Prompt/story file path (default: .hyperframes/expanded-prompt.md)")
    parser.add_argument("--format", choices=["text", "json", "markdown"], default="text")
    parser.add_argument("--dry-run", action="store_true", help="Print plan without writing .framepack files")
    args = parser.parse_args(argv)

    project = Path(args.project).resolve()
    prompt = Path(args.prompt) if args.prompt else None
    plan = match_weapons_for_project(project, prompt_path=prompt, write=False)
    if not args.dry_run:
        write_weapon_load_plan(project, plan)

    if args.format == "json":
        print(json.dumps(plan.to_dict(), ensure_ascii=False, indent=2))
    elif args.format == "markdown":
        print(render_weapon_load_plan_markdown(plan), end="")
    else:
        print(_format_text(plan), end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
