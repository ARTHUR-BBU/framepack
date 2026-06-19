"""B3: caution_motion 权重化 + forbidden_motion 向后兼容测试.

v0.14 把旧的 forbidden_motion（list 开关式禁止）升级为 caution_motion
（dict 每项 0-1 谨慎度权重）。

向后兼容：
  旧 frame.md 用 forbidden_motion: [item] → 自动转为 caution 值 0.9（高谨慎度）。

glow 是 atmosphere 不是 motion——motion 审计本身不管 glow；但 glow 若被用户
主动写进 caution_motion，解析层应原样保留为普通条目，不被特殊处理。
"""
from __future__ import annotations

from core.control_profile import ControlProfile


class TestCautionMotionParsing:
    @staticmethod
    def _frame_md_with_motion(
        caution_lines: list[str] | None = None,
        forbidden_lines: list[str] | None = None,
        weights_lines: list[str] | None = None,
    ) -> str:
        """Build a frame.md string with a control_profile block.

        caution_lines:  dict 格式 e.g. ["spin: 0.7", "shake: 0.5"]
        forbidden_lines: list 格式 e.g. ["spin", "shake"]
        weights_lines:  e.g. ["creative_autonomy: 0.5"]
        """
        lines = ["---", "control_profile:"]
        if weights_lines:
            lines.append("  weights:")
            for wl in weights_lines:
                lines.append(f"    {wl}")
        if caution_lines:
            lines.append("  caution_motion:")
            for cl in caution_lines:
                lines.append(f"    {cl}")
        if forbidden_lines:
            lines.append("  forbidden_motion:")
            for fl in forbidden_lines:
                lines.append(f"    - {fl}")
        lines.append("---")
        lines.append("# Frame")
        return "\n".join(lines) + "\n"

    def test_parse_caution_motion_new_format(self):
        """新格式 caution_motion: (dict) 解析正确。"""
        md = self._frame_md_with_motion(
            caution_lines=["spin: 0.7", "shake: 0.5"],
        )
        cp = ControlProfile.from_frame_md(md)
        assert cp is not None
        assert cp.caution_motion == {"spin": 0.7, "shake": 0.5}

    def test_old_forbidden_motion_becomes_high_caution(self):
        """旧格式 forbidden_motion: (list) 每项自动转为 caution 值 0.9。"""
        md = self._frame_md_with_motion(
            forbidden_lines=["spin", "shake"],
        )
        cp = ControlProfile.from_frame_md(md)
        assert cp is not None
        assert cp.caution_motion == {"spin": 0.9, "shake": 0.9}

    def test_mixed_format_both_parsed(self):
        """新旧格式共存时都能解析（caution 新格式 + forbidden 旧格式）。"""
        md = self._frame_md_with_motion(
            caution_lines=["spin: 0.3"],
            forbidden_lines=["shake"],
        )
        cp = ControlProfile.from_frame_md(md)
        assert cp is not None
        assert cp.caution_motion == {"spin": 0.3, "shake": 0.9}

    def test_no_motion_block_returns_empty(self):
        """没有 motion 块 → 空 dict。"""
        md = self._frame_md_with_motion(
            weights_lines=["creative_autonomy: 0.5"],
        )
        cp = ControlProfile.from_frame_md(md)
        assert cp is not None
        assert cp.caution_motion == {}

    def test_caution_values_clamped(self):
        """caution 值同样 clamp 到 0-1 范围。"""
        md = self._frame_md_with_motion(
            caution_lines=["spin: 1.5", "shake: -0.3"],
        )
        cp = ControlProfile.from_frame_md(md)
        assert cp is not None
        assert cp.caution_motion["spin"] == 1.0
        assert cp.caution_motion["shake"] == 0.0

    def test_glow_not_in_motion_category(self):
        """glow 出现在 caution_motion 时不会被特殊处理——它就是普通条目。

        glow 属于 atmosphere 而非 motion，motion 审计本身不管 glow；
        但用户若主动把 glow 写进 caution_motion，解析层应原样保留为普通条目。
        """
        md = self._frame_md_with_motion(
            caution_lines=["glow: 0.4", "spin: 0.6"],
        )
        cp = ControlProfile.from_frame_md(md)
        assert cp is not None
        assert cp.caution_motion["glow"] == 0.4
        assert cp.caution_motion["spin"] == 0.6


class TestCautionMotionDefaultField:
    def test_default_control_profile_has_empty_caution_motion(self):
        """裸构造的 ControlProfile 默认 caution_motion 为空 dict。"""
        cp = ControlProfile()
        assert cp.caution_motion == {}

    def test_caution_motion_values_clamped_at_construction(self):
        """构造时传入越界值也会被 clamp。"""
        cp = ControlProfile(caution_motion={"spin": 2.0, "shake": -1.0})
        assert cp.caution_motion == {"spin": 1.0, "shake": 0.0}
