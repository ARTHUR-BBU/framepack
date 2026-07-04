"""Framepack Director Overlay for HyperFrames workflow skills.

When an Agent loads a HyperFrames workflow skill (product-launch-video,
website-to-video, etc.), Framepack injects a co-direction message establishing
the creative authority split. This prevents the skill's self-contained
orchestrator from completely bypassing Framepack's creative direction.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

HYPERFRAMES_WORKFLOW_SKILLS = frozenset({
    "product-launch-video",
    "website-to-video",
    "faceless-explainer",
    "pr-to-video",
    "embedded-captions",
    "talking-head-recut",
    "motion-graphics",
    "music-to-video",
    "slideshow",
    "general-video",
    "remotion-to-hyperframes",
})

_overlay_injected: set[str] = set()


def reset_overlay_state() -> None:
    """Reset the dedup tracker. Used in tests to isolate sessions."""
    _overlay_injected.clear()


def is_workflow_skill(name: str) -> bool:
    """Return True if the skill name is a HyperFrames workflow skill."""
    return name in HYPERFRAMES_WORKFLOW_SKILLS


def build_overlay_message(skill_name: str) -> str:
    """Build the co-direction overlay message for a workflow skill."""
    return (
        f"[Framepack Director Overlay — {skill_name}]\n"
        f"You just loaded `{skill_name}`. This skill handles production execution "
        f"(capture, build, render). Framepack handles creative direction.\n\n"
        f"Rules:\n"
        f"1. **frame.md**: If Framepack's frame.md already exists, skip the skill's "
        f"build-frame.mjs (Step 2) — Framepack's frame.md is the creative source of truth. "
        f"If it doesn't exist yet, run Framepack Phase 0-2 FIRST before continuing.\n"
        f"2. **expanded-prompt.md**: If it exists, STORYBOARD.md must derive from it, "
        f"not replace it. The Director Story Bible takes creative precedence.\n"
        f"3. **Execution Manifest**: HTML authoring (including skill's frame-worker "
        f"sub-agents) must respect the Execution Manifest from expanded-prompt.md.\n"
        f"4. **Capture**: Use `npx hyperframes capture` for URL-based videos — its output "
        f"(tokens.json, screenshots) should feed Framepack's asset-intake.md.\n"
        f"5. **Capability alignment**: Before hand-coding visuals, check "
        f"`npx hyperframes catalog` and the official skills pack first.\n\n"
        f"This overlay is advisory — it does not block the skill. But violating these "
        f"rules means Framepack's creative system is bypassed, which defeats the purpose "
        f"of the workbench."
    )


def inject_overlay(ctx, skill_name: str, project_dir: str = "") -> bool:
    """Inject the overlay message for a workflow skill. Returns True if injected.

    Deduplicates per session: each skill gets injected at most once.
    """
    if skill_name in _overlay_injected:
        return False

    if ctx is None or not hasattr(ctx, "inject_message"):
        return False

    message = build_overlay_message(skill_name)
    try:
        ctx.inject_message(message, role="user")
        _overlay_injected.add(skill_name)
        _write_overlay_receipt(skill_name, project_dir)
        logger.info("Framepack overlay injected for skill: %s", skill_name)
        return True
    except Exception as exc:
        logger.warning("Framepack overlay injection failed for %s: %s", skill_name, exc)
        return False


def _write_overlay_receipt(skill_name: str, project_dir: str = "") -> None:
    """Write a receipt file recording that the overlay was injected."""
    if not project_dir:
        return
    try:
        fp_dir = Path(project_dir) / ".framepack"
        fp_dir.mkdir(parents=True, exist_ok=True)
        receipt = fp_dir / "overlay-receipt.md"
        timestamp = datetime.now(timezone.utc).isoformat()
        receipt.write_text(
            f"# Framepack Overlay Receipt\n\n"
            f"- skill: {skill_name}\n"
            f"- injected_at: {timestamp}\n"
            f"- message: Framepack Director Overlay (creative authority established)\n",
            encoding="utf-8",
            newline="\n",
        )
    except Exception:
        pass
