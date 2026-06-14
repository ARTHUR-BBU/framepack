import json

from core.skill_overlay_manager import SkillOverlay, managed_block_start
from core.skill_upgrade_manager import SkillUpgradeInput, plan_skill_upgrade


def overlay() -> SkillOverlay:
    return SkillOverlay(
        id="hf-root-duration",
        target_skill="hyperframes",
        framepack_version="0.10.1",
        body="Root composition must explicitly set data-duration.",
        equivalent_phrases=("root composition", "data-duration"),
    )


def upgrade_input(**kwargs) -> SkillUpgradeInput:
    base = dict(
        skill="hyperframes",
        official_old="# HyperFrames\n\nOld official.\n",
        official_new="# HyperFrames\n\nNew official section.\n",
        local_current="# HyperFrames\n\nOld official.\n",
        overlays=[overlay()],
    )
    base.update(kwargs)
    return SkillUpgradeInput(**base)


def test_unchanged_local_allows_replace_with_new_official_plus_overlays():
    plan = plan_skill_upgrade(upgrade_input())

    assert plan.decision == "replace"
    assert plan.manual_review_required is False
    assert plan.changed is True
    assert "New official section" in plan.result_text
    assert managed_block_start(overlay()) in plan.result_text


def test_user_local_block_is_preserved_and_auto_merged():
    local = """# HyperFrames

Old official.

<!-- USER LOCAL HARDENING START id=proxy-note -->
Use local proxy for registry tests.
<!-- USER LOCAL HARDENING END id=proxy-note -->
"""

    plan = plan_skill_upgrade(upgrade_input(local_current=local))

    assert plan.decision == "auto_merge"
    assert plan.manual_review_required is False
    assert "USER LOCAL HARDENING START id=proxy-note" in plan.result_text
    assert "New official section" in plan.result_text
    assert plan.user_local_blocks == ["proxy-note"]


def test_upstream_absorbed_overlay_is_not_reinserted():
    plan = plan_skill_upgrade(
        upgrade_input(
            official_new="# HyperFrames\n\nOfficial now says root composition must explicitly set data-duration.\n",
        )
    )

    assert plan.decision == "replace"
    assert plan.upstream_absorbed == ["hf-root-duration"]
    assert "FRAMEPACK HARDENING START id=hf-root-duration" not in plan.result_text


def test_malformed_local_markers_require_manual_review():
    plan = plan_skill_upgrade(
        upgrade_input(
            local_current="# HyperFrames\n\nOld official.\n\n<!-- FRAMEPACK HARDENING START id=broken -->\n",
        )
    )

    assert plan.decision == "manual_review"
    assert plan.manual_review_required is True
    assert plan.changed is False
    assert plan.result_text is None


def test_heavily_edited_local_without_markers_requires_manual_review():
    plan = plan_skill_upgrade(
        upgrade_input(local_current="# HyperFrames\n\nOld official.\n\nUndelimited local edit.\n")
    )

    assert plan.decision == "manual_review"
    assert "local_current differs from official_old without recognized provenance" in plan.notes


def test_plan_serializes_to_json_safe_dict():
    data = plan_skill_upgrade(upgrade_input()).to_dict()

    assert data["kind"] == "framepack_skill_upgrade_plan"
    assert data["skill"] == "hyperframes"
    json.dumps(data, ensure_ascii=False)
