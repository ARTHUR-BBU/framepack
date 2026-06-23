"""Tests for P2.4 Cross-case case-study mining."""

from __future__ import annotations

from pathlib import Path

from core.case_mining import (
    CaseSummary,
    discover_cases,
    summarize_case,
    mine_cases,
    write_mining_report,
)


def _make_case(root: Path, name: str, case_study: str = "", readiness: str = "") -> Path:
    case = root / "cases" / name
    case.mkdir(parents=True)
    if case_study:
        (case / "CASE-STUDY.md").write_text(case_study, encoding="utf-8")
    if readiness:
        fp = case / ".framepack"
        fp.mkdir()
        (fp / "render-readiness.md").write_text(readiness, encoding="utf-8")
    return case


class TestDiscoverCases:
    def test_no_cases_dir(self, tmp_path):
        assert discover_cases(tmp_path) == []

    def test_discovers_case_dirs(self, tmp_path):
        _make_case(tmp_path, "a")
        _make_case(tmp_path, "b")
        names = [p.name for p in discover_cases(tmp_path)]
        assert names == ["a", "b"]


class TestSummarizeCase:
    def test_summarize_case_study_tone_and_components(self, tmp_path):
        case = _make_case(tmp_path, "sports-case", case_study=(
            "# Case Study\n"
            "- Tone: chaotic\n"
            "- Catalog: kinetic-title, data-card\n"
            "- Lessons learned: use real audio cues\n"
        ))
        summary = summarize_case(case)
        assert summary.name == "sports-case"
        assert summary.tone == "chaotic"
        assert "kinetic-title" in summary.catalog_components
        assert any("audio" in item.lower() for item in summary.lessons)

    def test_summarize_readiness_counts(self, tmp_path):
        readiness = (
            "# Readiness\n"
            "| Gate | Status | Evidence | Risk |\n"
            "|---|---|---|---|\n"
            "| Asset Intake | RED | missing | risk |\n"
            "| Studio Preview | YELLOW | waived | risk |\n"
            "| HyperFrames Check | GREEN | pass | - |\n"
        )
        case = _make_case(tmp_path, "case", readiness=readiness)
        summary = summarize_case(case)
        assert summary.red_count == 1
        assert summary.yellow_count == 1
        assert summary.green_count == 1


class TestMineCases:
    def test_mine_empty(self, tmp_path):
        report = mine_cases(tmp_path)
        assert report.total_cases == 0
        assert report.cases == []

    def test_mine_tone_frequency(self, tmp_path):
        _make_case(tmp_path, "a", case_study="- Tone: chaotic\n")
        _make_case(tmp_path, "b", case_study="- Tone: chaotic\n")
        _make_case(tmp_path, "c", case_study="- Tone: cinematic\n")
        report = mine_cases(tmp_path)
        assert report.total_cases == 3
        assert report.tone_frequency["chaotic"] == 2
        assert report.tone_frequency["cinematic"] == 1

    def test_mine_common_gaps(self, tmp_path):
        readiness = "| Asset Intake | RED | missing | risk |\n| Studio Preview | RED | missing | risk |\n"
        _make_case(tmp_path, "a", readiness=readiness)
        _make_case(tmp_path, "b", readiness=readiness)
        report = mine_cases(tmp_path)
        assert report.common_red_gates["Asset Intake"] == 2
        assert report.common_red_gates["Studio Preview"] == 2

    def test_write_mining_report(self, tmp_path):
        _make_case(tmp_path, "a", case_study="- Tone: chaotic\n")
        report = mine_cases(tmp_path)
        path = write_mining_report(tmp_path, report)
        assert path.is_file()
        text = path.read_text(encoding="utf-8")
        assert "Cross-Case Mining" in text
        assert "chaotic" in text
