"""Tests for case scaffolder — standard directory creation + classification."""

from __future__ import annotations

import json
from pathlib import Path

from core.case_scaffolder import (
    CaseClass,
    ScaffoldResult,
    CaseClassification,
    scaffold_case,
    classify_case,
    STANDARD_DIRS,
    STANDARD_FRAMEPACK_ARTIFACTS,
)


def _make_plugin_dir(tmp_path: Path) -> Path:
    plugin = tmp_path / "_plugin"
    plugin.mkdir()
    (plugin / "plugin.yaml").write_text(
        'name: framepack\nversion: "0.15.0"\n', encoding="utf-8"
    )
    (plugin / "guardrails.md").write_text("# Guardrails\n", encoding="utf-8")
    return plugin


def _make_workbench(tmp_path: Path) -> Path:
    wb = tmp_path / "workbench"
    wb.mkdir()
    (wb / "WORKBENCH.md").write_text("# WB\n", encoding="utf-8")
    (wb / "cases").mkdir()
    return wb


# ---------------------------------------------------------------------------
# scaffold_case
# ---------------------------------------------------------------------------

class TestScaffoldCase:
    def test_creates_all_directories(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        result = scaffold_case(wb, "video-01", plugin)
        assert result.action == "created"
        for d in STANDARD_DIRS:
            assert (wb / "cases" / "video-01" / d).is_dir()

    def test_creates_agents_md_with_managed_block(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        scaffold_case(wb, "video-01", plugin)
        agents = (wb / "cases" / "video-01" / "AGENTS.md").read_text(encoding="utf-8")
        assert "FRAMEPACK MANAGED BLOCK" in agents
        assert "0.15.0" in agents

    def test_creates_package_json_with_pinned_version(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        scaffold_case(wb, "video-01", plugin, hyperframes_version="0.7.3")
        pkg = json.loads((wb / "cases" / "video-01" / "package.json").read_text(encoding="utf-8"))
        assert "0.7.3" in pkg["scripts"]["render"]
        assert "0.7.3" in pkg["scripts"]["lint"]

    def test_creates_hyperframes_json(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        scaffold_case(wb, "video-01", plugin)
        hf = json.loads((wb / "cases" / "video-01" / "hyperframes.json").read_text(encoding="utf-8"))
        assert hf["version"] == "0.7.3"

    def test_creates_frame_md(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        scaffold_case(wb, "video-01", plugin)
        assert (wb / "cases" / "video-01" / "frame.md").is_file()

    def test_creates_expanded_prompt_placeholder(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        scaffold_case(wb, "video-01", plugin)
        assert (wb / "cases" / "video-01" / ".hyperframes" / "expanded-prompt.md").is_file()

    def test_creates_framepack_artifacts(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        result = scaffold_case(wb, "video-01", plugin)
        for artifact in STANDARD_FRAMEPACK_ARTIFACTS:
            assert f".framepack/{artifact}" in result.files_created
            assert (wb / "cases" / "video-01" / ".framepack" / artifact).is_file()

    def test_optional_claude_md(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        result = scaffold_case(wb, "video-01", plugin, create_claude_md=True)
        assert "CLAUDE.md" in result.files_created
        assert (wb / "cases" / "video-01" / "CLAUDE.md").is_file()

    def test_refuses_if_non_empty(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        case = wb / "cases" / "existing"
        case.mkdir()
        (case / "stuff.txt").write_text("x", encoding="utf-8")
        result = scaffold_case(wb, "existing", plugin)
        assert result.action == "exists"
        assert result.error is not None


# ---------------------------------------------------------------------------
# classify_case
# ---------------------------------------------------------------------------

class TestClassifyCase:
    def test_empty_case(self, tmp_path):
        case = tmp_path / "empty-case"
        case.mkdir()
        result = classify_case(case)
        assert result.label is CaseClass.EMPTY

    def test_standard_case(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        scaffold_case(wb, "std-case", plugin)
        case = wb / "cases" / "std-case"
        result = classify_case(case)
        assert result.label is CaseClass.STANDARD_CASE

    def test_renderable_draft(self, tmp_path):
        case = tmp_path / "draft-case"
        case.mkdir()
        (case / "frame.md").write_text("# frame", encoding="utf-8")
        (case / "index.html").write_text("<html>", encoding="utf-8")
        (case / ".hyperframes").mkdir()
        (case / ".hyperframes" / "expanded-prompt.md").write_text("ok", encoding="utf-8")
        result = classify_case(case)
        assert result.label is CaseClass.RENDERABLE_DRAFT

    def test_research_case(self, tmp_path):
        case = tmp_path / "research"
        case.mkdir()
        (case / "index.html").write_text("<html>", encoding="utf-8")
        result = classify_case(case)
        assert result.label is CaseClass.RESEARCH_CASE

    def test_legacy_case_partial(self, tmp_path):
        case = tmp_path / "legacy"
        case.mkdir()
        (case / "frame.md").write_text("# frame", encoding="utf-8")
        (case / ".hyperframes").mkdir()
        (case / ".hyperframes" / "expanded-prompt.md").write_text("ok", encoding="utf-8")
        # Missing AGENTS.md, hyperframes.json, package.json
        result = classify_case(case)
        assert result.label is CaseClass.LEGACY_CASE
        assert any("missing" in n for n in result.notes)
