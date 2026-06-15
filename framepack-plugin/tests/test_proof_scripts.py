"""Proof/probe script unit tests."""

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

import framepack_probe_media  # noqa: E402
import framepack_extract_proof_frames  # noqa: E402
import framepack_make_contact_sheet  # noqa: E402


def test_probe_media_reports_missing_ffprobe(monkeypatch, tmp_path):
    monkeypatch.setattr(framepack_probe_media.shutil, "which", lambda name: None)

    with pytest.raises(SystemExit, match="ffprobe not found on PATH"):
        framepack_probe_media.run_ffprobe(tmp_path / "missing.mp4")


def test_load_manifest_proof_points_reads_required_scene_and_global_proofs(tmp_path):
    manifest = {
        "proofs": {"required": [{"time": 10.0, "label": "global_cta", "required": True}]},
        "scenes": [
            {
                "id": "scene_01",
                "proofs": [
                    {"time": 0.0, "label": "scene_01_first", "required": True},
                    {"time": 2.0, "label": "scene_01_optional", "required": False},
                ],
                "continuity": {"boundary_proofs": [{"time": 3.95, "label": "scene_01_boundary", "required": True}]},
            }
        ],
    }
    path = tmp_path / ".framepack" / "timeline-manifest.json"
    path.parent.mkdir()
    path.write_text(json.dumps(manifest), encoding="utf-8")

    points = framepack_extract_proof_frames.load_manifest_proof_points(path)

    assert [(p.label, p.time) for p in points] == [
        ("scene_01_first", 0.0),
        ("scene_01_boundary", 3.95),
        ("global_cta", 10.0),
    ]


def test_load_manifest_proof_points_skips_invalid_times(tmp_path):
    manifest = {
        "proofs": {"required": [{"time": "bad", "label": "global_cta", "required": True}]},
        "scenes": [
            {
                "id": "scene_01",
                "proofs": [{"time": "also-bad", "label": "scene_01_first", "required": True}],
                "continuity": {"boundary_proofs": [{"time": 3.95, "label": "scene_01_boundary", "required": True}]},
            }
        ],
    }
    path = tmp_path / ".framepack" / "timeline-manifest.json"
    path.parent.mkdir()
    path.write_text(json.dumps(manifest), encoding="utf-8")

    points = framepack_extract_proof_frames.load_manifest_proof_points(path)

    assert [(p.label, p.time) for p in points] == [("scene_01_boundary", 3.95)]


def test_build_extract_command_includes_precise_timestamp_and_output(tmp_path):
    output = tmp_path / "proof.png"
    command = framepack_extract_proof_frames.build_extract_command(Path("renders/final.mp4"), 3.95, output)

    assert command == ["ffmpeg", "-y", "-ss", "3.950", "-i", "renders/final.mp4", "-frames:v", "1", str(output)]


def test_proof_output_name_is_stable_and_sanitized(tmp_path):
    point = framepack_extract_proof_frames.ProofPoint(label="Scene 01 / Final!", time=3.95)

    output = framepack_extract_proof_frames.proof_output_path(tmp_path, 1, point)

    assert output.name == "proof-001-scene-01-final-3.950s.png"


def test_contact_sheet_plan_uses_default_output_and_labels(tmp_path):
    images = [tmp_path / "proof-001-a-0.000s.png", tmp_path / "proof-002-b-1.000s.png"]

    plan = framepack_make_contact_sheet.build_contact_sheet_plan(images, None)

    assert plan["output"] == str(tmp_path / "contact-sheet.jpg")
    assert plan["count"] == 2
    assert plan["labels"] == ["proof-001-a-0.000s", "proof-002-b-1.000s"]
