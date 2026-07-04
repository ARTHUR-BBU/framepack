"""HANDWRITE reason truthfulness audit regression tests.

If Execution Manifest claims HANDWRITE because "no exact builtin weapon" while the
scene text clearly matches a MOC weapon, quality_audit should flag it.
"""

from pathlib import Path

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


def _issues_by_code(report, code: str):
    return [issue for issue in report.issues if issue.code == code]


def test_handwrite_numeric_scene_flags_number_count_up(tmp_path):
    project = _make_project(
        tmp_path,
        """
## Scene 3 — 120+ 数据冲击
Concept: The hero number "120+" should jump from zero to the target with snap.
Animation choreography: 裸 tl.from(y+opacity) for the number.

## Execution Manifest
scene_3:
  weapon: HANDWRITE
  reason: no exact builtin weapon
""",
    )

    report = audit_project(project)
    issues = _issues_by_code(report, "handwrite_weapon_mismatch")

    assert issues
    assert issues[0].severity == "P1"
    assert issues[0].weapon_id == "number-count-up"
    assert "number-count-up" in issues[0].message
    assert issues[0].details["handwrite_reason"] == "no exact builtin weapon"


def test_handwrite_chart_scene_flags_data_chart_editorial(tmp_path):
    project = _make_project(
        tmp_path,
        """
## Scene 4 — 市场数据图表
Concept: editorial market chart with SVG path and stroke-dashoffset draw-on.
Animation choreography: 手写 SVG path + dashoffset.

## Execution Manifest
scene_4:
  weapon: HANDWRITE
  reason: no exact builtin weapon for custom chart
""",
    )

    report = audit_project(project)
    issues = _issues_by_code(report, "handwrite_weapon_mismatch")

    assert issues
    assert issues[0].severity == "P1"
    assert issues[0].weapon_id == "data-chart-editorial"
    assert "data-chart-editorial" in issues[0].message


def test_handwrite_title_entrance_flags_text_weapon(tmp_path):
    project = _make_project(
        tmp_path,
        """
## Scene 1 — 标题“东方之润”进场
Concept: luxury title entrance for 东方之润.
Animation choreography: 裸 tl.from(opacity+y) title reveal.

## Execution Manifest
scene_1:
  weapon: HANDWRITE
  reason: no exact builtin weapon
""",
    )

    report = audit_project(project)
    issues = _issues_by_code(report, "handwrite_weapon_mismatch")

    assert issues
    assert issues[0].weapon_id in {"text-split-enter", "caption-clip-wipe", "splittext-stagger-chars"}
    assert "HANDWRITE reason" in issues[0].message


def test_custom_shader_handwrite_with_specific_reason_is_not_flagged(tmp_path):
    project = _make_project(
        tmp_path,
        """
## Scene 5 — Custom WebGL pearl refraction
Concept: A bespoke fragment-shader refraction over product photography.
Animation choreography: shader uniforms drive caustic displacement.

## Execution Manifest
scene_5:
  weapon: HANDWRITE
  reason: bespoke WebGL shader refraction; no DOM/SVG/text/count/chart primitive involved
""",
    )

    report = audit_project(project)
    assert not _issues_by_code(report, "handwrite_weapon_mismatch")
