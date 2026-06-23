"""Tests for P1.1 Placeholder-Smell Audit."""

from __future__ import annotations

from pathlib import Path

from core.placeholder_audit import (
    PlaceholderFinding,
    PlaceholderAuditReport,
    audit_placeholder_smell,
    audit_project_placeholder_smell,
)


# ---------------------------------------------------------------------------
# Pure text audit
# ---------------------------------------------------------------------------

class TestAuditPlaceholderSmell:
    def test_clean_text_no_findings(self):
        html = "<div>Manchester United signs Éderson for £60m</div>"
        report = audit_placeholder_smell(html)
        assert len(report.findings) == 0
        assert report.verdict == "CLEAN"

    def test_internal_workflow_words_detected(self):
        html = "<div>LOAD</div><div>PUNCH</div><div>CALL</div>"
        report = audit_placeholder_smell(html)
        assert len(report.findings) >= 3
        codes = {f.code for f in report.findings}
        assert "internal_workflow_word" in codes

    def test_placeholder_status_detected(self):
        html = "<div>ARRIVAL PENDING</div>"
        report = audit_placeholder_smell(html)
        assert any(f.code == "placeholder_status" for f in report.findings)

    def test_generic_hype_detected(self):
        html = "<div>NEXT LEVEL</div><div>GAME CHANGER</div>"
        report = audit_placeholder_smell(html)
        assert any(f.code == "generic_hype" for f in report.findings)

    def test_standalone_uppercase_short_words(self):
        """Standalone uppercase words like LOAD, ENGINE, DUEL are suspect."""
        html = "<div>ENGINE</div><div>DUEL</div><div>CARRY</div>"
        report = audit_placeholder_smell(html)
        # These are single-word uppercase — internal workflow energy
        assert len(report.findings) >= 1

    def test_proper_nouns_not_flagged(self):
        """Real names like MANCHESTER UNITED or ÉDERSON should not be flagged."""
        html = "<div>MANCHESTER UNITED</div><div>ÉDERSON</div><div>OLD TRAFFORD</div>"
        report = audit_placeholder_smell(html)
        # These are legitimate proper nouns, not placeholders
        assert report.verdict in ("CLEAN", "LOW")

    def test_verdict_levels(self):
        """Many findings = HIGH, few = LOW/MEDIUM, none = CLEAN."""
        clean = audit_placeholder_smell("<div>Real content here about product launch</div>")
        assert clean.verdict == "CLEAN"

        dirty = audit_placeholder_smell("<div>LOAD</div><div>PUNCH</div><div>CALL</div><div>ARRIVAL PENDING</div>")
        assert dirty.verdict in ("HIGH", "MEDIUM")

    def test_finding_has_context(self):
        html = "<div>LOAD</div>"
        report = audit_placeholder_smell(html)
        assert len(report.findings) >= 1
        f = report.findings[0]
        assert f.word  # non-empty
        assert f.code  # non-empty
        assert f.context  # surrounding text


# ---------------------------------------------------------------------------
# Project-level audit (reads index.html)
# ---------------------------------------------------------------------------

class TestAuditProjectPlaceholderSmell:
    def test_no_html_file(self, tmp_path):
        report = audit_project_placeholder_smell(tmp_path)
        assert report.verdict == "SKIP"
        assert len(report.findings) == 0

    def test_clean_html(self, tmp_path):
        (tmp_path / "index.html").write_text(
            "<html><body><div>Product launches July 2026</div></body></html>",
            encoding="utf-8",
        )
        report = audit_project_placeholder_smell(tmp_path)
        assert report.verdict == "CLEAN"

    def test_placeholder_html(self, tmp_path):
        (tmp_path / "index.html").write_text(
            "<html><body>"
            "<div>LOAD</div><div>PUNCH</div><div>CALL</div>"
            "<div>ARRIVAL PENDING</div><div>MIDFIELD DOSSIER</div>"
            "</body></html>",
            encoding="utf-8",
        )
        report = audit_project_placeholder_smell(tmp_path)
        assert report.verdict in ("HIGH", "MEDIUM")
        assert len(report.findings) >= 3

    def test_writes_findings_to_framepack(self, tmp_path):
        (tmp_path / "index.html").write_text(
            "<div>LOAD</div><div>ARRIVAL PENDING</div>",
            encoding="utf-8",
        )
        audit_project_placeholder_smell(tmp_path, write_report=True)
        report_path = tmp_path / ".framepack" / "placeholder-audit.md"
        assert report_path.is_file()
        content = report_path.read_text(encoding="utf-8")
        assert "LOAD" in content or "placeholder" in content.lower()
