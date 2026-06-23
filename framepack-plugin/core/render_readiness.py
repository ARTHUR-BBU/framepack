"""Render Readiness Board — Framepack workflow gate system.

Checks for the presence and quality of Framepack workflow artifacts
(asset-intake, script-lanes, arsenal, catalog-decision, studio-preview,
context-sync, story bible) and produces a green/yellow/red board.

This is advisory: it never blocks render. It makes missing workflow
evidence visible and uncomfortable.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Optional


class GateStatus(str, Enum):
    GREEN = "GREEN"
    YELLOW = "YELLOW"
    RED = "RED"


@dataclass(frozen=True)
class GateResult:
    """One row in the readiness board."""
    name: str
    status: GateStatus
    evidence: str
    risk: str = ""


@dataclass(frozen=True)
class ReadinessBoard:
    """Full board with all gates and an overall verdict."""
    gates: list[GateResult]
    overall: GateStatus
    recommended_label: str = "draft"
    project_dir: str = ""


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def _exists(*parts: str) -> bool:
    return Path(*parts).is_file()


def _has_section(text: str, heading: str) -> bool:
    pattern = rf"^#+\s*{re.escape(heading)}"
    return bool(re.search(pattern, text, re.MULTILINE | re.IGNORECASE))


def _has_field(text: str, field_name: str) -> bool:
    """Check if a markdown/frontmatter field has a non-empty value."""
    pattern = rf"[-*]\s*{re.escape(field_name)}\s*:\s*\S"
    return bool(re.search(pattern, text, re.MULTILINE | re.IGNORECASE))


# ---------------------------------------------------------------------------
# Individual gate checkers
# ---------------------------------------------------------------------------

def check_asset_intake(project_dir: Path) -> GateResult:
    path = project_dir / ".framepack" / "asset-intake.md"
    if not path.is_file():
        return GateResult(
            name="Asset Intake",
            status=GateStatus.RED,
            evidence="missing .framepack/asset-intake.md",
            risk="no asset decision; output likely generic",
        )
    return GateResult(
        name="Asset Intake",
        status=GateStatus.GREEN,
        evidence=str(path.relative_to(project_dir)) if path.parent == project_dir / ".framepack" else str(path),
        risk="",
    )


def check_script_lanes(project_dir: Path) -> GateResult:
    path = project_dir / ".framepack" / "script-lanes.md"
    if not path.is_file():
        return GateResult(
            name="Script Lanes",
            status=GateStatus.RED,
            evidence="missing .framepack/script-lanes.md",
            risk="placeholder-smell risk; narrative direction undefined",
        )
    text = _read(path)
    if not _has_section(text, "Selected lane"):
        return GateResult(
            name="Script Lanes",
            status=GateStatus.YELLOW,
            evidence=".framepack/script-lanes.md exists but no lane selected",
            risk="lanes drafted but no commitment",
        )
    if _has_field(text, "user_confirmed") and "true" in text.lower():
        return GateResult(
            name="Script Lanes",
            status=GateStatus.GREEN,
            evidence=".framepack/script-lanes.md (lane selected + confirmed)",
            risk="",
        )
    return GateResult(
        name="Script Lanes",
        status=GateStatus.YELLOW,
        evidence=".framepack/script-lanes.md (lane selected but not user-confirmed)",
        risk="",
    )


def check_story_bible(project_dir: Path) -> GateResult:
    path = project_dir / ".hyperframes" / "expanded-prompt.md"
    if not path.is_file():
        return GateResult(
            name="Story Bible",
            status=GateStatus.RED,
            evidence="missing .hyperframes/expanded-prompt.md",
            risk="HyperFrames has no creative direction input",
        )
    return GateResult(
        name="Story Bible",
        status=GateStatus.GREEN,
        evidence=".hyperframes/expanded-prompt.md",
        risk="",
    )


def check_frame_md(project_dir: Path) -> GateResult:
    path = project_dir / "frame.md"
    if not path.is_file():
        return GateResult(
            name="Visual Identity",
            status=GateStatus.RED,
            evidence="missing frame.md",
            risk="no color/typography/motion tokens",
        )
    return GateResult(
        name="Visual Identity",
        status=GateStatus.GREEN,
        evidence="frame.md",
        risk="",
    )


def check_arsenal(project_dir: Path) -> GateResult:
    path = project_dir / ".framepack" / "arsenal.json"
    if not path.is_file():
        return GateResult(
            name="Arsenal Binding",
            status=GateStatus.RED,
            evidence="missing .framepack/arsenal.json",
            risk="weapons not governed; declared weapons may be handwritten without provenance",
        )
    return GateResult(
        name="Arsenal Binding",
        status=GateStatus.GREEN,
        evidence=".framepack/arsenal.json",
        risk="",
    )


def check_catalog_decision(project_dir: Path) -> GateResult:
    path = project_dir / ".framepack" / "catalog-decision.md"
    if not path.is_file():
        return GateResult(
            name="Catalog Decision",
            status=GateStatus.YELLOW,
            evidence="no .framepack/catalog-decision.md",
            risk="HyperFrames catalog support unevaluated",
        )
    return GateResult(
        name="Catalog Decision",
        status=GateStatus.GREEN,
        evidence=".framepack/catalog-decision.md",
        risk="",
    )


def check_studio_preview(project_dir: Path) -> GateResult:
    path = project_dir / ".framepack" / "studio-preview.md"
    if not path.is_file():
        return GateResult(
            name="Studio Preview",
            status=GateStatus.RED,
            evidence="no preview evidence",
            risk="closed-door render; no observation iteration",
        )
    text = _read(path)
    if _has_field(text, "skipped") and "true" in text.lower():
        return GateResult(
            name="Studio Preview",
            status=GateStatus.YELLOW,
            evidence="preview waived (skipped: true)",
            risk="user accepted no live preview",
        )
    return GateResult(
        name="Studio Preview",
        status=GateStatus.GREEN,
        evidence=".framepack/studio-preview.md",
        risk="",
    )


def check_context_sync(project_dir: Path) -> GateResult:
    path = project_dir / ".framepack" / "context-sync.md"
    if not path.is_file():
        return GateResult(
            name="Context Sync",
            status=GateStatus.YELLOW,
            evidence="no .framepack/context-sync.md",
            risk="AGENTS/CLAUDE version may be stale",
        )
    text = _read(path)
    if "project_context_current: true" in text.lower():
        return GateResult(
            name="Context Sync",
            status=GateStatus.GREEN,
            evidence=".framepack/context-sync.md (current)",
            risk="",
        )
    return GateResult(
        name="Context Sync",
        status=GateStatus.YELLOW,
        evidence=".framepack/context-sync.md (stale files detected)",
        risk="some instruction files may lag behind deployed plugin",
    )


def check_handoff_manifest(project_dir: Path) -> GateResult:
    path = project_dir / ".framepack" / "handoff-manifest.md"
    if not path.is_file():
        return GateResult(
            name="Handoff Manifest",
            status=GateStatus.YELLOW,
            evidence="no .framepack/handoff-manifest.md",
            risk="HyperFrames handoff intent not formalized",
        )
    return GateResult(
        name="Handoff Manifest",
        status=GateStatus.GREEN,
        evidence=".framepack/handoff-manifest.md",
        risk="",
    )


def check_taste_audit(project_dir: Path) -> GateResult:
    path = project_dir / ".framepack" / "taste-audit.md"
    if not path.is_file():
        return GateResult(
            name="Taste Audit",
            status=GateStatus.YELLOW,
            evidence="no pre-render taste audit",
            risk="creative direction not reviewed before render",
        )
    return GateResult(
        name="Taste Audit",
        status=GateStatus.GREEN,
        evidence=".framepack/taste-audit.md",
        risk="",
    )


# ---------------------------------------------------------------------------
# Board builder
# ---------------------------------------------------------------------------

def _gate_priority(status: GateStatus) -> int:
    order = {GateStatus.RED: 0, GateStatus.YELLOW: 1, GateStatus.GREEN: 2}
    return order.get(status, 3)


GATE_NAMES_IN_ORDER = [
    "Asset Intake",
    "Script Lanes",
    "Visual Identity",
    "Story Bible",
    "Handoff Manifest",
    "Arsenal Binding",
    "Catalog Decision",
    "Studio Preview",
    "Context Sync",
    "Taste Audit",
]

_GATE_CHECKERS = {
    "Asset Intake": check_asset_intake,
    "Script Lanes": check_script_lanes,
    "Visual Identity": check_frame_md,
    "Story Bible": check_story_bible,
    "Handoff Manifest": check_handoff_manifest,
    "Arsenal Binding": check_arsenal,
    "Catalog Decision": check_catalog_decision,
    "Studio Preview": check_studio_preview,
    "Context Sync": check_context_sync,
    "Taste Audit": check_taste_audit,
}


def build_readiness_board(project_dir: str | Path) -> ReadinessBoard:
    """Evaluate all gates and return a ReadinessBoard."""
    project = Path(project_dir)
    gates: list[GateResult] = []
    for name in GATE_NAMES_IN_ORDER:
        checker = _GATE_CHECKERS[name]
        gates.append(checker(project))

    if any(g.status is GateStatus.RED for g in gates):
        overall = GateStatus.RED
        label = "draft"
    elif any(g.status is GateStatus.YELLOW for g in gates):
        overall = GateStatus.YELLOW
        label = "provisional"
    else:
        overall = GateStatus.GREEN
        label = "standard_sample"

    return ReadinessBoard(
        gates=gates,
        overall=overall,
        recommended_label=label,
        project_dir=str(project),
    )


# ---------------------------------------------------------------------------
# Markdown emitter
# ---------------------------------------------------------------------------

_STATUS_EMOJI = {
    GateStatus.GREEN: "🟢",
    GateStatus.YELLOW: "🟡",
    GateStatus.RED: "🔴",
}


def render_board_markdown(board: ReadinessBoard) -> str:
    lines = [
        "# Render Readiness Board",
        "",
        "| Gate | Status | Evidence | Risk |",
        "|---|---|---|---|",
    ]
    for g in board.gates:
        emoji = _STATUS_EMOJI.get(g.status, "⬜")
        lines.append(f"| {g.name} | {emoji} {g.status.value} | {g.evidence} | {g.risk} |")

    lines.extend([
        "",
        "## Overall",
        f"- status: {_STATUS_EMOJI.get(board.overall, '⬜')} {board.overall.value}",
        f"- recommended_label: `{board.recommended_label}`",
        "",
        "## User options",
        "1. revise now (fix red gates)",
        "2. add missing assets / artifacts",
        "3. open Studio preview",
        "4. render anyway as draft",
        "",
    ])
    return "\n".join(lines)


def render_board_summary(board: ReadinessBoard) -> str:
    """Compact one-liner for hook injection."""
    counts = {GateStatus.RED: 0, GateStatus.YELLOW: 0, GateStatus.GREEN: 0}
    for g in board.gates:
        counts[g.status] = counts.get(g.status, 0) + 1
    emoji = _STATUS_EMOJI.get(board.overall, "⬜")
    return (
        f"{emoji} **Framepack Readiness — {board.overall.value}** "
        f"(label: {board.recommended_label}) | "
        f"🔴 {counts[GateStatus.RED]} · 🟡 {counts[GateStatus.YELLOW]} · 🟢 {counts[GateStatus.GREEN]}"
    )
