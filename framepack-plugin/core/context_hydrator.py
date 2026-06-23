"""Context Hydrator — workbench-wide AGENTS.md/CLAUDE.md version sync.

Extends the existing Guardrail Hydrator pattern: instead of only syncing
the current project's AGENTS.md managed block, this module scans an
entire workbench (root + cases/*) for stale instruction files and
generates a context-sync.md report.

This solves the problem where test workbench files like
F:/Framepack-01-test/AGENTS.md still say "version: 0.11.0" while the
deployed plugin is v0.15.0.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from hooks.guardrails import (
    BLOCK_RE,
    build_guardrails_payload,
    sync_project_agents,
    GuardrailsPayload,
    GuardrailsSyncResult,
)


@dataclass(frozen=True)
class ContextFileStatus:
    """Status of one instruction file (AGENTS.md or CLAUDE.md)."""
    path: str
    exists: bool
    has_managed_block: bool
    detected_version: str  # from managed block, or "none" / "unknown"
    is_stale: bool
    action_needed: str  # "none" | "create" | "update_block" | "append_block"


@dataclass(frozen=True)
class ContextSyncReport:
    """Full report of a context sync scan."""
    workbench_root: str
    plugin_version: str
    plugin_digest: str
    files: list[ContextFileStatus]
    project_context_current: bool
    stale_files: list[str] = field(default_factory=list)
    error: Optional[str] = None


def _detect_managed_version(text: str) -> str:
    """Extract version from a FRAMEPACK MANAGED BLOCK if present."""
    match = BLOCK_RE.search(text)
    if not match:
        return "none"
    block = match.group(0)
    version_match = re.search(r"version=([^\s]+)", block)
    return version_match.group(1) if version_match else "unknown"


def _detect_old_framepack_version(text: str) -> str:
    """Detect version from old-style full-copy AGENTS.md (pre-managed-block)."""
    match = re.search(r"version:\s*([\d.]+)", text, re.IGNORECASE)
    return match.group(1) if match else "unknown"


def _check_one_file(
    file_path: Path,
    plugin_payload: GuardrailsPayload,
) -> ContextFileStatus:
    """Check a single AGENTS.md or CLAUDE.md file."""
    if not file_path.exists():
        return ContextFileStatus(
            path=str(file_path),
            exists=False,
            has_managed_block=False,
            detected_version="none",
            is_stale=False,
            action_needed="none",
        )

    try:
        text = file_path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ContextFileStatus(
            path=str(file_path),
            exists=True,
            has_managed_block=False,
            detected_version="read_error",
            is_stale=True,
            action_needed="none",
        )

    has_block = bool(BLOCK_RE.search(text))
    detected = _detect_managed_version(text) if has_block else _detect_old_framepack_version(text)
    is_stale = detected != plugin_payload.version

    if not has_block:
        action = "append_block"
    elif is_stale:
        action = "update_block"
    else:
        action = "none"

    return ContextFileStatus(
        path=str(file_path),
        exists=True,
        has_managed_block=has_block,
        detected_version=detected,
        is_stale=is_stale,
        action_needed=action,
    )


def find_workbench_root(project_dir: Path | str) -> Optional[Path]:
    """Walk up from project_dir to find the workbench root.

    A workbench root is identified by having WORKBENCH.md or
    (AGENTS.md + cases/ directory).
    """
    current = Path(project_dir).resolve()
    for candidate in [current] + list(current.parents):
        if (candidate / "WORKBENCH.md").is_file():
            return candidate
        if (candidate / "cases").is_dir() and (candidate / "AGENTS.md").is_file():
            return candidate
    return None


def collect_context_files(workbench_root: Path) -> list[Path]:
    """Collect all AGENTS.md and CLAUDE.md files in a workbench."""
    targets: list[Path] = []

    # Root level
    for name in ("AGENTS.md", "CLAUDE.md"):
        p = workbench_root / name
        targets.append(p)

    # Case level
    cases_dir = workbench_root / "cases"
    if cases_dir.is_dir():
        for case in sorted(cases_dir.iterdir()):
            if not case.is_dir():
                continue
            for name in ("AGENTS.md", "CLAUDE.md"):
                p = case / name
                targets.append(p)

    return targets


def check_context_sync(
    workbench_root: Path | str,
    plugin_dir: Path | str,
) -> ContextSyncReport:
    """Scan a workbench for stale context files. Read-only; does not write."""
    workbench_root = Path(workbench_root)
    plugin_dir = Path(plugin_dir)

    payload = build_guardrails_payload(plugin_dir)
    targets = collect_context_files(workbench_root)

    file_statuses: list[ContextFileStatus] = []
    stale: list[str] = []

    for target in targets:
        status = _check_one_file(target, payload)
        file_statuses.append(status)
        if status.is_stale and status.exists:
            stale.append(f"{status.path} (detected: {status.detected_version})")

    project_current = len(stale) == 0

    return ContextSyncReport(
        workbench_root=str(workbench_root),
        plugin_version=payload.version,
        plugin_digest=payload.digest,
        files=file_statuses,
        project_context_current=project_current,
        stale_files=stale,
    )


def hydrate_context(
    workbench_root: Path | str,
    plugin_dir: Path | str,
) -> ContextSyncReport:
    """Scan + update: sync managed blocks in all stale files, then write report.

    Returns the final report (post-hydration).
    """
    workbench_root = Path(workbench_root)
    plugin_dir = Path(plugin_dir)

    # First: scan to know what needs updating
    initial = check_context_sync(workbench_root, plugin_dir)

    # Update stale files
    for fs in initial.files:
        if not fs.exists or fs.action_needed == "none":
            continue
        try:
            sync_project_agents(Path(fs.path).parent, plugin_dir, ctx=None)
        except Exception:
            pass  # sync_project_agents handles its own errors

    # Write context-sync.md
    fp_dir = workbench_root / ".framepack"
    fp_dir.mkdir(parents=True, exist_ok=True)
    report_path = fp_dir / "context-sync.md"
    final = check_context_sync(workbench_root, plugin_dir)
    report_path.write_text(
        _render_context_sync_markdown(final), encoding="utf-8", newline="\n"
    )

    return final


def _render_context_sync_markdown(report: ContextSyncReport) -> str:
    lines = [
        "# Framepack Context Sync",
        "",
        "## Source of truth",
        f"- version: {report.plugin_version}",
        f"- guardrails_hash: {report.plugin_digest}",
        "",
        "## Files checked",
        "| file | exists | managed_block | detected_version | stale | action |",
        "|---|---|---|---|---|---|",
    ]
    for fs in report.files:
        rel = fs.path
        if rel.startswith(report.workbench_root):
            rel = rel[len(report.workbench_root):].lstrip("\\/")
        lines.append(
            f"| {rel} | {fs.exists} | {fs.has_managed_block} | "
            f"{fs.detected_version} | {fs.is_stale} | {fs.action_needed} |"
        )
    lines.extend([
        "",
        "## Result",
        f"- project_context_current: {str(report.project_context_current).lower()}",
    ])
    if report.stale_files:
        lines.append(f"- stale_files: {len(report.stale_files)}")
        for s in report.stale_files:
            lines.append(f"  - {s}")
    else:
        lines.append("- stale_files: none")
    lines.append("")
    return "\n".join(lines)
