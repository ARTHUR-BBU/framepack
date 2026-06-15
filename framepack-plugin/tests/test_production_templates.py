"""Production template asset tests."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def test_scene_spec_template_exists_and_contains_required_sections():
    text = (ROOT / "templates" / "scene-spec.md").read_text(encoding="utf-8")

    assert "# Framepack Scene Spec" in text
    assert "Beat Timeline" in text
    assert "Continuity" in text
    assert "Proof Frames" in text
    assert "Surgical Change Log" in text


def test_timeline_manifest_template_exists_and_contains_required_ledgers():
    text = (ROOT / "templates" / "timeline-manifest.example.json").read_text(encoding="utf-8")

    assert '"kind": "framepack_timeline_manifest"' in text
    assert '"scenes"' in text
    assert '"proofs"' in text
    assert '"change_requests"' in text


def test_production_quality_skill_documents_cli_workflow():
    text = (ROOT / "skills" / "framepack-production-quality" / "SKILL.md").read_text(encoding="utf-8")

    assert "framepack_timeline_manifest.py" in text
    assert "framepack_extract_proof_frames.py" in text
    assert "framepack_quality_audit.py" in text
    assert "Framepack does not patch HTML" in text
