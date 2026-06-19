"""Hook 权重穿透测试 — frame.md 写入后注入五行权重指令。

验证 ControlProfile 通过 hook 神经通路主动推到 Agent 面前。
"""
import os
import sys
from unittest.mock import MagicMock

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from hooks.on_post_tool_call import _build_weight_directive, _safe_inject


class TestBuildWeightDirective:
    """_build_weight_directive 从 frame.md 文本提取权重并生成指令文本。"""

    def test_returns_directive_when_control_profile_present(self):
        md = (
            "---\n"
            "colors:\n"
            "  primary: \"#1a1a2e\"\n"
            "control_profile:\n"
            "  weights:\n"
            "    creative_autonomy: 0.85\n"
            "    restraint_force: 0.9\n"
            "    atmosphere_density: 0.2\n"
            "    motion_dynamism: 0.5\n"
            "    weapon_reliance: 0.3\n"
            "---\n"
            "# Frame\n"
        )
        directive = _build_weight_directive(md)
        assert directive is not None
        assert "creative_autonomy" in directive
        assert "信任" in directive  # high autonomy

    def test_returns_none_when_no_control_profile(self):
        """旧项目没有 control_profile → 返回 None，向后兼容"""
        md = "---\ncolors:\n  primary: \"#fff\"\n---\n# Frame"
        assert _build_weight_directive(md) is None

    def test_directive_contains_atmosphere_layer_cap(self):
        md = (
            "---\n"
            "control_profile:\n"
            "  weights:\n"
            "    atmosphere_density: 0.3\n"
            "---\n"
        )
        directive = _build_weight_directive(md)
        assert directive is not None
        assert "2" in directive  # floor(0.3*7)=2

    def test_directive_has_all_five_elements(self):
        md = (
            "---\n"
            "control_profile:\n"
            "  weights:\n"
            "    creative_autonomy: 0.5\n"
            "    restraint_force: 0.5\n"
            "    atmosphere_density: 0.5\n"
            "    motion_dynamism: 0.5\n"
            "    weapon_reliance: 0.5\n"
            "---\n"
        )
        directive = _build_weight_directive(md)
        assert directive is not None
        for elem in ("木", "金", "火", "水", "土"):
            assert elem in directive


class TestWeightDirectiveInjection:
    """权重指令通过 _safe_inject 注入 ctx。"""

    def test_weight_directive_injected_into_ctx(self):
        """模拟 _handle_frame_md 的权重注入路径。"""
        md = (
            "---\n"
            "control_profile:\n"
            "  weights:\n"
            "    creative_autonomy: 0.8\n"
            "    restraint_force: 0.9\n"
            "    atmosphere_density: 0.2\n"
            "    motion_dynamism: 0.5\n"
            "    weapon_reliance: 0.3\n"
            "---\n"
        )
        directive = _build_weight_directive(md)
        assert directive is not None

        ctx = MagicMock()
        _safe_inject(ctx, directive, role="user")
        ctx.inject_message.assert_called_once()
        injected_text = ctx.inject_message.call_args[0][0]
        assert "creative_autonomy" in injected_text
        assert "信任" in injected_text

    def test_no_injection_when_no_profile(self):
        """没有 control_profile 时不应注入权重指令"""
        md = "---\ncolors:\n  primary: \"#fff\"\n---\n"
        directive = _build_weight_directive(md)
        assert directive is None
        ctx = MagicMock()
        if directive:
            _safe_inject(ctx, directive, role="user")
        ctx.inject_message.assert_not_called()
