"""HANDWRITE reason truthfulness audit regression tests.

If Execution Manifest claims HANDWRITE because "no exact builtin weapon" while the
scene text clearly matches a MOC weapon, quality_audit should flag it.
"""

from pathlib import Path

import pytest
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.quality_audit import audit_project


def _make_project(tmp_path: Path, expanded_prompt: str) -> Path:
    (tmp_path / ".hyperframes").mkdir()
    (tmp_path / ".framepack").mkdir()
    (tmp_path / "frame.md").write_text("colors:\n  background: '#111111'\n", encoding="utf-8")
    (tmp_path / "index.html").write_text(
        "<div data-duration=\"12\"><div class=\"clip\" data-start=\"0\" data-duration=\"3\" data-track-index=\"0\"><div class=\"scene-inner\"></div></div></div>",
        encoding="utf-8",
    )
    (tmp_path / ".framepack" / "arsenal.json").write_text(
        '{"project":"%s","weapons":{},"hyperframes_config":{"duration":12}}' % tmp_path.name,
        encoding="utf-8",
    )
    (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text(expanded_prompt, encoding="utf-8")
    return tmp_path


def _prompt_for(scene_text: str, reason: str = "no exact builtin weapon") -> str:
    return f"""
## Scene 1 — Weapon candidate
{scene_text}

## Execution Manifest
scene_1:
  weapon: HANDWRITE
  reason: {reason}
"""


def _issues_by_code(report, code: str):
    return [issue for issue in report.issues if issue.code == code]


@pytest.mark.parametrize(
    ("weapon_id", "scene_text"),
    [
        ("text-split-enter", "Title hero text 东方之润 needs a dramatic split-enter entrance and reveal."),
        ("splittext-stagger-chars", "逐字 characters fly in with stagger chars, each letter animated independently."),
        ("caption-clip-wipe", "Subtitle caption should wipe left-to-right with clip-path reveal."),
        ("typewriter-cursor", "Terminal typewriter cursor types the line out character by character."),
        ("anime-text-split", "Use anime.js lightweight text split for letters and words."),
        ("number-count-up", "The KPI number 120+ should count and jump from zero to the target."),
        ("data-chart-editorial", "NYT editorial chart with SVG path stroke-dashoffset and data points."),
        ("sticky-flowchart", "Sticky note flowchart on a whiteboard with nodes and connection lines."),
        ("macos-notification", "A macOS notification toast banner slides in as social proof."),
        ("card-cascade-reveal", "Feature cards cascade into a fan grid with staggered reveal."),
        ("hero-3d-device-spin", "3D device spin for a MacBook mockup with product screenshot."),
        ("stagger-grid-reveal", "Bento grid tiles reveal with stagger from center outward."),
        ("float-3d-card", "Floating card with 3D parallax and subtle rotationX perspective."),
        ("bg-blur-mask", "Background blur mask with backdrop-filter darkens the background to focus foreground."),
        ("gradient-shift", "Animated gradient background shifts colors in a breathing flow."),
        ("particle-blob-bg", "Particle blob organic background slowly morphs behind content."),
        ("light-leak-cinema", "35mm film grain with warm light leak and letterbox cinema atmosphere."),
        ("glitch-flicker", "Glitch flicker CRT interference and digital noise hit the title."),
        ("elastic-scale-enter", "Icon should pop in with elastic bounce scale enter."),
        ("sprite-animation", "Sprite sheet frame animation plays sequence frames for the mascot."),
        ("svg-morph-transition", "SVG path morph transition changes one shape into another."),
    ],
)
def test_handwrite_generic_reason_flags_obvious_builtin_weapon(tmp_path, weapon_id, scene_text):
    project = _make_project(tmp_path, _prompt_for(scene_text))

    report = audit_project(project)
    issues = _issues_by_code(report, "handwrite_weapon_mismatch")

    assert issues
    assert issues[0].weapon_id == weapon_id
    assert issues[0].severity in {"P1", "P2"}
    assert issues[0].details["matched_weapon"] == weapon_id


def test_handwrite_numeric_scene_flags_number_count_up(tmp_path):
    project = _make_project(
        tmp_path,
        _prompt_for('The hero number "120+" should jump from zero to the target with snap. 数字跳动数据冲击。'),
    )

    report = audit_project(project)
    issues = _issues_by_code(report, "handwrite_weapon_mismatch")

    assert issues
    assert issues[0].severity == "P1"
    assert issues[0].weapon_id == "number-count-up"
    assert "number-count-up" in issues[0].message
    assert issues[0].details["handwrite_reason"] == "no exact builtin weapon"


def test_custom_shader_handwrite_with_specific_reason_is_not_flagged(tmp_path):
    project = _make_project(
        tmp_path,
        _prompt_for(
            "A bespoke fragment-shader refraction over product photography; shader uniforms drive caustic displacement.",
            reason="bespoke WebGL shader refraction; no DOM/SVG/text/count/chart primitive involved",
        ),
    )

    report = audit_project(project)
    assert not _issues_by_code(report, "handwrite_weapon_mismatch")


def test_deprecated_transitions_pack_is_not_forced(tmp_path):
    """transitions-pack is deprecated; HANDWRITE/native HF transitions can be valid."""
    project = _make_project(
        tmp_path,
        _prompt_for(
            "Scene uses a blur crossfade transition between clips; HyperFrames native clip timing handles it.",
            reason="HyperFrames native transition; transitions-pack is deprecated",
        ),
    )

    report = audit_project(project)
    assert not _issues_by_code(report, "handwrite_weapon_mismatch")
