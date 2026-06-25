"""Readiness Gate Engine public surface.

Phase A keeps behavior delegated to the legacy readiness module while new gates
are introduced behind this package. This gives downstream callers a stable
`core.gates.engine` import path before we migrate individual checks.
"""

from __future__ import annotations

from pathlib import Path

from core.render_readiness import (
    build_readiness_board as _legacy_build_readiness_board,
    render_board_markdown as _legacy_render_board_markdown,
    render_board_summary as _legacy_render_board_summary,
)
from core.gates.types import ReadinessBoard


def build_readiness_board(project_dir: str | Path) -> ReadinessBoard:
    """Build the readiness board for a project directory."""

    return _legacy_build_readiness_board(project_dir)


def render_board_markdown(board: ReadinessBoard) -> str:
    """Render a full markdown readiness board."""

    return _legacy_render_board_markdown(board)


def render_board_summary(board: ReadinessBoard) -> str:
    """Render a compact readiness summary."""

    return _legacy_render_board_summary(board)
