"""Hermes adapter — patch tracking and drift detection tests.

Tests the marker-based patch tracking system:
  1. load_patch_registry — reads .framepack/hermes_patches.json
  2. check_patches — verifies marker presence in target files
  3. patch_audit_report — human-readable report
  4. Version-gated trigger — only re-checks when Hermes version changes

Design: report-first, never auto-apply. Agent decides what to do.
"""

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.hermes_adapter import (
    PatchStatus,
    load_patch_registry,
    check_patches,
    patch_audit_report,
    should_check_patches,
)


# ── Test fixtures ──────────────────────────────────────────────────────


@pytest.fixture
def fake_hermes_home(tmp_path):
    """Create a fake HERMES_HOME with tools/skills_tool.py."""
    tools_dir = tmp_path / "tools"
    tools_dir.mkdir()
    skills_tool = tools_dir / "skills_tool.py"
    skills_tool.write_text(
        "# Hermes skills tool\n"
        "# FRAMEPACK-PATCH: skills_tool_file_path\n"
        "def _serve_plugin_skill():\n"
        "    pass\n"
    )
    return tmp_path


@pytest.fixture
def fake_project_dir(tmp_path):
    """Create a fake project .framepack/ with patches registry."""
    framepack_dir = tmp_path / "project" / ".framepack"
    framepack_dir.mkdir(parents=True)
    patches_file = framepack_dir / "hermes_patches.json"
    patches_file.write_text(json.dumps({
        "version": 1,
        "last_known_hermes_version": None,
        "patches": [
            {
                "id": "skills_tool_file_path",
                "target": "tools/skills_tool.py",
                "marker": "# FRAMEPACK-PATCH: skills_tool_file_path",
                "description": "Plugin skill_view file_path support",
                "pr": "https://github.com/NousResearch/hermes-agent/pull/48141",
                "applied_date": "2026-06-18",
            }
        ]
    }))
    return tmp_path / "project"


# ── load_patch_registry ────────────────────────────────────────────────


def test_load_patch_registry_reads_json(fake_project_dir):
    reg = load_patch_registry(fake_project_dir)
    assert reg["version"] == 1
    assert len(reg["patches"]) == 1
    assert reg["patches"][0]["id"] == "skills_tool_file_path"


def test_load_patch_registry_missing_file_returns_empty(tmp_path):
    """No .framepack/hermes_patches.json → empty registry, no crash."""
    reg = load_patch_registry(tmp_path)
    assert reg["patches"] == []
    assert reg["version"] == 0
    assert reg["upstream_features"] == []


def test_load_patch_registry_malformed_json_returns_empty(tmp_path):
    """Malformed JSON → empty registry, no crash (graceful degradation)."""
    framepack_dir = tmp_path / ".framepack"
    framepack_dir.mkdir()
    (framepack_dir / "hermes_patches.json").write_text("{ broken json")
    reg = load_patch_registry(tmp_path)
    assert reg["patches"] == []


# ── check_patches ──────────────────────────────────────────────────────


def test_check_patches_all_ok(fake_hermes_home, fake_project_dir):
    statuses = check_patches(fake_hermes_home, load_patch_registry(fake_project_dir))
    assert len(statuses) == 1
    assert statuses[0].status == "ok"
    assert statuses[0].patch_id == "skills_tool_file_path"


def test_check_patches_marker_missing(fake_hermes_home, fake_project_dir):
    """Target file exists but marker is gone → marker_missing (overwritten)."""
    # Remove the marker line
    target = fake_hermes_home / "tools" / "skills_tool.py"
    target.write_text("# Hermes skills tool\ndef foo(): pass\n")

    statuses = check_patches(fake_hermes_home, load_patch_registry(fake_project_dir))
    assert statuses[0].status == "marker_missing"


def test_check_patches_file_missing(fake_project_dir, tmp_path):
    """Target file doesn't exist at all → file_missing."""
    empty_hermes = tmp_path / "empty_hermes"
    empty_hermes.mkdir()

    statuses = check_patches(empty_hermes, load_patch_registry(fake_project_dir))
    assert statuses[0].status == "file_missing"


def test_check_patches_multiple_patches(fake_hermes_home, tmp_path):
    """Multiple patches, some ok some missing → each gets its own status."""
    framepack_dir = tmp_path / "proj" / ".framepack"
    framepack_dir.mkdir(parents=True)
    (framepack_dir / "hermes_patches.json").write_text(json.dumps({
        "version": 1,
        "patches": [
            {
                "id": "patch_one",
                "target": "tools/skills_tool.py",
                "marker": "# FRAMEPACK-PATCH: skills_tool_file_path",
                "description": "patch one",
            },
            {
                "id": "patch_two",
                "target": "tools/other.py",
                "marker": "# FRAMEPACK-PATCH: other",
                "description": "patch two",
            },
        ]
    }))

    statuses = check_patches(fake_hermes_home, load_patch_registry(tmp_path / "proj"))
    assert len(statuses) == 2
    ids = {s.patch_id: s.status for s in statuses}
    assert ids["patch_one"] == "ok"
    assert ids["patch_two"] == "file_missing"


# ── patch_audit_report ─────────────────────────────────────────────────


def test_audit_report_all_ok(fake_hermes_home, fake_project_dir):
    report = patch_audit_report(fake_hermes_home, fake_project_dir)
    assert "All Hermes patches intact" in report


def test_audit_report_with_issues(fake_hermes_home, fake_project_dir):
    """When patches are missing, report should list them clearly."""
    target = fake_hermes_home / "tools" / "skills_tool.py"
    target.write_text("# overwritten by upgrade\ndef foo(): pass\n")

    report = patch_audit_report(fake_hermes_home, fake_project_dir)
    assert "patch drift" in report.lower() or "missing" in report.lower()
    assert "skills_tool_file_path" in report


def test_audit_report_no_patches_registered(fake_hermes_home, tmp_path):
    """No patches registered → clean report, no error."""
    framepack_dir = tmp_path / ".framepack"
    framepack_dir.mkdir()
    (framepack_dir / "hermes_patches.json").write_text(json.dumps({
        "version": 1, "patches": []
    }))
    report = patch_audit_report(fake_hermes_home, tmp_path)
    assert "No Hermes patches registered" in report


# ── Version-gated trigger ──────────────────────────────────────────────


def test_should_check_first_run(fake_project_dir):
    """First run (last_known_version is None) → should check."""
    assert should_check_patches(fake_project_dir, current_version="0.17.0") is True


def test_should_check_version_unchanged(fake_project_dir):
    """Same version as last check → skip."""
    # Record a version
    reg_path = fake_project_dir / ".framepack" / "hermes_patches.json"
    data = json.loads(reg_path.read_text())
    data["last_known_hermes_version"] = "0.17.0"
    reg_path.write_text(json.dumps(data))

    assert should_check_patches(fake_project_dir, current_version="0.17.0") is False


def test_should_check_version_changed(fake_project_dir):
    """Version changed → should check again."""
    reg_path = fake_project_dir / ".framepack" / "hermes_patches.json"
    data = json.loads(reg_path.read_text())
    data["last_known_hermes_version"] = "0.16.0"
    reg_path.write_text(json.dumps(data))

    assert should_check_patches(fake_project_dir, current_version="0.17.0") is True


def test_should_check_updates_version_after_check(fake_project_dir):
    """should_check_patches should update last_known_version when returning True."""
    should_check_patches(fake_project_dir, current_version="0.17.0")

    reg_path = fake_project_dir / ".framepack" / "hermes_patches.json"
    data = json.loads(reg_path.read_text())
    assert data["last_known_hermes_version"] == "0.17.0"


# ── Integration: detect_hermes_version + find_hermes_install ───────────


def test_detect_hermes_version_returns_string():
    """In a real Hermes environment, version detection should work."""
    from core.hermes_adapter import detect_hermes_version

    version = detect_hermes_version()
    # In test env Hermes may or may not be importable; just verify it doesn't crash
    assert version is None or isinstance(version, str)


def test_find_hermes_install_returns_path_or_none():
    """find_hermes_install should return a Path or None without crashing."""
    from core.hermes_adapter import find_hermes_install

    result = find_hermes_install()
    assert result is None or isinstance(result, Path)


def test_run_patch_audit_if_needed_returns_str_or_none():
    """Main integration entry point — returns report string or None to skip."""
    from core.hermes_adapter import run_patch_audit_if_needed

    # With a project dir that has no .framepack/hermes_patches.json,
    # should return None gracefully (no patches file = skip)
    result = run_patch_audit_if_needed(Path("/tmp/nonexistent_project"))
    assert result is None
