#!/usr/bin/env python
"""Validate or sync Framepack timeline manifest for a HyperFrames project."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.timeline_manifest import (  # noqa: E402
    TimelineSyncResult,
    TimelineWarning,
    TIMELINE_KIND,
    TIMELINE_SCHEMA_VERSION,
    load_timeline,
    sync_timeline_from_project,
    validate_timeline,
)


def _warning_to_dict(warning: TimelineWarning) -> dict[str, Any]:
    return {
        "code": warning.code,
        "message": warning.message,
        "severity": warning.severity,
        "scene": warning.scene,
        "details": warning.details,
    }


def _result_to_dict(result: TimelineSyncResult) -> dict[str, Any]:
    return {
        "kind": "framepack_timeline_manifest_result",
        "changed": result.changed,
        "action": result.action,
        "path": str(result.path),
        "warnings": [_warning_to_dict(w) for w in result.warnings],
        "error": result.error,
    }


def _validate_only(project_dir: Path) -> TimelineSyncResult:
    path = project_dir / ".framepack" / "timeline-manifest.json"
    if not path.exists():
        return TimelineSyncResult(False, "missing", path, [])
    try:
        data = load_timeline(path)
        warnings = validate_timeline(data, project_dir)
        return TimelineSyncResult(False, "validated", path, warnings)
    except ValueError as exc:
        return TimelineSyncResult(False, "invalid", path, [TimelineWarning("timeline_manifest_invalid", str(exc), "P0")], error=str(exc))


def render_markdown(result: TimelineSyncResult) -> str:
    lines = [
        "# Framepack Timeline Manifest",
        "",
        f"Path: `{result.path}`",
        f"Action: `{result.action}`",
        f"Changed: `{str(result.changed).lower()}`",
        "",
        "## Warnings",
        "",
    ]
    if not result.warnings:
        lines.append("✅ No timeline warnings.")
    for warning in result.warnings:
        lines.append(f"- {warning.severity} `{warning.code}`: {warning.message}")
        if warning.scene:
            lines.append(f"  - Scene: `{warning.scene}`")
    if result.error:
        lines.extend(["", "## Error", "", result.error])
    return "\n".join(lines).rstrip() + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project_dir", help="HyperFrames project directory")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--sync", action="store_true", help="Write/sync .framepack/timeline-manifest.json")
    mode.add_argument("--validate", action="store_true", help="Validate existing timeline manifest without writing")
    parser.add_argument("--format", choices=("json", "markdown"), default="json")
    parser.add_argument("--output", help="Optional output file")
    args = parser.parse_args(argv)

    project_dir = Path(args.project_dir)
    result = sync_timeline_from_project(project_dir) if args.sync else _validate_only(project_dir)

    if args.format == "json":
        rendered = json.dumps(_result_to_dict(result), ensure_ascii=False, indent=2) + "\n"
    else:
        rendered = render_markdown(result)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(rendered, encoding="utf-8")
    sys.stdout.write(rendered)
    return 1 if result.error else 0


if __name__ == "__main__":
    raise SystemExit(main())
