"""Tests for render readiness board gate system."""

from __future__ import annotations

from pathlib import Path

from core.render_readiness import (
    GateStatus,
    GateResult,
    ReadinessBoard,
    build_readiness_board,
    render_board_markdown,
    render_board_summary,
    check_asset_intake,
    check_script_lanes,
    check_story_bible,
    check_arsenal,
    check_studio_preview,
    check_context_sync,
)


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

class TestGateStatus:
    def test_values(self):
        assert GateStatus.GREEN.value == "GREEN"
        assert GateStatus.YELLOW.value == "YELLOW"
        assert GateStatus.RED.value == "RED"

    def test_is_str_enum(self):
        assert GateStatus.GREEN == "GREEN"


class TestGateResult:
    def test_creation(self):
        r = GateResult(
            name="Asset Intake",
            status=GateStatus.RED,
            evidence="missing",
            risk="bad",
        )
        assert r.status is GateStatus.RED
        assert r.name == "Asset Intake"

    def test_frozen(self):
        r = GateResult("X", GateStatus.GREEN, "ok", "")
        try:
            r.name = "Y"  # type: ignore
            assert False, "should be frozen"
        except AttributeError:
            pass


# ---------------------------------------------------------------------------
# Individual gate checkers — empty project
# ---------------------------------------------------------------------------

class TestEmptyProjectGates:
    """An empty project should be all RED for core gates."""

    def test_asset_intake_missing(self, tmp_path):
        r = check_asset_intake(tmp_path)
        assert r.status is GateStatus.RED

    def test_script_lanes_missing(self, tmp_path):
        r = check_script_lanes(tmp_path)
        assert r.status is GateStatus.RED

    def test_story_bible_missing(self, tmp_path):
        r = check_story_bible(tmp_path)
        assert r.status is GateStatus.RED

    def test_arsenal_missing(self, tmp_path):
        r = check_arsenal(tmp_path)
        assert r.status is GateStatus.RED

    def test_studio_preview_missing(self, tmp_path):
        r = check_studio_preview(tmp_path)
        assert r.status is GateStatus.RED

    def test_context_sync_missing(self, tmp_path):
        r = check_context_sync(tmp_path)
        assert r.status is GateStatus.YELLOW  # yellow, not red


# ---------------------------------------------------------------------------
# Gate checkers — with artifacts
# ---------------------------------------------------------------------------

class TestGatesWithArtifacts:
    def test_asset_intake_present(self, tmp_path):
        (tmp_path / ".framepack").mkdir()
        (tmp_path / ".framepack" / "asset-intake.md").write_text(
            "# Asset Intake\n\n## Brand\n"
            "- logo: assets/logo.png (ready)\n"
            "- colors: primary=#1a1a2e accent=#c9a96e\n",
            encoding="utf-8",
        )
        r = check_asset_intake(tmp_path)
        assert r.status is GateStatus.GREEN

    def test_script_lanes_no_selection(self, tmp_path):
        (tmp_path / ".framepack").mkdir()
        (tmp_path / ".framepack" / "script-lanes.md").write_text(
            "# Script Lanes\n## Lane A\nbeats", encoding="utf-8"
        )
        r = check_script_lanes(tmp_path)
        assert r.status is GateStatus.YELLOW

    def test_script_lanes_selected_confirmed(self, tmp_path):
        (tmp_path / ".framepack").mkdir()
        (tmp_path / ".framepack" / "script-lanes.md").write_text(
            "# Script Lanes\n## Lane A\n## Selected lane\n"
            "- lane: A\n- user_confirmed: true\n",
            encoding="utf-8",
        )
        r = check_script_lanes(tmp_path)
        assert r.status is GateStatus.GREEN

    def test_arsenal_present(self, tmp_path):
        (tmp_path / ".framepack").mkdir()
        (tmp_path / ".framepack" / "arsenal.json").write_text("{}", encoding="utf-8")
        r = check_arsenal(tmp_path)
        assert r.status is GateStatus.GREEN

    def test_studio_preview_present(self, tmp_path):
        (tmp_path / ".framepack").mkdir()
        (tmp_path / ".framepack" / "studio-preview.md").write_text(
            "# Studio Preview\n"
            "- command: npx hyperframes preview\n"
            "- observations: title slams in cleanly, timing feels right\n",
            encoding="utf-8"
        )
        r = check_studio_preview(tmp_path)
        assert r.status is GateStatus.GREEN

    def test_studio_preview_waived(self, tmp_path):
        (tmp_path / ".framepack").mkdir()
        (tmp_path / ".framepack" / "studio-preview.md").write_text(
            "# Studio Preview\n- skipped: true\n- reason: no browser\n", encoding="utf-8"
        )
        r = check_studio_preview(tmp_path)
        assert r.status is GateStatus.YELLOW

    def test_context_sync_current(self, tmp_path):
        (tmp_path / ".framepack").mkdir()
        (tmp_path / ".framepack" / "context-sync.md").write_text(
            "# Context Sync\n- project_context_current: true\n", encoding="utf-8"
        )
        r = check_context_sync(tmp_path)
        assert r.status is GateStatus.GREEN


# ---------------------------------------------------------------------------
# Board builder
# ---------------------------------------------------------------------------

class TestBuildReadinessBoard:
    def test_empty_project_all_red_overall(self, tmp_path):
        board = build_readiness_board(tmp_path)
        assert board.overall is GateStatus.RED
        assert board.recommended_label == "draft"
        # core gates should be RED
        red_names = {g.name for g in board.gates if g.status is GateStatus.RED}
        assert "Asset Intake" in red_names
        assert "Script Lanes" in red_names
        assert "Arsenal Binding" in red_names

    def test_gate_order(self, tmp_path):
        board = build_readiness_board(tmp_path)
        names = [g.name for g in board.gates]
        assert names[0] == "Asset Intake"
        assert names[1] == "Script Lanes"

    def test_partial_project_yellow(self, tmp_path):
        # Add only story bible and frame.md
        (tmp_path / "frame.md").write_text("# frame", encoding="utf-8")
        (tmp_path / ".hyperframes").mkdir()
        (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text(
            "# expanded", encoding="utf-8"
        )
        board = build_readiness_board(tmp_path)
        # Still RED because asset intake, script lanes, arsenal are missing
        assert board.overall is GateStatus.RED

    def test_full_project_green(self, tmp_path):
        fp = tmp_path / ".framepack"
        fp.mkdir()
        (fp / "asset-intake.md").write_text(
            "# Asset Intake\n\n- logo: assets/logo.png\n- colors: primary=#1a1a2e\n", encoding="utf-8")
        (fp / "director-inspect.md").write_text(
            "# Director Inspect\n\n## Project intent\n"
            "- video_type: brand_product_launch\n- audience: sports fans\n"
            "- duration: 30s\n\n## User decision\n- provide_assets\n", encoding="utf-8")
        (fp / "script-lanes.md").write_text(
            "## Selected lane\n- lane: A\n- user_confirmed: true\n", encoding="utf-8")
        (fp / "arsenal.json").write_text("{}", encoding="utf-8")
        (fp / "catalog-decision.md").write_text("# Catalog Decision\n\n- used: kinetic-title\n", encoding="utf-8")
        (fp / "studio-preview.md").write_text("- command: preview\n- observations: looks good\n", encoding="utf-8")
        (fp / "context-sync.md").write_text(
            "- project_context_current: true\n", encoding="utf-8")
        (fp / "handoff-manifest.md").write_text("# Handoff\n\n- workflow: product-launch\n", encoding="utf-8")
        (fp / "taste-audit.md").write_text("# Taste Audit\n\n- verdict: READY\n", encoding="utf-8")
        (tmp_path / "frame.md").write_text("# Visual Identity\n\n- colors: primary=#1a1a2e\n", encoding="utf-8")
        hf = tmp_path / ".hyperframes"
        hf.mkdir()
        (hf / "expanded-prompt.md").write_text("# Story Bible\n\nReal creative direction here.", encoding="utf-8")
        board = build_readiness_board(tmp_path)
        assert board.overall is GateStatus.GREEN
        assert board.recommended_label == "standard_sample"


# ---------------------------------------------------------------------------
# Markdown emitter
# ---------------------------------------------------------------------------

class TestRenderBoardMarkdown:
    def test_has_table_header(self, tmp_path):
        board = build_readiness_board(tmp_path)
        md = render_board_markdown(board)
        assert "| Gate | Status |" in md
        assert "Asset Intake" in md

    def test_has_overall(self, tmp_path):
        board = build_readiness_board(tmp_path)
        md = render_board_markdown(board)
        assert "## Overall" in md
        assert "RED" in md

    def test_has_user_options(self, tmp_path):
        board = build_readiness_board(tmp_path)
        md = render_board_markdown(board)
        assert "render anyway" in md.lower()


class TestRenderBoardSummary:
    def test_compact_format(self, tmp_path):
        board = build_readiness_board(tmp_path)
        s = render_board_summary(board)
        assert "🔴" in s
        assert "Readiness" in s
        assert "draft" in s

    def test_green_project(self, tmp_path):
        fp = tmp_path / ".framepack"
        fp.mkdir()
        (fp / "asset-intake.md").write_text(
            "# Asset Intake\n\n- logo: assets/logo.png\n- colors: primary=#1a1a2e\n", encoding="utf-8")
        (fp / "director-inspect.md").write_text(
            "# Director Inspect\n\n## Project intent\n"
            "- video_type: brand_product_launch\n- audience: sports fans\n"
            "- duration: 30s\n", encoding="utf-8")
        (fp / "script-lanes.md").write_text(
            "## Selected lane\n- lane: A\n- user_confirmed: true\n", encoding="utf-8")
        (fp / "arsenal.json").write_text("{}", encoding="utf-8")
        (fp / "catalog-decision.md").write_text("# Catalog\n\n- used: kinetic-title\n", encoding="utf-8")
        (fp / "studio-preview.md").write_text("- command: preview\n- observations: good\n", encoding="utf-8")
        (fp / "context-sync.md").write_text(
            "- project_context_current: true\n", encoding="utf-8")
        (fp / "handoff-manifest.md").write_text("# Handoff\n\n- workflow: launch\n", encoding="utf-8")
        (fp / "taste-audit.md").write_text("# Taste Audit\n\n- verdict: READY\n", encoding="utf-8")
        (tmp_path / "frame.md").write_text("# Visual Identity\n\n- colors: primary=#1a1a2e\n", encoding="utf-8")
        hf = tmp_path / ".hyperframes"
        hf.mkdir()
        (hf / "expanded-prompt.md").write_text("# Story Bible\n\nReal creative direction.", encoding="utf-8")
        board = build_readiness_board(tmp_path)
        s = render_board_summary(board)
        assert "🟢" in s
        assert "standard_sample" in s
