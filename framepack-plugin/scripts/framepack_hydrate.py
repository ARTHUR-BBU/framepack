#!/usr/bin/env python
"""Framepack hydrate CLI — push latest guardrails to workbench AGENTS.md files.

Usage:
  python framepack_hydrate.py <workbench-path>
  python framepack_hydrate.py <workbench-path> --dry-run
  python framepack_hydrate.py <workbench-path> --format json

Scans the workbench root and all cases/*/ subdirectories for AGENTS.md / CLAUDE.md
files containing a FRAMEPACK MANAGED BLOCK, and updates stale blocks to match the
deployed guardrails.md.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

_PLUGIN_DIR = Path(__file__).resolve().parents[1]
if str(_PLUGIN_DIR) not in sys.path:
    sys.path.insert(0, str(_PLUGIN_DIR))


@dataclass
class HydrateFileResult:
    path: str
    action: str  # updated | no-op | inserted | error
    detail: str = ""


@dataclass
class HydrateReport:
    workbench: str
    guardrails_version: str
    guardrails_hash: str
    files: list[HydrateFileResult]
    summary: dict[str, int]

    def to_dict(self) -> dict:
        return {
            "kind": "framepack_hydrate_report",
            "workbench": self.workbench,
            "guardrails_version": self.guardrails_version,
            "guardrails_hash": self.guardrails_hash,
            "files": [asdict(f) for f in self.files],
            "summary": self.summary,
        }


def run_hydrate(workbench: str, dry_run: bool = False) -> HydrateReport:
    """Run hydration on a workbench and return the report."""
    from core.context_hydrator import hydrate_context, check_context_sync
    from hooks.guardrails import build_guardrails_payload

    workbench_path = Path(workbench).resolve()
    plugin_dir = _PLUGIN_DIR

    payload = build_guardrails_payload(plugin_dir)

    if dry_run:
        initial = check_context_sync(workbench_path, plugin_dir)
        files = []
        counts = {"updated": 0, "no-op": 0, "inserted": 0, "error": 0}
        for fs in initial.files:
            action = "no-op" if fs.action_needed == "none" else fs.action_needed
            files.append(HydrateFileResult(
                path=fs.path,
                action=action,
                detail=f"detected_version={fs.detected_version}, stale={fs.is_stale}",
            ))
            key = action if action in counts else "error"
            counts[key] = counts.get(key, 0) + 1
        return HydrateReport(
            workbench=str(workbench_path),
            guardrails_version=payload.version,
            guardrails_hash=payload.digest,
            files=files,
            summary=counts,
        )

    report = hydrate_context(workbench_path, plugin_dir)
    final = check_context_sync(workbench_path, plugin_dir)

    files = []
    counts = {"updated": 0, "no-op": 0, "inserted": 0, "error": 0}
    for fs in final.files:
        action = "no-op" if fs.action_needed == "none" else fs.action_needed
        files.append(HydrateFileResult(
            path=fs.path,
            action=action,
            detail=f"detected_version={fs.detected_version}, current={fs.detected_version == payload.version}",
        ))
        key = action if action in counts else "error"
        counts[key] = counts.get(key, 0) + 1

    return HydrateReport(
        workbench=str(workbench_path),
        guardrails_version=payload.version,
        guardrails_hash=payload.digest,
        files=files,
        summary=counts,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Framepack hydrate — push guardrails to workbench")
    parser.add_argument("workbench", help="Path to workbench root")
    parser.add_argument("--dry-run", action="store_true", help="Report only, no writes")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    args = parser.parse_args()

    report = run_hydrate(args.workbench, dry_run=args.dry_run)

    if args.format == "json":
        print(json.dumps(report.to_dict(), ensure_ascii=False, indent=2))
    else:
        print(f"Framepack Hydrate Report")
        print(f"{'=' * 40}")
        print(f"Workbench: {report.workbench}")
        print(f"Guardrails: v{report.guardrails_version} ({report.guardrails_hash})")
        print()
        for f in report.files:
            rel = f.path
            if rel.startswith(report.workbench):
                rel = rel[len(report.workbench):].lstrip("\\/")
            marker = "✅" if f.action in ("updated", "inserted") else "—"
            version_tag = f" [{f.detail}]" if f.detail else ""
            print(f"  {marker} {rel} → {f.action}{version_tag}")
        print()
        s = report.summary
        print(f"Summary: {s.get('updated', 0)} updated, {s.get('inserted', 0)} inserted, "
              f"{s.get('no-op', 0)} no-op, {s.get('error', 0)} errors")

    return 0


if __name__ == "__main__":
    sys.exit(main())
