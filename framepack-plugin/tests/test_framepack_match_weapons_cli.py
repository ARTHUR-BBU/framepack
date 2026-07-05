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


def test_match_weapons_cli_suggests_caption_clip_wipe_preset(tmp_path):
    project = _make_project(
        tmp_path,
        """
## Scene 2 — product callout
Premium product-callout lower-third caption with a short quote and metric-label.
Use caption clip wipe motion.
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
    match = data["scenes"][0]["matches"][0]
    assert data["scenes"][0]["selected"] == "caption-clip-wipe"
    assert match["preset_id"] == "editorial_lower_third"
    assert match["score_class"] == "B"
    assert match["studio_editable"] is False
    assert match["params_hint"]["direction"] == "left-to-right"


def test_matcher_does_not_treat_negated_caption_as_caption_weapon(tmp_path):
    from core.weapon_matcher import match_weapons_for_prompt

    plan = match_weapons_for_prompt("Scene 1: calm pearl macro shot with no caption or callout overlays")
    ids = {match.id for scene in plan.scenes for match in scene.matches}

    assert "caption-clip-wipe" not in ids
