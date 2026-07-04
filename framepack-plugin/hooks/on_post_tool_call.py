"""Framepack v0.17.0 — Prompt Factory hooks.

Framepack is the director's creative engine. It produces two deliverables:
  1. frame.md — visual identity (HyperFrames Step 1 input)
  2. expanded-prompt.md — scene-level creative breakdown (HyperFrames Step 2 input)

Once these two files are written, HyperFrames takes over. Framepack does NOT
audit HTML — that's `hyperframes lint`'s job. Framepack does NOT manage 13
intermediate files — the creative detail lives in expanded-prompt.md.

Philosophy: Framepack stops where HyperFrames starts. The handoff point is
frame.md + expanded-prompt.md. Clean boundary, zero overlap.
"""

import json
import logging
import os
import re
from pathlib import Path

from .guardrails import hydrate_guardrails
from core.arsenal_registry import sync_arsenal_from_project, ArsenalWarning
from core.control_profile import ControlProfile
from core.restraint_audit import audit_weight_consistency
from core.shell_utils import resolve_effective_workdir
from core.workflow_overlay import is_workflow_skill, inject_overlay
from core.context_hydrator import ensure_workbench_root_agents
from core.gates.control_profile import check_control_profile_consistency
from core.gates.scene_continuity import check_scene_continuity
from core.gates.storyboard_preview import check_storyboard_preview
from core.pipeline_progress import detect_pipeline_stage, write_progress_file

logger = logging.getLogger(__name__)

# ── Safe message injection ──

_INJECTION_DANGER_PATTERNS = [
    r"(?i)\bignore\s+(all\s+)?(previous|prior|above|instructions?)\b",
    r"(?i)\b(you\s+must|you\s+should|you\s+are\s+now)\b",
    r"(?i)\b(system\s+message|system\s+prompt|override)\b",
    r"(?i)\b(delete\s+(all\s+)?files?|rm\s+-rf|format\s+c:)\b",
    r"(?i)\bIMPORTANT\b.*\b(MUST|DELETE|EXECUTE|RUN)\b",
    r"```",
]


def _sanitize_message(text: str) -> str:
    for pattern in _INJECTION_DANGER_PATTERNS:
        text = re.sub(pattern, "[filtered]", text)
    return text


def _safe_inject(ctx, message: str, role: str = "user") -> bool:
    try:
        safe_message = _sanitize_message(message)
        ctx.inject_message(safe_message, role=role)
        return True
    except Exception as e:
        logger.warning("Failed to inject message (role=%s): %s", role, e)
        return False


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


# ── Skill loading ──

_SKILL_CONTENT_CACHE: dict[str, str] = {}


def _cached_skill_load(skill_name: str) -> str:
    if skill_name in _SKILL_CONTENT_CACHE:
        return _SKILL_CONTENT_CACHE[skill_name]

    skill_md = os.path.join(
        os.path.dirname(__file__), "..", "skills",
        skill_name, "SKILL.md",
    )
    try:
        with open(skill_md, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception:
        content = ""

    _SKILL_CONTENT_CACHE[skill_name] = content
    return content


# ── File helpers ──

def _read_file_safe(file_path: str) -> str:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="latin-1") as f:
            return f.read()


def _extract_json(raw: str) -> dict | None:
    if not raw:
        return None
    text = re.sub(r"```(?:json)?\s*", "", raw)
    text = text.strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        return json.loads(text[start:end + 1])
    except json.JSONDecodeError:
        return None


# ── File detection ──

def _is_frame_md(file_path: str) -> bool:
    """frame.md — HyperFrames' preferred design spec (visual + motion identity)."""
    if not file_path:
        return False
    return os.path.basename(file_path) == "frame.md"


def _is_asset_intake(file_path: str) -> bool:
    """asset-intake.md — user-provided material inventory."""
    return os.path.basename(file_path) == "asset-intake.md"


def _is_template_selection(file_path: str) -> bool:
    """template-selection.md — written after `framepack_template select`."""
    return os.path.basename(file_path) == "template-selection.md"


def _handle_asset_intake(ctx, file_path: str):
    """Validate asset-intake.md structure and inject lightweight TUI feedback."""
    path = Path(file_path) if os.path.isabs(file_path) else Path(os.getcwd()) / file_path
    try:
        content = path.read_text(encoding="utf-8", errors="replace")
    except OSError as e:
        logger.warning("Could not read asset-intake.md: %s", e)
        return

    sections_found: list[str] = []
    sections_missing: list[str] = []
    for heading in ("brand", "products", "footage", "text", "audio", "references"):
        if re.search(rf"^{heading}:", content, re.MULTILINE):
            sections_found.append(heading)
        else:
            sections_missing.append(heading)

    missing_items = bool(re.search(r"(?m)^missing:", content))
    t_entries = re.findall(r"needs_processing", content)
    needs_count = len(t_entries)

    parts: list[str] = ["📋 **Framepack — asset-intake 素材检查**\n"]
    parts.append(f"已收集: {', '.join(sections_found) if sections_found else '(无)'}")
    if sections_missing:
        parts.append(f"未收集: {', '.join(sections_missing)}")
    if needs_count:
        parts.append(f"需处理: {needs_count} 张图 → 建议 npx hyperframes remove-background")
    if missing_items:
        parts.append("⚠️ 有缺失素材标注，Phase 1/2 注意降级处理。")
    else:
        parts.append("✅ 素材清单完整，无缺失标注。")
    parts.append("")
    parts.append("Phase 1 注意：品牌色（如有）应直接注入 frame.md，跳过调色。")

    ctx.inject_message("\n".join(parts), role="assistant")
    logger.info("asset-intake.md advice injected")

    if not _has_template_selection_for(file_path):
        _safe_inject(ctx, _build_non_template_completeness_card(), role="assistant")
        logger.info("non-template completeness card injected")

    project_dir = _project_dir_for_framepack_file(file_path)
    _run_pipeline_gates_and_update(
        ctx,
        project_dir,
        ["core.gates.asset_intake.check_asset_depth"],
    )


def _handle_template_param_card(ctx, file_path: str) -> None:
    """After template select, inject param card so Agent gathers required fields first.

    Parses a 'params:' line from template-selection.md. If no params declared,
    this is a no-op (backward compatible with templates that don't declare params).
    """
    try:
        content = _read_file_safe(file_path)
        params_match = re.search(r"^params:\s*(.+)$", content, re.MULTILINE)
        if not params_match:
            return  # no params declared → nothing to inject
        param_list = [p.strip() for p in params_match.group(1).split(",") if p.strip()]
        if not param_list:
            return

        lines = [
            "📋 **Framepack — 模板参数卡**",
            "",
            "选定模板后，先确认这些必填参数再继续共创：",
            "",
        ]
        for p in param_list:
            lines.append(f"- {p}")
        lines.append("")
        lines.append("把这些参数确认清楚，避免后面临时补字段。")
        _safe_inject(ctx, "\n".join(lines), role="assistant")
        logger.info("template param card injected (%d params)", len(param_list))
    except Exception as exc:
        logger.warning("template param card injection failed: %s", exc)


def _has_template_selection_for(file_path: str) -> bool:
    """Return True when the current project already has a template selection."""
    project = Path(_project_dir_for_framepack_file(file_path))
    return (project / ".framepack" / "template-selection.md").is_file()


def _build_non_template_completeness_card() -> str:
    """Build a lightweight cold/warm-start checklist for non-template projects."""
    return "\n".join([
        "📋 **Framepack — 非模板创作小票**",
        "",
        "当前入口：非模板 / cold-start 或 warm-start。进入 frame.md 前，请确认：",
        "",
        "- 时长：例如 15s / 30s / 60s",
        "- 画幅：16:9 / 9:16 / 1:1",
        "- 风格/情绪：calm / medium / high，或具体视觉参考",
        "- 关键元素：logo / 产品图 / 人物 / 数据 / CTA",
        "- 音频：BGM / TTS / 无旁白 / 声画 hit",
        "- 输出目标：预览 / 官网 Hero / 发布会大屏 / 社媒投放",
        "",
        "有真实素材就优先用真实素材；不要直接脑补品牌资产。",
    ])


def _is_expanded_prompt(file_path: str) -> bool:
    """expanded-prompt.md — Framepack's creative handoff to HyperFrames."""
    if not file_path:
        return False
    return os.path.basename(file_path) == "expanded-prompt.md"


# ── frame.md quality analysis ──

_FRAME_MD_SYSTEM_PROMPT = """You are Framepack's frame.md quality reviewer — a sharp visual identity auditor.
Your job: check that frame.md has everything HyperFrames needs to produce a polished video.

A valid frame.md MUST have:
1. Color palette — at least primary + accent + background hex values
2. Typography — at least heading + body font names and sizes
3. Motion tokens — energy level (calm/medium/high), easing family, duration range
4. Atmosphere — mood description (not just a word, a direction)
5. Format — either YAML frontmatter with these fields, or clear prose sections

HYPERFRAMES RULES:
- Colors MUST be hex (#RRGGBB), not named colors or HSL
- Font names must be real (not "Your Font") — warn if no font files found
- Motion easing MUST be a valid GSAP ease (power1.out, power3.inOut, back.out, etc.)
- Energy level determines pacing: calm → 1-2s transitions, medium → 0.5-1s, high → 0.2-0.5s

Respond with JSON ONLY:
{
  "color_palette_ok": boolean,
  "typography_ok": boolean,
  "motion_tokens_ok": boolean,
  "atmosphere_ok": boolean,
  "format_ok": boolean,
  "issues": [string, ...],
  "visual_style_guess": "string or null",
  "summary": "one non-obvious insight about this creative direction"
}"""


def _analyze_frame_md(ctx, content: str) -> dict | None:
    max_chars = 4000
    truncated = content[:max_chars]
    if len(content) > max_chars:
        truncated += f"\n\n[... truncated, {len(content) - max_chars} more chars]"

    try:
        skill_content = _cached_skill_load("framepack-director")
        system_prompt = _FRAME_MD_SYSTEM_PROMPT
        if skill_content:
            system_prompt = (
                "## Framepack Director Knowledge\n\n"
                + skill_content[:3000]
                + "\n\n---\n\n"
                + _FRAME_MD_SYSTEM_PROMPT
            )

        result = ctx.llm.complete(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": truncated},
            ],
            temperature=0.2,
            max_tokens=1024,
            purpose="framepack-frame-md-quality",
        )
        return _extract_json(result.text)
    except Exception as e:
        logger.warning("frame.md LLM analysis failed: %s", e)
        return None


def _build_frame_md_advice(analysis: dict) -> str:
    parts = ["🎨 **Framepack — frame.md 质量检查**\n"]

    ok_sections = []
    missing = []
    if analysis.get("color_palette_ok"):
        ok_sections.append("配色 ✓")
    else:
        missing.append("配色 — 需要至少 primary + accent + background 的 hex 值")
    if analysis.get("typography_ok"):
        ok_sections.append("字体 ✓")
    else:
        missing.append("字体 — 需要标题和正文的字体名和大小")
    if analysis.get("motion_tokens_ok"):
        ok_sections.append("动效参数 ✓")
    else:
        missing.append("动效参数 — 需要 energy / easing / duration")
    if analysis.get("atmosphere_ok"):
        ok_sections.append("氛围 ✓")
    else:
        missing.append("氛围 — 需要情绪方向描述")
    if analysis.get("format_ok"):
        ok_sections.append("格式 ✓")
    else:
        missing.append("格式 — 需要 YAML frontmatter 或清晰的 prose 段落")

    parts.append("  ".join(ok_sections))

    issues = analysis.get("issues", [])
    if issues:
        parts.append("")
        for issue in issues:
            parts.append(f"🔴 {issue}")

    style = analysis.get("visual_style_guess")
    if style:
        parts.append(f"\n💡 风格识别：{style}")

    summary = analysis.get("summary", "")
    if summary:
        parts.append(f"\n📝 {summary}")

    if not missing:
        parts.append("\n✅ frame.md 就绪，可以进入创意细化阶段。")
    else:
        parts.append(f"\n⚠️ 缺少 {len(missing)} 项，补全后再进入下一步。")

    return "\n".join(parts)


# ── expanded-prompt.md quality analysis ──

_EXPANDED_PROMPT_SYSTEM_PROMPT = """You are Framepack's expanded-prompt quality reviewer.
Your job: verify the creative breakdown is detailed enough for HyperFrames to produce a polished video.

A valid expanded-prompt MUST have:
1. Title + style block — cites exact hex values, font names from frame.md
2. Rhythm declaration — named pattern (e.g. "hook-PUNCH-breathe-CTA")
3. Per-scene beats — for EACH scene:
   - Concept (what visual world? what metaphor? what feeling?)
   - Mood direction (cultural references, not hex codes)
   - Depth layers — BG (2-5 decoratives) + MG (content) + FG (accents)
   - Animation choreography — specific verbs per element (SLAM, CASCADE, float, etc.)
   - Transition out — specific type + duration + easing
4. Recurring motifs — visual threads across scenes
5. Total elements per scene: 8-10 (per video-composition density rule)

HYPERFRAMES HANDOFF CHECK:
- Every scene MUST have a transition-out (even the last scene — use "hold" or "fade to black")
- Animation verbs MUST be specific — "animate" is not a verb, "SLAM from bottom" is
- Color values MUST cite frame.md, not invent new ones
- Total duration SHOULD match the user's target (e.g. 30s)

Respond with JSON ONLY:
{
  "has_style_block": boolean,
  "has_rhythm": boolean,
  "scene_count": integer,
  "scenes_with_full_beats": integer,
  "has_motifs": boolean,
  "issues": [string, ...],
  "total_duration_guess": "string or null",
  "summary": "one non-obvious creative insight"
}"""


def _analyze_expanded_prompt(ctx, content: str) -> dict | None:
    max_chars = 8000
    truncated = content[:max_chars]
    if len(content) > max_chars:
        truncated += f"\n\n[... truncated, {len(content) - max_chars} more chars]"

    try:
        skill_content = _cached_skill_load("framepack-director")
        system_prompt = _EXPANDED_PROMPT_SYSTEM_PROMPT
        if skill_content:
            system_prompt = (
                "## Framepack Director Knowledge\n\n"
                + skill_content[:3000]
                + "\n\n---\n\n"
                + _EXPANDED_PROMPT_SYSTEM_PROMPT
            )

        result = ctx.llm.complete(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": truncated},
            ],
            temperature=0.2,
            max_tokens=1024,
            purpose="framepack-expanded-prompt-quality",
        )
        return _extract_json(result.text)
    except Exception as e:
        logger.warning("expanded-prompt LLM analysis failed: %s", e)
        return None


def _build_expanded_prompt_advice(analysis: dict) -> str:
    parts = ["🎬 **Framepack — expanded-prompt 创意检查**\n"]

    checks = []
    if analysis.get("has_style_block"):
        checks.append("风格块 ✓")
    else:
        checks.append("风格块 ✗")
    if analysis.get("has_rhythm"):
        checks.append("节奏声明 ✓")
    else:
        checks.append("节奏声明 ✗")
    if analysis.get("has_motifs"):
        checks.append("视觉线索 ✓")
    else:
        checks.append("视觉线索 ✗")

    parts.append("  ".join(checks))

    scene_count = analysis.get("scene_count", 0)
    full_beats = analysis.get("scenes_with_full_beats", 0)
    parts.append(f"场景：{scene_count} 个，完整 beat：{full_beats} 个")

    if full_beats < scene_count:
        parts.append(f"⚠️ {scene_count - full_beats} 个场景缺少完整的 beat（需要 concept + mood + layers + animation + transition）")

    duration = analysis.get("total_duration_guess")
    if duration:
        parts.append(f"估算时长：{duration}")

    issues = analysis.get("issues", [])
    if issues:
        parts.append("")
        for issue in issues:
            parts.append(f"🔴 {issue}")

    summary = analysis.get("summary", "")
    if summary:
        parts.append(f"\n📝 {summary}")

    if not issues and full_beats == scene_count:
        parts.append("\n✅ expanded-prompt 就绪，交接给 HyperFrames。")
    else:
        parts.append("\n⚠️ 补全缺失项后再交给 HyperFrames。")

    return "\n".join(parts)


# ── Hook registration ──

def _build_arsenal_warning_message(warnings) -> str:
    visible = [w for w in warnings if getattr(w, "code", "") not in {"unused_weapon"} or getattr(w, "severity", "") != "info"]
    if not visible:
        return ""
    lines = ["⚔️ **Framepack Arsenal Warning**"]
    for warning in visible[:8]:
        weapon = f" ({warning.weapon_id})" if warning.weapon_id else ""
        lines.append(f"- {warning.code}{weapon}: {warning.message}")
    if len(visible) > 8:
        lines.append(f"- ... {len(visible) - 8} more warnings")
    return "\n".join(lines)


def _sync_arsenal_for_expanded_prompt(ctx, file_path: str, content: str) -> None:
    project_dir = Path(_project_dir_for_framepack_file(file_path))
    try:
        result = sync_arsenal_from_project(project_dir, Path(__file__).resolve().parent.parent)
        warnings = list(result.warnings)
        if result.error:
            warnings.append(ArsenalWarning.from_error(result.error))
    except Exception as exc:
        logger.warning("Arsenal reconciliation failed: %s", exc)
        warnings = [ArsenalWarning.from_error(str(exc))]

    message = _build_arsenal_warning_message(warnings)
    if message:
        _safe_inject(ctx, message, role="user")


def _project_dir_for_framepack_file(file_path: str) -> str:
    path = Path(file_path)
    if not path.is_absolute():
        path = Path(os.getcwd()) / path
    if path.name == "expanded-prompt.md" and path.parent.name == ".hyperframes":
        return str(path.parent.parent)
    if path.name in {"asset-intake.md", "template-selection.md"} and path.parent.name == ".framepack":
        return str(path.parent.parent)
    return str(path.parent)


def _run_pipeline_gates_and_update(ctx, project_dir, gate_funcs) -> None:
    """Run gate functions for a pipeline stage, then update progress.md.

    gate_funcs: list of import-path strings (e.g.
    "core.gates.control_profile.check_control_profile_consistency") resolved
    lazily so patch targets in tests are honored.

    Advisory: gate exceptions and progress-write failures are swallowed —
    they never break the creative flow.
    """
    import importlib

    results = []
    for func_path in gate_funcs:
        module_name, _, attr = func_path.rpartition(".")
        try:
            mod = importlib.import_module(module_name)
            func = getattr(mod, attr)
            result = func(project_dir)
            if result is not None:
                results.append(result)
        except Exception as exc:
            logger.warning("pipeline gate %s failed: %s", func_path, exc)

    try:
        progress = detect_pipeline_stage(project_dir, gate_results=results)
        write_progress_file(project_dir, progress)
    except Exception as exc:
        logger.warning("pipeline progress update failed: %s", exc)


def _is_framepack_skill_name(name: str) -> bool:
    return name in {
        "framepack",
        "framepack:framepack-director",
        "framepack:framepack-gsap",
        "framepack:framepack-arsenal",
        "framepack-animation-library",
        "framepack-reference-miner",
    }


def _is_lint_command(command: str) -> bool:
    """Check if a terminal command invokes `hyperframes lint`."""
    stripped = command.strip()
    return "hyperframes" in stripped and "lint" in stripped


def _handle_lint_cache_bridge(ctx, command: str, workdir: str) -> None:
    """After Agent runs `hyperframes lint`, detect .framepack/lint-output.json,
    classify findings, save cache, and inject a summary.

    This is the post-execution side of the Upstream Warning Bridge.
    """
    if not _is_lint_command(command):
        return

    effective_workdir = resolve_effective_workdir(command, workdir)
    lint_output_path = Path(effective_workdir, ".framepack", "lint-output.json")

    if not lint_output_path.is_file():
        return

    try:
        lint_json = json.loads(lint_output_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Failed to read lint-output.json: %s", exc)
        return

    try:
        from core.warning_classifier import save_lint_cache, classify_lint_output
        save_lint_cache(Path(effective_workdir), lint_json)
        classified = classify_lint_output(lint_json)
    except Exception as exc:
        logger.warning("Lint cache bridge failed: %s", exc)
        return

    # Build summary message
    upstream = [c for c in classified if c["category"] == "upstream_limit"]
    quality = [c for c in classified if c["category"] == "quality_issue"]

    if not classified:
        message = (
            "✅ **Framepack Lint Bridge**\n\n"
            "hyperframes lint 报告 0 个 warning。一切干净。\n\n"
            "（缓存已写入 `.framepack/hyperframes-findings.json`）"
        )
    else:
        lines = [
            "🔍 **Framepack Lint Bridge — Warning 分类报告**\n",
            f"共 {len(classified)} 个 warning，已自动分类：\n",
        ]
        if quality:
            lines.append(f"**⚠️ 质量问题（必须修）— {len(quality)} 个：**")
            for item in quality:
                lines.append(f"  - `{item['code']}` [{item['severity']}]: {item['message'][:80]}")
            lines.append("")

        if upstream:
            lines.append(f"**ℹ️ 上游限制（不用管）— {len(upstream)} 个：**")
            for item in upstream:
                lines.append(f"  - `{item['code']}`: {item['message'][:80]}")
            lines.append("")

        lines.append("_分类缓存已写入 `.framepack/hyperframes-findings.json`，下次 quality audit 会自动合并。_")

        message = "\n".join(lines)

    _safe_inject(ctx, message, role="user")
    logger.info(
        "Lint cache bridge: %d findings (%d upstream, %d quality)",
        len(classified), len(upstream), len(quality),
    )


def register(ctx):
    """Register the post_tool_call hook for frame.md and expanded-prompt detection."""

    def on_post_tool_call(
        tool_name: str = "",
        args: dict | None = None,
        result: str = "",
        task_id: str = "",
        session_id: str = "",
        tool_call_id: str = "",
        **kwargs,
    ):
        if not args:
            return

        if tool_name == "skill_view":
            skill_name = args.get("name", "")
            if _is_framepack_skill_name(skill_name):
                project_dir = os.getcwd()
                hydrate_guardrails(ctx, project_dir=project_dir, reason=f"skill_view:{skill_name}")
                _ensure_workbench_root_context(ctx, project_dir, reason=f"skill_view:{skill_name}")
            if is_workflow_skill(skill_name):
                inject_overlay(ctx, skill_name, project_dir=os.getcwd())
            return

        # ── Lint cache bridge: detect terminal lint commands ──
        if tool_name == "terminal":
            command = args.get("command", "")
            if command and _is_lint_command(command):
                workdir = args.get("workdir", "") or os.getcwd()
                _handle_lint_cache_bridge(ctx, command, workdir)
            return

        if tool_name not in ("write_file",):
            return

        file_path = args.get("path", "")

        if _is_frame_md(file_path):
            project_dir = _project_dir_for_framepack_file(file_path)
            hydrate_guardrails(ctx, project_dir=project_dir, reason="frame.md write")
            _ensure_workbench_root_context(ctx, project_dir, reason="frame.md write")
            _handle_frame_md(ctx, file_path)
        elif _is_expanded_prompt(file_path):
            project_dir = _project_dir_for_framepack_file(file_path)
            hydrate_guardrails(ctx, project_dir=project_dir, reason="expanded-prompt write")
            _ensure_workbench_root_context(ctx, project_dir, reason="expanded-prompt write")
            _handle_expanded_prompt(ctx, file_path)
        elif _is_asset_intake(file_path):
            _handle_asset_intake(ctx, file_path)
        elif _is_template_selection(file_path):
            project_dir = _project_dir_for_framepack_file(file_path)
            _handle_template_param_card(ctx, file_path)
            _run_pipeline_gates_and_update(ctx, project_dir, [])

    ctx.register_hook("post_tool_call", on_post_tool_call)
    logger.info("Framepack v0.17.0 post_tool_call hook registered (frame.md + expanded-prompt + asset-intake + guardrail hydration + lint cache bridge)")


# ── Param Card Injection ──


def _inject_param_card_if_manifest(ctx, file_path: str) -> None:
    """After expanded-prompt.md is written, extract param card from Manifest
    and inject it so the Agent has exact values when writing HTML."""
    try:
        project_dir = _project_dir_for_framepack_file(file_path)
        from core.param_guard import extract_param_card

        card = extract_param_card(project_dir)
        if card:
            _safe_inject(ctx, card, role="user")
            logger.info("Parameter reference card injected from Execution Manifest")
    except Exception as e:
        logger.warning("Param card injection failed (non-blocking): %s", e)


# ── Handlers ──

def _build_weight_directive(frame_md_content: str) -> str | None:
    """从 frame.md 文本提取 ControlProfile 并生成五行权重指令。

    返回 None 当 frame.md 没有 control_profile 块（向后兼容旧项目）。
    """
    try:
        cp = ControlProfile.from_frame_md(frame_md_content)
    except Exception as e:
        logger.warning("ControlProfile parse failed: %s", e)
        return None
    if cp is None:
        return None
    return cp.render_directive()


def _handle_frame_md(ctx, file_path: str) -> None:
    logger.info("frame.md detected: %s", file_path)
    try:
        content = _read_file_safe(file_path)
    except Exception as e:
        logger.warning("Could not read frame.md: %s", e)
        return
    if not content.strip():
        return

    # 五行权重指令注入（v0.14）— 纯本地计算，必须在 LLM 质检之前执行
    # 这样即使 LLM 不可用，权重指令仍能到达 Agent（E-1 修复）
    weight_directive = _build_weight_directive(content)
    if weight_directive:
        _safe_inject(ctx, weight_directive, role="user")
        logger.info("frame.md weight directive injected")

    # LLM 质检 — 包在 try/except 里，异常不阻塞 hook（E-1 修复）
    try:
        analysis = _analyze_frame_md(ctx, content)
    except Exception as e:
        logger.warning("frame.md analysis raised: %s", e)
        analysis = None
    if analysis is None:
        logger.warning("frame.md analysis failed")
        return

    message = _build_frame_md_advice(analysis)
    _safe_inject(ctx, message, role="user")
    logger.info("frame.md advice injected")

    # ── Pipeline gate + progress (accompanying check, not just at render) ──
    project_dir = _project_dir_for_framepack_file(file_path)
    _run_pipeline_gates_and_update(
        ctx,
        project_dir,
        ["core.gates.control_profile.check_control_profile_consistency"],
    )


def _build_weight_consistency_report(frame_md_content: str,
                                      expanded_prompt: str) -> str | None:
    """检查五行权重与 expanded-prompt 的一致性，生成 P2 报告。

    返回 None 当：
      - frame.md 没有 control_profile（向后兼容）
      - 权重与产出一致（无 mismatch）
    """
    try:
        cp = ControlProfile.from_frame_md(frame_md_content)
    except Exception:
        return None
    if cp is None:
        return None

    issues = audit_weight_consistency(cp, expanded_prompt=expanded_prompt)
    if not issues:
        return None

    lines = ["## 五行权重一致性检查（P2，需要解释）", ""]
    for issue in issues:
        lines.append(f"- [{issue.severity}] {issue.message}")
    lines.append("")
    lines.append("请在 expanded-prompt.md 里对以上每项做出解释，或调整你的产出。")
    return "\n".join(lines)


def _handle_expanded_prompt(ctx, file_path: str) -> None:
    logger.info("expanded-prompt.md detected: %s", file_path)
    try:
        content = _read_file_safe(file_path)
    except Exception as e:
        logger.warning("Could not read expanded-prompt.md: %s", e)
        return
    if not content.strip():
        return

    _sync_arsenal_for_expanded_prompt(ctx, file_path, content)

    # Inject parameter reference card from Execution Manifest
    _inject_param_card_if_manifest(ctx, file_path)

    # 五行权重一致性检查注入（v0.14）— 纯本地计算，必须在 LLM 质检之前执行
    # 这样即使 LLM 不可用，一致性报告仍能到达 Agent（E-1 修复）
    # 从同目录找 frame.md 读取 control_profile
    expanded_path = Path(file_path)
    search_dirs = [expanded_path.parent, expanded_path.parent.parent]
    frame_md_content = ""
    for d in search_dirs:
        frame_path = d / "frame.md"
        if frame_path.exists():
            try:
                frame_md_content = _read_file_safe(str(frame_path))
            except Exception:
                pass
            break
    if frame_md_content:
        report = _build_weight_consistency_report(frame_md_content, content)
        if report:
            _safe_inject(ctx, report, role="user")
            logger.info("expanded-prompt weight consistency report injected")

    # LLM 质检 — 包在 try/except 里，异常不阻塞 hook（E-1 修复）
    try:
        analysis = _analyze_expanded_prompt(ctx, content)
    except Exception as e:
        logger.warning("expanded-prompt analysis raised: %s", e)
        analysis = None
    if analysis is None:
        logger.warning("expanded-prompt analysis failed")
        return

    message = _build_expanded_prompt_advice(analysis)
    _safe_inject(ctx, message, role="user")
    logger.info("expanded-prompt advice injected")

    # ── Pipeline gate + progress (accompanying check, not just at render) ──
    project_dir = _project_dir_for_framepack_file(file_path)
    _run_pipeline_gates_and_update(
        ctx,
        project_dir,
        [
            "core.gates.scene_continuity.check_scene_continuity",
            "core.gates.storyboard_preview.check_storyboard_preview",
        ],
    )
