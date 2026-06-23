"""Tests for P2.2 HyperFrames catalog component discovery."""

from __future__ import annotations

import json
from pathlib import Path

from core.catalog_discovery import (
    CatalogComponent,
    discover_catalog_components,
    merge_discovered_catalog,
)
from core.catalog_decision import CATALOG_COMPONENTS


class TestCatalogDiscovery:
    def test_missing_catalog_returns_empty(self, tmp_path):
        components = discover_catalog_components(tmp_path)
        assert components == []

    def test_discovers_hyperframes_catalog_json(self, tmp_path):
        hf = tmp_path / ".hyperframes"
        hf.mkdir()
        (hf / "catalog.json").write_text(json.dumps({
            "components": [
                {"name": "hero-title", "description": "Hero title block", "tags": ["title", "launch"]},
                {"name": "stat-strip", "description": "Stats strip", "tags": ["data"]},
            ]
        }), encoding="utf-8")
        components = discover_catalog_components(tmp_path)
        names = {c.name for c in components}
        assert names == {"hero-title", "stat-strip"}
        assert components[0].source.endswith(".hyperframes/catalog.json")

    def test_discovers_hyperframes_json_catalog_components(self, tmp_path):
        (tmp_path / "hyperframes.json").write_text(json.dumps({
            "catalog": {
                "components": {
                    "kinetic-poster": {"description": "Poster layout", "use_cases": ["poster"]}
                }
            }
        }), encoding="utf-8")
        components = discover_catalog_components(tmp_path)
        assert len(components) == 1
        assert components[0].name == "kinetic-poster"
        assert "poster" in components[0].use_cases

    def test_discovers_node_modules_catalog_manifest(self, tmp_path):
        manifest = tmp_path / "node_modules" / "@hyperframes" / "catalog" / "catalog.json"
        manifest.parent.mkdir(parents=True)
        manifest.write_text(json.dumps({
            "components": [{"name": "caption-card", "tags": ["caption"]}]
        }), encoding="utf-8")
        components = discover_catalog_components(tmp_path)
        assert [c.name for c in components] == ["caption-card"]

    def test_dedupes_components_by_name(self, tmp_path):
        hf = tmp_path / ".hyperframes"
        hf.mkdir()
        (hf / "catalog.json").write_text(json.dumps({
            "components": [{"name": "hero-title", "tags": ["title"]}]
        }), encoding="utf-8")
        (tmp_path / "hyperframes.json").write_text(json.dumps({
            "catalog": {"components": {"hero-title": {"description": "Duplicate"}}}
        }), encoding="utf-8")
        components = discover_catalog_components(tmp_path)
        assert [c.name for c in components] == ["hero-title"]

    def test_malformed_catalog_is_ignored(self, tmp_path):
        hf = tmp_path / ".hyperframes"
        hf.mkdir()
        (hf / "catalog.json").write_text("not json", encoding="utf-8")
        components = discover_catalog_components(tmp_path)
        assert components == []


class TestMergeDiscoveredCatalog:
    def test_merge_preserves_builtin_and_adds_discovered(self):
        discovered = [CatalogComponent(name="hero-title", description="Hero", use_cases=["launch"], source="x")]
        merged = merge_discovered_catalog(CATALOG_COMPONENTS, discovered)
        assert "kinetic-title" in merged
        assert "hero-title" in merged
        assert merged["hero-title"]["description"] == "Hero"

    def test_merge_discovered_does_not_override_builtin(self):
        discovered = [CatalogComponent(name="kinetic-title", description="Override", use_cases=["bad"], source="x")]
        merged = merge_discovered_catalog(CATALOG_COMPONENTS, discovered)
        assert merged["kinetic-title"]["description"] != "Override"
