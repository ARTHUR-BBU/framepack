"""E-1 回归测试: 权重注入必须在 LLM 质检不可用时仍然存活。

根因: _handle_frame_md / _handle_expanded_prompt 把权重注入放在了
_analyze_*() 返回 None 时的提前 return 之后，导致 LLM 不可用时
权重特性静默失效。权重注入是纯本地计算，不应受 LLM 影响。
"""
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from hooks.on_post_tool_call import (
    _handle_frame_md,
    _handle_expanded_prompt,
)

FRAME_MD_WITH_PROFILE = (
    "---\n"
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

# expanded-prompt with atmosphere mismatch (density=0.2 → cap=1, but 4 layers)
EXPANDED_WITH_MISMATCH = (
    "## Execution Manifest\n"
    "scene1: blur-reveal\n"
    "\n"
    "## Atmosphere\n"
    "particle glow gradient haze shimmer bokeh\n"
)


class TestHandleFrameMdLlmDecoupling:
    """_handle_frame_md 在 LLM 质检不可用时必须仍注入权重指令。"""

    def test_weight_injected_when_analysis_returns_none(self, tmp_path):
        """LLM 不可用 (_analyze_frame_md → None) 时权重指令仍到达 ctx"""
        frame_md = tmp_path / "frame.md"
        frame_md.write_text(FRAME_MD_WITH_PROFILE, encoding="utf-8")

        ctx = MagicMock()
        with patch(
            "hooks.on_post_tool_call._analyze_frame_md", return_value=None
        ):
            _handle_frame_md(ctx, str(frame_md))

        # 权重指令必须被注入，即使 LLM 质检失败
        assert ctx.inject_message.called, (
            "权重指令未注入：LLM 质检失败不应阻塞纯本地权重注入"
        )
        injected = " ".join(
            str(c) for c in ctx.inject_message.call_args_list
        )
        assert "creative_autonomy" in injected or "木" in injected, (
            f"注入内容不含权重指令: {injected}"
        )

    def test_weight_injected_when_llm_raises_exception(self, tmp_path):
        """LLM 抛异常时权重指令仍到达 ctx"""
        frame_md = tmp_path / "frame.md"
        frame_md.write_text(FRAME_MD_WITH_PROFILE, encoding="utf-8")

        ctx = MagicMock()
        with patch(
            "hooks.on_post_tool_call._analyze_frame_md",
            side_effect=RuntimeError("LLM unavailable"),
        ):
            _handle_frame_md(ctx, str(frame_md))

        # _analyze_frame_md 内部 catch 了异常返回 None，
        # 但即便如此权重注入也不应受影响
        assert ctx.inject_message.called


class TestHandleExpandedPromptLlmDecoupling:
    """_handle_expanded_prompt 在 LLM 质检不可用时必须仍注入一致性报告。"""

    def test_weight_report_injected_when_analysis_returns_none(self, tmp_path):
        """LLM 不可用时权重一致性报告仍到达 ctx"""
        frame_md = tmp_path / "frame.md"
        frame_md.write_text(FRAME_MD_WITH_PROFILE, encoding="utf-8")

        hf_dir = tmp_path / ".hyperframes"
        hf_dir.mkdir()
        expanded = hf_dir / "expanded-prompt.md"
        expanded.write_text(EXPANDED_WITH_MISMATCH, encoding="utf-8")

        ctx = MagicMock()
        with patch(
            "hooks.on_post_tool_call._analyze_expanded_prompt", return_value=None
        ), patch(
            "hooks.on_post_tool_call._sync_arsenal_for_expanded_prompt"
        ), patch(
            "hooks.on_post_tool_call._inject_param_card_if_manifest"
        ):
            _handle_expanded_prompt(ctx, str(expanded))

        # 一致性报告必须被注入
        assert ctx.inject_message.called, (
            "权重一致性报告未注入：LLM 质检失败不应阻塞纯本地权重审计"
        )
        injected = " ".join(
            str(c) for c in ctx.inject_message.call_args_list
        )
        assert "atmosphere" in injected.lower() or "权重一致性" in injected, (
            f"注入内容不含权重一致性报告: {injected}"
        )
