"""Quality audit CLI tests."""

import json
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "framepack_quality_audit.py"


def _write_project(tmp_path: Path) -> None:
    (tmp_path / ".hyperframes").mkdir()
    (tmp_path / ".framepack").mkdir()
    (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text(
        """
## HyperFrames Time Windows
TOTAL DURATION: 55 seconds
## Execution Manifest
scene_2:
  weapon: text-split-enter
  params:
    travelDistance: "60px"
""",
        encoding="utf-8",
    )
    (tmp_path / ".framepack" / "arsenal.json").write_text(
        json.dumps({"schema_version": "1.0.0", "project": "stale", "hyperframes_config": {"duration": 30}, "weapons": {}}),
        encoding="utf-8",
    )
    (tmp_path / "index.html").write_text(
        "<div data-hf-id='x'></div><script>textSplitEnter(tl,el,{travelDistance:'120px'});</script>",
        encoding="utf-8",
    )


def test_quality_audit_cli_writes_json_report(tmp_path):
    _write_project(tmp_path)
    output = tmp_path / "quality-report.json"

    result = subprocess.run(
        [sys.executable, str(SCRIPT), str(tmp_path), "--format", "json", "--output", str(output)],
        text=True,
        capture_output=True,
        check=True,
    )

    stdout_data = json.loads(result.stdout)
    file_data = json.loads(output.read_text(encoding="utf-8"))
    assert stdout_data == file_data
    assert file_data["kind"] == "framepack_quality_audit"
    assert file_data["summary"]["P0"] >= 1
    assert any(issue["code"] == "weapon_parameter_drift" for issue in file_data["issues"])


def test_quality_audit_cli_writes_markdown_report(tmp_path):
    _write_project(tmp_path)
    output = tmp_path / "quality-report.md"

    result = subprocess.run(
        [sys.executable, str(SCRIPT), str(tmp_path), "--format", "markdown", "--output", str(output)],
        text=True,
        capture_output=True,
        check=True,
    )

    text = output.read_text(encoding="utf-8")
    assert result.stdout == text
    assert "# Framepack Quality Audit" in text
    assert "weapon_parameter_drift" in text
    assert "P0" in text


def test_quality_audit_cli_sync_arsenal_is_explicit_opt_in(tmp_path):
    (tmp_path / ".hyperframes").mkdir()
    (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text(
        """
## Execution Manifest
scene_1:
  weapon: text-split-enter
  params:
    travelDistance: "60px"
""",
        encoding="utf-8",
    )
    (tmp_path / "index.html").write_text("<script>textSplitEnter(tl, el, {travelDistance:'60px'});</script>", encoding="utf-8")

    default_result = subprocess.run(
        [sys.executable, str(SCRIPT), str(tmp_path), "--format", "json"],
        text=True,
        capture_output=True,
        check=True,
    )

    assert not (tmp_path / ".framepack" / "arsenal.json").exists()
    default_data = json.loads(default_result.stdout)
    assert any(issue["code"] == "arsenal_missing" for issue in default_data["issues"])

    sync_result = subprocess.run(
        [sys.executable, str(SCRIPT), str(tmp_path), "--format", "json", "--sync-arsenal"],
        text=True,
        capture_output=True,
        check=True,
    )

    assert (tmp_path / ".framepack" / "arsenal.json").exists()
    synced_data = json.loads(sync_result.stdout)
    assert not any(issue["code"] == "arsenal_missing" for issue in synced_data["issues"])
    arsenal = json.loads((tmp_path / ".framepack" / "arsenal.json").read_text(encoding="utf-8"))
    assert arsenal["weapons"]["text-split-enter"]["function"] == "textSplitEnter"


def test_quality_audit_cli_sync_timeline_is_explicit_opt_in(tmp_path):
    (tmp_path / ".hyperframes").mkdir()
    (tmp_path / ".framepack").mkdir()
    (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text(
        """## HyperFrames Time Windows
| Scene | Start | Duration | Track |
|---|---:|---:|---:|
| scene_01 | 0 | 4 | 0 |
""",
        encoding="utf-8",
    )
    (tmp_path / ".framepack" / "arsenal.json").write_text(json.dumps({"schema_version": "1.0.0", "weapons": {}}), encoding="utf-8")
    (tmp_path / "index.html").write_text("<div id='scene_01' class='clip' data-start='0' data-duration='4' data-track-index='0'></div>", encoding="utf-8")

    default_result = subprocess.run(
        [sys.executable, str(SCRIPT), str(tmp_path), "--format", "json"],
        text=True,
        capture_output=True,
        check=True,
    )

    assert not (tmp_path / ".framepack" / "timeline-manifest.json").exists()
    default_data = json.loads(default_result.stdout)
    assert any(issue["code"] == "timeline_manifest_missing" for issue in default_data["issues"])

    sync_result = subprocess.run(
        [sys.executable, str(SCRIPT), str(tmp_path), "--format", "json", "--sync-timeline"],
        text=True,
        capture_output=True,
        check=True,
    )

    assert (tmp_path / ".framepack" / "timeline-manifest.json").exists()
    synced_data = json.loads(sync_result.stdout)
    assert not any(issue["code"] == "timeline_manifest_missing" for issue in synced_data["issues"])
    timeline = json.loads((tmp_path / ".framepack" / "timeline-manifest.json").read_text(encoding="utf-8"))
    assert timeline["scenes"][0]["id"] == "scene_01"


def test_quality_audit_cli_fails_on_max_severity_threshold(tmp_path):
    _write_project(tmp_path)

    result = subprocess.run(
        [sys.executable, str(SCRIPT), str(tmp_path), "--format", "json", "--fail-on", "P1"],
        text=True,
        capture_output=True,
    )

    assert result.returncode == 1
    data = json.loads(result.stdout)
    assert data["summary"]["P1"] >= 1


def test_quality_audit_cli_creates_output_parent_directories(tmp_path):
    _write_project(tmp_path)
    output = tmp_path / "nested" / "reports" / "quality-report.json"

    subprocess.run(
        [sys.executable, str(SCRIPT), str(tmp_path), "--format", "json", "--output", str(output)],
        text=True,
        capture_output=True,
        check=True,
    )

    assert output.is_file()
    assert json.loads(output.read_text(encoding="utf-8"))["kind"] == "framepack_quality_audit"
