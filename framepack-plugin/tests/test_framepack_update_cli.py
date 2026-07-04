"""Tests for framepack update CLI script."""

import json
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "framepack_update.py"


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
