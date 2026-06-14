"""Run Framepack first-run environment doctor.

Report-only: this script does not install, upgrade, downgrade, or overwrite
anything. It emits a JSON report that Hermes Agent can use to propose the next
safe action.
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

from core.environment_doctor import EnvironmentDoctor
from core.hyperframes_adapter import _default_runner
from core.hyperframes_support import HyperFramesSupportWindow


def load_support_window(path: Path) -> HyperFramesSupportWindow:
    data = json.loads(path.read_text(encoding="utf-8"))
    hyperframes = data["hyperframes"]
    return HyperFramesSupportWindow(
        supported_min=hyperframes["supported_min"],
        supported_max_tested=hyperframes["supported_max_tested"],
        soft_max=hyperframes["soft_max"],
        hard_block_below=hyperframes["hard_block_below"],
        latest_supported_for_downgrade=hyperframes.get("latest_supported_for_downgrade"),
        unknown_newer_policy=hyperframes.get("unknown_newer_policy", "warn_and_probe"),
    )


def default_skills_dir() -> Path:
    hermes_home = os.environ.get("HERMES_HOME")
    if hermes_home:
        return Path(hermes_home) / "skills" / "software-development"
    return Path("F:/Hermes_windows/skills/software-development")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run Framepack environment doctor")
    parser.add_argument("--project-dir", default=os.getcwd())
    parser.add_argument("--skills-dir", default=str(default_skills_dir()))
    parser.add_argument("--support-matrix", default=str(PLUGIN_ROOT / "compat" / "hyperframes-support.json"))
    parser.add_argument("--output", default="")
    args = parser.parse_args()

    doctor = EnvironmentDoctor(
        project_dir=Path(args.project_dir),
        skills_dir=Path(args.skills_dir),
        support_window=load_support_window(Path(args.support_matrix)),
        runner=_default_runner,
    )
    report = doctor.run().to_dict()
    text = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(text, encoding="utf-8")
    print(text, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
