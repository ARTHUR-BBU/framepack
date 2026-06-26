"""Tests for framepack_template.py CLI."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "framepack_template.py"


def run_cli(*args):
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        text=True,
        capture_output=True,
        check=False,
    )


def test_inspect_outputs_json_for_incomplete_template(tmp_path):
    result = run_cli("inspect", str(tmp_path), "--format", "json")

    assert result.returncode == 0
    data = json.loads(result.stdout)
    assert data["status"] == "incomplete"
    assert data["card"] is None
    assert data["issues"][0]["code"] == "missing_template_card"


def test_list_outputs_json_for_templates_root(tmp_path):
    template = tmp_path / "templates" / "demo"
    scaffold = run_cli(
        "scaffold",
        str(template),
        "--id", "demo",
        "--name", "Demo Template",
        "--description", "A demo template",
        "--suitable-for", "product launch",
        "--param", "brand_name",
    )
    assert scaffold.returncode == 0, scaffold.stderr

    result = run_cli("list", "--root", str(tmp_path), "--format", "json")

    assert result.returncode == 0
    data = json.loads(result.stdout)
    assert [item["card"]["id"] for item in data["templates"]] == ["demo"]


def test_scaffold_creates_bundle_from_cli(tmp_path):
    target = tmp_path / "template"

    result = run_cli(
        "scaffold",
        str(target),
        "--id", "cli-template",
        "--name", "CLI Template",
        "--description", "Created by CLI",
        "--suitable-for", "brand explainer",
        "--param", "headline",
        "--param", "cta",
    )

    assert result.returncode == 0, result.stderr
    assert (target / "TEMPLATE_CARD.md").is_file()
    example = json.loads((target / "template.params.example.json").read_text(encoding="utf-8"))
    assert example == {"headline": "", "cta": ""}


def test_package_copies_source_files_from_cli(tmp_path):
    source = tmp_path / "source"
    source.mkdir()
    (source / "index.html").write_text("<div>ok</div>", encoding="utf-8")
    (source / "VIDEO_DNA.md").write_text("# DNA", encoding="utf-8")
    target = tmp_path / "template"

    result = run_cli(
        "package",
        str(source),
        str(target),
        "--id", "packaged-template",
        "--name", "Packaged Template",
        "--description", "Packaged from source",
        "--suitable-for", "reference remake",
        "--param", "brand_name",
    )

    assert result.returncode == 0, result.stderr
    assert (target / "index.html").read_text(encoding="utf-8") == "<div>ok</div>"
    assert (target / "source" / "VIDEO_DNA.md").is_file()


def test_invalid_package_source_exits_2(tmp_path):
    result = run_cli(
        "package",
        str(tmp_path / "missing"),
        str(tmp_path / "target"),
        "--id", "bad",
        "--name", "Bad",
        "--description", "Bad source",
    )

    assert result.returncode == 2
    assert "not found" in result.stderr.lower() or "no such" in result.stderr.lower()


def test_inspect_missing_path_exits_2(tmp_path):
    result = run_cli("inspect", str(tmp_path / "missing"), "--format", "json")

    assert result.returncode == 2
    assert "not found" in result.stderr.lower()


def test_list_missing_root_exits_2(tmp_path):
    result = run_cli("list", "--root", str(tmp_path / "missing"), "--format", "json")

    assert result.returncode == 2
    assert "not found" in result.stderr.lower()
