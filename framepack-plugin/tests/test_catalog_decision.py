"""Tests for P1.4 Catalog Decision Helper."""

from __future__ import annotations

from pathlib import Path

from core.catalog_decision import (
    CatalogDecision,
    CATALOG_COMPONENTS,
    suggest_components,
    validate_decision,
    load_decision,
    save_decision,
)


class TestCatalogComponents:
    def test_known_components_exist(self):
        assert "kinetic-title" in CATALOG_COMPONENTS
        assert "data-card" in CATALOG_COMPONENTS

    def test_components_have_metadata(self):
        for name, meta in CATALOG_COMPONENTS.items():
            assert "use_cases" in meta
            assert isinstance(meta["use_cases"], list)


class TestSuggestComponents:
    def test_brand_launch_suggests_kinetic_title(self):
        result = suggest_components("品牌发布", scene_count=5)
        assert "kinetic-title" in result

    def test_data_heavy_suggests_data_card(self):
        result = suggest_components("展示产品数据和指标", scene_count=4)
        assert "data-card" in result

    def test_caption_heavy_suggests_caption_block(self):
        result = suggest_components("字幕和旁白", scene_count=4)
        # caption-related components should be suggested
        assert any("caption" in r for r in result)


class TestValidateDecision:
    def test_valid_decision(self, tmp_path):
        d = CatalogDecision(
            used_components=["kinetic-title"],
            waived_components=["data-card"],
            reason_if_none_used="",
        )
        issues = validate_decision(d)
        assert len(issues) == 0

    def test_empty_decision_needs_reason(self, tmp_path):
        d = CatalogDecision(
            used_components=[],
            waived_components=[],
            reason_if_none_used="",
        )
        issues = validate_decision(d)
        assert any("reason" in i.lower() for i in issues)

    def test_empty_decision_with_reason_ok(self, tmp_path):
        d = CatalogDecision(
            used_components=[],
            waived_components=[],
            reason_if_none_used="Custom HTML is more appropriate for this case.",
        )
        issues = validate_decision(d)
        assert len(issues) == 0

    def test_save_and_load(self, tmp_path):
        d = CatalogDecision(
            used_components=["kinetic-title", "data-card"],
            waived_components=[],
            reason_if_none_used="",
        )
        p = tmp_path / ".framepack" / "catalog-decision.md"
        save_decision(d, p)
        assert p.is_file()
        loaded = load_decision(p)
        assert loaded is not None
        assert "kinetic-title" in loaded.used_components
