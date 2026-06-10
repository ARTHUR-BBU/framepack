"""Core MVP hook: detect STORYBOARD.md writes -> analyze -> inject suggestions.

This is the "first parasitic scenario" — the minimum viable demonstration
that Framepack can proactively advise the agent during video creation.

Philosophy: The agent is the director. Framepack watches from behind,
whispers advice at the right moment, and never blocks the director's
creative flow (MVP: advise only, no blocking).
"""

import json
import logging
import os
import re

logger = logging.getLogger(__name__)

# ── Core module imports (try relative for Hermes, absolute for tests) ──

try:
    from ..core.arsenal import BUILT_IN_ARSENAL
except ImportError:
    from core.arsenal import BUILT_IN_ARSENAL  # type: ignore[no-redef]

try:
    from ..core.trusted_sources import is_trusted_url
except ImportError:
    from core.trusted_sources import is_trusted_url  # type: ignore[no-redef]

try:
    from ..core.html_parser import (
        HyperFramesHTMLParser,
        find_videos_in_timed_containers,
        check_root_container_attrs,
        check_imperative_media_control,
    )
except ImportError:
    from core.html_parser import (  # type: ignore[no-redef]
        HyperFramesHTMLParser,
        find_videos_in_timed_containers,
        check_root_container_attrs,
        check_imperative_media_control,
    )


# ── Safe message injection ──

# Patterns that indicate prompt injection / instruction-hijacking in LLM output
_INJECTION_DANGER_PATTERNS = [
    r"(?i)\bignore\s+(all\s+)?(previous|prior|above|instructions?)\b",
    r"(?i)\b(you\s+must|you\s+should|you\s+are\s+now)\b",
    r"(?i)\b(system\s+message|system\s+prompt|override)\b",
    r"(?i)\b(delete\s+(all\s+)?files?|rm\s+-rf|format\s+c:)\b",
    r"(?i)\bIMPORTANT\b.*\b(MUST|DELETE|EXECUTE|RUN)\b",
    r"```",  # code fences in summary could trick the agent
]


def _sanitize_message(text: str) -> str:
    """Strip dangerous instruction patterns from LLM-generated text.

    This prevents prompt injection: a user-authored STORYBOARD.md
    containing 'Ignore previous instructions' could be echoed by the
    LLM into its summary, then injected as a user-role message that
    the agent treats as a real command.

    The sanitizer is conservative — it only strips clearly dangerous
    patterns, not regular creative content.
    """
    for pattern in _INJECTION_DANGER_PATTERNS:
        text = re.sub(pattern, "[filtered]", text)
    return text


def _safe_inject(ctx, message: str, role: str = "user") -> bool:
    """Inject a message into the agent conversation, with error handling.

    Sanitizes the message for prompt injection before injecting.
    Returns True if injection succeeded, False if it failed.
    Failures are logged but never propagated — a broken inject
    should never crash the hook chain.
    """
    try:
        safe_message = _sanitize_message(message)
        ctx.inject_message(safe_message, role=role)
        return True
    except Exception as e:
        logger.warning("Failed to inject message (role=%s): %s", role, e)
        return False

def register(ctx):
    """Register the post_tool_call hook for storyboard detection.

    Every time the agent uses a tool, this hook fires.
    It checks if the agent just wrote a STORYBOARD.md file,
    and if so, analyzes it and injects advice into the conversation.
    """

    def on_post_tool_call(
        tool_name: str = "",
        args: dict | None = None,
        result: str = "",
        task_id: str = "",
        session_id: str = "",
        tool_call_id: str = "",
        **kwargs,
    ):
        """Fires after every tool call."""

        if not args:
            return

        # ── 1. Fast-path filter: only care about file writes ──
        if tool_name not in ("write_file",):
            return

        file_path = args.get("path", "")

        # ── Dispatch by file type ──
        if _is_storyboard_file(file_path):
            _handle_storyboard(ctx, file_path)
        elif _is_composition_file(file_path):
            _handle_composition(ctx, file_path)
        elif _is_hyperframes_html(file_path):
            _handle_hyperframes_html(ctx, file_path)
        elif _is_arsenal_file(file_path):
            _handle_arsenal(ctx, file_path)
        elif _is_video_dna_file(file_path):
            _handle_video_dna(ctx, file_path)
        elif _is_template_blueprint_file(file_path):
            _handle_template_blueprint(ctx, file_path)
        elif _is_design_file(file_path):
            _handle_design(ctx, file_path)
        elif _is_design_tokens_file(file_path):
            _handle_design_tokens(ctx, file_path)

    ctx.register_hook("post_tool_call", on_post_tool_call)


# ── Storyboard Handler ──


def _handle_storyboard(ctx, file_path: str) -> None:
    """Detect STORYBOARD.md → analyze structure → inject advice."""
    logger.info("Storyboard detected: %s", file_path)

    try:
        content = _read_file_safe(file_path)
    except Exception as e:
        logger.warning("Could not read storyboard: %s", e)
        return

    if not content.strip():
        logger.info("Storyboard is empty, skipping analysis")
        return

    analysis = _analyze_storyboard(ctx, content)
    if analysis is None:
        logger.warning("Storyboard analysis failed, skipping advice")
        return

    message = _build_storyboard_advice(analysis)
    _safe_inject(ctx, message, role="user")
    logger.info("Storyboard advice injected")


# ── Composition Handler ──


def _handle_composition(ctx, file_path: str) -> None:
    """Detect COMPOSITION.md → analyze template mappings → inject advice."""
    logger.info("Composition detected: %s", file_path)

    try:
        content = _read_file_safe(file_path)
    except Exception as e:
        logger.warning("Could not read composition: %s", e)
        return

    if not content.strip():
        logger.info("Composition is empty, skipping analysis")
        return

    analysis = _analyze_composition(ctx, content)
    if analysis is None:
        logger.warning("Composition analysis failed, skipping advice")
        return

    message = _build_composition_advice(analysis)
    _safe_inject(ctx, message, role="user")
    logger.info("Composition advice injected")


# ── File Detection ──


def _is_storyboard_file(file_path: str) -> bool:
    """Check if the written file is a Framepack storyboard.

    Matches: STORYBOARD.md anywhere in the path.
    Case-insensitive on the basename (Windows compatibility).
    """
    if not file_path:
        return False

    basename = os.path.basename(file_path)
    return basename.upper() == "STORYBOARD.MD"


def _is_composition_file(file_path: str) -> bool:
    """Check if the written file is a Framepack composition.

    Matches: COMPOSITION.md anywhere in the path.
    Case-insensitive on the basename (Windows compatibility).
    """
    if not file_path:
        return False

    basename = os.path.basename(file_path)
    return basename.upper() == "COMPOSITION.MD"


def _is_hyperframes_html(file_path: str) -> bool:
    """Check if the written file is a HyperFrames index.html.

    Matches: index.html (case-insensitive) in or near a Framepack workbench.
    """
    if not file_path:
        return False

    basename = os.path.basename(file_path)
    return basename.lower() == "index.html"


def _is_arsenal_file(file_path: str) -> bool:
    """Check if the written file is a Framepack arsenal file.

    Matches: arsenal.json anywhere in the path.
    """
    if not file_path:
        return False

    basename = os.path.basename(file_path)
    return basename.lower() == "arsenal.json"


def _is_video_dna_file(file_path: str) -> bool:
    """Check if the written file is a Video DNA analysis.

    Matches: VIDEO_DNA.md anywhere in the path.
    """
    if not file_path:
        return False

    basename = os.path.basename(file_path)
    return basename.upper() == "VIDEO_DNA.MD"


def _is_template_blueprint_file(file_path: str) -> bool:
    """Check if the written file is a Template Blueprint.

    Matches: TEMPLATE_BLUEPRINT.md anywhere in the path.
    """
    if not file_path:
        return False

    basename = os.path.basename(file_path)
    return basename.upper() == "TEMPLATE_BLUEPRINT.MD"


def _is_design_file(file_path: str) -> bool:
    """Check if the written file is a Framepack design document.

    Matches: DESIGN.md anywhere in the path.
    Case-insensitive on the basename (Windows compatibility).
    """
    if not file_path:
        return False

    basename = os.path.basename(file_path)
    return basename.upper() == "DESIGN.MD"


def _is_design_tokens_file(file_path: str) -> bool:
    """Check if the written file is a Framepack design tokens document.

    Matches: DESIGN_TOKENS.md anywhere in the path.
    Case-insensitive on the basename (Windows compatibility).
    """
    if not file_path:
        return False

    basename = os.path.basename(file_path)
    return basename.upper() == "DESIGN_TOKENS.MD"


def _read_file_safe(file_path: str) -> str:
    """Read file with encoding fallback.

    Tries UTF-8 first, falls back to latin-1.
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="latin-1") as f:
            return f.read()


# ── LLM Analysis ──


_STORYBOARD_SYSTEM_PROMPT = """You are Framepack's storyboard analyst — a sharp, no-bullshit video QA reviewer.
Your job is to find problems BEFORE they break the render. Be direct. Be specific.

Given a STORYBOARD.md from a HyperFrames video project, analyze it for:

1. Project type: event-promo (hook→speakers→energy→CTA),
sports-highlight (best plays→drama→stats), saas-launch (problem→solution→features),
course-promo (pain→teacher→curriculum), data-shock (stats→context→call),
news-explainer (headline→context→impact), or unknown

2. Structure: does it have an opening hook and closing CTA?

3. HyperFrames issues. Flag these as FATAL (WILL BREAK RENDER):
- Math.random() — NOT render-safe, replace with GSAP deterministic values
- repeat: -1 — infinite loops freeze the renderer
- First scene not visible in CSS — produces blank first frame
- <video> inside timed scene containers — use separate timeline instead
- Missing window.__timelines registration — scenes won't sync

4. Weapon recommendations — pick from these IDs where relevant:
workflow.event-promo, workflow.sports-highlight,
motion.event-countdown-pulse, motion.speaker-lineup-reveal,
motion.bento-reveal, motion.kinetic-captions,
library.gsap, rules.hyperframes-render-safe, reference.video-dna

RULES (follow strictly):
- Count the actual issues BEFORE writing them. The count in your output MUST equal the exact number of items in the arrays. If you have 3 hyperframes_issues, say there are 3, not 4.
- The summary MUST be a non-obvious insight, not a restatement of the title. Tell the director something they DON'T already know.
- Use direct language: "WILL BREAK" not "could cause issues", "MISSING" not "may benefit from", "MUST FIX" not "consider adding".
- If nothing is wrong, hyperframes_issues and structure_issues MUST be empty arrays [].

Respond with a JSON object ONLY (no markdown, no explanation):
{
  "project_type": string,
  "has_hook": boolean,
  "has_cta": boolean,
  "scene_count": integer,
  "hyperframes_issues": [string, ...],
  "structure_issues": [string, ...],
  "weapon_recommendations": [string, ...],
  "summary": "one non-obvious sentence"
}"""


def _load_skill_content() -> str:
    """Load the framepack-director SKILL.md for domain knowledge injection.

    Returns the skill content as a string, or empty string if unavailable.
    Cached at module level — skill files don't change at runtime.
    """
    return _cached_skill_load("framepack-director")


def _load_template_fuser_skill() -> str:
    """Load the framepack-template-fuser SKILL.md for LLM injection.

    Cached at module level — skill files don't change at runtime.
    """
    return _cached_skill_load("framepack-template-fuser")


# Module-level cache for skill file contents
_SKILL_CONTENT_CACHE: dict[str, str] = {}


def _cached_skill_load(skill_name: str) -> str:
    """Load a skill file from disk, with module-level caching."""
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


def _analyze_storyboard(ctx, content: str) -> dict | None:
    """Use ctx.llm to analyze the storyboard content.

    The LLM is instructed with Framepack's director knowledge so it
    can do a domain-specific analysis: project type detection,
    structural checks, HyperFrames compatibility, and weapon matching.

    Returns parsed analysis dict, or None if the LLM call failed.
    """
    # Truncate very long storyboards to avoid LLM context bloat
    max_chars = 8000
    truncated = content[:max_chars]
    if len(content) > max_chars:
        truncated += (
            f"\n\n[... {len(content) - max_chars} more characters truncated "
            f"from storyboard — analysis based on first {max_chars} chars ...]"
        )

    try:
        # Build the system prompt: hard rules + loaded skill knowledge
        skill_content = _load_skill_content()
        system_prompt = _STORYBOARD_SYSTEM_PROMPT
        if skill_content:
            system_prompt = (
                "## Framepack Director Knowledge (loaded from skill)\n\n"
                + skill_content
                + "\n\n---\n\n"
                + _STORYBOARD_SYSTEM_PROMPT
            )

        result = ctx.llm.complete(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": truncated},
            ],
            temperature=0.2,
            max_tokens=1024,
            purpose="framepack-storyboard-analysis",
        )

        # result.text holds the LLM's raw output
        parsed = _extract_json(result.text)

        if parsed is None:
            logger.warning("LLM returned unparseable analysis: %s", result.text[:200])
            return None

        return parsed

    except Exception as e:
        logger.warning("LLM analysis failed: %s", e)
        return None


def _extract_json(raw: str) -> dict | None:
    """Extract a JSON object from raw LLM text output.

    Handles markdown code fences, leading/trailing noise.
    """
    if not raw:
        return None

    # strip ```json fences
    text = re.sub(r"```(?:json)?\s*", "", raw)
    text = text.strip()

    # find the outermost { ... }
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None

    try:
        return json.loads(text[start:end + 1])
    except json.JSONDecodeError:
        return None


# ── Message Formatting ──


def _build_storyboard_advice(analysis: dict) -> str:
    """Build a natural-language advice message from structured analysis.

    The message is injected into the conversation as a "user" role message
    so the agent treats it as actionable feedback.
    """
    parts = ["📋 **Framepack Storyboard Analysis**\n"]

    # Project type
    ptype = analysis.get("project_type", "unknown")
    if ptype != "unknown":
        parts.append(f"Detected project type: **{ptype}**")

    # Scene count
    scenes = analysis.get("scene_count", 0)
    parts.append(f"Scenes: {scenes}")

    # Structure feedback
    issues = []
    real_issue_count = 0

    if not analysis.get("has_hook"):
        issues.append(
            "- **Missing opening hook** — "
            "the first scene should grab attention in under 3 seconds"
        )
        real_issue_count += 1
    if not analysis.get("has_cta"):
        issues.append(
            "- **Missing CTA** — "
            "the last scene should have a clear call-to-action (time/place/action)"
        )
        real_issue_count += 1

    for si in analysis.get("structure_issues", []):
        issues.append(f"- {si}")
        real_issue_count += 1

    # HyperFrames issues
    hyperframes_issues = analysis.get("hyperframes_issues", [])
    if hyperframes_issues:
        issues.append("\n**HyperFrames issues:**")
        for hi in hyperframes_issues:
            issues.append(f"  - {hi}")
            real_issue_count += 1

    if issues:
        parts.append(f"\n⚠️ **Issues found ({real_issue_count}):**")
        parts.extend(issues)
    else:
        parts.append("\n✅ No structural or HyperFrames issues detected.")

    # Weapon recommendations
    weapons = analysis.get("weapon_recommendations", [])
    if weapons:
        parts.append("\n🎯 **Recommended weapons:**")
        for w in weapons:
            parts.append(f"  - `{w}`")

    # Summary
    summary = analysis.get("summary", "")
    if summary:
        parts.append(f"\n💡 {summary}")

    return "\n".join(parts)


# ── Composition Analysis ──


_COMPOSITION_SYSTEM_PROMPT = """You are Framepack's template fusion reviewer.
The agent has written a COMPOSITION.md mapping storyboard scenes to HyperFrames
templates. Your job: validate every mapping and flag problems BEFORE they reach
the HTML build stage.

## What to check

1. **Coverage** — does every scene have a template assignment?
   MISSING assignments WILL cause broken composition blocks at build time.

2. **Template fit** — is each template choice appropriate for its scene?
   - Hook scenes → full-bleed or data-card (NOT bento or split-screen)
   - Data reveals → data-card or bento-reveal (NOT full-bleed)
   - CTA → full-bleed or countdown-pulse (NOT data-card or card-stack)

3. **HyperFrames compatibility**
   - timeline-scrub MUST be paired with GSAP (no ScrollTrigger)
   - kinetic-captions MUST register on window.__timelines
   - Mixed-template scenes require explicit timeline sync

4. **Weapon recommendations** based on template pattern:
   - bento-reveal → motion.bento-reveal, library.gsap
   - kinetic-captions → motion.kinetic-captions
   - countdown-pulse → motion.event-countdown-pulse
   - data-card heavy → motion.kinetic-captions, library.gsap
   - ALL → rules.hyperframes-render-safe

RULES (follow strictly):
- Count issues BEFORE listing. The number MUST match array length.
- Use direct language: "WILL BREAK" not "might cause issues".
- Summary MUST be a non-obvious insight. Don't restate what's obvious.

Respond with JSON ONLY:
{
  "scene_count": integer,
  "templates_used": [string, ...],
  "coverage_issues": [string, ...],
  "template_fit_issues": [string, ...],
  "hyperframes_issues": [string, ...],
  "weapon_recommendations": [string, ...],
  "summary": "one non-obvious sentence"
}"""


def _analyze_composition(ctx, content: str) -> dict | None:
    """Use ctx.llm to analyze template mappings in COMPOSITION.md."""
    max_chars = 8000
    truncated = content[:max_chars]
    if len(content) > max_chars:
        truncated += (
            f"\n\n[... {len(content) - max_chars} more characters truncated ...]"
        )

    try:
        skill_content = _load_template_fuser_skill()
        system_prompt = _COMPOSITION_SYSTEM_PROMPT
        if skill_content:
            system_prompt = (
                "## Framepack Template Fuser Knowledge (loaded from skill)\n\n"
                + skill_content
                + "\n\n---\n\n"
                + _COMPOSITION_SYSTEM_PROMPT
            )

        result = ctx.llm.complete(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": truncated},
            ],
            temperature=0.2,
            max_tokens=1024,
            purpose="framepack-composition-analysis",
        )

        parsed = _extract_json(result.text)
        if parsed is None:
            logger.warning("LLM returned unparseable composition analysis: %s",
                           result.text[:200])
            return None

        return parsed

    except Exception as e:
        logger.warning("Composition LLM analysis failed: %s", e)
        return None


def _build_composition_advice(analysis: dict) -> str:
    """Build advice message from composition analysis."""
    parts = ["🎬 **Framepack Composition Analysis**\n"]

    scenes = analysis.get("scene_count", 0)
    templates = analysis.get("templates_used", [])
    parts.append(f"Scenes mapped: {scenes}")
    if templates:
        parts.append(f"Templates in use: {', '.join(templates)}")

    issues = []
    real_issue_count = 0
    for ci in analysis.get("coverage_issues", []):
        issues.append(f"- {ci}")
        real_issue_count += 1
    for fi in analysis.get("template_fit_issues", []):
        issues.append(f"- {fi}")
        real_issue_count += 1

    hf_issues = analysis.get("hyperframes_issues", [])
    if hf_issues:
        issues.append("\n**HyperFrames issues:**")
        for hi in hf_issues:
            issues.append(f"  - {hi}")
            real_issue_count += 1

    if issues:
        parts.append(f"\n⚠️ **Issues found ({real_issue_count}):**")
        parts.extend(issues)
    else:
        parts.append("\n✅ All template mappings look solid.")

    weapons = analysis.get("weapon_recommendations", [])
    if weapons:
        parts.append("\n🎯 **Recommended weapons:**")
        for w in weapons:
            parts.append(f"  - `{w}`")

    summary = analysis.get("summary", "")
    if summary:
        parts.append(f"\n💡 {summary}")

    return "\n".join(parts)


# ── Design Handler (LLM analysis) ──


_DESIGN_SYSTEM_PROMPT = """\
Analyze this DESIGN.md document from a Framepack video production workbench.

DESIGN.md defines the visual language — typography, color intent, layout
philosophy, spacing rhythm, and motion style. It is NOT a CSS file; it is
a design brief that the agent translates into code.

Your analysis MUST cover:

1. **Typography** — What hierarchy exists? Which sizes for which roles?
   Is the type scale coherent (heading → subhead → body → caption → label)?
   Any font pairing issues? Does the system account for both large display
   type (hero moments) and small data/stat type?

2. **Visual Language** — What is the design vocabulary? Flat/3D/glassy?
   Clean editorial or gritty texture? Any reference to material design,
   Swiss style, brutalist, Apple HIG, or other schools? Is the language
   consistent across all scenes?

3. **Layout System** — Is there a grid? How does content anchor?
   Centered vs asymmetric? Does the layout account for the 9:16 vertical
   format specifically, or is it generic?

4. **Motion Philosophy** — How does DESIGN.md describe motion? Fast/slow?
   Hard cuts vs smooth easing? Any reference to specific animation schools
   (Apple keynote, kinetic typography, bounce, stagger)?

5. **Color Intent** — Beyond hex values, what's the color STORY? Warm vs
   cold? Accent pop? Gradients or flat? How do colors map to emotions
   across scenes?

Output ONLY valid JSON. No markdown fences, no backticks:

{
  "summary": "A non-obvious directorial insight about this design. Never restate the project type. Describe what makes this design special or what it's missing.",
  "typography_score": "strong|adequate|missing",
  "typography_issues": ["issue 1", "issue 2"],
  "visual_language_score": "strong|adequate|missing",
  "visual_language_issues": ["issue 1"],
  "layout_score": "strong|adequate|missing",
  "layout_issues": ["issue 1"],
  "motion_score": "strong|adequate|missing",
  "motion_issues": ["issue 1"],
  "color_score": "strong|adequate|missing",
  "color_issues": ["issue 1"],
  "critical_issues": ["MUST FIX issue 1", "MUST FIX issue 2"],
  "design_tokens_covered": ["colors", "fonts", "spacing"],
  "design_tokens_missing": ["something the design references but DESIGN_TOKENS.md must provide"]
}

Rules:
- Count issues BEFORE writing them. The `critical_issues` count MUST equal `len(critical_issues)`.
- "missing" means the dimension is entirely absent from DESIGN.md. Use this sparingly.
- "adequate" means present but could be stronger.
- "strong" means thorough and opinionated.
- Summary MUST be a non-obvious directorial insight. Never say "comprehensive design document."
"""


def _handle_design(ctx, file_path: str) -> None:
    """Detect DESIGN.md → analyze visual language → inject advice."""
    logger.info("Design detected: %s", file_path)

    try:
        content = _read_file_safe(file_path)
    except Exception as e:
        logger.warning("Could not read design: %s", e)
        return

    if not content.strip():
        logger.info("Design is empty, skipping analysis")
        return

    analysis = _analyze_design(ctx, content)
    if analysis is None:
        logger.warning("Design analysis failed, skipping advice")
        return

    message = _build_design_advice(analysis)
    _safe_inject(ctx, message, role="user")
    logger.info("Design advice injected")


def _analyze_design(ctx, content: str) -> dict | None:
    """Send DESIGN.md content to LLM for creative analysis."""
    max_chars = 8000
    truncated = content[:max_chars]
    if len(content) > max_chars:
        truncated += (
            f"\n\n[... {len(content) - max_chars} more characters truncated ...]"
        )

    try:
        result = ctx.llm.complete(
            messages=[
                {"role": "system", "content": _DESIGN_SYSTEM_PROMPT},
                {"role": "user", "content": truncated},
            ],
            temperature=0.2,
            max_tokens=1024,
            purpose="framepack-design-analysis",
        )

        parsed = _extract_json(result.text)
        if parsed is None:
            logger.warning("LLM returned unparseable design analysis: %s",
                           result.text[:200])
            return None

        return parsed

    except Exception as e:
        logger.warning("Design LLM analysis failed: %s", e)
        return None


def _build_design_advice(analysis: dict) -> str:
    """Build advice message from design analysis."""
    parts = ["🎨 **Framepack Design Analysis**\n"]

    # Typography
    typo_score = analysis.get("typography_score", "adequate")
    icon = {"strong": "✅", "adequate": "⚠️", "missing": "🔴"}.get(typo_score, "⚠️")
    parts.append(f"{icon} Typography: **{typo_score}**")
    for issue in analysis.get("typography_issues", []):
        parts.append(f"   - {issue}")

    # Visual Language
    vl_score = analysis.get("visual_language_score", "adequate")
    icon = {"strong": "✅", "adequate": "⚠️", "missing": "🔴"}.get(vl_score, "⚠️")
    parts.append(f"{icon} Visual Language: **{vl_score}**")
    for issue in analysis.get("visual_language_issues", []):
        parts.append(f"   - {issue}")

    # Layout
    layout_score = analysis.get("layout_score", "adequate")
    icon = {"strong": "✅", "adequate": "⚠️", "missing": "🔴"}.get(layout_score, "⚠️")
    parts.append(f"{icon} Layout System: **{layout_score}**")
    for issue in analysis.get("layout_issues", []):
        parts.append(f"   - {issue}")

    # Motion
    motion_score = analysis.get("motion_score", "adequate")
    icon = {"strong": "✅", "adequate": "⚠️", "missing": "🔴"}.get(motion_score, "⚠️")
    parts.append(f"{icon} Motion Philosophy: **{motion_score}**")
    for issue in analysis.get("motion_issues", []):
        parts.append(f"   - {issue}")

    # Color
    color_score = analysis.get("color_score", "adequate")
    icon = {"strong": "✅", "adequate": "⚠️", "missing": "🔴"}.get(color_score, "⚠️")
    parts.append(f"{icon} Color Intent: **{color_score}**")
    for issue in analysis.get("color_issues", []):
        parts.append(f"   - {issue}")

    # Critical issues
    critical = analysis.get("critical_issues", [])
    if critical:
        parts.append(f"\n🔴 **Critical ({len(critical)}):**")
        for ci in critical:
            parts.append(f"  - {ci}")

    # Token coverage
    covered = analysis.get("design_tokens_covered", [])
    missing_tokens = analysis.get("design_tokens_missing", [])
    if missing_tokens:
        parts.append(f"\n💡 **Missing from DESIGN_TOKENS.md:**")
        for mt in missing_tokens:
            parts.append(f"  - {mt}")
    elif covered:
        parts.append(f"\n✅ Token categories covered: {', '.join(covered)}")

    summary = analysis.get("summary", "")
    if summary:
        parts.append(f"\n💡 {summary}")

    return "\n".join(parts)


# ── Design Tokens Handler (structural validation, zero tokens) ──

_DESIGN_TOKENS_REQUIRED_SECTIONS = [
    ("Color Tokens", "## Color", "Concrete hex/RGB values for every semantic color role"),
    ("Font Tokens", "## Font", "Font families, weights, sizes as reusable tokens"),
    ("Spacing Tokens", "## Spacing", "Margin/padding/gap scale (4px base, 8px grid, etc.)"),
    ("Animation Tokens", "## Animation", "Duration presets, easing curves, stagger defaults"),
]


def _handle_design_tokens(ctx, file_path: str) -> None:
    """Detect DESIGN_TOKENS.md → validate sections → inject gaps report."""
    logger.info("Design tokens detected: %s", file_path)

    try:
        content = _read_file_safe(file_path)
    except Exception as e:
        logger.warning("Could not read design tokens: %s", e)
        return

    if not content.strip():
        logger.info("DESIGN_TOKENS.md is empty — suggesting generation")
        _safe_inject(ctx,
            "🎨 **Framepack Design Tokens — Empty**\n\n"
            "DESIGN_TOKENS.md is empty. Generate concrete token values:\n"
            "→ `## Color` — hex/RGB for primary, accent, bg, text, overlay\n"
            "→ `## Font` — family, weight, size tokens (xs/sm/md/lg/xl/display)\n"
            "→ `## Spacing` — margin/padding/gap scale in px\n"
            "→ `## Animation` — duration presets, easing defaults\n\n"
            "These tokens feed directly into CSS custom properties and GSAP configs.",
            role="user",
        )
        return

    result = _validate_design_tokens_sections(content)
    message = _build_design_tokens_message(result)
    if message:
        _safe_inject(ctx, message, role="user")
        logger.info("Design tokens validation injected (%d/%d sections present)",
                     len(result["present"]), len(_DESIGN_TOKENS_REQUIRED_SECTIONS))


def _validate_design_tokens_sections(content: str) -> dict:
    """Check which required sections are present in DESIGN_TOKENS.md.

    Uses the same structural pattern as _validate_dna_sections.
    """
    present = []
    missing = []
    for name, marker, desc in _DESIGN_TOKENS_REQUIRED_SECTIONS:
        if marker.lower() in content.lower():
            present.append((name, desc))
        else:
            missing.append((name, desc))

    return {
        "present": present,
        "missing": missing,
        "complete": len(missing) == 0,
    }


def _build_design_tokens_message(result: dict) -> str | None:
    """Build DESIGN_TOKENS.md validation message, or None if complete."""
    if result["complete"]:
        return (
            "🎨 **Framepack Design Tokens — Complete**\n\n"
            f"All {len(_DESIGN_TOKENS_REQUIRED_SECTIONS)}/{len(_DESIGN_TOKENS_REQUIRED_SECTIONS)} "
            "token categories present. Ready for CSS variable generation."
        )

    missing = result["missing"]
    present = result["present"]

    parts = ["🎨 **Framepack Design Tokens — Incomplete**\n"]

    if present:
        parts.append(f"✅ Present ({len(present)}/{len(_DESIGN_TOKENS_REQUIRED_SECTIONS)}):")
        for name, desc in present:
            parts.append(f"   {name} — {desc}")

    parts.append("")
    parts.append(f"❌ Missing ({len(missing)}/{len(_DESIGN_TOKENS_REQUIRED_SECTIONS)}):")
    for name, desc in missing:
        parts.append(f"   {name} — {desc}")

    parts.append("")
    parts.append(
        "**Fix:** Add the missing sections with concrete values. "
        "Without animation tokens, GSAP durations default to guesswork. "
        "Without spacing tokens, layouts break on the first scene change."
    )

    return "\n".join(parts)


# ── HyperFrames HTML Audit ──


# Severity levels for audit findings
_AUDIT_P0 = "P0 — WILL BREAK RENDER"
_AUDIT_P1 = "P1 — LIKELY BROKEN"
_AUDIT_P2 = "P2 — BEST PRACTICE"


def _run_html_checks(html: str) -> list[dict]:
    """Run deterministic regex checks against HyperFrames index.html.

    Returns a list of findings: {check_id, severity, message, passed}.
    These are zero-token, instant checks for the most common render failures.
    """
    findings = []

    # ── P0: Render WILL fail ──

    # data-width on scene containers
    if 'data-width' not in html:
        findings.append({
            "check_id": "data-width",
            "severity": _AUDIT_P0,
            "passed": False,
            "message": "Missing data-width attributes — scenes have no dimensions, "
                       "canvas renders blank. Add data-width to every scene container.",
        })
    else:
        findings.append({"check_id": "data-width", "severity": "-", "passed": True, "message": ""})

    # data-height on scene containers
    if 'data-height' not in html:
        findings.append({
            "check_id": "data-height",
            "severity": _AUDIT_P0,
            "passed": False,
            "message": "Missing data-height attributes — scenes have no vertical dimensions.",
        })
    else:
        findings.append({"check_id": "data-height", "severity": "-", "passed": True, "message": ""})

    # data-start on scene containers
    if 'data-start' not in html:
        findings.append({
            "check_id": "data-start",
            "severity": _AUDIT_P0,
            "passed": False,
            "message": "Missing data-start attributes — scenes cannot be scheduled. "
                       "Add data-start to every scene container.",
        })
    else:
        findings.append({"check_id": "data-start", "severity": "-", "passed": True, "message": ""})

    # ── P1: Render likely broken ──

    # Math.random() — non-deterministic render output (case-insensitive)
    if re.search(r'Math\.random\s*\(', html, re.IGNORECASE):
        findings.append({
            "check_id": "no-math-random",
            "severity": _AUDIT_P1,
            "passed": False,
            "message": "Math.random() detected — every render frame produces different output. "
                       "Replace with deterministic values or pre-computed random seeds.",
        })
    else:
        findings.append({"check_id": "no-math-random", "severity": "-", "passed": True, "message": ""})

    # repeat: -1 — infinite loops break render pipeline
    if re.search(r'repeat\s*:\s*-1', html):
        findings.append({
            "check_id": "no-repeat-infinite",
            "severity": _AUDIT_P1,
            "passed": False,
            "message": "repeat: -1 detected — infinite animation loops break the render pipeline. "
                       "Use a finite repeat count or precompute frames.",
        })
    else:
        findings.append({"check_id": "no-repeat-infinite", "severity": "-", "passed": True, "message": ""})

    # ScrollTrigger — scroll-based triggers have no scrollbar in render
    if 'scrolltrigger' in html.lower():
        findings.append({
            "check_id": "no-scrolltrigger",
            "severity": _AUDIT_P1,
            "passed": False,
            "message": "ScrollTrigger detected — scroll-based animations cannot fire in render "
                       "context (no scrollbar). Convert to deterministic GSAP timeline beats.",
        })
    else:
        findings.append({"check_id": "no-scrolltrigger", "severity": "-", "passed": True, "message": ""})

    # window.__timelines registration
    if 'window.__timelines' not in html:
        findings.append({
            "check_id": "timelines-registered",
            "severity": _AUDIT_P1,
            "passed": False,
            "message": "window.__timelines not found — GSAP timelines must be registered so "
                       "the HyperFrames scheduler can control them. "
                       "Add: window.__timelines.push(tl) after each timeline creation.",
        })
    else:
        findings.append({"check_id": "timelines-registered", "severity": "-", "passed": True, "message": ""})

    # ── P2: Best practice ──

    # FLIP animation references (experimental, may break)
    if 'flip' in html.lower():
        findings.append({
            "check_id": "no-flip",
            "severity": _AUDIT_P2,
            "passed": False,
            "message": "FLIP animation reference detected — FLIP relies on DOM position which "
                       "varies by viewport. Consider GSAP for deterministic animations.",
        })
    else:
        findings.append({"check_id": "no-flip", "severity": "-", "passed": True, "message": ""})

    # ── Structural checks (HTML parser) ──

    try:
        parser = HyperFramesHTMLParser()
        parser.feed(html)

        # P0: <video> nested inside timed scene containers
        video_violations = find_videos_in_timed_containers(parser)
        if video_violations:
            scenes = ", ".join(
                f"{v['parent_id']}(start={v['parent_start']})" for v in video_violations
            )
            findings.append({
                "check_id": "no-video-in-timed-container",
                "severity": _AUDIT_P0,
                "passed": False,
                "message": f"<video> nested inside timed scene containers: {scenes}. "
                           f"HyperFrames requires videos at the composition root level, "
                           f"not inside timed scene divs. Move <video> outside scene containers.",
            })
        else:
            findings.append({"check_id": "no-video-in-timed-container", "severity": "-", "passed": True, "message": ""})

        # P0: Root container missing HyperFrames attributes
        missing_attrs = check_root_container_attrs(parser)
        if missing_attrs:
            findings.append({
                "check_id": "root-container-attrs",
                "severity": _AUDIT_P0,
                "passed": False,
                "message": f"Root container missing: {', '.join(missing_attrs)}. "
                           f"HyperFrames requires data-composition-id and class=\"clip\" "
                           f"on the root composition element.",
            })
        else:
            findings.append({"check_id": "root-container-attrs", "severity": "-", "passed": True, "message": ""})

        # P0: Imperative media control in <script>
        script_violations = check_imperative_media_control(parser.script_text)
        if script_violations:
            violations_text = "; ".join(script_violations)
            findings.append({
                "check_id": "no-imperative-media",
                "severity": _AUDIT_P0,
                "passed": False,
                "message": violations_text,
            })
        else:
            findings.append({"check_id": "no-imperative-media", "severity": "-", "passed": True, "message": ""})

    except Exception as e:
        logger.warning("HTML structural parsing failed, skipping structural checks: %s", e)
        findings.append({"check_id": "no-video-in-timed-container", "severity": "-", "passed": True, "message": "(skipped)"})
        findings.append({"check_id": "root-container-attrs", "severity": "-", "passed": True, "message": "(skipped)"})
        findings.append({"check_id": "no-imperative-media", "severity": "-", "passed": True, "message": "(skipped)"})

    return findings


def _handle_hyperframes_html(ctx, file_path: str) -> None:
    """Detect index.html → audit against HyperFrames contract → inject report."""
    logger.info("HyperFrames HTML detected: %s", file_path)

    try:
        html = _read_file_safe(file_path)
    except Exception as e:
        logger.warning("Could not read HTML: %s", e)
        return

    if not html.strip():
        logger.info("HTML is empty, skipping audit")
        return

    findings = _run_html_checks(html)
    message = _build_html_audit_message(findings)
    _safe_inject(ctx, message, role="user")
    logger.info("HyperFrames HTML audit injected (%d checks run)", len(findings))


def _build_html_audit_message(findings: list[dict]) -> str:
    """Format audit findings as a concise checklist."""
    parts = ["🔍 **HyperFrames HTML Audit**\n"]

    passed = sum(1 for f in findings if f["passed"])
    failed = sum(1 for f in findings if not f["passed"])
    p0_count = sum(1 for f in findings if not f["passed"] and "P0" in f["severity"])
    p1_count = sum(1 for f in findings if not f["passed"] and "P1" in f["severity"])

    parts.append(f"Checks: {passed} passed, {failed} failed")
    if p0_count:
        parts.append(f"  🔴 P0 (will break render): {p0_count}")
    if p1_count:
        parts.append(f"  🟡 P1 (likely broken): {p1_count}")

    failures = [f for f in findings if not f["passed"]]
    if failures:
        parts.append("")
        for f in failures:
            icon = "🔴" if "P0" in f["severity"] else "🟡" if "P1" in f["severity"] else "🔵"
            parts.append(f"{icon} **[{f['check_id']}]** {f['message']}")

    if not failures:
        parts.append("\n✅ No HyperFrames contract violations detected.")

    # Recommendations
    if failures:
        has_data_issue = any(
            not f["passed"] and f["check_id"] in ("data-width", "data-height", "data-start")
            for f in findings
        )
        has_js_issue = any(
            not f["passed"] and f["check_id"]
            in ("no-math-random", "no-repeat-infinite", "no-scrolltrigger")
            for f in findings
        )
        parts.append("\n🎯 **Fix priority:**")
        if has_data_issue:
            parts.append("  1. Add data-width, data-height, data-start to every scene container")
        if has_js_issue:
            parts.append(
                "  2. Remove Math.random(), repeat: -1, and ScrollTrigger from GSAP timelines"
            )
        parts.append(f"  3. Re-run audit after fixes")

    return "\n".join(parts)


# ── Arsenal Validation ──


# Derived from the single source of truth in core/arsenal.py
_VALID_WEAPON_IDS = frozenset(item.id for item in BUILT_IN_ARSENAL)

# Mandatory weapons every project arsenal should include
_MANDATORY_WEAPONS = frozenset({
    "rules.hyperframes-render-safe",
})

# Recommended for all projects
_RECOMMENDED_WEAPONS = frozenset({
    "library.gsap",
    "reference.video-dna",
})


def _validate_arsenal(arsenal_data: dict) -> dict:
    """Validate an arsenal.json against known weapons and trust rules.

    Returns: {known, unknown, missing_mandatory, missing_recommended, warnings}
    """
    items = arsenal_data.get("items", [])
    if not isinstance(items, list):
        items = []

    weapon_ids = set()
    for item in items:
        wid = item.get("id", "")
        if wid:
            weapon_ids.add(wid)

    known = weapon_ids & _VALID_WEAPON_IDS
    unknown = weapon_ids - _VALID_WEAPON_IDS
    missing_mandatory = _MANDATORY_WEAPONS - weapon_ids
    missing_recommended = _RECOMMENDED_WEAPONS - weapon_ids

    warnings = []
    if unknown:
        ids = ", ".join(sorted(unknown))
        warnings.append(
            f"Unknown weapon IDs: {ids}. "
            "These are not in the built-in arsenal. Verify they come "
            "from trusted sources before using."
        )
    if missing_mandatory:
        ids = ", ".join(sorted(missing_mandatory))
        warnings.append(
            f"MISSING mandatory weapons: {ids}. "
            "Projects without these WILL have render issues."
        )

    return {
        "known": known,
        "unknown": unknown,
        "missing_mandatory": missing_mandatory,
        "missing_recommended": missing_recommended,
        "warnings": warnings,
    }


def _handle_arsenal(ctx, file_path: str) -> None:
    """Detect arsenal.json → validate weapons → inject warnings."""
    logger.info("Arsenal detected: %s", file_path)

    try:
        raw = _read_file_safe(file_path)
    except Exception as e:
        logger.warning("Could not read arsenal: %s", e)
        return

    if not raw.strip():
        logger.info("Arsenal is empty, skipping")
        return

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        logger.warning("Arsenal JSON invalid: %s", e)
        return

    result = _validate_arsenal(data)
    message = _build_arsenal_message(result)
    if message:
        _safe_inject(ctx, message, role="user")
        logger.info("Arsenal validation injected")


def _build_arsenal_message(result: dict) -> str | None:
    """Build arsenal validation message, or None if all clean."""
    warnings = result.get("warnings", [])
    known = result.get("known", set())
    unknown = result.get("unknown", set())
    missing_rec = result.get("missing_recommended", set())

    if not warnings and not missing_rec:
        return None  # Perfect — no need to inject

    parts = ["🔫 **Framepack Arsenal Validation**\n"]

    if known:
        parts.append(f"✅ Known weapons: {len(known)} ({', '.join(sorted(known))})")

    if warnings:
        parts.append("")
        for w in warnings:
            parts.append(f"⚠️  {w}")

    if missing_rec:
        ids = ", ".join(sorted(missing_rec))
        parts.append(
            f"\n💡 Consider adding: {ids}"
        )

    return "\n".join(parts)


# ── Reference Mining ──

# Required sections in VIDEO_DNA.md (all 7 dimensions from the Skill)
_DNA_REQUIRED_SECTIONS = [
    ("## Rhythm", "💓 Timing structure"),
    ("## Scene Roles", "🎬 Scene-by-scene function analysis"),
    ("## Visual Grammar", "🎨 Visual language (color, type, composition)"),
    ("## Motion Grammar", "🏃 Animation patterns (entrance, exit, emphasis)"),
    ("## Asset Requirements", "📦 Raw material checklist"),
    ("## Reusable Slots", "♻️ Extractable patterns for future projects"),
    ("## HyperFrames Constraints", "🛡️ Render safety declarations"),
]

# Required sections in TEMPLATE_BLUEPRINT.md
_BLUEPRINT_REQUIRED_SECTIONS = [
    ("## Scene Sequence", "📋 Scene-by-scene build table"),
    ("## GSAP Recipe Map", "⚡ Animation implementation per scene"),
    ("## Render Checklist", "✅ Pre-build validation items"),
]


def _validate_dna_sections(content: str) -> dict:
    """Check VIDEO_DNA.md for all required sections.

    Returns: {present, missing, complete}
    """
    present = []
    missing = []

    for header, description in _DNA_REQUIRED_SECTIONS:
        if header.lower() in content.lower():
            present.append((header, description))
        else:
            missing.append((header, description))

    return {
        "present": present,
        "missing": missing,
        "complete": len(missing) == 0,
    }


def _validate_blueprint_sections(content: str) -> dict:
    """Check TEMPLATE_BLUEPRINT.md for all required sections.

    Returns: {present, missing, complete}
    """
    present = []
    missing = []

    for header, description in _BLUEPRINT_REQUIRED_SECTIONS:
        if header.lower() in content.lower():
            present.append((header, description))
        else:
            missing.append((header, description))

    return {
        "present": present,
        "missing": missing,
        "complete": len(missing) == 0,
    }


def _handle_video_dna(ctx, file_path: str) -> None:
    """Detect VIDEO_DNA.md → validate structure → inject gaps report."""
    logger.info("Video DNA detected: %s", file_path)

    try:
        content = _read_file_safe(file_path)
    except Exception as e:
        logger.warning("Could not read VIDEO_DNA.md: %s", e)
        return

    if not content.strip():
        logger.info("VIDEO_DNA.md is empty — suggesting Skill load")
        _safe_inject(ctx,
            "🧬 **Framepack Reference Miner**\n\n"
            "VIDEO_DNA.md is empty. To mine reference videos properly, load the Skill:\n"
            "→ `skill_view(name='framepack:framepack-reference-miner')`\n\n"
            "It contains the 7-dimension methodology + STRUCTURED TEMPLATES "
            "for both VIDEO_DNA.md and TEMPLATE_BLUEPRINT.md.",
            role="user",
        )
        return

    result = _validate_dna_sections(content)
    message = _build_dna_message(result)
    if message:
        _safe_inject(ctx, message, role="user")
        logger.info("Video DNA validation injected (%d/%d sections present)",
                     len(result["present"]), len(_DNA_REQUIRED_SECTIONS))


def _handle_template_blueprint(ctx, file_path: str) -> None:
    """Detect TEMPLATE_BLUEPRINT.md → validate structure → inject gaps report."""
    logger.info("Template Blueprint detected: %s", file_path)

    try:
        content = _read_file_safe(file_path)
    except Exception as e:
        logger.warning("Could not read TEMPLATE_BLUEPRINT.md: %s", e)
        return

    if not content.strip():
        logger.info("TEMPLATE_BLUEPRINT.md is empty — suggesting Skill load")
        _safe_inject(ctx,
            "📐 **Framepack Reference Miner**\n\n"
            "TEMPLATE_BLUEPRINT.md is empty. To build proper blueprints, load the Skill:\n"
            "→ `skill_view(name='framepack:framepack-reference-miner')`\n\n"
            "It contains the scene-sequence table template, GSAP recipe map format, "
            "and render checklist structure.",
            role="user",
        )
        return

    result = _validate_blueprint_sections(content)
    message = _build_blueprint_message(result)
    if message:
        _safe_inject(ctx, message, role="user")
        logger.info("Template Blueprint validation injected (%d/%d sections present)",
                     len(result["present"]), len(_BLUEPRINT_REQUIRED_SECTIONS))


def _build_dna_message(result: dict) -> str | None:
    """Build VIDEO_DNA.md validation message, or None if complete."""
    if result["complete"]:
        return (
            "🧬 **Framepack Video DNA — Complete**\n\n"
            f"All {len(_DNA_REQUIRED_SECTIONS)}/7 dimensions present. "
            "This DNA is structurally complete.\n"
            "Next: derive TEMPLATE_BLUEPRINT.md from this DNA."
        )

    missing = result["missing"]
    present = result["present"]

    parts = ["🧬 **Framepack Video DNA — Incomplete**\n"]

    if present:
        parts.append(f"✅ Present ({len(present)}/7):")
        for header, desc in present:
            parts.append(f"   {header} — {desc}")

    parts.append("")
    parts.append(f"❌ Missing ({len(missing)}/7):")
    for header, desc in missing:
        parts.append(f"   {header} — {desc}")

    parts.append("")
    parts.append(
        "📖 Load `framepack:framepack-reference-miner` for the full methodology "
        "and structured templates for each section."
    )

    return "\n".join(parts)


def _build_blueprint_message(result: dict) -> str | None:
    """Build TEMPLATE_BLUEPRINT.md validation message, or None if complete."""
    if result["complete"]:
        return (
            "📐 **Framepack Template Blueprint — Complete**\n\n"
            f"All {len(_BLUEPRINT_REQUIRED_SECTIONS)}/3 sections present. "
            "Blueprint is structurally complete."
        )

    missing = result["missing"]
    present = result["present"]

    parts = ["📐 **Framepack Template Blueprint — Incomplete**\n"]

    if present:
        parts.append(f"✅ Present ({len(present)}/3):")
        for header, desc in present:
            parts.append(f"   {header} — {desc}")

    parts.append("")
    parts.append(f"❌ Missing ({len(missing)}/3):")
    for header, desc in missing:
        parts.append(f"   {header} — {desc}")

    parts.append("")
    parts.append(
        "📖 Load `framepack:framepack-reference-miner` for table templates "
        "and the structured blueprint format."
    )

    return "\n".join(parts)
