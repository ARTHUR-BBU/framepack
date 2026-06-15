"""Pre-tool-call hook: verify Framepack handoff readiness before HyperFrames takes over.

v0.10.5 philosophy: Framepack's job is done once frame.md + expanded-prompt.md
are written. HyperFrames handles HTML authoring, structural validation, and
rendering. This hook remains report-first: it hydrates guardrails, reconciles
the arsenal, and surfaces quality-beyond-lint warnings. It does not block
HyperFrames commands or replace HyperFrames lint/render/validate.
"""

import logging
import os
import re
import shlex
from pathlib import Path

logger = logging.getLogger(__name__)

from .guardrails import hydrate_guardrails
from .on_post_tool_call import _build_arsenal_warning_message, _safe_inject
from core.arsenal_registry import sync_arsenal_from_project
from core.hyperframes_adapter import (
    CommandCategory,
    classify_hyperframes_command,
    strip_heredoc_bodies as _strip_heredoc_bodies,
)
from core.quality_audit import audit_project
from core.timeline_manifest import parse_hyperframes_time_windows, sync_timeline_from_project


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


_CD_BEFORE_COMMAND_RE = re.compile(
    r"(?:^|[;&|]\s*)cd\s+(?P<path>\"[^\"]+\"|'[^']+'|[^\s;&|]+)\s*(?:&&|;)",
    re.IGNORECASE,
)


def _shell_unquote_path(raw_path: str) -> str:
    try:
        parts = shlex.split(raw_path, posix=True)
    except ValueError:
        return raw_path.strip().strip('"\'')
    return parts[0] if parts else raw_path.strip().strip('"\'')


def _resolve_effective_workdir(command: str, base_workdir: str) -> str:
    """Resolve shell `cd project && hyperframes ...` prefixes to the real project dir.

    Hermes terminal commands often use shell-level `cd <project> && npx hyperframes ...`
    instead of the tool's `workdir` argument. Hooks run before the shell executes,
    so relying only on args["workdir"] hydrates the caller cwd, not the project.
    """
    base = Path(base_workdir or os.getcwd())
    hyperframes_at = command.find("hyperframes")
    for match in _CD_BEFORE_COMMAND_RE.finditer(command):
        if hyperframes_at != -1 and match.start() > hyperframes_at:
            continue
        cd_path = Path(_shell_unquote_path(match.group("path")))
        if not cd_path.is_absolute():
            cd_path = base / cd_path
        return str(cd_path.resolve())
    return str(base.resolve())


def _audit_arsenal_for_hyperframes(ctx, workdir: str) -> None:
    project_dir = Path(workdir)
    try:
        result = sync_arsenal_from_project(project_dir, Path(__file__).resolve().parent.parent)
        warnings = list(result.warnings)
        if result.error:
            warning_like = type(
                "WarningLike",
                (),
                {
                    "code": "arsenal_error",
                    "message": result.error,
                    "severity": "warn",
                    "weapon_id": None,
                },
            )
            warnings.append(warning_like())
        message = _build_arsenal_warning_message(warnings)
        if message:
            _safe_inject(ctx, message, role="user")
    except Exception as exc:
        logger.warning("pre_tool_call arsenal audit failed: %s", exc)
        _safe_inject(ctx, f"⚔️ **Framepack Arsenal Warning**\n- arsenal_error: {exc}", role="user")


def _sync_timeline_for_hyperframes(ctx, workdir: str) -> None:
    project_dir = Path(workdir)
    expanded_path = project_dir / ".hyperframes" / "expanded-prompt.md"
    html_path = project_dir / "index.html"
    has_windows = False
    try:
        if expanded_path.is_file():
            has_windows = bool(parse_hyperframes_time_windows(expanded_path.read_text(encoding="utf-8")))
        if not has_windows and not html_path.is_file():
            return
        result = sync_timeline_from_project(project_dir)
        if result.error:
            _safe_inject(ctx, f"🎬 **Framepack Timeline Manifest Warning**\n- timeline_error: {result.error}", role="user")
            return
        if result.action in {"created", "synced", "migrated"}:
            _safe_inject(
                ctx,
                "🎬 **Framepack Timeline Manifest — non-blocking sync**\n"
                f"- action: `{result.action}`\n"
                f"- path: `{result.path}`\n"
                "- 这是场记账本：时间窗、proof frame、锁定状态和连续性证据会写在这里。",
                role="user",
            )
    except Exception as exc:
        logger.warning("pre_tool_call timeline sync failed: %s", exc)
        _safe_inject(ctx, f"🎬 **Framepack Timeline Manifest Warning**\n- timeline_error: {exc}", role="user")


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

        base_workdir = args.get("workdir", "") or os.getcwd()
        workdir = _resolve_effective_workdir(command_for_detection, base_workdir)

        if _is_hyperframes_noop_command(command_for_detection):
            return

        hydrate_guardrails(ctx, project_dir=workdir, reason="hyperframes command")
        _audit_arsenal_for_hyperframes(ctx, workdir)
        _sync_timeline_for_hyperframes(ctx, workdir)
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
    logger.info("Framepack v0.10.5 pre_tool_call hook registered (handoff readiness + guardrail hydration + quality audit)")
