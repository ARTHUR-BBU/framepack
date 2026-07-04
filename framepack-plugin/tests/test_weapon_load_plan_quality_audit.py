from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.quality_audit import audit_project
from core.weapon_load_plan import SceneWeaponPlan, WeaponLoadPlan, WeaponMatch, write_weapon_load_plan


def _make_project(tmp_path: Path, html: str) -> Path:
    (tmp_path / ".hyperframes").mkdir()
    (tmp_path / ".framepack").mkdir()
    (tmp_path / "frame.md").write_text("colors:\n  background: '#111111'\n", encoding="utf-8")
    (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text("## Scene 1\nNumber 120+ count up", encoding="utf-8")
    (tmp_path / ".framepack" / "arsenal.json").write_text(
        '{"project":"%s","weapons":{},"hyperframes_config":{"duration":12}}' % tmp_path.name,
        encoding="utf-8",
    )
    (tmp_path / "index.html").write_text(html, encoding="utf-8")
    return tmp_path


def _write_number_plan(project: Path):
    plan = WeaponLoadPlan(
        version="0.1",
        source_prompt=".hyperframes/expanded-prompt.md",
        scenes=[
            SceneWeaponPlan(
                scene="scene_1",
                need="number count",
                selected="number-count-up",
                handwrite=False,
                matches=[
                    WeaponMatch(
                        source="framepack_builtin",
                        id="number-count-up",
                        confidence="high",
                        reuse_mode="full",
                        load={"skill": "framepack-animation-library", "file_path": "parts/references/number-count-up.js"},
                    )
                ],
            )
        ],
        required_skill_loads=[],
        handwrite_waivers=[],
    )
    write_weapon_load_plan(project, plan)


def test_quality_audit_reports_weapon_load_plan_not_implemented(tmp_path):
    project = _make_project(tmp_path, "<script>const tl = gsap.timeline(); tl.from('#n',{opacity:0,y:20});</script>")
    _write_number_plan(project)

    report = audit_project(project)
    issues = [issue for issue in report.issues if issue.code == "weapon_load_plan_not_implemented"]

    assert issues
    assert issues[0].weapon_id == "number-count-up"
    assert issues[0].severity == "P0"


def test_quality_audit_accepts_weapon_load_plan_canonical_call(tmp_path):
    project = _make_project(tmp_path, "<script>const tl = gsap.timeline(); numberCountUp(tl, n, {targetValue:120});</script>")
    _write_number_plan(project)

    report = audit_project(project)

    assert not [issue for issue in report.issues if issue.code == "weapon_load_plan_not_implemented"]


def test_quality_audit_reports_missing_weapon_load_plan_when_html_and_prompt_exist(tmp_path):
    project = _make_project(tmp_path, "<script>const tl = gsap.timeline();</script>")

    report = audit_project(project)
    issues = [issue for issue in report.issues if issue.code == "weapon_load_plan_missing"]

    assert issues
    assert issues[0].severity == "P2"
