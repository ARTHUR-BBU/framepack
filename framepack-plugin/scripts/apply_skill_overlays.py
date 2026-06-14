"""Apply Framepack hardening overlays to local Hermes skills.

Safe by default: dry-run unless --apply is passed. No network, no package manager,
no skill installation. This script only applies Framepack managed hardening
blocks to already-existing local SKILL.md files.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

PLUGIN_ROOT = Path(__file__).resolve().parent.parent
if str(PLUGIN_ROOT) not in sys.path:
    sys.path.insert(0, str(PLUGIN_ROOT))

from core.skill_overlay_manager import SkillOverlay
from core.skill_overlay_planner import run_skill_overlay_plan

FRAMEPACK_VERSION = "0.10.2"


def built_in_overlays() -> list[SkillOverlay]:
    return [
        SkillOverlay(
            id="hf-root-duration",
            target_skill="hyperframes",
            framepack_version=FRAMEPACK_VERSION,
            body=(
                "## Framepack Hardening: Root Composition Duration\n\n"
                "Root composition elements must explicitly set `data-duration`. "
                "Do not rely on GSAP timeline inference for final holds, outros, or black frames."
            ),
            equivalent_phrases=("root composition", "data-duration"),
        ),
        SkillOverlay(
            id="hf-clip-root-no-transform",
            target_skill="hyperframes",
            framepack_version=FRAMEPACK_VERSION,
            body=(
                "## Framepack Hardening: Clip Root Is A Scheduler Shell\n\n"
                "Do not animate opacity, filter, or transform on `.clip` root elements. "
                "Animate `.scene-inner` or an equivalent inner wrapper instead."
            ),
            equivalent_phrases=("clip root", "scene-inner"),
        ),
    ]


def default_skills_dir() -> Path:
    hermes_home = os.environ.get("HERMES_HOME")
    if hermes_home:
        return Path(hermes_home) / "skills" / "software-development"
    return Path("F:/Hermes_windows/skills/software-development")


def main() -> int:
    parser = argparse.ArgumentParser(description="Plan/apply Framepack skill hardening overlays")
    parser.add_argument("--skills-dir", default=str(default_skills_dir()))
    parser.add_argument("--apply", action="store_true", help="Write overlay changes. Default is dry-run.")
    parser.add_argument("--output", default="", help="Optional JSON report path; allowed in dry-run and does not modify skills")
    args = parser.parse_args()

    plan = run_skill_overlay_plan(
        skills_dir=Path(args.skills_dir),
        overlays=built_in_overlays(),
        apply=args.apply,
    )
    data = plan.to_dict()
    text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(text, encoding="utf-8")
    print(text, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
