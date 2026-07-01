"""Pipeline progress detection for Framepack visibility.

Detects which workflow artifacts exist in a project and renders a user-facing
progress markdown. Advisory only — never blocks.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import IntEnum
from pathlib import Path


class PipelineStage(IntEnum):
    """Official HyperFrames-aligned pipeline stages. Value = progress depth."""

    INTAKE = 0
    DESIGN = 1
    SCRIPT = 2
    STORYBOARD = 3
    TIMING = 4
    BUILD = 5
    VALIDATE = 6


_STAGE_LABELS = {
    PipelineStage.INTAKE: "素材准备",
    PipelineStage.DESIGN: "视觉身份",
    PipelineStage.SCRIPT: "文案脚本",
    PipelineStage.STORYBOARD: "分镜导演稿",
    PipelineStage.TIMING: "配音/节奏",
    PipelineStage.BUILD: "制作中",
    PipelineStage.VALIDATE: "验片交付",
}


@dataclass
class PipelineProgress:
    """Snapshot of project pipeline state."""

    current_stage: PipelineStage
    has_asset_intake: bool
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

    has_asset_intake = (project / ".framepack" / "asset-intake.md").is_file()
    has_template_selection = (project / ".framepack" / "template-selection.md").is_file()
    has_frame_md = (project / "frame.md").is_file()
    has_expanded_prompt = (project / ".hyperframes" / "expanded-prompt.md").is_file()
    has_index_html = (project / "index.html").is_file()

    if has_index_html:
        stage = PipelineStage.BUILD
    elif has_expanded_prompt:
        stage = PipelineStage.STORYBOARD
    elif has_frame_md:
        stage = PipelineStage.DESIGN
    else:
        stage = PipelineStage.INTAKE

    return PipelineProgress(
        current_stage=stage,
        has_asset_intake=has_asset_intake,
        has_template_selection=has_template_selection,
        has_frame_md=has_frame_md,
        has_expanded_prompt=has_expanded_prompt,
        has_index_html=has_index_html,
        gate_results=gate_results,
    )


def _stage_evidence(progress: PipelineProgress, stage: PipelineStage) -> str:
    """Return artifact evidence for a progress stage."""
    if stage == PipelineStage.INTAKE:
        evidence = []
        if progress.has_asset_intake:
            evidence.append("asset-intake.md")
        if progress.has_template_selection:
            evidence.append("template-selection.md")
        return " / ".join(evidence)
    if stage == PipelineStage.DESIGN and progress.has_frame_md:
        return "frame.md"
    if stage == PipelineStage.STORYBOARD and progress.has_expanded_prompt:
        return "expanded-prompt.md"
    if stage == PipelineStage.BUILD and progress.has_index_html:
        return "index.html"
    if stage == PipelineStage.VALIDATE:
        return "render readiness"
    return ""


def render_progress_markdown(progress: PipelineProgress) -> str:
    """Render a user-facing progress markdown."""
    lines = ["# 项目进度", ""]
    reached = progress.current_stage.value

    for stage in PipelineStage:
        label = _STAGE_LABELS[stage]
        evidence = _stage_evidence(progress, stage)
        evidence_suffix = f"（{evidence}）" if evidence else ""
        if stage.value < reached:
            lines.append(f"- ✅ {label}{evidence_suffix}")
        elif stage.value == reached:
            lines.append(f"- 🔄 {label} ← 当前{evidence_suffix}")
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
