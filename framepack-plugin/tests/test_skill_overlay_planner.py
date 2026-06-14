import json
from pathlib import Path

from core.skill_overlay_manager import SkillOverlay, managed_block_start
from core.skill_overlay_planner import run_skill_overlay_plan


def overlay(body="Root composition must explicitly set data-duration.") -> SkillOverlay:
    return SkillOverlay(
        id="hf-root-duration",
        target_skill="hyperframes",
        framepack_version="0.10.1",
        body=body,
        equivalent_phrases=("root composition", "data-duration"),
    )


def write_skill(skills_dir: Path, name: str, text: str) -> Path:
    skill_dir = skills_dir / name
    skill_dir.mkdir(parents=True)
    path = skill_dir / "SKILL.md"
    path.write_text(text, encoding="utf-8")
    return path


def test_missing_target_skill_reports_missing_without_writes(tmp_path):
    skills_dir = tmp_path / "skills"

    plan = run_skill_overlay_plan(skills_dir=skills_dir, overlays=[overlay()], apply=False)

    assert plan.status == "needs_setup"
    assert plan.changed is False
    assert len(plan.items) == 1
    item = plan.items[0]
    assert item.skill == "hyperframes"
    assert item.action == "missing_skill"
    assert item.changed is False
    assert item.path.endswith("hyperframes/SKILL.md") or item.path.endswith("hyperframes\\SKILL.md")
    assert not (skills_dir / "hyperframes" / "SKILL.md").exists()


def test_dry_run_reports_write_overlay_but_leaves_file_unchanged(tmp_path):
    skills_dir = tmp_path / "skills"
    skill_path = write_skill(skills_dir, "hyperframes", "# HyperFrames\n\nOriginal manual.\n")
    before = skill_path.read_text(encoding="utf-8")

    plan = run_skill_overlay_plan(skills_dir=skills_dir, overlays=[overlay()], apply=False)

    assert plan.status == "would_change"
    assert plan.changed is True
    assert plan.items[0].action == "write_overlay"
    assert plan.items[0].changed is True
    assert skill_path.read_text(encoding="utf-8") == before


def test_apply_writes_overlay_and_preserves_user_local_blocks(tmp_path):
    skills_dir = tmp_path / "skills"
    text = """# HyperFrames

<!-- USER LOCAL HARDENING START id=old-tian-note -->
Keep local proxy troubleshooting notes.
<!-- USER LOCAL HARDENING END id=old-tian-note -->
"""
    skill_path = write_skill(skills_dir, "hyperframes", text)

    plan = run_skill_overlay_plan(skills_dir=skills_dir, overlays=[overlay()], apply=True)
    after = skill_path.read_text(encoding="utf-8")

    assert plan.status == "changed"
    assert plan.changed is True
    assert plan.items[0].action == "write_overlay"
    assert "old-tian-note" in plan.items[0].preserved_user_blocks
    assert managed_block_start(overlay()) in after
    assert "USER LOCAL HARDENING START id=old-tian-note" in after


def test_malformed_marker_requires_manual_review_and_leaves_file_unchanged(tmp_path):
    skills_dir = tmp_path / "skills"
    skill_path = write_skill(
        skills_dir,
        "hyperframes",
        "# HyperFrames\n\n<!-- FRAMEPACK HARDENING START id=hf-root-duration source=framepack@0.10.0 target=hyperframes -->\nbroken\n",
    )
    before = skill_path.read_text(encoding="utf-8")

    plan = run_skill_overlay_plan(skills_dir=skills_dir, overlays=[overlay()], apply=True)

    assert plan.status == "manual_review"
    assert plan.changed is False
    assert plan.items[0].action == "manual_review"
    assert skill_path.read_text(encoding="utf-8") == before


def test_unknown_malformed_framepack_marker_blocks_all_writes(tmp_path):
    skills_dir = tmp_path / "skills"
    skill_path = write_skill(
        skills_dir,
        "hyperframes",
        "# HyperFrames\n\n<!-- FRAMEPACK HARDENING START id=some-old-overlay source=framepack@0.9.0 target=hyperframes -->\nbroken\n",
    )
    before = skill_path.read_text(encoding="utf-8")

    plan = run_skill_overlay_plan(skills_dir=skills_dir, overlays=[overlay()], apply=True)

    assert plan.status == "manual_review"
    assert plan.changed is False
    assert plan.items[0].action == "manual_review"
    assert skill_path.read_text(encoding="utf-8") == before


def test_upstream_absorbed_leaves_file_unchanged(tmp_path):
    skills_dir = tmp_path / "skills"
    skill_path = write_skill(
        skills_dir,
        "hyperframes",
        "# HyperFrames\n\nOfficial upstream says root composition should set data-duration explicitly.\n",
    )
    before = skill_path.read_text(encoding="utf-8")

    plan = run_skill_overlay_plan(skills_dir=skills_dir, overlays=[overlay()], apply=True)

    assert plan.status == "ready"
    assert plan.changed is False
    assert plan.items[0].action == "upstream_absorbed"
    assert skill_path.read_text(encoding="utf-8") == before


def test_plan_serializes_to_json_safe_dict(tmp_path):
    skills_dir = tmp_path / "skills"
    write_skill(skills_dir, "hyperframes", "# HyperFrames\n")

    data = run_skill_overlay_plan(skills_dir=skills_dir, overlays=[overlay()], apply=False).to_dict()

    assert data["kind"] == "framepack_skill_overlay_plan"
    assert data["apply"] is False
    assert data["items"][0]["overlay_id"] == "hf-root-duration"
    json.dumps(data, ensure_ascii=False)
