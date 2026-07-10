"""Tests for the proof-frame evidence module (Phase 5).

The proof-frame detector was previously inline in taste_audit.py.
Phase 5 extracts it into taste_proof_detectors.py and adds metadata.
"""
from pathlib import Path

from core.taste_proof_detectors import (
    ProofEvidence,
    audit_proof_evidence,
    has_proof_frames,
)


def test_missing_proof_frames_returns_suggestion(tmp_path):
    """index.html exists, no proof frames → suggestion-level no_proof_frames."""
    (tmp_path / "index.html").write_text("<html></html>", encoding="utf-8")
    issues = audit_proof_evidence(tmp_path)
    assert any(i.code == "no_proof_frames" for i in issues)
    assert issues[0].severity == "suggestion"


def test_existing_proof_frames_suppresses_no_proof_issue(tmp_path):
    """index.html + proof frames → no no_proof_frames issue."""
    (tmp_path / "index.html").write_text("<html></html>", encoding="utf-8")
    proof_dir = tmp_path / ".framepack" / "proof-frames"
    proof_dir.mkdir(parents=True)
    (proof_dir / "scene1.png").write_bytes(b"\x89PNG\r\n\x1a\n fake png")
    issues = audit_proof_evidence(tmp_path)
    assert not any(i.code == "no_proof_frames" for i in issues)


def test_proof_frames_in_legacy_locations_are_recognized(tmp_path):
    """Legacy proof directories (proofs/, snapshots/) also count."""
    (tmp_path / "index.html").write_text("<html></html>", encoding="utf-8")
    for dirname in ("proofs", "snapshots"):
        d = tmp_path / dirname
        d.mkdir()
        (d / "frame.png").write_bytes(b"\x89PNG fake")
        issues = audit_proof_evidence(tmp_path)
        assert not any(i.code == "no_proof_frames" for i in issues)
        # cleanup for next iteration
        import shutil
        shutil.rmtree(d)


def test_proof_evidence_metadata_includes_frame_count(tmp_path):
    """ProofEvidence should report frame count and recognized locations."""
    (tmp_path / "index.html").write_text("<html></html>", encoding="utf-8")
    proof_dir = tmp_path / ".framepack" / "proof-frames"
    proof_dir.mkdir(parents=True)
    for i in range(3):
        (proof_dir / f"frame_{i}.png").write_bytes(b"\x89PNG fake")
    evidence = ProofEvidence.from_project(tmp_path)
    assert evidence.frame_count == 3
    assert evidence.has_frames is True
    assert any(".framepack/proof-frames" in loc for loc in evidence.locations)


def test_proof_evidence_empty_when_no_frames(tmp_path):
    """No frames anywhere → has_frames=False, frame_count=0."""
    (tmp_path / "index.html").write_text("<html></html>", encoding="utf-8")
    evidence = ProofEvidence.from_project(tmp_path)
    assert evidence.has_frames is False
    assert evidence.frame_count == 0


def test_motion_claim_unproven_still_works_via_module(tmp_path):
    """Motion claim with proof frames → motion_claim_unproven suppressed."""
    (tmp_path / "index.html").write_text(
        "<html><script>gsap.to('.card',{y:20})</script></html>", encoding="utf-8"
    )
    proof_dir = tmp_path / ".framepack" / "proof-frames"
    proof_dir.mkdir(parents=True)
    (proof_dir / "motion_proof.png").write_bytes(b"\x89PNG fake")
    expanded = "Motion: high-energy kinetic choreography with morphing cards."
    issues = audit_proof_evidence(tmp_path, expanded_prompt=expanded, html="gsap.to")
    assert not any(i.code == "motion_claim_unproven" for i in issues)


def test_motion_claim_unproven_without_frames(tmp_path):
    """Motion claim without canonical proof frames → motion_claim_unproven."""
    (tmp_path / "index.html").write_text(
        "<html><script>gsap.to('.card',{y:20})</script></html>", encoding="utf-8"
    )
    expanded = "Motion: high-energy kinetic choreography with morphing cards."
    issues = audit_proof_evidence(tmp_path, expanded_prompt=expanded, html="gsap.to")
    motion_issues = [i for i in issues if i.code == "motion_claim_unproven"]
    assert motion_issues
    assert motion_issues[0].severity == "risk"


def test_has_proof_frames_helper_standalone(tmp_path):
    """has_proof_frames can be called standalone."""
    assert has_proof_frames(tmp_path) is False
    proof_dir = tmp_path / ".framepack" / "proof-frames"
    proof_dir.mkdir(parents=True)
    (proof_dir / "x.png").write_bytes(b"fake")
    assert has_proof_frames(tmp_path) is True
