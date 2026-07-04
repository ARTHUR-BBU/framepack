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
    logger.info("Framepack v0.17.0 Plugin registering")

    # Register skills (knowledge layer)
    _register_skills(ctx)

    # Register hooks (intervention layer)
    # post_tool_call: STORYBOARD.md / COMPOSITION.md / index.html detection
    from .hooks.on_post_tool_call import register as register_post_hook
    register_post_hook(ctx)

    # pre_tool_call: intercept index.html writes BEFORE they land
    from .hooks.on_pre_tool_call import register as register_pre_hook
    register_pre_hook(ctx)

    # Register CLI commands (infrastructure layer)
    _register_cli_commands(ctx)


def _register_cli_commands(ctx):
    """Register Framepack CLI subcommands for Hermes."""
    import argparse
    import json as _json
    import sys as _sys
    from pathlib import Path as _Path

    plugin_root = _Path(__file__).resolve().parent

    def _hydrate_handler(args) -> None:
        import subprocess
        script = plugin_root / "scripts" / "framepack_hydrate.py"
        cmd = [_sys.executable, str(script)]
        if getattr(args, "dry_run", False):
            cmd.append("--dry-run")
        fmt = getattr(args, "format", "text")
        if fmt:
            cmd += ["--format", fmt]
        workbench = getattr(args, "workbench", "")
        if workbench:
            cmd.append(workbench)
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60,
                                encoding="utf-8", errors="replace")
        output = result.stdout or result.stderr
        if output:
            print(output)

    def _update_handler(args) -> None:
        import subprocess
        script = plugin_root / "scripts" / "framepack_update.py"
        cmd = [_sys.executable, str(script)]
        if getattr(args, "skip_smoke", False):
            cmd.append("--skip-smoke")
        workbench = getattr(args, "workbench", None)
        if workbench:
            cmd += ["--workbench", workbench]
        if getattr(args, "report_only", False):
            cmd.append("--report-only")
        fmt = getattr(args, "format", "text")
        if fmt:
            cmd += ["--format", fmt]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300,
                                encoding="utf-8", errors="replace")
        output = result.stdout or result.stderr
        if output:
            print(output)

    def _match_weapons_handler(args) -> None:
        import subprocess
        script = plugin_root / "scripts" / "framepack_match_weapons.py"
        cmd = [_sys.executable, str(script)]
        project = getattr(args, "project", "")
        if project:
            cmd.append(project)
        prompt = getattr(args, "prompt", None)
        if prompt:
            cmd += ["--prompt", prompt]
        if getattr(args, "dry_run", False):
            cmd.append("--dry-run")
        fmt = getattr(args, "format", "text")
        if fmt:
            cmd += ["--format", fmt]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120,
                                encoding="utf-8", errors="replace")
        output = result.stdout or result.stderr
        if output:
            print(output)
        if result.returncode:
            raise SystemExit(result.returncode)

    try:
        def _hydrate_setup(sub):
            sub.add_argument("workbench", help="Path to workbench root")
            sub.add_argument("--dry-run", action="store_true")
            sub.add_argument("--format", choices=["text", "json"], default="text")

        ctx.register_cli_command(
            name="framepack-hydrate",
            help="Push latest Framepack guardrails to workbench AGENTS.md files",
            setup_fn=_hydrate_setup,
            handler_fn=_hydrate_handler,
            description="Sync guardrails.md to all AGENTS.md files in a workbench",
        )
        logger.info("Registered CLI command: framepack-hydrate")
    except Exception as e:
        logger.warning("Failed to register framepack-hydrate CLI: %s", e)

    try:
        def _update_setup(sub):
            sub.add_argument("--skip-smoke", action="store_true")
            sub.add_argument("--workbench", default=None)
            sub.add_argument("--report-only", action="store_true")
            sub.add_argument("--format", choices=["text", "json"], default="text")

        ctx.register_cli_command(
            name="framepack-update",
            help="End-to-end Framepack upgrade (sync deployed + hydrate + smoke)",
            setup_fn=_update_setup,
            handler_fn=_update_handler,
            description="Upgrade deployed plugin from source, hydrate workbenches, run smoke",
        )
        logger.info("Registered CLI command: framepack-update")
    except Exception as e:
        logger.warning("Failed to register framepack-update CLI: %s", e)

    try:
        def _match_weapons_setup(sub):
            sub.add_argument("project", help="Project directory")
            sub.add_argument("--prompt", default=None)
            sub.add_argument("--dry-run", action="store_true")
            sub.add_argument("--format", choices=["text", "json", "markdown"], default="text")

        ctx.register_cli_command(
            name="framepack-match-weapons",
            help="Run mandatory Weapon Matching Pass before HTML authoring",
            setup_fn=_match_weapons_setup,
            handler_fn=_match_weapons_handler,
            description="Match expanded-prompt scenes to HyperFrames/Framepack weapons and write .framepack/weapon-load-plan.*",
        )
        logger.info("Registered CLI command: framepack-match-weapons")
    except Exception as e:
        logger.warning("Failed to register framepack-match-weapons CLI: %s", e)


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
