#!/usr/bin/env python
"""Run Framepack Kinetic Taste Audit for creative artifacts."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.taste_audit import TasteAuditReport, audit_project  # noqa: E402


def render_markdown(report: TasteAuditReport) -> str:
    data = report.to_dict()
    lines = [
        "# Framepack Taste Audit",
        "",
        f"Project: `{data['project_dir']}`",
        "",
        "## Summary",
        "",
        "| Severity | Count |",
        "|---|---:|",
    ]
    for severity in ("risk", "suggestion", "note"):
        lines.append(f"| {severity} | {data['summary'].get(severity, 0)} |")
    lines.extend(["", "## Director Critique", ""])
    if not data["issues"]:
        lines.append("✅ No kinetic taste risks detected.")
    for issue in data["issues"]:
        lines.append(f"### {issue['severity']} · {issue['code']}")
        lines.append("")
        lines.append(issue["message"])
        if issue.get("suggestion"):
            lines.append(f"- Suggestion: {issue['suggestion']}")
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
    args = parser.parse_args(argv)

    report = audit_project(Path(args.project_dir))
    if args.format == "json":
        rendered = json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n"
    else:
        rendered = render_markdown(report)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(rendered, encoding="utf-8")
    sys.stdout.write(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
