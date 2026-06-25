"""Tests for template-as-weapon card parsing and inspection."""

from __future__ import annotations

from core.templates.types import (
    TemplateCard,
    inspect_template_bundle,
    load_template_card,
)


def write_card(template_dir, text: str) -> None:
    template_dir.mkdir(parents=True, exist_ok=True)
    (template_dir / "TEMPLATE_CARD.md").write_text(text, encoding="utf-8")


def test_loads_template_card_frontmatter(tmp_path):
    write_card(tmp_path, """---
id: miara-style-template
name: Miara Style Template
description: Glassy mascot/product explainer template
suitable_for:
  - product launch
  - brand explainer
not_suitable_for:
  - legal report
params:
  - brand_name
  - tagline
---
# Miara Style Template
""")

    card = load_template_card(tmp_path)

    assert isinstance(card, TemplateCard)
    assert card.id == "miara-style-template"
    assert card.name == "Miara Style Template"
    assert card.description == "Glassy mascot/product explainer template"
    assert card.suitable_for == ("product launch", "brand explainer")
    assert card.not_suitable_for == ("legal report",)
    assert card.params == ("brand_name", "tagline")
    assert card.path.endswith("miara-style-template") or card.path == str(tmp_path).replace("\\", "/")


def test_missing_template_card_reports_incomplete_error(tmp_path):
    report = inspect_template_bundle(tmp_path)

    assert report.status == "incomplete"
    assert report.card is None
    assert any(issue.severity == "ERROR" and issue.code == "missing_template_card" for issue in report.issues)


def test_missing_optional_template_evidence_is_warning_not_exception(tmp_path):
    write_card(tmp_path, """---
id: sparse-template
name: Sparse Template
description: Has only required card metadata
suitable_for:
  - quick promo
params:
  - headline
---
# Sparse
""")

    report = inspect_template_bundle(tmp_path)

    assert report.card is not None
    assert report.status == "draft"
    assert not any(issue.severity == "ERROR" for issue in report.issues)
    codes = {issue.code for issue in report.issues}
    assert "missing_params_doc" in codes
    assert "missing_example_params" in codes


def test_complete_minimal_bundle_reports_complete(tmp_path):
    write_card(tmp_path, """---
id: complete-template
name: Complete Template
description: Complete enough for template list and use workflow
suitable_for:
  - product launch
params:
  - brand_name
---
# Complete
""")
    (tmp_path / "PARAMS.md").write_text("# Params\n- brand_name", encoding="utf-8")
    (tmp_path / "TEMPLATE_GUIDE.md").write_text("# Guide", encoding="utf-8")
    (tmp_path / "template.params.example.json").write_text('{"brand_name":"Acme"}', encoding="utf-8")
    (tmp_path / "index.html").write_text("<div></div>", encoding="utf-8")
    (tmp_path / "assets").mkdir()
    (tmp_path / "renders").mkdir()
    (tmp_path / "snapshots").mkdir()

    report = inspect_template_bundle(tmp_path)

    assert report.status == "complete"
    assert report.card is not None
    assert report.summary["id"] == "complete-template"
    assert report.summary["params"] == ["brand_name"]


def test_template_card_exposes_schema_and_template_suite_kind(tmp_path):
    write_card(tmp_path, """---
id: complete-template
kind: template_suite
schema_version: "1.0"
name: Complete Template
description: Complete enough for template list and use workflow
suitable_for:
  - product launch
params:
  - brand_name
---
# Complete
""")

    card = load_template_card(tmp_path)

    assert card is not None
    assert card.to_dict()["schema_version"] == "1.0"
    assert card.to_dict()["kind"] == "template_suite"


def test_inspect_flags_invalid_template_id(tmp_path):
    write_card(tmp_path, """---
id: ../bad
name: Bad Template
description: Bad id
suitable_for:
  - product launch
params:
  - brief
---
# Bad
""")
    (tmp_path / "PARAMS.md").write_text("# Params", encoding="utf-8")
    (tmp_path / "TEMPLATE_GUIDE.md").write_text("# Guide", encoding="utf-8")
    (tmp_path / "template.params.example.json").write_text('{"brief":""}', encoding="utf-8")

    report = inspect_template_bundle(tmp_path)

    assert report.status == "incomplete"
    assert any(issue.code == "invalid_template_id" for issue in report.issues)
