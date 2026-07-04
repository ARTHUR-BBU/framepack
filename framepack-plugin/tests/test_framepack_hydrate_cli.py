"""Tests for framepack hydrate CLI script."""

import json
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "framepack_hydrate.py"


def test_hydrate_dry_run_on_empty_dir(tmp_path):
    """Dry-run on empty dir should not crash and should report no files."""
    import os
    env = os.environ.copy()
    plugin_root = str(Path(__file__).resolve().parents[1])
    env["PYTHONPATH"] = plugin_root + os.pathsep + env.get("PYTHONPATH", "")

    result = subprocess.run(
        [sys.executable, str(SCRIPT), str(tmp_path), "--dry-run", "--format", "json"],
        capture_output=True, text=True, timeout=30, env=env,
    )
    assert result.returncode == 0
    data = json.loads(result.stdout)
    assert data["kind"] == "framepack_hydrate_report"
    assert data["guardrails_version"]


def test_hydrate_updates_stale_managed_block(tmp_path):
    """Hydrate should update a stale managed block in AGENTS.md."""
    workbench = tmp_path / "wb"
    workbench.mkdir()
    agents = workbench / "AGENTS.md"
    agents.write_text(
        "# Workbench\n\n"
        "<!-- FRAMEPACK MANAGED BLOCK START version=0.0.1 hash=sha256:old source=plugin -->\n"
        "# Old Guardrails\n"
        "<!-- FRAMEPACK MANAGED BLOCK END -->\n",
        encoding="utf-8",
    )

    import os
    env = os.environ.copy()
    plugin_root = str(Path(__file__).resolve().parents[1])
    env["PYTHONPATH"] = plugin_root + os.pathsep + env.get("PYTHONPATH", "")

    result = subprocess.run(
        [sys.executable, str(SCRIPT), str(workbench), "--format", "json"],
        capture_output=True, text=True, timeout=30, env=env,
    )
    assert result.returncode == 0
    data = json.loads(result.stdout)

    # After hydration, the block should be updated
    updated_text = agents.read_text(encoding="utf-8")
    assert "Framepack is a" in updated_text or "Framepack is a" in updated_text
    assert "0.0.1" not in updated_text  # old version gone


def test_hydrate_noop_on_current_block(tmp_path):
    """Hydrate should be no-op when block is already current."""
    workbench = tmp_path / "wb"
    workbench.mkdir()
    agents = workbench / "AGENTS.md"

    import os
    env = os.environ.copy()
    plugin_root = str(Path(__file__).resolve().parents[1])
    env["PYTHONPATH"] = plugin_root + os.pathsep + env.get("PYTHONPATH", "")

    # First run: create current block
    result1 = subprocess.run(
        [sys.executable, str(SCRIPT), str(workbench), "--format", "json"],
        capture_output=True, text=True, timeout=30, env=env,
    )
    assert result1.returncode == 0

    # Second run: should be no-op
    result2 = subprocess.run(
        [sys.executable, str(SCRIPT), str(workbench), "--format", "json"],
        capture_output=True, text=True, timeout=30, env=env,
    )
    assert result2.returncode == 0
    data2 = json.loads(result2.stdout)
    no_ops = sum(1 for f in data2["files"] if f["action"] == "no-op")
    assert no_ops >= 1
