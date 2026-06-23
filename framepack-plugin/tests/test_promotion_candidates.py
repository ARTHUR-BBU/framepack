"""Tests for P2.3 Promotion candidates after successful renders."""

from __future__ import annotations

import json
from pathlib import Path

from core.promotion_candidates import (
    PromotionCandidate,
    detect_successful_render,
    collect_promotion_candidates,
    write_promotion_report,
)


class TestDetectSuccessfulRender:
    def test_no_render_is_false(self, tmp_path):
        assert detect_successful_render(tmp_path) is False

    def test_render_mp4_present_is_true(self, tmp_path):
        renders = tmp_path / "renders"
        renders.mkdir()
        (renders / "final.mp4").write_bytes(b"fake mp4")
        assert detect_successful_render(tmp_path) is True

    def test_zero_byte_render_is_false(self, tmp_path):
        renders = tmp_path / "renders"
        renders.mkdir()
        (renders / "final.mp4").write_bytes(b"")
        assert detect_successful_render(tmp_path) is False


class TestCollectPromotionCandidates:
    def test_no_successful_render_no_candidates(self, tmp_path):
        (tmp_path / "index.html").write_text("<div>ok</div>", encoding="utf-8")
        candidates = collect_promotion_candidates(tmp_path)
        assert candidates == []

    def test_template_candidate_from_index_and_case_study(self, tmp_path):
        renders = tmp_path / "renders"
        renders.mkdir()
        (renders / "final.mp4").write_bytes(b"fake")
        (tmp_path / "index.html").write_text("<div class='clip'>Hero</div>", encoding="utf-8")
        (tmp_path / "CASE-STUDY.md").write_text("# Case\nReusable sports intro pattern.", encoding="utf-8")
        candidates = collect_promotion_candidates(tmp_path)
        assert any(c.kind == "template" for c in candidates)

    def test_weapon_candidate_from_framepack_weapons(self, tmp_path):
        renders = tmp_path / "renders"
        renders.mkdir()
        (renders / "final.mp4").write_bytes(b"fake")
        weapons = tmp_path / ".framepack" / "weapons"
        weapons.mkdir(parents=True)
        (weapons / "spark.js").write_text("export function spark() {}", encoding="utf-8")
        candidates = collect_promotion_candidates(tmp_path)
        assert any(c.kind == "weapon" and "spark.js" in c.path for c in candidates)

    def test_arsenal_used_weapon_candidate(self, tmp_path):
        renders = tmp_path / "renders"
        renders.mkdir()
        (renders / "final.mp4").write_bytes(b"fake")
        fp = tmp_path / ".framepack"
        fp.mkdir()
        (fp / "arsenal.json").write_text(json.dumps({
            "weapons": {"text-split-enter": {"status": "used", "source": "builtin"}}
        }), encoding="utf-8")
        candidates = collect_promotion_candidates(tmp_path)
        assert any(c.kind == "weapon" and c.name == "text-split-enter" for c in candidates)

    def test_write_promotion_report(self, tmp_path):
        candidates = [PromotionCandidate(kind="template", name="case-template", path="index.html", reason="successful render")]
        path = write_promotion_report(tmp_path, candidates)
        assert path.is_file()
        text = path.read_text(encoding="utf-8")
        assert "case-template" in text
        assert "template" in text

    def test_write_promotion_report_escapes_table_cells(self, tmp_path):
        candidates = [PromotionCandidate(
            kind="template",
            name="case | template",
            path="index.html",
            reason="line1\nline2 | reason",
        )]
        path = write_promotion_report(tmp_path, candidates)
        text = path.read_text(encoding="utf-8")
        assert "case \\| template" in text
        assert "line1 line2 \\| reason" in text
