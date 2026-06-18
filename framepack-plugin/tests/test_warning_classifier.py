"""Tests for core/warning_classifier.py — HyperFrames lint warning classification.

TDD RED phase: these tests should ALL FAIL because the module doesn't exist yet.
"""
from __future__ import annotations

import json
import shutil
import textwrap
import tempfile
from pathlib import Path

import pytest

from core.warning_classifier import (
    WARNING_CLASSIFICATION,
    classify_finding,
    classify_lint_output,
    load_lint_cache,
    save_lint_cache,
    merge_classified_into_quality_issues,
)


# ── Fixtures ────────────────────────────────────────────────────────────

def _make_lint_json(**overrides) -> dict:
    """Build a realistic hyperframes lint --json output dict."""
    findings = overrides.pop("findings", None)
    if findings is None:
        findings = [
            {
                "code": "overlapping_gsap_tweens",
                "severity": "warning",
                "message": 'GSAP tweens overlap on "__unresolved__" for opacity, scale, y between 0.00s and 0.55s.',
                "selector": "__unresolved__",
                "fixHint": 'Shorten the earlier tween, move the later tween, or add `overwrite: "auto"`.',
                "file": "F:\\\\project\\\\index.html",
            },
            {
                "code": "gsap_studio_edit_blocked",
                "severity": "warning",
                "message": 'GSAP tweens target "#s1-core", "#s1-label" in a registered timeline.',
                "fixHint": "Do not add a manual window.__timelines script...",
                "file": "F:\\\\project\\\\index.html",
            },
        ]
    base = {
        "ok": True,
        "errorCount": 0,
        "warningCount": len(findings),
        "infoCount": 0,
        "findings": findings,
        "filesScanned": 1,
        "_meta": {"version": "0.6.99", "latestVersion": "0.6.110", "updateAvailable": True},
    }
    base.update(overrides)
    return base


def _tmp_project() -> Path:
    """Create a temp project dir with .framepack/ subfolder."""
    d = Path(tempfile.mkdtemp())
    (d / ".framepack").mkdir()
    return d


# ── 1. Classification table structure ────────────────────────────────────

class TestWarningClassificationTable:
    """WARNING_CLASSIFICATION is a data-driven dict, not if/else spaghetti."""

    def test_classification_table_is_non_empty(self):
        assert len(WARNING_CLASSIFICATION) >= 4

    def test_every_entry_has_category_and_severity(self):
        for code, entry in WARNING_CLASSIFICATION.items():
            assert "category" in entry, f"{code} missing 'category'"
            assert entry["category"] in ("upstream_limit", "quality_issue"), (
                f"{code} has invalid category: {entry['category']}"
            )
            assert "default_severity" in entry, f"{code} missing 'default_severity'"
            assert entry["default_severity"] in ("P0", "P1", "P2", "P3"), (
                f"{code} has invalid severity: {entry['default_severity']}"
            )

    def test_known_upstream_limits(self):
        assert "gsap_studio_edit_blocked" in WARNING_CLASSIFICATION
        assert WARNING_CLASSIFICATION["gsap_studio_edit_blocked"]["category"] == "upstream_limit"

    def test_known_quality_issues(self):
        assert "overlapping_gsap_tweens" in WARNING_CLASSIFICATION
        assert WARNING_CLASSIFICATION["overlapping_gsap_tweens"]["category"] == "quality_issue"

    def test_composition_too_large_is_quality_issue(self):
        assert "composition_file_too_large" in WARNING_CLASSIFICATION
        assert WARNING_CLASSIFICATION["composition_file_too_large"]["category"] == "quality_issue"

    def test_timeline_too_dense_is_quality_issue(self):
        assert "timeline_track_too_dense" in WARNING_CLASSIFICATION
        assert WARNING_CLASSIFICATION["timeline_track_too_dense"]["category"] == "quality_issue"


# ── 2. Single finding classification ───────────────────────────────────

class TestClassifyFinding:
    """classify_finding maps a single lint finding to a classified dict."""

    def test_known_quality_issue(self):
        finding = {"code": "overlapping_gsap_tweens", "severity": "warning", "message": "overlap"}
        result = classify_finding(finding)
        assert result["code"] == "overlapping_gsap_tweens"
        assert result["category"] == "quality_issue"
        assert result["severity"] == "P2"

    def test_known_upstream_limit(self):
        finding = {"code": "gsap_studio_edit_blocked", "severity": "warning", "message": "blocked"}
        result = classify_finding(finding)
        assert result["code"] == "gsap_studio_edit_blocked"
        assert result["category"] == "upstream_limit"
        assert result["severity"] == "P2"

    def test_unknown_code_defaults_to_upstream_limit(self):
        """Unknown warning codes are safely defaulted to upstream_limit."""
        finding = {"code": "brand_new_future_warning", "severity": "warning", "message": "something new"}
        result = classify_finding(finding)
        assert result["code"] == "brand_new_future_warning"
        assert result["category"] == "upstream_limit"
        assert result["severity"] == "P2"  # safe default

    def test_preserves_original_message(self):
        finding = {"code": "overlapping_gsap_tweens", "severity": "warning", "message": "detailed msg here"}
        result = classify_finding(finding)
        assert result["message"] == "detailed msg here"

    def test_preserves_description_from_classification_table(self):
        finding = {"code": "gsap_studio_edit_blocked", "severity": "warning", "message": "blocked"}
        result = classify_finding(finding)
        assert "description" in result
        assert len(result["description"]) > 20

    def test_finding_with_no_code_defaults_safely(self):
        """Malformed finding without code field."""
        finding = {"severity": "warning", "message": "no code"}
        result = classify_finding(finding)
        assert result["category"] == "upstream_limit"


# ── 3. Full lint output classification ─────────────────────────────────

class TestClassifyLintOutput:
    """classify_lint_output processes a full lint --json dict into classified list."""

    def test_classifies_full_lint_output(self):
        lint_json = _make_lint_json()
        classified = classify_lint_output(lint_json)
        assert len(classified) == 2
        codes = {c["code"] for c in classified}
        assert "overlapping_gsap_tweens" in codes
        assert "gsap_studio_edit_blocked" in codes

    def test_separates_categories(self):
        lint_json = _make_lint_json()
        classified = classify_lint_output(lint_json)
        quality = [c for c in classified if c["category"] == "quality_issue"]
        upstream = [c for c in classified if c["category"] == "upstream_limit"]
        assert len(quality) == 1
        assert len(upstream) == 1

    def test_empty_findings(self):
        lint_json = _make_lint_json(findings=[])
        classified = classify_lint_output(lint_json)
        assert classified == []

    def test_all_unknown_warnings(self):
        lint_json = _make_lint_json(findings=[
            {"code": "future_warning_a", "severity": "warning", "message": "new a"},
            {"code": "future_warning_b", "severity": "warning", "message": "new b"},
        ])
        classified = classify_lint_output(lint_json)
        assert all(c["category"] == "upstream_limit" for c in classified)

    def test_preserves_hyperframes_version(self):
        lint_json = _make_lint_json()
        classified = classify_lint_output(lint_json)
        # classify_lint_output should return the classified list,
        # and the cache should store version separately (tested in cache tests)
        assert isinstance(classified, list)


# ── 4. Cache read/write ────────────────────────────────────────────────

class TestLintCache:
    """save_lint_cache / load_lint_cache round-trip."""

    def test_save_and_load_roundtrip(self):
        project = _tmp_project()
        try:
            lint_json = _make_lint_json()
            save_lint_cache(project, lint_json)

            cached = load_lint_cache(project)
            assert cached is not None
            assert cached["version"] == 1
            assert cached["source"] == "hyperframes-lint"
            assert cached["hyperframes_version"] == "0.6.99"
            assert "timestamp" in cached
            assert "classified" in cached
            assert len(cached["classified"]) == 2
        finally:
            shutil.rmtree(project)

    def test_load_returns_none_when_no_cache(self):
        project = _tmp_project()
        try:
            assert load_lint_cache(project) is None
        finally:
            shutil.rmtree(project)

    def test_cache_stores_raw_lint_output(self):
        project = _tmp_project()
        try:
            lint_json = _make_lint_json()
            save_lint_cache(project, lint_json)
            cached = load_lint_cache(project)
            assert "raw" in cached
            assert cached["raw"]["ok"] is True
            assert cached["raw"]["_meta"]["version"] == "0.6.99"
        finally:
            shutil.rmtree(project)

    def test_cache_classified_entries_have_required_fields(self):
        project = _tmp_project()
        try:
            lint_json = _make_lint_json()
            save_lint_cache(project, lint_json)
            cached = load_lint_cache(project)
            for entry in cached["classified"]:
                assert "code" in entry
                assert "severity" in entry
                assert "category" in entry
                assert "message" in entry
        finally:
            shutil.rmtree(project)

    def test_cache_overwrites_on_second_save(self):
        project = _tmp_project()
        try:
            save_lint_cache(project, _make_lint_json())
            save_lint_cache(project, _make_lint_json(findings=[]))
            cached = load_lint_cache(project)
            assert len(cached["classified"]) == 0
        finally:
            shutil.rmtree(project)

    def test_malformed_lint_json_handled_gracefully(self):
        project = _tmp_project()
        try:
            lint_json = {"ok": True, "findings": "not a list"}  # malformed
            save_lint_cache(project, lint_json)
            cached = load_lint_cache(project)
            # Should still work — classified will be empty
            assert "classified" in cached
            assert isinstance(cached["classified"], list)
        finally:
            shutil.rmtree(project)


# ── 5. Quality audit integration ────────────────────────────────────────

class TestMergeIntoQualityIssues:
    """merge_classified_into_quality_issues converts classified findings to QualityIssue list."""

    def test_converts_classified_to_quality_issues(self):
        classified = [
            {"code": "overlapping_gsap_tweens", "severity": "P2", "category": "quality_issue",
             "message": "overlap on __unresolved__", "description": "GSAP tweens overlap"},
            {"code": "gsap_studio_edit_blocked", "severity": "P2", "category": "upstream_limit",
             "message": "Studio cannot edit", "description": "HyperFrames architecture limit"},
        ]
        from core.quality_audit import QualityIssue
        issues = merge_classified_into_quality_issues(classified, "F:\\project\\index.html")
        assert len(issues) == 2
        # Quality issue should have code as-is
        assert issues[0].code == "overlapping_gsap_tweens"
        assert issues[0].severity == "P2"
        # Upstream limit should be prefixed
        assert issues[1].code == "upstream:gsap_studio_edit_blocked"
        assert issues[1].severity == "P2"

    def test_empty_classified_returns_empty_issues(self):
        assert merge_classified_into_quality_issues([], "F:\\project") == []

    def test_upstream_issues_have_category_in_details(self):
        classified = [
            {"code": "gsap_studio_edit_blocked", "severity": "P2", "category": "upstream_limit",
             "message": "blocked", "description": "arch limit"},
        ]
        issues = merge_classified_into_quality_issues(classified, "F:\\project\\index.html")
        assert issues[0].details is not None
        assert issues[0].details["category"] == "upstream_limit"
