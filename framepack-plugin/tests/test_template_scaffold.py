"""Tests for scaffolding and packaging template bundles."""

from __future__ import annotations

import json

import pytest

from core.templates.scaffold import scaffold_template_bundle
from core.templates.productize import package_template_source
from core.templates.types import TemplateCard, inspect_template_bundle


def card(tmp_path, template_id="miara-style-template") -> TemplateCard:
    return TemplateCard(
        id=template_id,
        name="Miara Style Template",
        description="Glassy mascot/product explainer template",
        suitable_for=("product launch", "brand explainer"),
        not_suitable_for=("legal report",),
        params=("brand_name", "tagline", "accent_color"),
        path=str(tmp_path).replace("\\", "/"),
    )


def test_scaffold_template_bundle_writes_standard_files(tmp_path):
    target = tmp_path / "templates" / "miara-style-template"

    scaffold_template_bundle(target, card(target))

    assert (target / "TEMPLATE_CARD.md").is_file()
    assert (target / "TEMPLATE_GUIDE.md").is_file()
    assert (target / "PARAMS.md").is_file()
    example = json.loads((target / "template.params.example.json").read_text(encoding="utf-8"))
    assert example == {"brand_name": "", "tagline": "", "accent_color": ""}
    assert (target / "assets").is_dir()
    assert (target / "renders").is_dir()
    assert (target / "snapshots").is_dir()
    assert (target / "SOURCE_NOTES.md").is_file()
    report = inspect_template_bundle(target)
    assert report.status == "complete"


def test_scaffold_refuses_to_overwrite_existing_files_by_default(tmp_path):
    target = tmp_path / "template"
    target.mkdir()
    (target / "TEMPLATE_CARD.md").write_text("keep me", encoding="utf-8")

    with pytest.raises(FileExistsError):
        scaffold_template_bundle(target, card(target))

    assert (target / "TEMPLATE_CARD.md").read_text(encoding="utf-8") == "keep me"


def test_scaffold_can_overwrite_when_explicit(tmp_path):
    target = tmp_path / "template"
    target.mkdir()
    (target / "TEMPLATE_CARD.md").write_text("old", encoding="utf-8")

    scaffold_template_bundle(target, card(target), overwrite=True)

    assert "Miara Style Template" in (target / "TEMPLATE_CARD.md").read_text(encoding="utf-8")


def test_package_template_source_copies_selected_project_files(tmp_path):
    source = tmp_path / "source-case"
    source.mkdir()
    (source / "index.html").write_text("<div>source</div>", encoding="utf-8")
    (source / "hyperframes.json").write_text("{}", encoding="utf-8")
    (source / "package.json").write_text("{}", encoding="utf-8")
    (source / "assets").mkdir()
    (source / "assets" / "logo.png").write_bytes(b"png")
    (source / "renders").mkdir()
    (source / "renders" / "final.mp4").write_bytes(b"mp4")
    (source / "snapshots").mkdir()
    (source / "snapshots" / "hero.png").write_bytes(b"png")
    (source / "VIDEO_DNA.md").write_text("# DNA", encoding="utf-8")
    (source / "TEMPLATE_BLUEPRINT.md").write_text("# Blueprint", encoding="utf-8")
    hermes = source / ".hermes"
    hermes.mkdir()
    (hermes / "content_decomposition.md").write_text("# Content", encoding="utf-8")

    target = tmp_path / "template"
    package_template_source(source, target, card(target))

    assert (target / "index.html").read_text(encoding="utf-8") == "<div>source</div>"
    assert (target / "assets" / "logo.png").read_bytes() == b"png"
    assert (target / "renders" / "final.mp4").read_bytes() == b"mp4"
    assert (target / "snapshots" / "hero.png").read_bytes() == b"png"
    assert (target / "source" / "VIDEO_DNA.md").is_file()
    assert (target / "source" / "TEMPLATE_BLUEPRINT.md").is_file()
    assert (target / "source" / "content_decomposition.md").is_file()
    source_notes = (target / "SOURCE_NOTES.md").read_text(encoding="utf-8")
    assert "source-case" in source_notes
    assert "reference video" in source_notes.lower()


def test_package_requires_existing_source(tmp_path):
    with pytest.raises(FileNotFoundError):
        package_template_source(tmp_path / "missing", tmp_path / "target", card(tmp_path / "target"))
