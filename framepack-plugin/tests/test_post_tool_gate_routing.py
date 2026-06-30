"""Test pipeline gate routing and progress update after file writes.

These tests verify that gate functions are invoked after frame.md /
expanded-prompt.md writes, and that progress.md is updated. We test the
extracted helper _run_pipeline_gates_and_update directly to avoid coupling
to LLM analysis paths inside _handle_frame_md / _handle_expanded_prompt.
"""

from __future__ import annotations

import shutil
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

from hooks.on_post_tool_call import _run_pipeline_gates_and_update


def _make_project_with_frame() -> Path:
    d = Path(tempfile.mkdtemp())
    (d / "frame.md").write_text(
        "# Frame\n\ncontrol_profile:\n  creative_autonomy: 0.6\n",
        encoding="utf-8",
    )
    return d


def test_frame_md_gate_runs_control_profile_and_writes_progress():
    """After frame.md, control_profile gate runs and progress.md is written."""
    d = _make_project_with_frame()
    try:
        ctx = MagicMock()
        from core.render_readiness import GateResult, GateStatus

        fake_gate = GateResult(
            name="control_profile", status=GateStatus.GREEN, evidence="ok"
        )
        with patch(
            "core.gates.control_profile.check_control_profile_consistency",
            return_value=fake_gate,
        ) as mock_gate:
            _run_pipeline_gates_and_update(
                ctx,
                project_dir=d,
                gate_funcs=["core.gates.control_profile.check_control_profile_consistency"],
            )
            assert mock_gate.called, "control_profile gate should run"
        assert (d / ".framepack" / "progress.md").is_file(), "progress.md should be written"
    finally:
        shutil.rmtree(d)


def test_expanded_prompt_gates_run_continuity_and_storyboard():
    """After expanded-prompt, scene_continuity + storyboard gates run."""
    d = Path(tempfile.mkdtemp())
    (d / "frame.md").write_text("# f", encoding="utf-8")
    (d / ".hyperframes").mkdir()
    (d / ".hyperframes" / "expanded-prompt.md").write_text("# expanded", encoding="utf-8")
    try:
        ctx = MagicMock()
        with patch("core.gates.scene_continuity.check_scene_continuity") as mock_cont, \
             patch("core.gates.storyboard_preview.check_storyboard_preview") as mock_sb:
            mock_cont.return_value = None
            mock_sb.return_value = None
            _run_pipeline_gates_and_update(
                ctx,
                project_dir=d,
                gate_funcs=[
                    "core.gates.scene_continuity.check_scene_continuity",
                    "core.gates.storyboard_preview.check_storyboard_preview",
                ],
            )
            assert mock_cont.called
            assert mock_sb.called
    finally:
        shutil.rmtree(d)


def test_gate_exception_does_not_crash():
    """Gate raising exception must not break the flow — advisory, non-blocking."""
    d = _make_project_with_frame()
    try:
        ctx = MagicMock()
        with patch(
            "core.gates.control_profile.check_control_profile_consistency",
            side_effect=RuntimeError("boom"),
        ):
            # Should NOT raise
            _run_pipeline_gates_and_update(
                ctx,
                project_dir=d,
                gate_funcs=["core.gates.control_profile.check_control_profile_consistency"],
            )
        # progress.md should still be written even if gate crashed
        assert (d / ".framepack" / "progress.md").is_file()
    finally:
        shutil.rmtree(d)


def test_progress_file_failure_is_silent():
    """If progress.md write fails, no crash — silent degrade."""
    d = _make_project_with_frame()
    try:
        ctx = MagicMock()
        with patch(
            "core.gates.control_profile.check_control_profile_consistency",
            return_value=None,
        ), patch(
            "core.pipeline_progress.write_progress_file",
            side_effect=OSError("disk full"),
        ):
            # Should NOT raise even if progress write fails
            _run_pipeline_gates_and_update(
                ctx,
                project_dir=d,
                gate_funcs=["core.gates.control_profile.check_control_profile_consistency"],
            )
    finally:
        shutil.rmtree(d)
