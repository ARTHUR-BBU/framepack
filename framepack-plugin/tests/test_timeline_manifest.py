"""Timeline manifest runtime tests."""

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.timeline_manifest import (  # noqa: E402
    ensure_timeline,
    load_timeline,
    parse_hyperframes_time_windows,
    sync_timeline_from_project,
    validate_timeline,
)


def test_ensure_timeline_creates_minimal_manifest(tmp_path):
    result = ensure_timeline(tmp_path, plugin_version="0.10.5-dev")

    timeline_path = tmp_path / ".framepack" / "timeline-manifest.json"
    assert result.changed is True
    assert result.action == "created"
    assert timeline_path.exists()

    data = json.loads(timeline_path.read_text(encoding="utf-8"))
    assert data["schema_version"] == "1.0.0"
    assert data["kind"] == "framepack_timeline_manifest"
    assert data["project"]["name"] == tmp_path.name
    assert data["project"]["duration"] is None
    assert data["scenes"] == []
    assert data["proofs"]["directory"] == ".framepack/proofs"
    assert data["plugin_version_created"] == "0.10.5-dev"


def test_sync_timeline_from_expanded_prompt_time_windows(tmp_path):
    hyperframes = tmp_path / ".hyperframes"
    hyperframes.mkdir()
    (hyperframes / "expanded-prompt.md").write_text(
        """# Expanded Prompt

## HyperFrames Time Windows

| Scene | Start | Duration | Track |
|---|---:|---:|---:|
| scene_01 | 0.0 | 4.0 | 0 |
| scene_02 | 4.0 | 6.5 | 0 |

## Execution Manifest
""",
        encoding="utf-8",
    )

    result = sync_timeline_from_project(tmp_path, plugin_version="0.10.5-dev")

    data = json.loads((tmp_path / ".framepack" / "timeline-manifest.json").read_text(encoding="utf-8"))
    assert result.changed is True
    assert result.action == "synced"
    assert data["project"]["duration"] == 10.5
    assert data["scenes"] == [
        {
            "id": "scene_01",
            "start": 0.0,
            "duration": 4.0,
            "track_index": 0,
            "status": "draft",
            "proofs": [],
            "continuity": {"outgoing_seed": "", "incoming_match": "", "boundary_proofs": []},
        },
        {
            "id": "scene_02",
            "start": 4.0,
            "duration": 6.5,
            "track_index": 0,
            "status": "draft",
            "proofs": [],
            "continuity": {"outgoing_seed": "", "incoming_match": "", "boundary_proofs": []},
        },
    ]
    assert data["proofs"]["required"] == [
        {
            "type": "boundary",
            "from": "scene_01",
            "to": "scene_02",
            "time": 4.0,
            "label": "scene_01_to_scene_02_boundary",
            "required": True,
        }
    ]


def test_sync_timeline_preserves_existing_boundary_proofs(tmp_path):
    framepack = tmp_path / ".framepack"
    framepack.mkdir()
    timeline_path = framepack / "timeline-manifest.json"
    timeline_path.write_text(
        json.dumps(
            {
                "schema_version": "1.0.0",
                "kind": "framepack_timeline_manifest",
                "project": {"name": tmp_path.name},
                "scenes": [
                    {
                        "id": "scene_01",
                        "start": 0.0,
                        "duration": 4.0,
                        "track_index": 0,
                        "status": "draft",
                        "proofs": [],
                        "continuity": {"boundary_proofs": ["handoff visible at 4.0s"]},
                    }
                ],
                "proofs": {
                    "directory": ".framepack/proofs",
                    "contact_sheet": ".framepack/proofs/contact-sheet.jpg",
                    "required": [],
                },
            }
        ),
        encoding="utf-8",
    )
    hyperframes = tmp_path / ".hyperframes"
    hyperframes.mkdir()
    (hyperframes / "expanded-prompt.md").write_text(
        """## HyperFrames Time Windows
| Scene | Start | Duration | Track |
|---|---:|---:|---:|
| scene_01 | 0 | 4 | 0 |
| scene_02 | 4 | 4 | 0 |
""",
        encoding="utf-8",
    )

    sync_timeline_from_project(tmp_path, plugin_version="0.10.5-dev")
    data = json.loads(timeline_path.read_text(encoding="utf-8"))

    assert data["scenes"][0]["continuity"]["boundary_proofs"] == ["handoff visible at 4.0s"]
    assert len(data["proofs"]["required"]) == 1


def test_parse_hyperframes_time_windows_supports_compact_lines():
    scenes = parse_hyperframes_time_windows(
        """## HyperFrames Time Windows
scene_01: start=0.0, duration=4.0, track=0
scene_02: start=4.0, duration=6.5, track=1
"""
    )

    assert [scene["id"] for scene in scenes] == ["scene_01", "scene_02"]
    assert scenes[0]["start"] == 0.0
    assert scenes[1]["duration"] == 6.5
    assert scenes[1]["track_index"] == 1


def test_sync_timeline_preserves_locked_scene_fields(tmp_path):
    framepack = tmp_path / ".framepack"
    framepack.mkdir()
    timeline_path = framepack / "timeline-manifest.json"
    timeline_path.write_text(
        json.dumps(
            {
                "schema_version": "1.0.0",
                "kind": "framepack_timeline_manifest",
                "project": {"name": tmp_path.name, "duration": 4.0},
                "scenes": [
                    {
                        "id": "scene_01",
                        "start": 0.0,
                        "duration": 4.0,
                        "track_index": 0,
                        "status": "locked",
                        "proofs": [{"time": 3.95, "label": "scene_01_final", "required": True}],
                        "locks": {"status": "locked", "must_not_change": ["timing"]},
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    hyperframes = tmp_path / ".hyperframes"
    hyperframes.mkdir()
    (hyperframes / "expanded-prompt.md").write_text(
        """## HyperFrames Time Windows
| Scene | Start | Duration | Track |
|---|---:|---:|---:|
| scene_01 | 0.0 | 5.0 | 0 |
""",
        encoding="utf-8",
    )

    result = sync_timeline_from_project(tmp_path, plugin_version="0.10.5-dev")
    data = json.loads(timeline_path.read_text(encoding="utf-8"))

    assert result.action == "exists"
    assert any(w.code == "locked_scene_timing_changed" for w in result.warnings)
    assert data["scenes"][0]["status"] == "locked"
    assert data["scenes"][0]["duration"] == 4.0
    assert data["scenes"][0]["proofs"] == [{"time": 3.95, "label": "scene_01_final", "required": True}]
    assert data["scenes"][0]["locks"] == {"status": "locked", "must_not_change": ["timing"]}


def test_load_timeline_invalid_json_raises_value_error(tmp_path):
    path = tmp_path / ".framepack" / "timeline-manifest.json"
    path.parent.mkdir()
    path.write_text("{not json", encoding="utf-8")

    with pytest.raises(ValueError, match="Invalid timeline manifest JSON"):
        load_timeline(path)


def test_validate_timeline_detects_scene_overlap_on_same_track(tmp_path):
    data = {
        "schema_version": "1.0.0",
        "kind": "framepack_timeline_manifest",
        "project": {"name": tmp_path.name},
        "scenes": [
            {"id": "scene_01", "start": 0.0, "duration": 5.0, "track_index": 0, "status": "draft"},
            {"id": "scene_02", "start": 4.5, "duration": 3.0, "track_index": 0, "status": "draft"},
            {"id": "scene_03", "start": 4.5, "duration": 3.0, "track_index": 1, "status": "draft"},
        ],
    }

    warnings = validate_timeline(data, tmp_path)

    assert [warning.code for warning in warnings] == ["timeline_scene_overlap"]
    assert warnings[0].severity == "P1"
    assert warnings[0].scene == "scene_02"
