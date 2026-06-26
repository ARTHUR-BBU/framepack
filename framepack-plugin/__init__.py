"""Framepack — HyperFrames video creation advisor for Hermes Agent.

Architecture: Plugin = body (hooks + intervention), Skill = brain (knowledge).
The Plugin watches the Agent Loop and activates domain knowledge on demand.
"""

import logging
import sys
from pathlib import Path

logger = logging.getLogger(__name__)


def _ensure_plugin_root_on_path() -> None:
    """Make absolute plugin imports work when Hermes imports us by file path.

    The plugin historically imports shared modules as ``core.*`` from hooks and
    scripts. That works in tests with ``PYTHONPATH=<plugin root>``, but Hermes
    loads deployed plugins by their ``__init__.py`` file path. In that mode the
    package directory is not guaranteed to be on ``sys.path``, so hook import can
    fail with ``No module named 'core'`` before skills finish registering.
    """
    plugin_root = str(Path(__file__).resolve().parent)
    if plugin_root not in sys.path:
        sys.path.insert(0, plugin_root)


def register(ctx):
    """Plugin entry point. Called once at Hermes startup."""
    _ensure_plugin_root_on_path()
    logger.info("Framepack v0.16.0 Plugin registering")

    # Register skills (knowledge layer)
    _register_skills(ctx)

    # Register hooks (intervention layer)
    # post_tool_call: STORYBOARD.md / COMPOSITION.md / index.html detection
    from .hooks.on_post_tool_call import register as register_post_hook
    register_post_hook(ctx)

    # pre_tool_call: intercept index.html writes BEFORE they land
    from .hooks.on_pre_tool_call import register as register_pre_hook
    register_pre_hook(ctx)


def _register_skills(ctx):
    """Register Framepack's domain knowledge as Hermes Skills.

    Skills are the "brain" of the plugin — they carry director guidelines,
    template fusion rules, HyperFrames build rules, and reference mining
    methods. The plugin loads them on demand through ctx.llm.

    plugin_name:name becomes the qualified skill name. If the plugin is
    named "framepack" and we register "director", it becomes
    "framepack:director".

    IMPORTANT: register_skill expects the path to SKILL.md FILE, not the
    skill directory. The downstream code calls .read_text() on it.
    """
    import os

    skills_dir = Path(__file__).parent / "skills"
    if not skills_dir.is_dir():
        logger.debug("No skills directory found at %s", skills_dir)
        return

    for name in os.listdir(skills_dir):
        skill_dir = skills_dir / name
        if not skill_dir.is_dir():
            continue

        skill_md = skill_dir / "SKILL.md"
        if not skill_md.is_file():
            logger.warning("SKILL.md missing in skill: %s", name)
            continue

        try:
            ctx.register_skill(name=name, path=skill_md)
            logger.info("Registered skill: framepack:%s", name)
        except Exception as e:
            logger.warning("Failed to register skill %s: %s", name, e)
