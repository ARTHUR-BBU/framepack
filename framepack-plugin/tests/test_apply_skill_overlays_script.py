import json
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "apply_skill_overlays.py"


def write_skill(skills_dir: Path, name: str, text: str) -> Path:
    skill_dir = skills_dir / name
    skill_dir.mkdir(parents=True)
    path = skill_dir / "SKILL.md"
    path.write_text(text, encoding="utf-8")
    return path


def run_cli(*args: str) -> dict:
    result = subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        text=True,
        capture_output=True,
        check=True,
    )
    return json.loads(result.stdout)


def test_cli_defaults_to_dry_run_without_writing(tmp_path):
    skills_dir = tmp_path / "skills"
    skill_path = write_skill(skills_dir, "hyperframes", "# HyperFrames\n")
    before = skill_path.read_text(encoding="utf-8")

    data = run_cli("--skills-dir", str(skills_dir))

    assert data["kind"] == "framepack_skill_overlay_plan"
    assert data["apply"] is False
    assert data["status"] == "would_change"
    assert skill_path.read_text(encoding="utf-8") == before


def test_cli_apply_writes_overlay(tmp_path):
    skills_dir = tmp_path / "skills"
    skill_path = write_skill(skills_dir, "hyperframes", "# HyperFrames\n")

    data = run_cli("--skills-dir", str(skills_dir), "--apply")

    assert data["apply"] is True
    assert data["status"] == "changed"
    after = skill_path.read_text(encoding="utf-8")
    assert "FRAMEPACK HARDENING START" in after
    assert "hf-root-duration" in after


def test_cli_can_write_report_to_output_file(tmp_path):
    skills_dir = tmp_path / "skills"
    write_skill(skills_dir, "hyperframes", "# HyperFrames\n")
    output = tmp_path / "reports" / "overlay-plan.json"

    data = run_cli("--skills-dir", str(skills_dir), "--output", str(output))

    assert output.is_file()
    assert json.loads(output.read_text(encoding="utf-8")) == data
