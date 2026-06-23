"""Integration tests for readiness board hook injection."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock

import sys

PLUGIN_ROOT = Path(__file__).resolve().parent.parent
if str(PLUGIN_ROOT) not in sys.path:
    sys.path.insert(0, str(PLUGIN_ROOT))

from hooks.on_pre_tool_call import _inject_readiness_board
from core.render_readiness import build_readiness_board


class FakeCtx:
    def __init__(self):
        self.messages = []
    def inject_message(self, msg, role="assistant"):
        self.messages.append((role, msg))


class TestReadinessBoardHook:
    def test_injects_summary_on_empty_project(self, tmp_path):
        ctx = FakeCtx()
        _inject_readiness_board(ctx, str(tmp_path))
        assert len(ctx.messages) == 1
        role, msg = ctx.messages[0]
        assert role == "user"
        assert "Readiness" in msg
        assert "RED" in msg

    def test_writes_render_readiness_md(self, tmp_path):
        ctx = FakeCtx()
        _inject_readiness_board(ctx, str(tmp_path))
        md = (tmp_path / ".framepack" / "render-readiness.md").read_text(encoding="utf-8")
        assert "# Render Readiness Board" in md

    def test_message_contains_red_gate_names(self, tmp_path):
        ctx = FakeCtx()
        _inject_readiness_board(ctx, str(tmp_path))
        msg = ctx.messages[0][1]
        assert "Asset Intake" in msg

    def test_no_crash_on_minimal_project(self, tmp_path):
        """Even a project with just index.html should not crash."""
        (tmp_path / "index.html").write_text("<html></html>", encoding="utf-8")
        ctx = FakeCtx()
        _inject_readiness_board(ctx, str(tmp_path))
        assert len(ctx.messages) == 1
