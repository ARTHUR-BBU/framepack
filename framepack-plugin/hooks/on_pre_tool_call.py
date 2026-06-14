"""Pre-tool-call hook: verify Framepack handoff readiness before HyperFrames takes over.

v0.10.2 philosophy: Framepack's job is done once frame.md + expanded-prompt.md
are written. HyperFrames handles HTML authoring, structural validation, and
rendering. This hook remains report-first: it hydrates guardrails, reconciles
the arsenal, and surfaces quality-beyond-lint warnings. It does not block
HyperFrames commands or replace HyperFrames lint/render/validate.
"""

import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

from .guardrails import hydrate_guardrails
from .on_post_tool_call import _build_arsenal_warning_message, _safe_inject
from core.arsenal_registry import ensure_arsenal, load_arsenal, reconcile_manifest, save_arsenal
from core.execution_manifest import parse_execution_manifest
from core.hyperframes_adapter import (
    CommandCategory,
    classify_hyperframes_command,
    strip_heredoc_bodies as _strip_heredoc_bodies,
)
from core.quality_audit import audit_project


def _invokes_hyperframes_command(command: str) -> bool:
    return classify_hyperframes_command(command).category is not CommandCategory.NOT_HYPERFRAMES


def _is_hyperframes_noop_command(command: str) -> bool:
    classification = classify_hyperframes_command(command)
    return classification.category in {
        CommandCategory.DISCOVERY,
        CommandCategory.PROJECT_SCAFFOLD,
        CommandCategory.REGISTRY,
        CommandCategory.MEDIA_PREPROCESS,
    }


def _audit_arsenal_for_hyperframes(ctx, workdir: str) -> None:
    project_dir = Path(workdir)
    expanded_path = project_dir / ".hyperframes" / "expanded-prompt.md"
    if not expanded_path.is_file():
        return
    try:
        content = expanded_path.read_text(encoding="utf-8")
        result = ensure_arsenal(project_dir, Path(__file__).resolve().parent.parent)
        warnings = list(result.warnings)
        data = load_arsenal(result.path)
        data, reconcile_warnings = reconcile_manifest(data, parse_execution_manifest(content), Path(__file__).resolve().parent.parent)
        warnings.extend(reconcile_warnings)
        save_arsenal(result.path, data)
        message = _build_arsenal_warning_message(warnings)
        if message:
            _safe_inject(ctx, message, role="user")
    except Exception as exc:
        logger.warning("pre_tool_call arsenal audit failed: %s", exc)
        _safe_inject(ctx, f"⚔️ **Framepack Arsenal Warning**\n- arsenal_error: {exc}", role="user")


def _build_quality_audit_message(report) -> str:
    if not report.issues:
        return ""
    summary = report.summary
    lines = [
        "🧪 **Framepack Quality Audit — report-first / non-blocking**",
        "",
        f"P0: {summary.get('P0', 0)} · P1: {summary.get('P1', 0)} · P2: {summary.get('P2', 0)} · P3: {summary.get('P3', 0)}",
        "",
        "Top findings:",
    ]
    for issue in report.issues[:5]:
        target = f" `{issue.weapon_id}`" if issue.weapon_id else ""
        scene = f" ({issue.scene})" if issue.scene else ""
        lines.append(f"- {issue.severity} {issue.code}{target}{scene}: {issue.message}")
    if len(report.issues) > 5:
        lines.append(f"- … {len(report.issues) - 5} more issue(s). Run `python scripts/framepack_quality_audit.py <project>` for JSON/Markdown details.")
    lines.append("")
    lines.append("_这不是阻断门；它是 render 前的安检票，提醒你哪些问题 lint 看不见。_")
    return "\n".join(lines)


def _audit_quality_for_hyperframes(ctx, workdir: str) -> None:
    project_dir = Path(workdir)
    if not (project_dir / "index.html").is_file():
        return
    try:
        report = audit_project(project_dir)
        message = _build_quality_audit_message(report)
        if message:
            _safe_inject(ctx, message, role="user")
    except Exception as exc:
        logger.warning("pre_tool_call quality audit failed: %s", exc)
        _safe_inject(ctx, f"🧪 **Framepack Quality Audit Warning**\n- quality_audit_error: {exc}", role="user")


def register(ctx):
    """Register the pre_tool_call hook for handoff readiness."""

    def on_pre_tool_call(
        tool_name: str = "",
        args: dict | None = None,
        task_id: str = "",
        session_id: str = "",
        **kwargs,
    ):
        if tool_name != "terminal":
            return
        if not args:
            return

        command = args.get("command", "")
        command_for_detection = _strip_heredoc_bodies(command)
        if not _invokes_hyperframes_command(command_for_detection):
            return

        workdir = args.get("workdir", "") or os.getcwd()

        if _is_hyperframes_noop_command(command):
            return

        hydrate_guardrails(ctx, project_dir=workdir, reason="hyperframes command")
        _audit_arsenal_for_hyperframes(ctx, workdir)
        _audit_quality_for_hyperframes(ctx, workdir)

        frame_md_path = os.path.join(workdir, "frame.md")
        if os.path.isfile(frame_md_path):
            return

        expanded_path = os.path.join(workdir, ".hyperframes", "expanded-prompt.md")
        has_expanded = os.path.isfile(expanded_path)

        if not has_expanded:
            message = (
                "⚠️ **HyperFrames 命令检测到，但交接文件缺失**\n\n"
                "Framepack 的职责是产出两个文件交给 HyperFrames：\n"
                "- `frame.md` — 视觉身份（配色、字体、动效参数）\n"
                "- `.hyperframes/expanded-prompt.md` — 创意细化（场景、节奏、转场）\n\n"
                "两个都还没有。建议先让 Framepack 完成创意阶段。\n\n"
                "_你可以继续执行，但 HyperFrames 会使用默认参数，效果可能不理想。_"
            )
        else:
            message = (
                "⚠️ **frame.md 缺失**\n\n"
                "`expanded-prompt.md` 已就绪，但 `frame.md` 还没有。\n"
                "frame.md 是 HyperFrames 的视觉身份输入（配色、字体、动效参数）。\n"
                "没有它，HyperFrames 会使用默认样式。\n\n"
                "_建议先生成 frame.md 再继续。_"
            )

        _safe_inject(ctx, message, role="user")
        logger.info("pre_tool_call: frame.md missing, handoff warning injected")

    ctx.register_hook("pre_tool_call", on_pre_tool_call)
    logger.info("Framepack v0.10.2 pre_tool_call hook registered (handoff readiness + guardrail hydration + quality audit)")
