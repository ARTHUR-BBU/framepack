#!/usr/bin/env python
"""Framepack Case Scaffolder CLI.

Usage:
    # Create a new standard case
    python scripts/framepack_scaffold_case.py --workbench <path> --case <slug>

    # Hydrate (update stale AGENTS/CLAUDE in an existing workbench)
    python scripts/framepack_scaffold_case.py --workbench <path> --hydrate

    # Classify existing cases
    python scripts/framepack_scaffold_case.py --workbench <path> --classify
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

script_parent = Path(__file__).resolve().parent.parent
if str(script_parent) not in sys.path:
    sys.path.insert(0, str(script_parent))

from core.case_scaffolder import scaffold_case, classify_case, CaseClass
from core.context_hydrator import (
    find_workbench_root,
    check_context_sync,
    hydrate_context,
)


def _plugin_dir() -> Path:
    return script_parent


def cmd_scaffold(args) -> int:
    wb = Path(args.workbench)
    if not wb.is_dir():
        print(f"Error: workbench not found: {wb}", file=sys.stderr)
        return 1
    result = scaffold_case(wb, args.case, _plugin_dir(), create_claude_md=args.claude)
    if result.action == "exists":
        print(f"Case already exists: {result.case_dir}")
        print(f"  {result.error}")
        return 1
    print(f"Created case: {result.case_dir}")
    print(f"  Directories: {', '.join(result.dirs_created)}")
    print(f"  Files: {len(result.files_created)} files")
    return 0


def cmd_hydrate(args) -> int:
    wb = find_workbench_root(Path(args.workbench))
    if wb is None:
        wb = Path(args.workbench)
    if not wb.is_dir():
        print(f"Error: workbench not found: {wb}", file=sys.stderr)
        return 1
    report = hydrate_context(wb, _plugin_dir())
    if report.project_context_current:
        print("Context is current.")
    else:
        print(f"Stale files found: {len(report.stale_files)}")
        for s in report.stale_files:
            print(f"  - {s}")
        print("Managed blocks updated.")
    print(f"Report: {wb}/.framepack/context-sync.md")
    return 0


def cmd_classify(args) -> int:
    wb = find_workbench_root(Path(args.workbench))
    if wb is None:
        wb = Path(args.workbench)
    cases_dir = wb / "cases"
    if not cases_dir.is_dir():
        print("No cases/ directory found", file=sys.stderr)
        return 1
    for case in sorted(cases_dir.iterdir()):
        if not case.is_dir():
            continue
        result = classify_case(case)
        print(f"  {case.name:40s} -> {result.label.value:20s}", end="")
        if result.notes:
            print(f"  ({'; '.join(result.notes)})")
        else:
            print()
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Framepack Case Scaffolder")
    parser.add_argument("--workbench", required=True, help="Path to workbench root")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--case", help="Create a new case with this slug")
    group.add_argument("--hydrate", action="store_true", help="Sync stale AGENTS/CLAUDE files")
    group.add_argument("--classify", action="store_true", help="Classify existing cases")
    parser.add_argument("--claude", action="store_true", help="Also create CLAUDE.md")
    args = parser.parse_args()

    if args.case:
        return cmd_scaffold(args)
    elif args.hydrate:
        return cmd_hydrate(args)
    elif args.classify:
        return cmd_classify(args)
    return 1


if __name__ == "__main__":
    sys.exit(main())
