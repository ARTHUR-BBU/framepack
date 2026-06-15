#!/usr/bin/env python
"""Run Framepack quality-beyond-lint semantic audit for a HyperFrames project."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.arsenal_registry import sync_arsenal_from_project  # noqa: E402
from core.quality_audit import QualityAuditReport, audit_project  # noqa: E402
from core.timeline_manifest import sync_timeline_from_project  # noqa: E402

SEVERITY_ORDER = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}


def render_markdown(report: QualityAuditReport) -> str:
    data = report.to_dict()
    lines = [
        "# Framepack Quality Audit",
        "",
        f"Project: `{data['project_dir']}`",
        "",
        "## Summary",
        "",
        "| Severity | Count |",
        "|---|---:|",
    ]
    for severity in ("P0", "P1", "P2", "P3"):
        lines.append(f"| {severity} | {data['summary'].get(severity, 0)} |")
    lines.extend(["", "## Issues", ""])
    if not data["issues"]:
        lines.append("✅ No quality-beyond-lint issues detected.")
    for issue in data["issues"]:
        title = f"### {issue['severity']} · {issue['code']}"
        if issue.get("weapon_id"):
            title += f" · `{issue['weapon_id']}`"
        lines.append(title)
        lines.append("")
        lines.append(issue["message"])
        if issue.get("scene"):
            lines.append(f"- Scene: `{issue['scene']}`")
        if issue.get("path"):
            lines.append(f"- Path: `{issue['path']}`")
        if issue.get("details"):
            lines.append("- Details:")
            lines.append("```json")
            lines.append(json.dumps(issue["details"], ensure_ascii=False, indent=2))
            lines.append("```")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project_dir", help="HyperFrames project directory to audit")
    parser.add_argument("--format", choices=("json", "markdown"), default="json")
    parser.add_argument("--output", help="Optional output file path")
    parser.add_argument("--sync-arsenal", action="store_true", help="Write/sync .framepack/arsenal.json from expanded-prompt.md before auditing")
    parser.add_argument("--sync-timeline", action="store_true", help="Write/sync .framepack/timeline-manifest.json from expanded-prompt.md/index.html before auditing")
    parser.add_argument("--fail-on", choices=("P0", "P1", "P2", "P3"), help="Exit with status 1 when issues at or above this severity are found")
    args = parser.parse_args(argv)

    project_dir = Path(args.project_dir)
    if args.sync_arsenal:
        sync_arsenal_from_project(project_dir, ROOT)
    if args.sync_timeline:
        sync_timeline_from_project(project_dir)
    report = audit_project(project_dir)
    if args.format == "json":
        rendered = json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n"
    else:
        rendered = render_markdown(report)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(rendered, encoding="utf-8")
    sys.stdout.write(rendered)
    if args.fail_on:
        threshold = SEVERITY_ORDER[args.fail_on]
        if any(SEVERITY_ORDER[issue.severity] <= threshold for issue in report.issues):
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
