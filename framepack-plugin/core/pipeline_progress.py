"""Pipeline progress detection for Framepack visibility.

Detects which workflow artifacts exist in a project and renders a user-facing
progress markdown. Advisory only — never blocks.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import IntEnum
from pathlib import Path


class PipelineStage(IntEnum):
    """Ordered pipeline stages. Value = progress depth."""

    TEMPLATE_SELECTED = 0
    PARAMS_FILLED = 1
    FRAME_MD = 2
    EXPANDED_PROMPT = 3
    HTML_GENERATED = 4
    RENDER_READY = 5


_STAGE_LABELS = {
    PipelineStage.TEMPLATE_SELECTED: "已选模板",
    PipelineStage.PARAMS_FILLED: "已填参数",
    PipelineStage.FRAME_MD: "已出视觉稿",
    PipelineStage.EXPANDED_PROMPT: "已出分镜",
    PipelineStage.HTML_GENERATED: "可预览",
    PipelineStage.RENDER_READY: "可渲染",
}


@dataclass
class PipelineProgress:
    """Snapshot of project pipeline state."""

    current_stage: PipelineStage
    has_template_selection: bool
    has_frame_md: bool
    has_expanded_prompt: bool
    has_index_html: bool
    gate_results: list = field(default_factory=list)


def detect_pipeline_stage(
    project_dir: str | Path,
    gate_results: list | None = None,
) -> PipelineProgress:
    """Detect current pipeline stage by checking artifact presence."""
    project = Path(project_dir)
    gate_results = gate_results or []

    has_template_selection = (project / ".framepack" / "template-selection.md").is_file()
    has_frame_md = (project / "frame.md").is_file()
    has_expanded_prompt = (project / ".hyperframes" / "expanded-prompt.md").is_file()
    has_index_html = (project / "index.html").is_file()

    if has_index_html:
        stage = PipelineStage.HTML_GENERATED
    elif has_expanded_prompt:
        stage = PipelineStage.EXPANDED_PROMPT
    elif has_frame_md:
        stage = PipelineStage.FRAME_MD
    elif has_template_selection:
        stage = PipelineStage.TEMPLATE_SELECTED
    else:
        stage = PipelineStage.TEMPLATE_SELECTED  # empty project = start

    return PipelineProgress(
        current_stage=stage,
        has_template_selection=has_template_selection,
        has_frame_md=has_frame_md,
        has_expanded_prompt=has_expanded_prompt,
        has_index_html=has_index_html,
        gate_results=gate_results,
    )


def render_progress_markdown(progress: PipelineProgress) -> str:
    """Render a user-facing progress markdown."""
    lines = ["# 项目进度", ""]
    reached = progress.current_stage.value

    # Evidence: which artifact file backs each reached stage
    _stage_evidence = {
        PipelineStage.TEMPLATE_SELECTED: "template-selection.md",
        PipelineStage.PARAMS_FILLED: "template params",
        PipelineStage.FRAME_MD: "frame.md",
        PipelineStage.EXPANDED_PROMPT: "expanded-prompt.md",
        PipelineStage.HTML_GENERATED: "index.html",
        PipelineStage.RENDER_READY: "render readiness",
    }

    for stage in PipelineStage:
        label = _STAGE_LABELS[stage]
        if stage.value < reached:
            evidence = _stage_evidence.get(stage, "")
            lines.append(f"- ✅ {label}" + (f"（{evidence}）" if evidence else ""))
        elif stage.value == reached:
            evidence = _stage_evidence.get(stage, "")
            lines.append(f"- 🔄 {label} ← 当前" + (f"（{evidence}）" if evidence else ""))
        else:
            lines.append(f"- ⬜ {label}")

    if progress.gate_results:
        lines.append("")
        lines.append("**校验：**")
        for gr in progress.gate_results:
            status_emoji = {"GREEN": "✅", "YELLOW": "🟡", "RED": "🔴"}.get(
                str(gr.status), "⬜"
            )
            lines.append(f"- {status_emoji} {gr.name}: {gr.evidence}")

    lines.append("")
    lines.append("_由 Framepack pipeline gate 自动更新_")
    return "\n".join(lines)


def write_progress_file(project_dir: str | Path, progress: PipelineProgress) -> bool:
    """Write progress markdown to .framepack/progress.md. Returns False on failure."""
    try:
        fp_dir = Path(project_dir) / ".framepack"
        fp_dir.mkdir(parents=True, exist_ok=True)
        (fp_dir / "progress.md").write_text(
            render_progress_markdown(progress), encoding="utf-8"
        )
        return True
    except OSError:
        return False
