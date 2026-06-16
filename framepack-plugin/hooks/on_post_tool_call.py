"""Framepack v0.11.0 — Prompt Factory hooks.

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
from core.arsenal_registry import sync_arsenal_from_project

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
            warnings.append(type("WarningLike", (), {"code": "arsenal_error", "message": result.error, "severity": "warn", "weapon_id": None})())
    except Exception as exc:
        logger.warning("Arsenal reconciliation failed: %s", exc)
        warnings = [type("WarningLike", (), {"code": "arsenal_error", "message": str(exc), "severity": "warn", "weapon_id": None})()]

    message = _build_arsenal_warning_message(warnings)
    if message:
        _safe_inject(ctx, message, role="user")


def _project_dir_for_framepack_file(file_path: str) -> str:
    path = Path(file_path)
    if not path.is_absolute():
        path = Path(os.getcwd()) / path
    if path.name == "expanded-prompt.md" and path.parent.name == ".hyperframes":
        return str(path.parent.parent)
    return str(path.parent)


def _is_framepack_skill_name(name: str) -> bool:
    return name in {
        "framepack",
        "framepack:framepack-director",
        "framepack:framepack-gsap",
        "framepack:framepack-arsenal",
        "framepack-animation-library",
        "framepack-reference-miner",
    }


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
                hydrate_guardrails(ctx, project_dir=os.getcwd(), reason=f"skill_view:{skill_name}")
            return

        if tool_name not in ("write_file",):
            return

        file_path = args.get("path", "")

        if _is_frame_md(file_path):
            hydrate_guardrails(ctx, project_dir=_project_dir_for_framepack_file(file_path), reason="frame.md write")
            _handle_frame_md(ctx, file_path)
        elif _is_expanded_prompt(file_path):
            hydrate_guardrails(ctx, project_dir=_project_dir_for_framepack_file(file_path), reason="expanded-prompt write")
            _handle_expanded_prompt(ctx, file_path)

    ctx.register_hook("post_tool_call", on_post_tool_call)
    logger.info("Framepack v0.11.0 post_tool_call hook registered (frame.md + expanded-prompt + guardrail hydration)")


# ── Handlers ──

def _handle_frame_md(ctx, file_path: str) -> None:
    logger.info("frame.md detected: %s", file_path)
    try:
        content = _read_file_safe(file_path)
    except Exception as e:
        logger.warning("Could not read frame.md: %s", e)
        return
    if not content.strip():
        return

    analysis = _analyze_frame_md(ctx, content)
    if analysis is None:
        logger.warning("frame.md analysis failed")
        return

    message = _build_frame_md_advice(analysis)
    _safe_inject(ctx, message, role="user")
    logger.info("frame.md advice injected")


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

    analysis = _analyze_expanded_prompt(ctx, content)
    if analysis is None:
        logger.warning("expanded-prompt analysis failed")
        return

    message = _build_expanded_prompt_advice(analysis)
    _safe_inject(ctx, message, role="user")
    logger.info("expanded-prompt advice injected")
