"""Pipeline progress detection tests."""
from __future__ import annotations

import shutil
import tempfile
from pathlib import Path

from core.pipeline_progress import (
    PipelineStage,
    detect_pipeline_stage,
    render_progress_markdown,
)


def _make_project() -> Path:
    return Path(tempfile.mkdtemp())


def test_empty_project_starts_at_intake_not_template_stage():
    d = _make_project()
    try:
        result = detect_pipeline_stage(d)
        assert result.current_stage == PipelineStage.INTAKE
        assert result.has_asset_intake is False
        assert result.has_template_selection is False
        md = render_progress_markdown(result)
        assert "素材准备" in md
        assert "已选模板" not in md
    finally:
        shutil.rmtree(d)


def test_asset_intake_detected_as_intake_stage():
    d = _make_project()
    try:
        fp = d / ".framepack"
        fp.mkdir()
        (fp / "asset-intake.md").write_text("brand:\n  logo: logo.png\n", encoding="utf-8")
        result = detect_pipeline_stage(d)
        assert result.current_stage == PipelineStage.INTAKE
        assert result.has_asset_intake is True
        md = render_progress_markdown(result)
        assert "素材准备" in md
        assert "asset-intake.md" in md
        assert "已选模板" not in md
    finally:
        shutil.rmtree(d)


def test_template_selection_is_intake_evidence_not_stage_spine():
    d = _make_project()
    try:
        fp = d / ".framepack"
        fp.mkdir()
        (fp / "template-selection.md").write_text("# selected", encoding="utf-8")
        result = detect_pipeline_stage(d)
        assert result.has_template_selection is True
        assert result.current_stage == PipelineStage.INTAKE
        md = render_progress_markdown(result)
        assert "素材准备" in md
        assert "template-selection.md" in md
        assert "已选模板" not in md
    finally:
        shutil.rmtree(d)


def test_frame_md_detected_as_design_stage():
    d = _make_project()
    try:
        (d / "frame.md").write_text("# frame", encoding="utf-8")
        result = detect_pipeline_stage(d)
        assert result.has_frame_md is True
        assert result.current_stage == PipelineStage.DESIGN
        md = render_progress_markdown(result)
        assert "视觉身份" in md
        assert "frame.md" in md
    finally:
        shutil.rmtree(d)


def test_expanded_prompt_detected_as_storyboard_stage():
    d = _make_project()
    try:
        (d / "frame.md").write_text("# frame", encoding="utf-8")
        exp = d / ".hyperframes"
        exp.mkdir()
        (exp / "expanded-prompt.md").write_text("# expanded", encoding="utf-8")
        result = detect_pipeline_stage(d)
        assert result.has_expanded_prompt is True
        assert result.current_stage == PipelineStage.STORYBOARD
        md = render_progress_markdown(result)
        assert "分镜导演稿" in md
        assert "expanded-prompt.md" in md
    finally:
        shutil.rmtree(d)


def test_index_html_detected_as_build_stage():
    d = _make_project()
    try:
        (d / "frame.md").write_text("# f", encoding="utf-8")
        (d / ".hyperframes").mkdir()
        (d / ".hyperframes" / "expanded-prompt.md").write_text("# e", encoding="utf-8")
        (d / "index.html").write_text("<html></html>", encoding="utf-8")
        result = detect_pipeline_stage(d)
        assert result.has_index_html is True
        assert result.current_stage == PipelineStage.BUILD
        md = render_progress_markdown(result)
        assert "制作中" in md
        assert "index.html" in md
    finally:
        shutil.rmtree(d)


def test_render_progress_markdown_has_official_pipeline_stages():
    d = _make_project()
    try:
        (d / "frame.md").write_text("# f", encoding="utf-8")
        result = detect_pipeline_stage(d)
        md = render_progress_markdown(result)
        assert "素材准备" in md
        assert "视觉身份" in md
        assert "文案脚本" in md
        assert "分镜导演稿" in md
        assert "配音/节奏" in md
        assert "制作中" in md
        assert "验片交付" in md
        assert "已选模板" not in md
    finally:
        shutil.rmtree(d)


def test_render_progress_markdown_shows_gate_status():
    """Gate results attach to progress and show in markdown."""
    from core.render_readiness import GateResult, GateStatus

    d = _make_project()
    try:
        (d / "frame.md").write_text("# f", encoding="utf-8")
        gate_result = GateResult(
            name="control_profile", status=GateStatus.GREEN, evidence="ok"
        )
        result = detect_pipeline_stage(d, gate_results=[gate_result])
        md = render_progress_markdown(result)
        assert "control_profile" in md
        assert "GREEN" in md or "✅" in md
    finally:
        shutil.rmtree(d)
