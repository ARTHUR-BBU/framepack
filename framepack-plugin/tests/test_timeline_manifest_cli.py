"""Timeline manifest CLI tests."""

import json
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "framepack_timeline_manifest.py"


def run_cli(*args, cwd=None):
    return subprocess.run([sys.executable, str(SCRIPT), *map(str, args)], cwd=cwd, capture_output=True, text=True)


def test_timeline_cli_validate_does_not_write_missing_manifest(tmp_path):
    result = run_cli(tmp_path, "--validate", "--format", "json")

    assert result.returncode == 0
    assert not (tmp_path / ".framepack" / "timeline-manifest.json").exists()
    data = json.loads(result.stdout)
    assert data["action"] == "missing"
    assert data["changed"] is False


def test_timeline_cli_sync_creates_manifest(tmp_path):
    result = run_cli(tmp_path, "--sync", "--format", "json")

    assert result.returncode == 0
    assert (tmp_path / ".framepack" / "timeline-manifest.json").exists()
    data = json.loads(result.stdout)
    assert data["action"] == "created"
    assert data["changed"] is True


def test_timeline_cli_sync_reads_expanded_prompt_windows(tmp_path):
    hyperframes = tmp_path / ".hyperframes"
    hyperframes.mkdir()
    (hyperframes / "expanded-prompt.md").write_text(
        """## HyperFrames Time Windows
| Scene | Start | Duration | Track |
|---|---:|---:|---:|
| scene_01 | 0 | 3 | 0 |
""",
        encoding="utf-8",
    )

    result = run_cli(tmp_path, "--sync", "--format", "json")

    assert result.returncode == 0
    data = json.loads(result.stdout)
    assert data["action"] == "synced"
    manifest = json.loads((tmp_path / ".framepack" / "timeline-manifest.json").read_text(encoding="utf-8"))
    assert manifest["scenes"][0]["id"] == "scene_01"
    assert manifest["project"]["duration"] == 3.0


def test_timeline_cli_markdown_output(tmp_path):
    result = run_cli(tmp_path, "--validate", "--format", "markdown")

    assert result.returncode == 0
    assert "# Framepack Timeline Manifest" in result.stdout
    assert "Action: `missing`" in result.stdout
