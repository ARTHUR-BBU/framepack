"""Build a Framepack/HyperFrames upgrade report from JSON evidence files."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

PLUGIN_ROOT = Path(__file__).resolve().parent.parent
if str(PLUGIN_ROOT) not in sys.path:
    sys.path.insert(0, str(PLUGIN_ROOT))

from core.framepack_upgrade_report import build_upgrade_report


def _read_json(path: str) -> dict:
    if not path:
        return {}
    return json.loads(Path(path).read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Build Framepack upgrade report from doctor/install/skill/smoke JSON files")
    parser.add_argument("--environment", default="", help="Environment doctor JSON report")
    parser.add_argument("--install-plan", default="", help="Skill install plan JSON")
    parser.add_argument("--skill-upgrade", action="append", default=[], help="Skill upgrade plan JSON; repeatable")
    parser.add_argument("--smoke", default="", help="Smoke evidence JSON")
    parser.add_argument("--output", default="", help="Optional JSON report path")
    args = parser.parse_args()

    report = build_upgrade_report(
        environment=_read_json(args.environment),
        install_plan=_read_json(args.install_plan),
        skill_upgrades=[_read_json(path) for path in args.skill_upgrade],
        smoke=_read_json(args.smoke),
    )
    text = json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n"
    if args.output:
        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(text, encoding="utf-8")
    print(text, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
