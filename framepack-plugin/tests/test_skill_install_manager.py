import json
from pathlib import Path

from core.skill_install_manager import OfficialSkill, run_skill_install_plan
from core.skill_overlay_manager import SkillOverlay


def official(name: str, text: str | None = None) -> OfficialSkill:
    return OfficialSkill(
        name=name,
        version="0.6.97",
        text=text or f"# {name}\n\nOfficial manual.\n",
    )


def overlay() -> SkillOverlay:
    return SkillOverlay(
        id="hf-root-duration",
        target_skill="hyperframes",
        framepack_version="0.10.2",
        body="Root composition must explicitly set data-duration.",
        equivalent_phrases=("root composition", "data-duration"),
    )


def test_dry_run_plans_missing_skill_install_without_writing(tmp_path):
    skills_dir = tmp_path / "skills"
    manifest_path = tmp_path / ".framepack" / "skill-install-manifest.json"

    plan = run_skill_install_plan(
        skills_dir=skills_dir,
        official_skills=[official("hyperframes")],
        overlays=[overlay()],
        manifest_path=manifest_path,
        apply=False,
    )

    assert plan.status == "would_install"
    assert plan.changed is True
    assert plan.items[0].action == "install_skill"
    assert not (skills_dir / "hyperframes" / "SKILL.md").exists()
    assert not manifest_path.exists()
    json.dumps(plan.to_dict(), ensure_ascii=False)


def test_apply_installs_official_skill_then_overlay_and_manifest(tmp_path):
    skills_dir = tmp_path / "skills"
    manifest_path = tmp_path / ".framepack" / "skill-install-manifest.json"

    plan = run_skill_install_plan(
        skills_dir=skills_dir,
        official_skills=[official("hyperframes")],
        overlays=[overlay()],
        manifest_path=manifest_path,
        apply=True,
    )

    skill_path = skills_dir / "hyperframes" / "SKILL.md"
    text = skill_path.read_text(encoding="utf-8")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    assert plan.status == "changed"
    assert "Official manual" in text
    assert "FRAMEPACK HARDENING START id=hf-root-duration" in text
    assert manifest["kind"] == "framepack_skill_install_manifest"
    assert manifest["skills"]["hyperframes"]["official_version"] == "0.6.97"
    assert manifest["skills"]["hyperframes"]["framepack_overlays"] == ["hf-root-duration"]
    assert len(manifest["skills"]["hyperframes"]["official_sha256"]) == 64
    assert len(manifest["skills"]["hyperframes"]["installed_sha256"]) == 64


def test_existing_skill_is_not_overwritten_without_replace_flag(tmp_path):
    skills_dir = tmp_path / "skills"
    skill_dir = skills_dir / "hyperframes"
    skill_dir.mkdir(parents=True)
    skill_path = skill_dir / "SKILL.md"
    skill_path.write_text("# Local HyperFrames\n\nExisting local edits.\n", encoding="utf-8")

    plan = run_skill_install_plan(
        skills_dir=skills_dir,
        official_skills=[official("hyperframes")],
        overlays=[overlay()],
        manifest_path=tmp_path / "manifest.json",
        apply=True,
    )

    assert plan.status == "manual_review"
    assert plan.items[0].action == "already_exists"
    assert skill_path.read_text(encoding="utf-8") == "# Local HyperFrames\n\nExisting local edits.\n"


def test_replace_existing_skill_requires_backup(tmp_path):
    skills_dir = tmp_path / "skills"
    backup_dir = tmp_path / "backups"
    skill_dir = skills_dir / "hyperframes"
    skill_dir.mkdir(parents=True)
    skill_path = skill_dir / "SKILL.md"
    skill_path.write_text("# Old\n", encoding="utf-8")

    plan = run_skill_install_plan(
        skills_dir=skills_dir,
        official_skills=[official("hyperframes")],
        overlays=[],
        manifest_path=tmp_path / "manifest.json",
        backup_dir=backup_dir,
        replace_existing=True,
        apply=True,
    )

    assert plan.status == "changed"
    assert plan.items[0].action == "replace_skill"
    assert plan.items[0].backup_path is not None
    assert Path(plan.items[0].backup_path).is_file()
    assert Path(plan.items[0].backup_path).read_text(encoding="utf-8") == "# Old\n"
    assert "Official manual" in skill_path.read_text(encoding="utf-8")


def test_missing_official_source_is_reported_without_writes(tmp_path):
    plan = run_skill_install_plan(
        skills_dir=tmp_path / "skills",
        official_skills=[],
        required_skills=["hyperframes"],
        overlays=[],
        manifest_path=tmp_path / "manifest.json",
        apply=True,
    )

    assert plan.status == "needs_source"
    assert plan.changed is False
    assert plan.items[0].action == "missing_official_source"
    assert not (tmp_path / "skills").exists()


def test_missing_one_official_source_blocks_all_install_writes(tmp_path):
    skills_dir = tmp_path / "skills"

    plan = run_skill_install_plan(
        skills_dir=skills_dir,
        official_skills=[official("present")],
        required_skills=["present", "missing"],
        overlays=[],
        manifest_path=tmp_path / "manifest.json",
        apply=True,
    )

    assert plan.status == "needs_source"
    assert plan.changed is False
    assert [item.action for item in plan.items] == ["missing_official_source"]
    assert not (skills_dir / "present" / "SKILL.md").exists()
    assert not (tmp_path / "manifest.json").exists()
