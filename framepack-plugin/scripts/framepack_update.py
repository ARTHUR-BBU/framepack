#!/usr/bin/env python
"""Framepack update CLI — end-to-end upgrade orchestrator.

Usage:
  python framepack_update.py                    # full chain
  python framepack_update.py --skip-smoke       # skip smoke test
  python framepack_update.py --workbench <path> # also hydrate a workbench
  python framepack_update.py --report-only      # check only, no changes

Chain: doctor → sync source→deployed → hydrate (optional) → smoke → report.
NEVER runs git pull/push/fetch. Source copy is authoritative as-is.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path

_SOURCE_DIR = Path(__file__).resolve().parents[1]
_DEPLOYED_DIR = Path("F:/Hermes_windows/plugins/framepack")

_FILES_TO_SYNC = [
    "guardrails.md",
    "plugin.yaml",
    "__init__.py",
    "hooks/on_post_tool_call.py",
    "hooks/on_pre_tool_call.py",
    "hooks/guardrails.py",
    "core/workflow_overlay.py",
    "core/hyperframes_capabilities.py",
    "core/context_hydrator.py",
]
_DIRS_TO_SYNC = ["skills", "scripts", "core", "hooks", "templates", "compat"]


@dataclass
class UpdateStepResult:
    name: str
    status: str  # ok | warning | error | skipped
    detail: str = ""
    items: list[str] = field(default_factory=list)


@dataclass
class UpdateReport:
    source_version: str
    steps: list[UpdateStepResult]
    git_ahead: int | None = None
    git_dirty: bool | None = None
    overall: str = "unknown"

    def to_dict(self) -> dict:
        return {
            "kind": "framepack_update_report",
            "source_version": self.source_version,
            "overall": self.overall,
            "git_ahead": self.git_ahead,
            "git_dirty": self.git_dirty,
            "steps": [asdict(s) for s in self.steps],
        }


def _read_version(plugin_dir: Path) -> str:
    manifest = plugin_dir / "plugin.yaml"
    if not manifest.exists():
        return "unknown"
    import re
    text = manifest.read_text(encoding="utf-8")
    m = re.search(r'^version:\s*["\']?([^"\'\n]+)["\']?\s*$', text, re.MULTILINE)
    return m.group(1).strip() if m else "unknown"


def _md5(path: Path) -> str:
    return hashlib.md5(path.read_bytes()).hexdigest()


def _sync_files(source: Path, deployed: Path, report_only: bool) -> tuple[list[str], list[str]]:
    """Sync source → deployed. Returns (changed_files, unchanged_files)."""
    changed = []
    unchanged = []

    all_files = []
    for d in _DIRS_TO_SYNC:
        src_sub = source / d
        if src_sub.is_dir():
            for p in src_sub.rglob("*"):
                if p.is_file() and "__pycache__" not in str(p) and ".pyc" not in str(p):
                    all_files.append(p)

    for f in _FILES_TO_SYNC:
        p = source / f
        if p.is_file() and p not in all_files:
            all_files.append(p)

    for src_file in all_files:
        rel = src_file.relative_to(source)
        dst_file = deployed / rel
        if not dst_file.parent.exists():
            continue
        if dst_file.exists() and _md5(src_file) == _md5(dst_file):
            unchanged.append(str(rel))
        else:
            changed.append(str(rel))
            if not report_only:
                dst_file.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src_file, dst_file)

    return changed, unchanged


def _git_state(source: Path) -> tuple[int | None, bool | None]:
    """Return (ahead_count, is_dirty). Never modifies git state."""
    import subprocess
    try:
        ahead = subprocess.run(
            ["git", "rev-list", "--count", "origin/main..HEAD"],
            capture_output=True, text=True, cwd=str(source), timeout=10,
        )
        ahead_count = int(ahead.stdout.strip()) if ahead.returncode == 0 else None

        status = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True, text=True, cwd=str(source), timeout=10,
        )
        is_dirty = bool(status.stdout.strip()) if status.returncode == 0 else None
        return ahead_count, is_dirty
    except Exception:
        return None, None


def run_update(
    skip_smoke: bool = False,
    workbench: str | None = None,
    report_only: bool = False,
) -> UpdateReport:
    """Run the full update chain."""
    import subprocess

    version = _read_version(_SOURCE_DIR)
    steps: list[UpdateStepResult] = []

    # Step 1: Doctor (skip — environment_doctor needs runner, keep it simple)
    steps.append(UpdateStepResult(
        name="doctor", status="skipped",
        detail="environment_doctor requires interactive runner; run 'python scripts/framepack_doctor.py' separately",
    ))

    # Step 2: Source → Deployed sync
    changed, unchanged = _sync_files(_SOURCE_DIR, _DEPLOYED_DIR, report_only)
    sync_status = "ok" if not report_only else "skipped"
    steps.append(UpdateStepResult(
        name="sync", status=sync_status,
        detail=f"{len(changed)} changed, {len(unchanged)} unchanged",
        items=changed[:20],
    ))

    # Step 3: Hydrate (optional)
    if workbench:
        try:
            from scripts.framepack_hydrate import run_hydrate
            hydrate_report = run_hydrate(workbench, dry_run=report_only)
            s = hydrate_report.summary
            steps.append(UpdateStepResult(
                name="hydrate", status="ok",
                detail=f"{s.get('updated', 0)} updated, {s.get('no-op', 0)} no-op",
            ))
        except Exception as e:
            steps.append(UpdateStepResult(name="hydrate", status="error", detail=str(e)))
    else:
        steps.append(UpdateStepResult(name="hydrate", status="skipped", detail="no --workbench specified"))

    # Step 4: Skill overlays
    steps.append(UpdateStepResult(
        name="skill_overlays", status="skipped",
        detail="run 'python scripts/apply_skill_overlays.py --dry-run' separately",
    ))

    # Step 5: Smoke test
    if not skip_smoke and not report_only:
        try:
            result = subprocess.run(
                [sys.executable, "-m", "pytest", str(_DEPLOYED_DIR / "tests"),
                 "-q", "-o", "addopts=", "-x"],
                capture_output=True, text=True, timeout=120,
            )
            if result.returncode == 0:
                last_line = [l for l in result.stdout.strip().splitlines() if l][-1]
                steps.append(UpdateStepResult(name="smoke", status="ok", detail=last_line))
            else:
                steps.append(UpdateStepResult(name="smoke", status="error", detail=result.stdout[-500:]))
        except Exception as e:
            steps.append(UpdateStepResult(name="smoke", status="error", detail=str(e)))
    else:
        steps.append(UpdateStepResult(name="smoke", status="skipped"))

    # Step 6: Git state (report only, never modify)
    ahead, dirty = _git_state(_SOURCE_DIR)
    git_detail = ""
    if ahead is not None:
        git_detail += f"ahead origin/main by {ahead} commits, "
    if dirty is not None:
        git_detail += "working tree " + ("dirty" if dirty else "clean")

    has_errors = any(s.status == "error" for s in steps)
    overall = "UPDATE_FAILED" if has_errors else "UPDATE_COMPLETE"

    return UpdateReport(
        source_version=version,
        steps=steps,
        git_ahead=ahead,
        git_dirty=dirty,
        overall=overall,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Framepack update — end-to-end upgrade")
    parser.add_argument("--skip-smoke", action="store_true")
    parser.add_argument("--workbench", default=None)
    parser.add_argument("--report-only", action="store_true")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    args = parser.parse_args()

    report = run_update(
        skip_smoke=args.skip_smoke,
        workbench=args.workbench,
        report_only=args.report_only,
    )

    if args.format == "json":
        print(json.dumps(report.to_dict(), ensure_ascii=False, indent=2))
    else:
        print(f"Framepack Update Report")
        print(f"{'=' * 40}")
        print(f"Source:   {_SOURCE_DIR} (v{report.source_version})")
        print(f"Deployed: {_DEPLOYED_DIR}")
        print()
        for step in report.steps:
            icon = {"ok": "✅", "error": "❌", "warning": "⚠️", "skipped": "—"}.get(step.status, "?")
            print(f"  {icon} {step.name}: {step.detail}")
            for item in step.items[:5]:
                print(f"       → {item}")
        print()
        if report.git_ahead is not None or report.git_dirty is not None:
            parts = []
            if report.git_ahead is not None:
                parts.append(f"ahead origin/main by {report.git_ahead} commits")
            if report.git_dirty is not None:
                parts.append("working tree " + ("dirty" if report.git_dirty else "clean"))
            print(f"Git: {', '.join(parts)}")
            if report.git_ahead and report.git_ahead > 0:
                print(f"⚠️ Consider pushing to GitHub when ready")
        print()
        print(f"Overall: {report.overall}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
