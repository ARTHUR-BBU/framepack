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


def test_asset_intake_write_runs_asset_depth_and_writes_progress():
    """Writing asset-intake.md updates non-template progress immediately."""
    d = Path(tempfile.mkdtemp())
    fp = d / ".framepack"
    fp.mkdir()
    (fp / "asset-intake.md").write_text("brand:\n  logo: logo.png\n", encoding="utf-8")
    try:
        from hooks.on_post_tool_call import _handle_asset_intake
        from core.render_readiness import GateResult, GateStatus

        ctx = MagicMock()
        ctx.inject_message = MagicMock()
        fake_gate = GateResult(
            name="Asset Depth", status=GateStatus.GREEN, evidence="ok"
        )
        with patch("core.gates.asset_intake.check_asset_depth", return_value=fake_gate) as mock_gate:
            _handle_asset_intake(ctx, str(fp / "asset-intake.md"))
            assert mock_gate.called
        assert (fp / "progress.md").is_file()
        md = (fp / "progress.md").read_text(encoding="utf-8")
        assert "素材准备" in md
        assert "asset-intake.md" in md
    finally:
        shutil.rmtree(d)


def test_project_dir_for_framepack_files_resolves_project_root():
    """Files under .framepack should resolve to the project root, not .framepack."""
    from hooks.on_post_tool_call import _project_dir_for_framepack_file

    d = Path(tempfile.mkdtemp())
    fp = d / ".framepack"
    fp.mkdir()
    try:
        assert _project_dir_for_framepack_file(str(fp / "asset-intake.md")) == str(d)
        assert _project_dir_for_framepack_file(str(fp / "template-selection.md")) == str(d)
    finally:
        shutil.rmtree(d)


def test_asset_intake_without_template_injects_non_template_completeness_card():
    """Non-template asset intake gets a cold/warm-start creation checklist."""
    d = Path(tempfile.mkdtemp())
    fp = d / ".framepack"
    fp.mkdir()
    (fp / "asset-intake.md").write_text("brand:\n  logo: logo.png\n", encoding="utf-8")
    try:
        from hooks.on_post_tool_call import _handle_asset_intake

        ctx = MagicMock()
        ctx.inject_message = MagicMock()
        _handle_asset_intake(ctx, str(fp / "asset-intake.md"))
        injected = "\n---\n".join(call.args[0] for call in ctx.inject_message.call_args_list)
        assert "创作小票" in injected
        assert "时长" in injected
        assert "画幅" in injected
        assert "风格" in injected
        assert "CTA" in injected
    finally:
        shutil.rmtree(d)


def test_asset_intake_with_template_does_not_inject_non_template_card():
    """Template projects keep using the template param card path."""
    d = Path(tempfile.mkdtemp())
    fp = d / ".framepack"
    fp.mkdir()
    (fp / "asset-intake.md").write_text("brand:\n  logo: logo.png\n", encoding="utf-8")
    (fp / "template-selection.md").write_text("# Template\nparams: brand_name\n", encoding="utf-8")
    try:
        from hooks.on_post_tool_call import _handle_asset_intake

        ctx = MagicMock()
        ctx.inject_message = MagicMock()
        _handle_asset_intake(ctx, str(fp / "asset-intake.md"))
        injected = "\n---\n".join(call.args[0] for call in ctx.inject_message.call_args_list)
        assert "创作小票" not in injected
    finally:
        shutil.rmtree(d)


def test_template_selection_write_injects_param_card():
    """Writing template-selection.md triggers param card injection."""
    d = Path(tempfile.mkdtemp())
    fp = d / ".framepack"
    fp.mkdir()
    (fp / "template-selection.md").write_text(
        "# Template: miara-style-template\nparams: brand_name, tagline, cta\n",
        encoding="utf-8",
    )
    try:
        from hooks.on_post_tool_call import _handle_template_param_card

        ctx = MagicMock()
        ctx.inject_message = MagicMock()
        _handle_template_param_card(ctx, str(fp / "template-selection.md"))
        assert ctx.inject_message.called, "param card should be injected"
        injected = ctx.inject_message.call_args[0][0]
        assert "brand_name" in injected or "参数" in injected
    finally:
        shutil.rmtree(d)


def test_template_selection_without_params_is_noop():
    """If template-selection.md has no params line, no injection (backward compat)."""
    d = Path(tempfile.mkdtemp())
    fp = d / ".framepack"
    fp.mkdir()
    (fp / "template-selection.md").write_text(
        "# Template: plain\n\nNo params here.\n", encoding="utf-8"
    )
    try:
        from hooks.on_post_tool_call import _handle_template_param_card

        ctx = MagicMock()
        ctx.inject_message = MagicMock()
        _handle_template_param_card(ctx, str(fp / "template-selection.md"))
        assert not ctx.inject_message.called, "no params → no injection"
    finally:
        shutil.rmtree(d)
