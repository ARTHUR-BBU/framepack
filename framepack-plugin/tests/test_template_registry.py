"""Tests for template bundle discovery."""

from __future__ import annotations

from core.templates.registry import discover_templates


def write_card(template_dir, template_id: str, name: str) -> None:
    template_dir.mkdir(parents=True, exist_ok=True)
    (template_dir / "TEMPLATE_CARD.md").write_text(f"""---
id: {template_id}
name: {name}
description: {name} description
suitable_for:
  - product launch
params:
  - brand_name
---
# {name}
""", encoding="utf-8")


def test_discovers_templates_under_templates_root(tmp_path):
    write_card(tmp_path / "templates" / "b-template", "b-template", "B Template")
    write_card(tmp_path / "templates" / "a-template", "a-template", "A Template")

    reports = discover_templates([tmp_path])

    assert [report.card.id for report in reports] == ["a-template", "b-template"]


def test_discovers_direct_template_directory(tmp_path):
    write_card(tmp_path, "direct-template", "Direct Template")

    reports = discover_templates([tmp_path])

    assert len(reports) == 1
    assert reports[0].card.name == "Direct Template"


def test_discovers_case_directories_with_cards(tmp_path):
    write_card(tmp_path / "cases" / "case-template", "case-template", "Case Template")
    (tmp_path / "cases" / "plain-case").mkdir(parents=True)

    reports = discover_templates([tmp_path])

    assert [report.card.id for report in reports] == ["case-template"]


def test_ignores_incomplete_directories_by_default(tmp_path):
    (tmp_path / "templates" / "missing-card").mkdir(parents=True)

    reports = discover_templates([tmp_path])

    assert reports == []


def test_can_include_incomplete_directories(tmp_path):
    (tmp_path / "templates" / "missing-card").mkdir(parents=True)

    reports = discover_templates([tmp_path], include_incomplete=True)

    assert len(reports) == 1
    assert reports[0].status == "incomplete"
    assert reports[0].card is None
