"""Tests for template bundle arsenal registration and selection."""

from __future__ import annotations

import json

import pytest

from core.templates.arsenal import (
    list_registered_templates,
    recommend_templates,
    register_template_bundle,
    select_template,
)
from core.templates.scaffold import scaffold_template_bundle
from core.templates.types import TemplateCard


def card(template_dir, template_id="demo-template") -> TemplateCard:
    return TemplateCard(
        id=template_id,
        name="Demo Template",
        description="Reusable product-launch template",
        suitable_for=("product launch", "brand explainer"),
        not_suitable_for=("legal report",),
        params=("brand_name", "tagline", "accent_color"),
        path=str(template_dir).replace("\\", "/"),
    )


def make_template(tmp_path, template_id="demo-template"):
    template_dir = tmp_path / "templates" / template_id
    scaffold_template_bundle(template_dir, card(template_dir, template_id))
    (template_dir / "index.html").write_text("<div>template</div>", encoding="utf-8")
    return template_dir


def read_arsenal(project_dir):
    return json.loads((project_dir / ".framepack" / "arsenal.json").read_text(encoding="utf-8"))


def test_register_template_bundle_adds_template_suite_weapon(tmp_path):
    project = tmp_path / "project"
    project.mkdir()
    template_dir = make_template(tmp_path)

    result = register_template_bundle(project, template_dir)

    data = read_arsenal(project)
    entry = data["weapons"]["demo-template"]
    assert result.changed is True
    assert result.entry["id"] == "demo-template"
    assert entry["kind"] == "template_suite"
    assert entry["source"] == "local"
    assert entry["status"] == "active"
    assert entry["name"] == "Demo Template"
    assert entry["description"] == "Reusable product-launch template"
    assert entry["suitable_for"] == ["product launch", "brand explainer"]
    assert entry["not_suitable_for"] == ["legal report"]
    assert entry["params"] == ["brand_name", "tagline", "accent_color"]
    assert entry["hash"].startswith("sha256:")
    assert entry["template_card"].endswith("TEMPLATE_CARD.md")


def test_register_template_bundle_preserves_existing_weapons(tmp_path):
    project = tmp_path / "project"
    framepack = project / ".framepack"
    framepack.mkdir(parents=True)
    (framepack / "arsenal.json").write_text(
        json.dumps({"schema_version": "1.0.0", "weapons": {"custom": {"id": "custom", "source": "library"}}}),
        encoding="utf-8",
    )
    template_dir = make_template(tmp_path)

    register_template_bundle(project, template_dir)

    data = read_arsenal(project)
    assert data["weapons"]["custom"]["source"] == "library"
    assert data["weapons"]["demo-template"]["kind"] == "template_suite"


def test_register_template_bundle_is_idempotent_for_unchanged_bundle(tmp_path):
    project = tmp_path / "project"
    project.mkdir()
    template_dir = make_template(tmp_path)

    first = register_template_bundle(project, template_dir)
    second = register_template_bundle(project, template_dir)

    assert first.changed is True
    assert second.changed is False


def test_register_template_bundle_rejects_incomplete_template_without_mutating_registry(tmp_path):
    project = tmp_path / "project"
    project.mkdir()
    template_dir = tmp_path / "templates" / "broken"
    template_dir.mkdir(parents=True)

    with pytest.raises(ValueError, match="missing_template_card"):
        register_template_bundle(project, template_dir)

    assert not (project / ".framepack" / "arsenal.json").exists()


def test_list_registered_templates_returns_template_suites_only_sorted(tmp_path):
    project = tmp_path / "project"
    framepack = project / ".framepack"
    framepack.mkdir(parents=True)
    (framepack / "arsenal.json").write_text(
        json.dumps(
            {
                "schema_version": "1.0.0",
                "weapons": {
                    "z-template": {"id": "z-template", "kind": "template_suite", "source": "local", "status": "active"},
                    "text-split-enter": {"id": "text-split-enter", "kind": "part", "source": "builtin"},
                    "a-template": {"id": "a-template", "kind": "template_suite", "source": "local", "status": "active"},
                },
            }
        ),
        encoding="utf-8",
    )

    templates = list_registered_templates(project)

    assert [item["id"] for item in templates] == ["a-template", "z-template"]


def test_select_template_writes_selection_evidence_and_missing_param_questions(tmp_path):
    project = tmp_path / "project"
    project.mkdir()
    template_dir = make_template(tmp_path)
    register_template_bundle(project, template_dir)

    result = select_template(
        project,
        "demo-template",
        brief="Launch Acme",
        params={"brand_name": "Acme"},
        assets=["assets/logo.png"],
    )

    selection_path = project / ".framepack" / "template-selection.md"
    text = selection_path.read_text(encoding="utf-8")
    assert result["selection_path"].endswith(".framepack/template-selection.md")
    assert result["missing_params"] == ["tagline", "accent_color"]
    assert "demo-template" in text
    assert "Launch Acme" in text
    assert "brand_name: Acme" in text
    assert "assets/logo.png" in text
    assert "tagline" in text
    assert "accent_color" in text


def test_select_missing_template_raises_without_writing_selection(tmp_path):
    project = tmp_path / "project"
    project.mkdir()
    make_template(tmp_path)

    with pytest.raises(KeyError):
        select_template(project, "missing-template")

    assert not (project / ".framepack" / "template-selection.md").exists()


def test_recommend_templates_scores_by_suitable_for_overlap(tmp_path):
    project = tmp_path / "project"
    project.mkdir()

    def add(template_id, suitable_for, not_suitable_for=()):
        template_dir = tmp_path / "templates" / template_id
        scaffold_template_bundle(
            template_dir,
            TemplateCard(
                id=template_id,
                name=template_id.replace("-", " ").title(),
                description=f"{template_id} template",
                suitable_for=suitable_for,
                not_suitable_for=not_suitable_for,
                params=("brand_name",),
                path=str(template_dir).replace("\\", "/"),
            ),
        )
        register_template_bundle(project, template_dir)

    add("lux-template", ("product launch", "brand explainer"))
    add("edu-template", ("educational", "explainer"))
    add("social-template", ("social teaser",))

    recommendations = recommend_templates(project, "帮我做一个产品发布品牌视频")

    assert recommendations
    assert recommendations[0]["template_id"] == "lux-template"
    assert recommendations[0]["matched_tags"] == ["product launch"]
    assert recommendations[0]["score"] > 0
    assert recommendations[-1]["score"] == 0


def test_recommend_templates_penalizes_not_suitable_match(tmp_path):
    project = tmp_path / "project"
    project.mkdir()

    def add(template_id, suitable_for, not_suitable_for=()):
        template_dir = tmp_path / "templates" / template_id
        scaffold_template_bundle(
            template_dir,
            TemplateCard(
                id=template_id,
                name=template_id.replace("-", " ").title(),
                description=f"{template_id} template",
                suitable_for=suitable_for,
                not_suitable_for=not_suitable_for,
                params=("brand_name",),
                path=str(template_dir).replace("\\", "/"),
            ),
        )
        register_template_bundle(project, template_dir)

    add("good", ("product launch",))
    add("bad", ("product launch",), not_suitable_for=("legal report",))

    recommendations = recommend_templates(project, "product launch for a legal report")

    good = next(item for item in recommendations if item["template_id"] == "good")
    bad = next(item for item in recommendations if item["template_id"] == "bad")
    assert good["score"] > bad["score"]
    assert "legal report" in bad["excluded_tags"]


def test_recommend_templates_returns_empty_when_no_templates_registered(tmp_path):
    project = tmp_path / "project"
    project.mkdir()

    recommendations = recommend_templates(project, "anything")

    assert recommendations == []
