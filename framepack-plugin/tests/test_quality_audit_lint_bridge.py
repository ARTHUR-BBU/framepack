"""Tests for quality_audit integration with warning_classifier.

TDD RED phase: audit_project should pick up .framepack/hyperframes-findings.json
cache and merge upstream_limit findings into the report.

These tests focus specifically on the bridge between warning_classifier cache
and quality_audit report output.
"""
from __future__ import annotations

import json
import tempfile
import shutil
from pathlib import Path

import pytest

from core.quality_audit import audit_project
from core.warning_classifier import save_lint_cache


def _make_project_with_cache(tmp_path: Path, lint_findings: list[dict]) -> Path:
    """Create a minimal project with lint cache pre-populated.

    The project has an index.html so quality_audit will run, and a populated
    hyperframes-findings.json cache so quality_audit should merge findings.
    """
    project = tmp_path

    # Minimal index.html so audit_project runs
    (project / "index.html").write_text(
        '<!DOCTYPE html><html><body><div class="scene-inner"></div></body></html>',
        encoding="utf-8",
    )

    # Create .framepack dir + lint cache
    framepack_dir = project / ".framepack"
    framepack_dir.mkdir(exist_ok=True)

    lint_json = {
        "ok": True,
        "errorCount": 0,
        "warningCount": len(lint_findings),
        "infoCount": 0,
        "findings": lint_findings,
        "filesScanned": 1,
        "_meta": {"version": "0.6.99", "latestVersion": "0.6.110", "updateAvailable": True},
    }
    save_lint_cache(project, lint_json)
    return project


# ── Cache → quality_audit integration ───────────────────────────────────

class TestQualityAuditLintCacheIntegration:
    """quality_audit should read .framepack/hyperframes-findings.json and merge
    classified findings into its report."""

    def test_report_includes_upstream_limit_when_cache_present(self, tmp_path):
        _make_project_with_cache(tmp_path, [
            {"code": "gsap_studio_edit_blocked", "severity": "warning",
             "message": "Studio cannot edit GSAP elements", "file": str(tmp_path / "index.html")},
        ])

        report = audit_project(tmp_path)

        codes = {issue.code for issue in report.issues}
        assert "upstream:gsap_studio_edit_blocked" in codes, (
            f"Expected upstream:gsap_studio_edit_blocked in report, got: {codes}"
        )

    def test_report_includes_quality_issue_when_cache_present(self, tmp_path):
        _make_project_with_cache(tmp_path, [
            {"code": "overlapping_gsap_tweens", "severity": "warning",
             "message": "tweens overlap", "file": str(tmp_path / "index.html")},
        ])

        report = audit_project(tmp_path)

        codes = {issue.code for issue in report.issues}
        assert "overlapping_gsap_tweens" in codes, (
            f"Expected overlapping_gsap_tweens in report, got: {codes}"
        )

    def test_report_separates_quality_and_upstream(self, tmp_path):
        _make_project_with_cache(tmp_path, [
            {"code": "gsap_studio_edit_blocked", "severity": "warning",
             "message": "blocked", "file": str(tmp_path / "index.html")},
            {"code": "overlapping_gsap_tweens", "severity": "warning",
             "message": "overlap", "file": str(tmp_path / "index.html")},
            {"code": "composition_file_too_large", "severity": "warning",
             "message": "too large", "file": str(tmp_path / "index.html")},
        ])

        report = audit_project(tmp_path)
        codes = {issue.code for issue in report.issues}

        # upstream limits prefixed with "upstream:"
        assert "upstream:gsap_studio_edit_blocked" in codes

        # quality issues use bare code (no prefix)
        assert "overlapping_gsap_tweens" in codes
        assert "composition_file_too_large" in codes

    def test_report_unchanged_when_no_cache(self, tmp_path):
        """Without a lint cache, quality_audit should behave exactly as before."""
        (tmp_path / "index.html").write_text(
            '<!DOCTYPE html><html><body></body></html>',
            encoding="utf-8",
        )

        report = audit_project(tmp_path)
        codes = {issue.code for issue in report.issues}

        # No upstream: prefixed codes should appear
        upstream_codes = [c for c in codes if c.startswith("upstream:")]
        assert upstream_codes == [], f"Unexpected upstream codes without cache: {upstream_codes}"

    def test_unknown_warning_in_cache_appears_as_upstream_limit(self, tmp_path):
        _make_project_with_cache(tmp_path, [
            {"code": "future_warning_xyz", "severity": "warning",
             "message": "something new from upstream", "file": str(tmp_path / "index.html")},
        ])

        report = audit_project(tmp_path)
        codes = {issue.code for issue in report.issues}
        assert "upstream:future_warning_xyz" in codes

    def test_report_upstream_issue_has_correct_severity(self, tmp_path):
        _make_project_with_cache(tmp_path, [
            {"code": "gsap_studio_edit_blocked", "severity": "warning",
             "message": "blocked", "file": str(tmp_path / "index.html")},
        ])

        report = audit_project(tmp_path)
        upstream_issues = [i for i in report.issues if i.code.startswith("upstream:")]
        assert len(upstream_issues) == 1
        assert upstream_issues[0].severity == "P2"

    def test_report_upstream_issue_has_category_in_details(self, tmp_path):
        _make_project_with_cache(tmp_path, [
            {"code": "gsap_studio_edit_blocked", "severity": "warning",
             "message": "blocked", "file": str(tmp_path / "index.html")},
        ])

        report = audit_project(tmp_path)
        upstream_issues = [i for i in report.issues if i.code.startswith("upstream:")]
        assert len(upstream_issues) == 1
        assert upstream_issues[0].details["category"] == "upstream_limit"


# ── to_dict serialization includes upstream findings ────────────────────

class TestQualityAuditSerializationWithCache:
    """to_dict output should include upstream findings so JSON consumers can
    filter them by category."""

    def test_to_dict_includes_upstream_category_in_details(self, tmp_path):
        _make_project_with_cache(tmp_path, [
            {"code": "gsap_studio_edit_blocked", "severity": "warning",
             "message": "blocked", "file": str(tmp_path / "index.html")},
        ])

        payload = audit_project(tmp_path).to_dict()
        upstream_in_payload = [
            i for i in payload["issues"]
            if (i.get("details") or {}).get("category") == "upstream_limit"
        ]
        assert len(upstream_in_payload) == 1
        assert upstream_in_payload[0]["code"] == "upstream:gsap_studio_edit_blocked"
