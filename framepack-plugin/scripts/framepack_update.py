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
import subprocess
import sys
import os
from dataclasses import asdict, dataclass, field
from pathlib import Path


def _looks_like_plugin_source(path: Path) -> bool:
    return (path / "plugin.yaml").is_file() and (path / "scripts" / "framepack_update.py").is_file()


def _resolve_source_dir(current_file: Path) -> Path:
    """Resolve authoritative source repo even when this script runs from deployed plugin."""
    env_source = os.environ.get("FRAMEPACK_SOURCE_DIR")
    if env_source and _looks_like_plugin_source(Path(env_source)):
        return Path(env_source)

    candidates = [
        Path.cwd() / "framepack-plugin",
        Path("F:/hyperframes/framepack-plugin"),
        current_file.resolve().parents[1],
    ]
    for candidate in candidates:
        if _looks_like_plugin_source(candidate):
            return candidate
    return current_file.resolve().parents[1]


_SOURCE_DIR = _resolve_source_dir(Path(__file__))
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


def _pytest_failure_summary(stdout: str, stderr: str) -> str:
    """Return concise, printable pytest failure detail."""
    combined = "\n".join(part for part in [stdout, stderr] if part)
    lines = [line.strip() for line in combined.replace("\r", "\n").splitlines() if line.strip()]
    interesting = [
        line for line in lines
        if line.startswith(("FAILED ", "ERROR ", "E   ", "E       "))
        or " failed" in line
        or " error" in line.lower()
    ]
    selected = interesting[-8:] if interesting else lines[-8:]
    return " | ".join(selected)[-800:]


def _select_test_python() -> str:
    """Find a Python executable that can import pytest.

    Hermes CLI may run inside its own venv, and that venv intentionally may not
    include dev/test dependencies. Smoke tests should use a project/system Python
    with pytest rather than failing with "No module named pytest".
    """
    candidates: list[str] = []
    env_python = os.environ.get("FRAMEPACK_TEST_PYTHON")
    if env_python:
        candidates.append(env_python)
    path_python = shutil.which("python")
    if path_python:
        candidates.append(path_python)
    candidates.append(sys.executable)

    seen: set[str] = set()
    for candidate in candidates:
        if not candidate or candidate in seen:
            continue
        seen.add(candidate)
        try:
            probe = subprocess.run(
                [candidate, "-c", "import pytest"],
                capture_output=True, text=True, timeout=15,
                encoding="utf-8", errors="replace",
            )
            if probe.returncode == 0:
                return candidate
        except Exception:
            continue
    return sys.executable


def run_update(
    skip_smoke: bool = False,
    workbench: str | None = None,
    report_only: bool = False,
) -> UpdateReport:
    """Run the full update chain."""
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
            test_python = _select_test_python()
            result = subprocess.run(
                [test_python, "-m", "pytest", str(_DEPLOYED_DIR / "tests"),
                 "-q", "-o", "addopts=", "-x"],
                capture_output=True, text=True, timeout=120,
                encoding="utf-8", errors="replace",
            )
            if result.returncode == 0:
                last_line = [l for l in result.stdout.strip().splitlines() if l][-1]
                steps.append(UpdateStepResult(name="smoke", status="ok", detail=last_line))
            else:
                detail = _pytest_failure_summary(result.stdout, result.stderr)
                steps.append(UpdateStepResult(name="smoke", status="error", detail=detail))
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
