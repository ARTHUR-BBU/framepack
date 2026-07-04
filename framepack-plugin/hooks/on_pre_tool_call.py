"""Pre-tool-call hook: verify Framepack handoff readiness before HyperFrames takes over.

v0.18.0 philosophy: Framepack's job is done once frame.md + expanded-prompt.md
are written. HyperFrames handles HTML authoring, structural validation, and
rendering. This hook remains report-first: it hydrates guardrails, reconciles
the arsenal, and surfaces quality-beyond-lint warnings. It does not block
HyperFrames commands or replace HyperFrames lint/render/validate.
"""

import logging
import os
import re
from pathlib import Path

logger = logging.getLogger(__name__)

from .guardrails import hydrate_guardrails
from .on_post_tool_call import _build_arsenal_warning_message, _safe_inject
from core.arsenal_registry import sync_arsenal_from_project, ArsenalWarning
from core.shell_utils import resolve_effective_workdir as _resolve_effective_workdir
from core.hyperframes_adapter import (
    CommandCategory,
    classify_hyperframes_command,
    strip_heredoc_bodies as _strip_heredoc_bodies,
)
from core.quality_audit import audit_project
from core.pre_render_audit import audit_pre_render, build_pre_render_audit_message
from core.timeline_manifest import parse_hyperframes_time_windows, sync_timeline_from_project
from core.render_readiness import build_readiness_board, render_board_summary, render_board_markdown, GateStatus
from core.context_hydrator import ensure_workbench_root_agents
from core.weapon_load_plan import load_weapon_load_plan
from core.weapon_matcher import match_weapons_for_project


WEAPON_MATCHING_HARD_GATE = True


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


def _ensure_workbench_root_context(ctx, project_dir: str | Path, reason: str) -> None:
    """Best-effort workbench-root AGENTS.md managed-block sync."""
    try:
        ensure_workbench_root_agents(
            project_dir,
            Path(__file__).resolve().parent.parent,
            ctx=ctx,
            reason=reason,
        )
    except Exception as exc:
        logger.debug("workbench root context sync skipped: %s", exc)


def _audit_arsenal_for_hyperframes(ctx, workdir: str) -> None:
    project_dir = Path(workdir)
    try:
        result = sync_arsenal_from_project(project_dir, Path(__file__).resolve().parent.parent)
        warnings = list(result.warnings)
        if result.error:
            warnings.append(ArsenalWarning.from_error(result.error))
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
    has_p0 = summary.get("P0", 0) > 0
    header = (
        "⛔ **BLOCKING — P0 issues must be fixed before render**"
        if has_p0
        else "🧪 **Framepack Quality Audit — report-first / non-blocking**"
    )
    lines = [
        header,
        "",
        f"P0: {summary.get('P0', 0)} · P1: {summary.get('P1', 0)} · P2: {summary.get('P2', 0)} · P3: {summary.get('P3', 0)}",
        "",
        "Top findings:",
    ]
    for issue in report.issues[:5]:
        target = f" `{issue.weapon_id}`" if issue.weapon_id else ""
        scene = f" ({issue.scene})" if issue.scene else ""
        marker = "⛔" if issue.severity == "P0" else "·"
        lines.append(f"- [{issue.severity}] {marker} {issue.code}{target}{scene}: {issue.message}")
    if len(report.issues) > 5:
        lines.append(f"- … {len(report.issues) - 5} more issue(s). Run `python scripts/framepack_quality_audit.py <project>` for JSON/Markdown details.")
    if has_p0:
        lines.append("")
        lines.append("**P0 issues are blocking. Do not proceed to render until all P0 issues are resolved.**")
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




def _is_pre_render_review_command(command: str) -> bool:
    """True for user-facing preview/render surfaces.

    Framepack may advise here, but never blocks. Lint/validate/inspect remain
    technical checks and should not trigger this taste audit.
    """
    classification = classify_hyperframes_command(command)
    subcommand = classification.invocation.command if classification.invocation else None
    if subcommand in {"preview", "render", "publish", "present", "snapshot"}:
        return True
    if subcommand in {"cloud", "lambda", "cloudrun"} and re.search(r"\brender\b", command):
        return True
    return False


def _audit_pre_render_for_hyperframes(ctx, workdir: str) -> None:
    project_dir = Path(workdir)
    if not (project_dir / "index.html").is_file():
        return
    try:
        report = audit_pre_render(project_dir)
        message = build_pre_render_audit_message(report)
        if message:
            _safe_inject(ctx, message, role="user")
    except Exception as exc:
        logger.warning("pre_tool_call pre-render audit failed: %s", exc)
        _safe_inject(ctx, f"🎬 **Framepack Pre-render Audit Warning**\n- pre_render_audit_error: {exc}", role="user")


def _inject_readiness_board(ctx, workdir: str) -> None:
    """Build a Readiness Board and inject a summary before render/preview.

    Also writes .framepack/render-readiness.md for persistent evidence.
    """
    project_dir = Path(workdir)
    try:
        board = build_readiness_board(project_dir)
        # Write persistent markdown
        fp_dir = project_dir / ".framepack"
        fp_dir.mkdir(parents=True, exist_ok=True)
        (fp_dir / "render-readiness.md").write_text(
            render_board_markdown(board), encoding="utf-8", newline="\n"
        )
        # Inject summary
        summary = render_board_summary(board)
        # Add red gate names for visibility
        red_gates = [g.name for g in board.gates if g.status is GateStatus.RED]
        yellow_gates = [g.name for g in board.gates if g.status is GateStatus.YELLOW]
        detail_lines = [summary]
        if red_gates:
            detail_lines.append(f"  🔴 RED gates: {', '.join(red_gates)}")
        if yellow_gates:
            detail_lines.append(f"  🟡 YELLOW gates: {', '.join(yellow_gates)}")
        detail_lines.append(
            "  _Framepack advises; you decide. "
            "You can render anyway, but the label reflects workflow evidence._"
        )
        _safe_inject(ctx, "\n".join(detail_lines), role="user")
    except Exception as exc:
        logger.warning("pre_tool_call readiness board failed: %s", exc)


def _remind_lint_json_if_needed(ctx, command: str) -> None:
    """When Agent runs `npx hyperframes lint` without --json, remind them
    to redirect structured output to .framepack/lint-output.json so the
    warning classifier bridge can pick it up.

    Non-blocking: just injects a nudge message. Does not modify the command.
    """
    stripped = command.strip()

    # Must be a lint command
    if "hyperframes" not in stripped or "lint" not in stripped:
        return

    # Already using --json — no reminder needed
    if "--json" in stripped:
        return

    # Don't fire for lint --help or lint --version
    if "--help" in stripped or "--version" in stripped:
        return

    message = (
        "💡 **Framepack Lint Bridge 提示**\n\n"
        "你正在运行 `hyperframes lint`，但没有使用 `--json` 标志。\n\n"
        "Framepack 的 Upstream Warning Bridge 需要结构化的 JSON 输出才能自动分类 warning。\n"
        "建议改用：\n\n"
        "```\n"
        "npx hyperframes lint --json > .framepack/lint-output.json\n"
        "```\n\n"
        "这样 Framepack 会自动将 warning 分类为：\n"
        "- **upstream_limit** — HyperFrames 架构限制（不用管）\n"
        "- **quality_issue** — 质量问题（必须修）\n\n"
        "_不使用 --json 也可以运行，但 Framepack 无法自动分类 warning。_"
    )
    _safe_inject(ctx, message, role="user")


def _is_index_html_path(path: str) -> bool:
    return bool(path) and Path(path).name == "index.html"


def _project_dir_for_html_path(path: str) -> Path:
    html_path = Path(path)
    if not html_path.is_absolute():
        html_path = Path(os.getcwd()) / html_path
    return html_path.parent


def _weapon_plan_summary(plan) -> str:
    selected = [scene.selected for scene in plan.scenes if scene.selected]
    waivers = [scene.scene for scene in plan.scenes if scene.handwrite]
    lines = [
        "⚔️ **Framepack Weapon Matching Pass — required before HTML**",
        "",
        f"- matched scenes: {len(selected)}",
        f"- HANDWRITE waivers: {len(waivers)}",
    ]
    if selected:
        lines.append(f"- selected weapons/skills: {', '.join(selected[:8])}")
    lines.append("- receipt: `.framepack/weapon-load-plan.json`")
    lines.append("")
    lines.append("Load the listed resources before writing animation code. No bare GSAP comfort path unless the receipt has a waiver.")
    return "\n".join(lines)


def _ensure_weapon_plan_before_html(ctx, html_path: str) -> None:
    if not _is_index_html_path(html_path):
        return
    project_dir = _project_dir_for_html_path(html_path)
    if load_weapon_load_plan(project_dir) is not None:
        return
    prompt = project_dir / ".hyperframes" / "expanded-prompt.md"
    if not prompt.is_file():
        _safe_inject(
            ctx,
            "⚔️ **Framepack Weapon Matching Pass could not run**\n"
            "- missing: `.hyperframes/expanded-prompt.md`\n"
            "- HTML writing is blocked until the pass can run or a valid HANDWRITE waiver exists.",
            role="user",
        )
        if WEAPON_MATCHING_HARD_GATE:
            raise RuntimeError("Weapon Matching Pass blocked HTML write: missing .hyperframes/expanded-prompt.md")
        return
    try:
        plan = match_weapons_for_project(project_dir, prompt_path=prompt, write=True)
    except Exception as exc:
        logger.warning("pre-html Weapon Matching Pass failed: %s", exc)
        _safe_inject(
            ctx,
            "⚔️ **Framepack Weapon Matching Pass failed before HTML**\n"
            f"- error: {exc}\n"
            "- HTML writing is blocked; do not claim no weapons exist. Fix the pass or record a waiver.",
            role="user",
        )
        if WEAPON_MATCHING_HARD_GATE:
            raise RuntimeError(f"Weapon Matching Pass blocked HTML write: {exc}") from exc
        return
    _safe_inject(ctx, _weapon_plan_summary(plan), role="user")


def _pre_tool_html_paths(tool_name: str, args: dict) -> list[str]:
    if tool_name == "write_file":
        path = str(args.get("path", ""))
        return [path] if path else []
    if tool_name == "patch":
        if args.get("mode", "replace") == "patch":
            patch_text = str(args.get("patch", ""))
            return [match.strip() for match in re.findall(r"^\*\*\* (?:Update|Add) File:\s*(.+)$", patch_text, re.M)]
        path = str(args.get("path", ""))
        return [path] if path else []
    if tool_name == "terminal":
        command = _strip_heredoc_bodies(str(args.get("command", "")))
        base_workdir = str(args.get("workdir", "") or os.getcwd())
        # Resolve shell-level `cd sub && ...` so we gate the real project, not the tool workdir.
        effective_workdir = _resolve_effective_workdir(command, base_workdir)
        return _extract_index_html_redirects(command, effective_workdir)
    return []


# Matches a redirect target that ends in index.html, supporting:
#   > index.html, >> "index.html", > ./index.html, > subdir/index.html, | tee index.html
_REDIRECT_INDEX_RE = re.compile(
    r"""
    (?:>>|>)\s*            # redirect operator
    (?P<path>[^\s;|&>]+)   # target token (until whitespace or shell separator)
    |                       #  -- or --
    tee\s+                  # `tee` command
    (?P<tee_path>[^\s;|&>]+)
    """,
    re.VERBOSE,
)


def _extract_index_html_redirects(command: str, workdir: str) -> list[str]:
    """Extract index.html write targets from shell redirects, ignoring comments/literals.

    A bare mention of `index.html` in a comment or non-redirect context must NOT fire,
    so we only look at tokens that follow a redirect operator (>, >>) or `tee`.
    """
    base = Path(workdir or os.getcwd())
    hits: list[str] = []
    for line in command.splitlines():
        # Strip full-line comments (shell `# ...`). Inline comments after `;` are rare for redirects.
        stripped = line.lstrip()
        if stripped.startswith("#"):
            continue
        for match in _REDIRECT_INDEX_RE.finditer(line):
            raw = match.group("path") or match.group("tee_path") or ""
            if not raw:
                continue
            cleaned = raw.strip().strip("\"'`")
            if not cleaned.lower().endswith("index.html"):
                continue
            # Normalize ./ and relative subdir against the (possibly cd-resolved) workdir.
            normalized = cleaned if Path(cleaned).is_absolute() else str((base / cleaned).resolve())
            hits.append(normalized)
    # De-duplicate while preserving order.
    seen: set[str] = set()
    unique: list[str] = []
    for path in hits:
        if path not in seen:
            seen.add(path)
            unique.append(path)
    return unique


# Backward-compatible helper for older tests/callers.
def _pre_tool_html_path(tool_name: str, args: dict) -> str:
    paths = _pre_tool_html_paths(tool_name, args)
    return paths[0] if paths else ""


def register(ctx):
    """Register the pre_tool_call hook for handoff readiness."""

    def on_pre_tool_call(
        tool_name: str = "",
        args: dict | None = None,
        task_id: str = "",
        session_id: str = "",
        **kwargs,
    ):
        if not args:
            return

        html_paths = _pre_tool_html_paths(tool_name, args)
        if html_paths:
            for html_path in html_paths:
                _ensure_weapon_plan_before_html(ctx, html_path)
            if tool_name != "terminal":
                return

        if tool_name != "terminal":
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
        _ensure_workbench_root_context(ctx, workdir, reason="hyperframes command")
        _audit_arsenal_for_hyperframes(ctx, workdir)
        _sync_timeline_for_hyperframes(ctx, workdir)
        _audit_quality_for_hyperframes(ctx, workdir)
        if _is_pre_render_review_command(command_for_detection):
            _inject_readiness_board(ctx, workdir)
            _audit_pre_render_for_hyperframes(ctx, workdir)
        _remind_lint_json_if_needed(ctx, command_for_detection)

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
    logger.info("Framepack v0.18.0 pre_tool_call hook registered (handoff readiness + guardrail hydration + quality audit)")
