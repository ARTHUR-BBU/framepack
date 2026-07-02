from __future__ import annotations

from pathlib import Path

from core.gates.engine import build_readiness_board, render_board_markdown, render_board_summary
from core.gates.types import GateStatus


def _fp(project: Path) -> Path:
    path = project / ".framepack"
    path.mkdir(parents=True, exist_ok=True)
    return path


def test_gate_engine_preserves_legacy_readiness_surface(tmp_path: Path):
    board = build_readiness_board(tmp_path)

    names = [gate.name for gate in board.gates]
    assert names[:6] == [
        "Asset Intake",
        "Script Lanes",
        "Director Inspect",
        "Visual Identity",
        "Story Bible",
        "Handoff Manifest",
    ]
    assert board.overall is GateStatus.RED
    assert board.recommended_label == "draft"


def test_gate_engine_renders_markdown_and_summary(tmp_path: Path):
    board = build_readiness_board(tmp_path)

    markdown = render_board_markdown(board)
    summary = render_board_summary(board)

    assert "# Render Readiness Board" in markdown
    assert "| Gate | Status | Evidence | Risk |" in markdown
    assert "Framepack Readiness" in summary
    assert "RED" in summary


def test_script_lanes_green_with_director_decision_reason(tmp_path: Path):
    _fp(tmp_path).joinpath("script-lanes.md").write_text(
        """# Script Lanes

## Lane A
- hook: show evidence first
- beats: intake -> frame -> story bible
- final line: the workbench writes itself

## Selected lane
- lane: A
- user_confirmed: false
- director_decision: true
- decision_reason: autonomous dogfood brief delegated lane choice to Framepack
""",
        encoding="utf-8",
    )

    board = build_readiness_board(tmp_path)
    gate = {g.name: g for g in board.gates}["Script Lanes"]

    assert gate.status is GateStatus.GREEN
    assert "director decision" in gate.evidence.lower()


def test_hyperframes_capability_alignment_warns_when_url_source_lacks_decision(tmp_path: Path):
    _fp(tmp_path).joinpath("asset-intake.md").write_text(
        """# Asset Intake

## References
- url: https://example.com
- source_type: website
""",
        encoding="utf-8",
    )

    board = build_readiness_board(tmp_path)
    gate = {g.name: g for g in board.gates}["HyperFrames Capability Alignment"]

    assert gate.status is GateStatus.YELLOW
    assert "capture" in gate.evidence.lower()


def test_hyperframes_capability_alignment_green_with_used_or_waived_decision(tmp_path: Path):
    fp = _fp(tmp_path)
    fp.joinpath("asset-intake.md").write_text("source: https://example.com\n", encoding="utf-8")
    fp.joinpath("hyperframes-capability-alignment.md").write_text(
        """# HyperFrames Capability Alignment

## Decisions
- used: website-to-video / capture for source evidence
- waived:
""",
        encoding="utf-8",
    )

    board = build_readiness_board(tmp_path)
    gate = {g.name: g for g in board.gates}["HyperFrames Capability Alignment"]

    assert gate.status is GateStatus.GREEN
