"""Tests for P0.4 Studio Preview Evidence Gate — content quality check."""

from __future__ import annotations

from pathlib import Path

from core.render_readiness import GateStatus, check_studio_preview
from core.gate_templates import STUDIO_PREVIEW_TEMPLATE


def _make_framepack(tmp_path: Path) -> Path:
    fp = tmp_path / ".framepack"
    fp.mkdir(exist_ok=True)
    return fp


class TestStudioPreviewContentQuality:
    def test_empty_template_is_yellow(self, tmp_path):
        """Scaffolder placeholder should not count as real preview evidence."""
        fp = _make_framepack(tmp_path)
        (fp / "studio-preview.md").write_text(STUDIO_PREVIEW_TEMPLATE, encoding="utf-8")
        r = check_studio_preview(tmp_path)
        assert r.status is GateStatus.YELLOW
        assert "placeholder" in r.evidence.lower() or "template" in r.evidence.lower()

    def test_filled_preview_is_green(self, tmp_path):
        """File with real observations and method should be GREEN."""
        fp = _make_framepack(tmp_path)
        (fp / "studio-preview.md").write_text(
            "# Studio Preview\n\n"
            "## Preview command\n"
            "- command: npx hyperframes preview\n"
            "- URL: http://localhost:3000\n\n"
            "## Inspection method\n"
            "- browser live preview\n\n"
            "## Observations\n"
            "- scene_1: title slams in cleanly, timing feels right\n"
            "- scene_2: transition slightly fast, may need +0.2s\n\n"
            "## Changes after preview\n"
            "- changed: scene_2 transition duration 0.8s -> 1.0s\n",
            encoding="utf-8",
        )
        r = check_studio_preview(tmp_path)
        assert r.status is GateStatus.GREEN

    def test_waived_preview_is_yellow(self, tmp_path):
        """Explicit waiver stays YELLOW (existing behavior)."""
        fp = _make_framepack(tmp_path)
        (fp / "studio-preview.md").write_text(
            "# Studio Preview\n\n- skipped: true\n- reason: headless CI, no browser available\n",
            encoding="utf-8",
        )
        r = check_studio_preview(tmp_path)
        assert r.status is GateStatus.YELLOW

    def test_missing_stays_red(self, tmp_path):
        r = check_studio_preview(tmp_path)
        assert r.status is GateStatus.RED
