"""Deployment manifest / skill version consistency tests."""

import re
from pathlib import Path

import pytest

PLUGIN_ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = PLUGIN_ROOT.parent
DEPLOY_ROOT = Path("F:/Hermes_windows/plugins/framepack")
ACTIVE_SKILLS_ROOT = Path("F:/Hermes_windows/skills/software-development")


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _frontmatter_version(path: Path) -> str:
    text = _read(path)
    match = re.search(r"^version:\s*[\"']?([^\"'\s]+)", text, re.M)
    assert match, f"missing frontmatter version in {path}"
    return match.group(1)


def _plugin_version(path: Path) -> str:
    return _frontmatter_version(path / "plugin.yaml")


def test_source_plugin_includes_main_framepack_skill():
    """The main framepack skill is part of the deployable plugin payload."""
    assert (PLUGIN_ROOT / "skills" / "framepack" / "SKILL.md").is_file()


def test_main_framepack_skill_version_matches_plugin_version():
    plugin_version = _plugin_version(PLUGIN_ROOT)
    assert _frontmatter_version(PLUGIN_ROOT / "skills" / "framepack" / "SKILL.md") == plugin_version


def test_0120_release_version_is_synchronized_across_release_surfaces():
    plugin_version = _plugin_version(PLUGIN_ROOT)
    assert plugin_version == "0.14.0"

    release_files = {
        REPO_ROOT / "README.md": ["version **0.14.0**", "Framepack v0.14.0"],
        REPO_ROOT / "docs" / "README.zh-CN.md": ["版本为 **0.14.0**"],
        REPO_ROOT / "AGENTS.md": ["version: 0.14.0", "v0.14.0 hooks", "Framepack v0.14.0 skills"],
        PLUGIN_ROOT / "plugin.yaml": ["version: \"0.14.0\"", "v0.14.0 adds: Five-Element Weight Control System"],
        PLUGIN_ROOT / "skills" / "framepack" / "SKILL.md": ["# Framepack v0.14.0 — HyperFrames Prompt Factory", "Environment & Upgrade Manager"],
        PLUGIN_ROOT / "__init__.py": ["Framepack v0.14.0 Plugin registering"],
        PLUGIN_ROOT / "hooks" / "on_pre_tool_call.py": ["v0.14.0 philosophy", "Framepack v0.14.0 pre_tool_call hook registered"],
        PLUGIN_ROOT / "hooks" / "on_post_tool_call.py": ["Framepack v0.14.0", "Framepack v0.14.0 post_tool_call hook registered"],
        PLUGIN_ROOT / "compat" / "hyperframes-support.json": ['"framepack_version": "0.14.0"'],
        PLUGIN_ROOT / "core" / "arsenal_registry.py": ['DEFAULT_PLUGIN_VERSION = "0.14.0"'],
        PLUGIN_ROOT / "core" / "timeline_manifest.py": ['DEFAULT_PLUGIN_VERSION = "0.14.0"'],
        PLUGIN_ROOT / "scripts" / "apply_skill_overlays.py": ['FRAMEPACK_VERSION = "0.14.0"'],
        PLUGIN_ROOT / "templates" / "timeline-manifest.example.json": [
            '"plugin_version_created": "0.14.0"',
            '"plugin_version_updated": "0.14.0"',
        ],
    }
    for path, needles in release_files.items():
        if not path.exists():
            continue  # skip repo-root-level files not present in deployment-only environments
        text = _read(path)
        for needle in needles:
            assert needle in text, f"{needle!r} missing from {path}"

    for skill_name in [
        "framepack",
        "framepack-arsenal",
        "framepack-director",
        "framepack-gsap",
        "framepack-reference-miner",
        "framepack-animation-library",
        "framepack-production-quality",
    ]:
        assert _frontmatter_version(PLUGIN_ROOT / "skills" / skill_name / "SKILL.md") == plugin_version


@pytest.mark.skipif(not DEPLOY_ROOT.exists(), reason="local Framepack deployment directory is not present")
def test_deployed_main_skill_version_matches_deployed_plugin():
    plugin_version = _plugin_version(DEPLOY_ROOT)
    assert _frontmatter_version(DEPLOY_ROOT / "skills" / "framepack" / "SKILL.md") == plugin_version


@pytest.mark.skipif(not (ACTIVE_SKILLS_ROOT / "framepack" / "SKILL.md").exists(), reason="local active independent framepack skill is not present")
def test_active_independent_framepack_skill_version_matches_source_plugin():
    plugin_version = _plugin_version(PLUGIN_ROOT)
    active_skill = ACTIVE_SKILLS_ROOT / "framepack" / "SKILL.md"
    assert _frontmatter_version(active_skill) == plugin_version
