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


@pytest.mark.skipif(not DEPLOY_ROOT.exists(), reason="local Framepack deployment directory is not present")
def test_deployed_main_skill_version_matches_deployed_plugin():
    plugin_version = _plugin_version(DEPLOY_ROOT)
    assert _frontmatter_version(DEPLOY_ROOT / "skills" / "framepack" / "SKILL.md") == plugin_version


@pytest.mark.skipif(not (ACTIVE_SKILLS_ROOT / "framepack" / "SKILL.md").exists(), reason="local active independent framepack skill is not present")
def test_active_independent_framepack_skill_version_matches_source_plugin():
    plugin_version = _plugin_version(PLUGIN_ROOT)
    active_skill = ACTIVE_SKILLS_ROOT / "framepack" / "SKILL.md"
    assert _frontmatter_version(active_skill) == plugin_version
