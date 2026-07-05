from pathlib import Path
import json
import subprocess
import sys

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "framepack_weapon_bench.py"


def test_weapon_bench_cli_run_writes_demo_and_scorecard(tmp_path):
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "run", "caption-clip-wipe", "--project", str(tmp_path), "--format", "json"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )

    assert result.returncode == 0, result.stderr
    data = json.loads(result.stdout)
    assert data["weapon_id"] == "caption-clip-wipe"
    assert data["demo_html"] == ".framepack/weapon-bench/caption-clip-wipe/demo.html"
    assert data["scorecard"] == ".framepack/weapon-bench/caption-clip-wipe/scorecard.json"
    assert (tmp_path / data["demo_html"]).is_file()
    assert (tmp_path / data["scorecard"]).is_file()
    scorecard = json.loads((tmp_path / data["scorecard"]).read_text(encoding="utf-8"))
    assert scorecard["score_class"] == "B"
    assert scorecard["recommended_presets"]
    assert scorecard["avoid"]
    assert scorecard["evidence"]["lint"] == "pass"
    assert scorecard["evidence"]["validate"] == "pass"
    assert "external weapon function" in scorecard["evidence"]["keyframes"]
    html = (tmp_path / data["demo_html"]).read_text(encoding="utf-8")
    assert 'data-composition-id="main"' in html
    assert 'data-duration="8"' in html
    assert 'class="clip"' in html
    assert 'window.__timelines["main"]' in html
    assert 'caption-clip-wipe.js' in html
    assert 'captionClipWipe(tl,' in html
    assert "direction: 'left-to-right'" in html
    assert "direction: 'center-out'" in html
    assert "direction: 'top-to-bottom'" in html


def test_weapon_bench_cli_score_outputs_markdown(tmp_path):
    subprocess.run(
        [sys.executable, str(SCRIPT), "run", "caption-clip-wipe", "--project", str(tmp_path), "--format", "json"],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )

    result = subprocess.run(
        [sys.executable, str(SCRIPT), "score", "caption-clip-wipe", "--project", str(tmp_path), "--format", "markdown"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )

    assert result.returncode == 0, result.stderr
    assert "# Weapon Scorecard: caption-clip-wipe" in result.stdout
    assert "Class:" in result.stdout
