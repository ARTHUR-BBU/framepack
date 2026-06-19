"""Hook 2 接线测试 — expanded-prompt.md 写入后注入权重一致性检查。

验证 restraint_audit 的结果通过 hook 神经通路推到 Agent 面前。
"""
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from hooks.on_post_tool_call import _build_weight_consistency_report
from core.control_profile import ControlProfile, Weights


class TestWeightConsistencyReport:
    """_build_weight_consistency_report 从 frame.md+expanded-prompt 生成一致性报告。"""

    def test_returns_report_when_mismatch_found(self):
        frame_md = (
            "---\n"
            "control_profile:\n"
            "  weights:\n"
            "    atmosphere_density: 0.1\n"
            "---\n"
        )
        expanded = "particle grid-lines gradient glow light-leak haze bokeh"
        report = _build_weight_consistency_report(frame_md, expanded)
        assert report is not None
        assert "atmosphere_density" in report or "氛围" in report

    def test_returns_none_when_no_control_profile(self):
        frame_md = "---\ncolors:\n  primary: \"#fff\"\n---\n"
        expanded = "scene1: whatever"
        assert _build_weight_consistency_report(frame_md, expanded) is None

    def test_returns_none_when_no_mismatch(self):
        """权重与产出一致 → 返回 None（不需要注入）"""
        frame_md = (
            "---\n"
            "control_profile:\n"
            "  weights:\n"
            "    atmosphere_density: 0.8\n"
            "---\n"
        )
        expanded = "grid-lines gradient glow"
        report = _build_weight_consistency_report(frame_md, expanded)
        assert report is None

    def test_report_contains_p2_and_explanation_request(self):
        frame_md = (
            "---\n"
            "control_profile:\n"
            "  weights:\n"
            "    restraint_force: 0.9\n"
            "---\n"
        )
        expanded = "surprise surprise surprise surprise"
        report = _build_weight_consistency_report(frame_md, expanded)
        assert report is not None
        assert "P2" in report
        assert "解释" in report

    def test_report_handles_missing_frame_md(self):
        """frame.md 路径不存在 → 返回 None（不崩溃）"""
        report = _build_weight_consistency_report("", "expanded content")
        # 空 frame.md → 没有 control_profile → None
        assert report is None
