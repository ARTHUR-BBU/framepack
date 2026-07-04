"""Tests for framepack update CLI script."""

import json
import subprocess
import sys
from pathlib import Path
from unittest.mock import Mock

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "framepack_update.py"
PLUGIN_ROOT = Path(__file__).resolve().parents[1]


def test_update_report_only_does_not_write():
    """--report-only should not modify any files."""
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--report-only", "--skip-smoke", "--format", "json"],
        capture_output=True, text=True, timeout=30,
    )
    assert result.returncode == 0
    data = json.loads(result.stdout)
    assert data["kind"] == "framepack_update_report"
    assert "source_version" in data
    assert "steps" in data
    assert len(data["steps"]) >= 4
    # report-only should skip sync writes
    sync_step = [s for s in data["steps"] if s["name"] == "sync"][0]
    assert sync_step["status"] == "skipped"


def test_update_reports_git_state():
    """Update should report git ahead/dirty without modifying."""
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--report-only", "--skip-smoke", "--format", "json"],
        capture_output=True, text=True, timeout=30,
    )
    assert result.returncode == 0
    data = json.loads(result.stdout)
    # git_ahead and git_dirty should be present (not None) when in a git repo
    assert "git_ahead" in data
    assert "git_dirty" in data


def test_update_never_runs_git_pull():
    """Verify the update script does not execute git pull/push/fetch commands."""
    import re
    script_text = SCRIPT.read_text(encoding="utf-8")
    # Check for actual subprocess git invocations (not docstring mentions)
    git_commands = re.findall(r'subprocess\.run\(\s*\[?\s*["\']git["\']', script_text)
    for match in re.finditer(r'subprocess\.run\(\s*\[([^]]+)\]', script_text):
        cmd_parts = match.group(1)
        assert '"pull"' not in cmd_parts, f"git pull found in subprocess call: {cmd_parts}"
        assert '"push"' not in cmd_parts, f"git push found in subprocess call: {cmd_parts}"
        assert '"fetch"' not in cmd_parts, f"git fetch found in subprocess call: {cmd_parts}"


def test_update_source_dir_prefers_dev_repo_when_available():
    """When launched from deployed plugin, update must still sync from source repo."""
    sys.path.insert(0, str(PLUGIN_ROOT / "scripts"))
    import framepack_update

    dev_repo = Path("F:/hyperframes/framepack-plugin")
    expected = dev_repo if dev_repo.exists() else PLUGIN_ROOT
    assert framepack_update._SOURCE_DIR == expected


def test_smoke_failure_detail_includes_failure_summary(monkeypatch):
    """Smoke failures should report useful pytest output, not a blank detail."""
    sys.path.insert(0, str(PLUGIN_ROOT / "scripts"))
    import framepack_update

    def fake_run(cmd, **kwargs):
        if "pytest" in cmd:
            return Mock(
                returncode=1,
                stdout="\r\nFAILED tests/test_example.py::test_bad\r\n1 failed, 2 passed\r\n",
                stderr="",
            )
        if cmd[:2] == ["git", "rev-list"]:
            return Mock(returncode=0, stdout="0\n")
        if cmd[:2] == ["git", "status"]:
            return Mock(returncode=0, stdout="")
        return Mock(returncode=0, stdout="")

    monkeypatch.setattr(framepack_update.subprocess, "run", fake_run)
    monkeypatch.setattr(framepack_update, "_sync_files", lambda *args, **kwargs: ([], []))
    monkeypatch.setattr(framepack_update, "_select_test_python", lambda: "python-with-pytest")

    report = framepack_update.run_update(skip_smoke=False, report_only=False)
    smoke = [s for s in report.steps if s.name == "smoke"][0]

    assert smoke.status == "error"
    assert "FAILED tests/test_example.py::test_bad" in smoke.detail


def test_select_test_python_skips_python_without_pytest(monkeypatch):
    """Smoke should not blindly use Hermes venv python when it lacks pytest."""
    sys.path.insert(0, str(PLUGIN_ROOT / "scripts"))
    import framepack_update

    monkeypatch.setenv("FRAMEPACK_TEST_PYTHON", "bad-python")
    monkeypatch.setattr(framepack_update.shutil, "which", lambda name: "good-python" if name == "python" else None)

    def fake_run(cmd, **kwargs):
        exe = cmd[0]
        return Mock(returncode=0 if exe == "good-python" else 1, stdout="", stderr="No module named pytest")

    monkeypatch.setattr(framepack_update.subprocess, "run", fake_run)
    monkeypatch.setattr(framepack_update.sys, "executable", "hermes-venv-python")

    assert framepack_update._select_test_python() == "good-python"
