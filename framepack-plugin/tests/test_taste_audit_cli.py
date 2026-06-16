import json

from core.taste_audit import TasteAuditIssue, TasteAuditReport
from scripts.framepack_taste_audit import main, render_markdown


def test_render_markdown_includes_summary_and_issues():
    report = TasteAuditReport(
        project_dir="/tmp/project",
        summary={"risk": 1, "suggestion": 0, "note": 0},
        issues=[TasteAuditIssue("static_mockup_risk", "risk", "Static mockup.", "Choreograph it.")],
    )
    rendered = render_markdown(report)
    assert "# Framepack Taste Audit" in rendered
    assert "| risk | 1 |" in rendered
    assert "static_mockup_risk" in rendered
    assert "Choreograph it." in rendered


def test_main_outputs_json(tmp_path, capsys):
    project = tmp_path / "project"
    project.mkdir()
    (project / "frame.md").write_text("---\ncolors: {}\n---\n", encoding="utf-8")
    exit_code = main([str(project), "--format", "json"])
    assert exit_code == 0
    data = json.loads(capsys.readouterr().out)
    assert data["kind"] == "framepack_taste_audit"


def test_main_writes_output_file(tmp_path):
    project = tmp_path / "project"
    project.mkdir()
    (project / "frame.md").write_text("---\ncolors: {}\n---\n", encoding="utf-8")
    output = tmp_path / "taste.md"
    exit_code = main([str(project), "--format", "markdown", "--output", str(output)])
    assert exit_code == 0
    assert "Framepack Taste Audit" in output.read_text(encoding="utf-8")
