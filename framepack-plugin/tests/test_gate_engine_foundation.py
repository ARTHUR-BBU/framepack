from __future__ import annotations

from pathlib import Path

from core.gates.engine import build_readiness_board, render_board_markdown, render_board_summary
from core.gates.types import GateStatus


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
