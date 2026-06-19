"""权重一致性审计测试 — restraint_audit 模块.

验证五行权重与实际产出（expanded-prompt.md）的匹配性。
P2 级别：提醒但不阻断，要求 Agent 做出解释。
"""
import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.control_profile import ControlProfile, Weights
from core.restraint_audit import (
    ConsistencyIssue,
    audit_weight_consistency,
    _count_atmosphere_layers,
    _handwrite_ratio,
)


class TestConsistencyIssue:
    def test_p2_issue_requires_explanation_by_default(self):
        issue = ConsistencyIssue(code="test", severity="P2", message="test")
        assert issue.requires_explanation is True

    def test_p3_issue_does_not_require_explanation(self):
        issue = ConsistencyIssue(code="test", severity="P3", message="test",
                                  requires_explanation=False)
        assert issue.requires_explanation is False


class TestAtmosphereDensityCheck:
    def test_low_density_but_many_layers_flags_p2(self):
        """atmosphere_density=0.2 但 expanded-prompt 有 5 层氛围 → P2"""
        cp = ControlProfile(weights=Weights(atmosphere_density=0.2))
        expanded = "BG: particle-field, grid-lines, gradient-shift, radial-glow, light-leak"
        issues = audit_weight_consistency(cp, expanded_prompt=expanded)
        assert any(i.code == "atmosphere_density_mismatch" and i.severity == "P2"
                   for i in issues)

    def test_matching_density_no_warning(self):
        """atmosphere_density=0.3 → cap=2，正好 2 层 → 不告警"""
        cp = ControlProfile(weights=Weights(atmosphere_density=0.3))
        expanded = "BG: grid-lines, gradient-shift"
        issues = audit_weight_consistency(cp, expanded_prompt=expanded)
        assert not any(i.code == "atmosphere_density_mismatch" for i in issues)

    def test_one_layer_over_cap_ok(self):
        """cap=2 但 3 层 → 不告警（允许 +1 容差）"""
        cp = ControlProfile(weights=Weights(atmosphere_density=0.3))
        expanded = "BG: grid-lines, gradient-shift, glow"
        issues = audit_weight_consistency(cp, expanded_prompt=expanded)
        assert not any(i.code == "atmosphere_density_mismatch" for i in issues)

    def test_high_density_allows_many_layers(self):
        """atmosphere_density=0.8 → cap=5，5 层不告警"""
        cp = ControlProfile(weights=Weights(atmosphere_density=0.8))
        expanded = "particle grid-lines gradient glow light-leak"
        issues = audit_weight_consistency(cp, expanded_prompt=expanded)
        assert not any(i.code == "atmosphere_density_mismatch" for i in issues)


class TestWeaponRelianceCheck:
    def test_high_reliance_but_all_handwrite_flags_p2(self):
        """weapon_reliance=0.8 但 Manifest 全标 HANDWRITE → P2"""
        cp = ControlProfile(weights=Weights(weapon_reliance=0.8))
        expanded = "## Execution Manifest\nscene1: HANDWRITE\nscene2: HANDWRITE\nscene3: HANDWRITE"
        issues = audit_weight_consistency(cp, expanded_prompt=expanded)
        assert any(i.code == "weapon_reliance_mismatch" for i in issues)

    def test_high_reliance_with_weapons_ok(self):
        """weapon_reliance=0.8 且大部分用武器 → 不告警"""
        cp = ControlProfile(weights=Weights(weapon_reliance=0.8))
        expanded = "## Execution Manifest\nscene1: kinetic-type\nscene2: blur-crossfade\nscene3: HANDWRITE"
        issues = audit_weight_consistency(cp, expanded_prompt=expanded)
        assert not any(i.code == "weapon_reliance_mismatch" for i in issues)

    def test_low_reliance_with_handwrite_ok(self):
        """weapon_reliance=0.2 全裸写 → 不告警"""
        cp = ControlProfile(weights=Weights(weapon_reliance=0.2))
        expanded = "## Execution Manifest\nscene1: HANDWRITE\nscene2: HANDWRITE"
        issues = audit_weight_consistency(cp, expanded_prompt=expanded)
        assert not any(i.code == "weapon_reliance_mismatch" for i in issues)


class TestRestraintForceCheck:
    def test_high_restraint_but_many_surprises_flags_p2(self):
        """restraint_force=0.8 但有 3 个 surprise → P2"""
        cp = ControlProfile(weights=Weights(restraint_force=0.8))
        expanded = "scene1: surprise reveal\nscene2: surprise twist\nscene3: surprise finale"
        issues = audit_weight_consistency(cp, expanded_prompt=expanded)
        assert any(i.code == "restraint_force_mismatch" for i in issues)

    def test_high_restraint_one_surprise_ok(self):
        """restraint_force=0.8 且只有 1 个 surprise → 不告警"""
        cp = ControlProfile(weights=Weights(restraint_force=0.8))
        expanded = "scene1: surprise reveal\nscene2: normal\nscene3: normal"
        issues = audit_weight_consistency(cp, expanded_prompt=expanded)
        assert not any(i.code == "restraint_force_mismatch" for i in issues)


class TestEdgeCases:
    def test_no_control_profile_returns_empty(self):
        """没有 control_profile → 不检查（向后兼容）"""
        issues = audit_weight_consistency(None, expanded_prompt="anything")
        assert issues == []

    def test_empty_expanded_prompt_returns_empty(self):
        cp = ControlProfile()
        issues = audit_weight_consistency(cp, expanded_prompt="")
        assert issues == []

    def test_all_p2_issues_have_explanation_flag(self):
        """所有 P2 issue 都要 requires_explanation=True"""
        cp = ControlProfile(weights=Weights(
            atmosphere_density=0.1, weapon_reliance=0.9, restraint_force=0.9))
        expanded = ("particle grid-lines gradient glow light-leak haze "
                    "scene1: HANDWRITE scene2: HANDWRITE "
                    "surprise surprise surprise surprise")
        issues = audit_weight_consistency(cp, expanded_prompt=expanded)
        for i in issues:
            if i.severity == "P2":
                assert i.requires_explanation is True


class TestHelperFunctions:
    def test_count_atmosphere_layers(self):
        assert _count_atmosphere_layers("grid-lines glow particle") == 3
        assert _count_atmosphere_layers("no layers here") == 0

    def test_handwrite_ratio(self):
        assert _handwrite_ratio("scene1: HANDWRITE\nscene2: blur") == 0.5
        assert _handwrite_ratio("") == 0.0

    def test_handwrite_ratio_hyphenated_weapon_names(self):
        """连字符武器名（如 card-cascade-reveal）不应被截断"""
        text = ("scene1: card-cascade-reveal\n"
                "scene2: bg-blur-mask\n"
                "scene3: HANDWRITE")
        ratio = _handwrite_ratio(text)
        assert ratio == 1.0 / 3.0

    def test_atmosphere_keywords_no_duplicates(self):
        """_ATMOSPHERE_KEYWORDS 列表不应有重复项（代码气味修复）"""
        from core.restraint_audit import _ATMOSPHERE_KEYWORDS
        assert len(_ATMOSPHERE_KEYWORDS) == len(set(_ATMOSPHERE_KEYWORDS)), \
            f"重复项: {set([x for x in _ATMOSPHERE_KEYWORDS if _ATMOSPHERE_KEYWORDS.count(x) > 1])}"

    def test_handwrite_ratio_bare_scene_colon_no_crossline(self):
        """C-1: 裸 scene1:（冒号后无武器名）不应跨行吞下一行首词。

        根因: 正则 scene\\d+:?\\s*([\\w-]+) 的 \\s* 包含换行符。
        当某行是裸 scene1:，\\s* 跨行吞掉下一行首词 'scene2'，
        导致真正的 HANDWRITE 根本不被识别（hw_ratio 被污染为 0.0）。
        """
        text = "scene1:\nscene2: HANDWRITE"
        ratio = _handwrite_ratio(text)
        # 正确行为: scene1: 无武器名 → 跳过；scene2: HANDWRITE → 1 条 hw
        # ratio = 1/1 = 1.0
        assert ratio == 1.0, f"C-1 跨行吞词 bug: ratio={ratio}"

    def test_handwrite_ratio_word_boundary_obscene(self):
        """C-4: obscene1: 这类不应匹配 sceneN: 模式（词首锚定）。

        根因: 正则 scene\\d+ 没有 \\b 词边界，会在 'obscene1' 中部
        匹配到 'scene1'，导致误识别。
        """
        text = "obscene1: HANDWRITE"
        ratio = _handwrite_ratio(text)
        # 正确行为: 无合法 sceneN: 条目 → ratio = 0.0
        assert ratio == 0.0, f"C-4 词首锚定 bug: ratio={ratio}"

    def test_handwrite_ratio_case_insensitive_after_word_boundary(self):
        """\\b 词边界不应破坏 re.IGNORECASE —— 大写 SCENE 仍应匹配。

        Reviewer 建议: 确认加 \\b 后 re.IGNORECASE 仍生效。
        """
        text = "SCENE1: HANDWRITE\nscene2: blur"
        ratio = _handwrite_ratio(text)
        assert ratio == 0.5, f"re.IGNORECASE 被 \\b 破坏: ratio={ratio}"


class TestCautionMotionAudit:
    """B-2: 审计层应消费 caution_motion — 高谨慎 motion 被使用时产生 P2 issue"""

    def test_high_caution_motion_used_in_prompt_flags_p2(self):
        """caution_motion shake=0.9 且 expanded-prompt 里用了 shake → P2"""
        cp = ControlProfile(
            weights=Weights(),
            caution_motion={"shake": 0.9},
        )
        prompt = "scene1: SLAM text\nscene2: shake camera\nscene3: fade"
        issues = audit_weight_consistency(cp, prompt)
        codes = [i.code for i in issues]
        assert "caution_motion_violation" in codes, \
            f"应告警高谨慎 motion 被使用，但 issues={codes}"

    def test_low_caution_motion_not_flagged(self):
        """caution_motion flash=0.3（低谨慎）被使用不告警"""
        cp = ControlProfile(
            weights=Weights(),
            caution_motion={"flash": 0.3},
        )
        prompt = "scene1: flash transition\nscene2: fade"
        issues = audit_weight_consistency(cp, prompt)
        codes = [i.code for i in issues]
        assert "caution_motion_violation" not in codes

    def test_no_caution_motion_no_issue(self):
        """没有 caution_motion → 不审计此维度"""
        cp = ControlProfile(weights=Weights())
        prompt = "scene1: shake\nscene2: spin"
        issues = audit_weight_consistency(cp, prompt)
        codes = [i.code for i in issues]
        assert "caution_motion_violation" not in codes
