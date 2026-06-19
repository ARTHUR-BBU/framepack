"""ControlProfile — 五行权重系统数据结构测试.

五行权重（相生相克，涵盖所有创意控制）:
  木 creative_autonomy  — 创意自主度
  金 restraint_force    — 克制力
  火 atmosphere_density — 氛围密度
  水 motion_dynamism    — 动作张力
  土 weapon_reliance    — 武器依赖度
"""
import textwrap
from pathlib import Path

from core.control_profile import ControlProfile, Weights, SelfAssessment


class TestWeightsDataclass:
    def test_default_weights_are_conservative_midline(self):
        w = Weights()
        # 默认 = 中等铁轨，保守值（向后兼容旧项目）
        assert 0.4 <= w.creative_autonomy <= 0.6
        assert 0.4 <= w.restraint_force <= 0.6
        assert 0.3 <= w.atmosphere_density <= 0.5
        assert 0.4 <= w.motion_dynamism <= 0.6
        assert 0.4 <= w.weapon_reliance <= 0.6

    def test_weights_clamped_to_0_1_range(self):
        w = Weights(creative_autonomy=1.5, restraint_force=-0.3,
                    atmosphere_density=0.5, motion_dynamism=0.5, weapon_reliance=0.5)
        assert w.creative_autonomy == 1.0
        assert w.restraint_force == 0.0

    def test_atmosphere_layer_cap(self):
        # 层数上限 = floor(density × 7)
        assert Weights(atmosphere_density=0.3).atmosphere_layer_cap() == 2
        assert Weights(atmosphere_density=1.0).atmosphere_layer_cap() == 7
        assert Weights(atmosphere_density=0.0).atmosphere_layer_cap() == 0


class TestSelfAssessment:
    def test_default_self_assessment_is_midline(self):
        sa = SelfAssessment()
        for field in ("content_understanding", "color_confidence",
                       "rhythm_confidence", "restraint_instinct"):
            assert 0.4 <= getattr(sa, field) <= 0.6


class TestControlProfileParsing:
    @staticmethod
    def _frame_md_with_profile(weights_lines: list[str],
                                assessment_lines: list[str] | None = None) -> str:
        """Build a frame.md string with a control_profile block.

        weights_lines: e.g. ["creative_autonomy: 0.8", "restraint_force: 0.7"]
        """
        lines = [
            "---",
            "colors:",
            "  primary: \"#1a1a2e\"",
            "  accent: \"#c9a96e\"",
            "  background: \"#0d0d1a\"",
            "typography:",
            "  heading: \"Playfair Display\"",
            "  body: \"DM Sans\"",
            "control_profile:",
        ]
        if assessment_lines:
            lines.append("  self_assessment:")
            for al in assessment_lines:
                lines.append(f"    {al}")
        lines.append("  weights:")
        for wl in weights_lines:
            lines.append(f"    {wl}")
        lines.append("---")
        lines.append("# Frame")
        return "\n".join(lines) + "\n"

    def test_parse_full_control_profile(self):
        md = self._frame_md_with_profile(
            weights_lines=["creative_autonomy: 0.8", "restraint_force: 0.7",
                           "atmosphere_density: 0.3", "motion_dynamism: 0.6",
                           "weapon_reliance: 0.5"],
            assessment_lines=["content_understanding: 0.85", "color_confidence: 0.8",
                              "rhythm_confidence: 0.7", "restraint_instinct: 0.9"],
        )
        cp = ControlProfile.from_frame_md(md)
        assert cp is not None
        assert cp.weights.creative_autonomy == 0.8
        assert cp.weights.restraint_force == 0.7
        assert cp.self_assessment.restraint_instinct == 0.9

    def test_parse_returns_none_when_no_control_profile(self):
        """旧项目没有 control_profile → 返回 None（向后兼容）"""
        md = "---\ncolors:\n  primary: \"#fff\"\n---\n# Frame"
        assert ControlProfile.from_frame_md(md) is None

    def test_parse_partial_weights_uses_defaults(self):
        """只填了部分权重，其余用默认"""
        md = self._frame_md_with_profile(
            weights_lines=["creative_autonomy: 0.9", "atmosphere_density: 0.2"]
        )
        cp = ControlProfile.from_frame_md(md)
        assert cp.weights.creative_autonomy == 0.9
        assert cp.weights.atmosphere_density == 0.2
        # 未填的用默认
        assert 0.4 <= cp.weights.restraint_force <= 0.6

    def test_parse_invalid_weight_value_clamped(self):
        md = self._frame_md_with_profile(
            weights_lines=["creative_autonomy: 999", "restraint_force: -5"]
        )
        cp = ControlProfile.from_frame_md(md)
        assert cp.weights.creative_autonomy == 1.0
        assert cp.weights.restraint_force == 0.0

    def test_from_frame_md_file_not_found(self):
        cp = ControlProfile.from_frame_md_file(Path("/nonexistent/frame.md"))
        assert cp is None
