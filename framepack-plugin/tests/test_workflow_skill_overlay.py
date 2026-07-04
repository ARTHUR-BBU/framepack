"""Tests for Framepack Director Overlay on HyperFrames workflow skills.

When an Agent loads a HyperFrames workflow skill (product-launch-video,
website-to-video, etc.), Framepack injects a co-direction message establishing
the creative authority split. This test verifies the overlay hook fires on the
right skills, injects the right message, and deduplicates per session.
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from hooks.on_post_tool_call import register as register_post
from core.workflow_overlay import reset_overlay_state


def _post_hook(ctx):
    register_post(ctx)
    return ctx.register_hook.call_args[0][1]


HYPERFRAMES_WORKFLOW_SKILLS = [
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
]

NON_WORKFLOW_SKILLS = [
    "hyperframes",
    "hyperframes-cli",
    "hyperframes-core",
    "gsap",
    "framepack",
    "framepack:framepack-director",
    "framepack-animation-library",
]


@pytest.mark.parametrize("skill_name", HYPERFRAMES_WORKFLOW_SKILLS)
def test_overlay_fires_on_workflow_skill(skill_name, tmp_path):
    """Overlay injection fires when Agent loads any HyperFrames workflow skill."""
    ctx = MagicMock()
    hook = _post_hook(ctx)
    hook(tool_name="skill_view", args={"name": skill_name})

    injected = "\n".join(call.args[0] for call in ctx.inject_message.call_args_list)
    assert "Framepack Director Overlay" in injected
    assert skill_name in injected


@pytest.mark.parametrize("skill_name", NON_WORKFLOW_SKILLS)
def test_overlay_does_not_fire_on_non_workflow_skill(skill_name, tmp_path):
    """Overlay does NOT fire for domain skills, Framepack skills, or utilities.

    Note: Framepack's own skills (framepack, framepack:framepack-director) do trigger
    guardrail hydration which calls inject_message — but that's hydration, not overlay.
    We only assert no OVERLAY-specific message is injected.
    """
    ctx = MagicMock()
    hook = _post_hook(ctx)
    hook(tool_name="skill_view", args={"name": skill_name})

    injected = "\n".join(call.args[0] for call in ctx.inject_message.call_args_list)
    assert "Framepack Director Overlay" not in injected


def test_overlay_includes_creative_authority_rules(tmp_path):
    """The overlay message must establish frame.md precedence and Execution Manifest constraint."""
    reset_overlay_state()
    ctx = MagicMock()
    hook = _post_hook(ctx)
    hook(tool_name="skill_view", args={"name": "product-launch-video"})

    injected = "\n".join(call.args[0] for call in ctx.inject_message.call_args_list)
    assert "frame.md" in injected
    assert "expanded-prompt.md" in injected
    assert "Execution Manifest" in injected or "build-frame.mjs" in injected


def test_overlay_deduplicates_per_session(tmp_path):
    """Loading the same skill twice in one session should only inject once."""
    reset_overlay_state()
    ctx = MagicMock()
    hook = _post_hook(ctx)
    hook(tool_name="skill_view", args={"name": "product-launch-video"})
    hook(tool_name="skill_view", args={"name": "product-launch-video"})

    overlay_calls = [
        call for call in ctx.inject_message.call_args_list
        if "Framepack Director Overlay" in str(call.args[0])
    ]
    assert len(overlay_calls) == 1


def test_overlay_fires_for_different_skills_in_same_session(tmp_path):
    """Different workflow skills each get their own overlay."""
    reset_overlay_state()
    ctx = MagicMock()
    hook = _post_hook(ctx)
    hook(tool_name="skill_view", args={"name": "product-launch-video"})
    hook(tool_name="skill_view", args={"name": "website-to-video"})

    overlay_calls = [
        call for call in ctx.inject_message.call_args_list
        if "Framepack Director Overlay" in str(call.args[0])
    ]
    assert len(overlay_calls) == 2
