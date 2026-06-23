"""Tests for P0.2 content quality gates — distinguishes filled vs empty templates."""

from __future__ import annotations

from pathlib import Path

from core.render_readiness import (
    GateStatus,
    check_asset_intake,
    check_script_lanes,
    check_director_inspect,
)
from core.gate_templates import ASSET_INTAKE_TEMPLATE, SCRIPT_LANES_TEMPLATE, DIRECTOR_INSPECT_TEMPLATE


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_framepack(tmp_path: Path) -> Path:
    fp = tmp_path / ".framepack"
    fp.mkdir(exist_ok=True)
    return fp


# ---------------------------------------------------------------------------
# Asset Intake — empty template vs filled
# ---------------------------------------------------------------------------

class TestAssetIntakeContentQuality:
    def test_empty_template_is_yellow(self, tmp_path):
        """A scaffolder-generated placeholder should not pass as GREEN."""
        fp = _make_framepack(tmp_path)
        (fp / "asset-intake.md").write_text(ASSET_INTAKE_TEMPLATE, encoding="utf-8")
        r = check_asset_intake(tmp_path)
        assert r.status is GateStatus.YELLOW
        assert "template" in r.evidence.lower() or "placeholder" in r.evidence.lower() or "empty" in r.evidence.lower()

    def test_filled_intake_is_green(self, tmp_path):
        """A file with real asset entries should be GREEN."""
        fp = _make_framepack(tmp_path)
        (fp / "asset-intake.md").write_text(
            "# Asset Intake\n\n## Brand\n"
            "- logo:\n  - path: assets/logo.png\n  - format: png\n  - status: ready\n"
            "- colors:\n  - primary: \"#1a1a2e\"\n  - accent: \"#c9a96e\"\n\n"
            "## Missing\n- licensed_bgm\n",
            encoding="utf-8",
        )
        r = check_asset_intake(tmp_path)
        assert r.status is GateStatus.GREEN

    def test_partial_intake_is_yellow(self, tmp_path):
        """Has section headers but no actual values."""
        fp = _make_framepack(tmp_path)
        (fp / "asset-intake.md").write_text(
            "# Asset Intake\n\n## Brand\n- logo:\n- colors:\n## Missing\n",
            encoding="utf-8",
        )
        r = check_asset_intake(tmp_path)
        assert r.status is GateStatus.YELLOW


# ---------------------------------------------------------------------------
# Script Lanes — empty template vs filled
# ---------------------------------------------------------------------------

class TestScriptLanesContentQuality:
    def test_empty_template_is_yellow(self, tmp_path):
        """Scaffolder placeholder with no lane selected is YELLOW."""
        fp = _make_framepack(tmp_path)
        (fp / "script-lanes.md").write_text(SCRIPT_LANES_TEMPLATE, encoding="utf-8")
        r = check_script_lanes(tmp_path)
        assert r.status is GateStatus.YELLOW

    def test_filled_lane_confirmed_is_green(self, tmp_path):
        fp = _make_framepack(tmp_path)
        (fp / "script-lanes.md").write_text(
            "# Script Lanes\n\n## Lane A\n"
            "- hook: \"从零到英超\"\n- beats: arrival, training, debut\n"
            "- final line: \"号码揭晓\"\n\n"
            "## Selected lane\n- lane: A\n- user_confirmed: true\n",
            encoding="utf-8",
        )
        r = check_script_lanes(tmp_path)
        assert r.status is GateStatus.GREEN


# ---------------------------------------------------------------------------
# Director Inspect — quality check
# ---------------------------------------------------------------------------

class TestDirectorInspectQuality:
    def test_missing_is_red(self, tmp_path):
        r = check_director_inspect(tmp_path)
        assert r.status is GateStatus.RED

    def test_empty_template_is_yellow(self, tmp_path):
        fp = _make_framepack(tmp_path)
        (fp / "director-inspect.md").write_text(DIRECTOR_INSPECT_TEMPLATE, encoding="utf-8")
        r = check_director_inspect(tmp_path)
        assert r.status is GateStatus.YELLOW

    def test_filled_inspect_is_green(self, tmp_path):
        fp = _make_framepack(tmp_path)
        (fp / "director-inspect.md").write_text(
            "# Director Inspect\n\n"
            "## Project intent\n"
            "- video_type: brand_product_launch\n"
            "- audience: sports fans\n"
            "- duration: 30s\n\n"
            "## 9-question director rubric\n"
            "1. sports fans aged 18-35\n"
            "2. excitement and anticipation\n"
            "3. arrival of new player\n\n"
            "## User decision\n"
            "- provide_assets\n",
            encoding="utf-8",
        )
        r = check_director_inspect(tmp_path)
        assert r.status is GateStatus.GREEN
