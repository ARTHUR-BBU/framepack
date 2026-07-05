"""Taste-to-quality audit bridge tests.

Verifies the wiring that connects the previously-suspended taste_audit module
into the quality_audit pipeline. Before this bridge existed, the taste trio
(specimens / grammar / auditor) had zero runtime consumers — the sommelier
was hired but nobody called him to taste the food.
"""

import sys
import tempfile
import shutil
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.quality_audit import audit_project


def _make_project(frame_md: str, expanded: str = "") -> Path:
    """Create a minimal synthetic project for taste-bridge testing.

    Uses tempdir so we can vary taste parameters freely without brittle fixtures.
    """
    d = Path(tempfile.mkdtemp())
    d.joinpath("frame.md").write_text(frame_md, encoding="utf-8")
    if expanded:
        exp = d.joinpath(".hyperframes")
        exp.mkdir()
        exp.joinpath("expanded-prompt.md").write_text(expanded, encoding="utf-8")
    return d


# ── Wiring: taste issues surface in the quality report ──────────────────


def test_risk_taste_issue_surfaces_as_p1(tmp_path):
    """A taste 'risk' (static_mockup) must appear in the quality report as P1."""
    d = _make_project(
        frame_md="# minimal frame",
        expanded="# Scene 1\nThe mockup sits centered on screen.\n",
    )
    try:
        report = audit_project(d)
        codes = [(i.code, i.severity) for i in report.issues]
        assert ("static_mockup_risk", "P1") in codes
    finally:
        shutil.rmtree(d)


def test_suggestion_taste_issue_surfaces_as_p2(tmp_path):
    """A taste 'suggestion' (missing kinetic continuity) must surface as P2."""
    d = _make_project(
        frame_md="# minimal frame",
        expanded="# Scene 1\nJust a plain scene with no continuity.\n",
    )
    try:
        report = audit_project(d)
        codes = [(i.code, i.severity) for i in report.issues]
        assert ("missing_kinetic_continuity", "P2") in codes
    finally:
        shutil.rmtree(d)


def test_note_taste_issue_surfaces_as_p3(tmp_path):
    """A taste 'note' (structural motif without transformation) must surface as P3."""
    d = _make_project(
        frame_md="---\nmotif: dot_pattern\n---",
        expanded="# Scene 1\nSome content.\n",
    )
    try:
        report = audit_project(d)
        codes = [(i.code, i.severity) for i in report.issues]
        assert ("motif_not_transformed", "P3") in codes
    finally:
        shutil.rmtree(d)


# ── Suggestion preservation ─────────────────────────────────────────────


def test_taste_suggestion_preserved_in_details(tmp_path):
    """The taste-only 'suggestion' field must survive the bridge into details."""
    d = _make_project(
        frame_md="# minimal frame",
        expanded="# Scene 1\nThe mockup sits centered on screen.\n",
    )
    try:
        report = audit_project(d)
        risk_issue = next(
            i for i in report.issues if i.code == "static_mockup_risk"
        )
        assert risk_issue.details is not None
        assert "suggestion" in risk_issue.details
        assert "Interface Ballet" in risk_issue.details["suggestion"]
    finally:
        shutil.rmtree(d)


# ── Specimen ID validation ──────────────────────────────────────────────


def test_invalid_specimen_id_reported_as_p1(tmp_path):
    """A reference_dna ID that doesn't exist must be reported as P1."""
    d = _make_project(
        frame_md=(
            "---\n"
            "taste:\n"
            "  reference_dna:\n"
            "    - nonexistent_specimen\n"
            "  visual_physics:\n"
            "    gravity: low\n"
            "---"
        ),
        expanded="# Scene 1\nContent.\n",
    )
    try:
        report = audit_project(d)
        specimen_issues = [
            i for i in report.issues if i.code == "specimen_id_unknown"
        ]
        assert len(specimen_issues) == 1
        assert specimen_issues[0].severity == "P1"
    finally:
        shutil.rmtree(d)


def test_valid_specimen_id_not_reported(tmp_path):
    """A known reference_dna ID must NOT trigger a specimen_id_unknown issue."""
    d = _make_project(
        frame_md=(
            "---\n"
            "taste:\n"
            "  reference_dna:\n"
            "    - luxury_object_emergence\n"
            "  visual_physics:\n"
            "    gravity: low\n"
            "---"
        ),
        expanded="# Scene 1\nContent.\n",
    )
    try:
        report = audit_project(d)
        specimen_issues = [
            i for i in report.issues if i.code == "specimen_id_unknown"
        ]
        assert len(specimen_issues) == 0
    finally:
        shutil.rmtree(d)


def test_mixed_valid_invalid_specimen_reports_only_invalid(tmp_path):
    """One valid + one invalid ID → exactly one specimen_id_unknown issue."""
    d = _make_project(
        frame_md=(
            "---\n"
            "taste:\n"
            "  reference_dna:\n"
            "    - luxury_object_emergence\n"
            "    - bogus_id\n"
            "  visual_physics:\n"
            "    gravity: low\n"
            "---"
        ),
        expanded="# Scene 1\nContent.\n",
    )
    try:
        report = audit_project(d)
        specimen_issues = [
            i for i in report.issues if i.code == "specimen_id_unknown"
        ]
        assert len(specimen_issues) == 1
        assert specimen_issues[0].severity == "P1"
        assert "bogus_id" in specimen_issues[0].message
    finally:
        shutil.rmtree(d)


# ── Summary integration ─────────────────────────────────────────────────


def test_taste_issues_counted_in_summary(tmp_path):
    """Taste-derived issues must be counted in the quality report summary."""
    d = _make_project(
        frame_md="# minimal frame",
        expanded="# Scene 1\nThe mockup sits centered on screen.\n",
    )
    try:
        report = audit_project(d)
        # static_mockup_risk → P1, so summary P1 must be > 0
        assert report.summary.get("P1", 0) > 0
    finally:
        shutil.rmtree(d)


def test_commercial_taste_issue_surfaces_in_quality_report(tmp_path):
    """Phase 3 commercial taste signals must ride the existing quality bridge."""
    d = _make_project(
        frame_md="# minimal frame",
        expanded=(
            "# Product launch video\n"
            "Text: Transform your workflow with next generation intelligent automation for every team.\n"
            "Text: More productivity, more clarity, more growth, more speed.\n"
            "Text: Join thousands of teams today with a platform built for modern operations.\n"
            "Product: none.\n"
        ),
    )
    try:
        report = audit_project(d)
        codes = [(i.code, i.severity) for i in report.issues]
        assert ("text_dominance", "P1") in codes
    finally:
        shutil.rmtree(d)
