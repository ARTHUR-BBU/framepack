from pathlib import Path
import json
import subprocess
import sys

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "framepack_match_weapons.py"


def _make_project(tmp_path: Path, prompt: str) -> Path:
    (tmp_path / ".hyperframes").mkdir()
    (tmp_path / ".framepack").mkdir()
    (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text(prompt, encoding="utf-8")
    return tmp_path


def test_match_weapons_cli_writes_plan_json(tmp_path):
    project = _make_project(
        tmp_path,
        """
## Scene 3 — 120+ 数据冲击
The KPI number 120+ should count up with snap.
""",
    )

    result = subprocess.run(
        [sys.executable, str(SCRIPT), str(project), "--format", "json"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )

    assert result.returncode == 0, result.stderr
    data = json.loads(result.stdout)
    assert data["kind"] == "framepack_weapon_load_plan"
    assert data["scenes"][0]["selected"] == "number-count-up"
    assert (project / ".framepack" / "weapon-load-plan.json").is_file()
    assert (project / ".framepack" / "weapon-load-plan.md").is_file()


def test_match_weapons_cli_no_match_still_writes_waiver(tmp_path):
    project = _make_project(
        tmp_path,
        """
## Scene 9 — custom shader
Bespoke WebGL pearl refraction shader.
""",
    )

    result = subprocess.run(
        [sys.executable, str(SCRIPT), str(project), "--format", "text"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )

    assert result.returncode == 0, result.stderr
    assert "HANDWRITE waivers: 1" in result.stdout
    data = json.loads((project / ".framepack" / "weapon-load-plan.json").read_text(encoding="utf-8"))
    assert data["scenes"][0]["handwrite"] is True
    assert data["handwrite_waivers"][0]["checked_sources"]


def test_match_weapons_cli_dry_run_does_not_write(tmp_path):
    project = _make_project(tmp_path, "## Scene 1\nTitle hero text split-enter reveal.")

    result = subprocess.run(
        [sys.executable, str(SCRIPT), str(project), "--dry-run", "--format", "markdown"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )

    assert result.returncode == 0, result.stderr
    assert "Framepack Weapon Load Plan" in result.stdout
    assert not (project / ".framepack" / "weapon-load-plan.json").exists()
