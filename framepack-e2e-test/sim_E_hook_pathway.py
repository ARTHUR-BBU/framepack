"""命题 E — Hook 神经通路真实模拟（3 轮）。

驱动 framepack v0.14.0 的【真实注册 hook】（register(ctx) → on_post_tool_call
闭包）穿过完整通路：
    write_file 工具调用
      → on_post_tool_call
      → _handle_frame_md / _handle_expanded_prompt
      → _build_weight_directive / _build_weight_consistency_report
      → _safe_inject
      → ctx.inject_message   ← 神经突触，全程真实代码

只对三类外部依赖打桩（均与权重通路无关）：
  - hydrate_guardrails   : 写 AGENTS.md + Hermes 补丁审计（文件系统/网络）
  - ctx.llm.complete     : 外部 LLM（per-round 控制：成功 JSON / 抛错）
权重通路代码 100% 真实，零打桩。
"""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

# 让 hooks / core 作为顶层包可导入
PLUGIN = Path(__file__).resolve().parent.parent / "framepack-plugin"
sys.path.insert(0, str(PLUGIN))

from hooks.on_post_tool_call import (  # noqa: E402
    register,
    _build_weight_directive,
    _build_weight_consistency_report,
)


# ── 真实录制 ctx：每个 inject_message 落盘可检 ──
class RecCtx:
    def __init__(self, llm_text=None, llm_raises=None):
        self.injected: list[tuple[str, str]] = []  # (message, role)
        self.llm = MagicMock()
        if llm_raises:
            self.llm.complete.side_effect = llm_raises
        else:
            self.llm.complete.return_value.text = llm_text or "{}"
        self._hook = None

    def register_hook(self, name, fn):
        self._hook = fn

    def inject_message(self, message, role="user"):
        self.injected.append((message, role))

    def call(self, **kw):
        assert self._hook is not None, "hook not registered"
        self._hook(**kw)

    def weight_msgs(self):
        """只挑出权重通路产物（指令 + 一致性报告）。"""
        out = []
        for m, _ in self.injected:
            if "五行权重指令" in m or "五行权重一致性检查" in m:
                out.append(m)
        return out


FRAME_ANALYSIS_JSON = (
    '{"color_palette_ok":true,"typography_ok":true,"motion_tokens_ok":true,'
    '"atmosphere_ok":true,"format_ok":true,"issues":[],'
    '"visual_style_guess":"sim-style","summary":"sim ok"}'
)
EXPANDED_ANALYSIS_JSON = (
    '{"has_style_block":true,"has_rhythm":true,"scene_count":3,'
    '"scenes_with_full_beats":3,"has_motifs":true,"issues":[],'
    '"total_duration_guess":"30s","summary":"sim ok"}'
)


def _frame_md_full() -> str:
    return (
        "---\n"
        "colors:\n"
        "  primary: \"#1a1a2e\"\n"
        "control_profile:\n"
        "  weights:\n"
        "    creative_autonomy: 0.85\n"
        "    restraint_force: 0.9\n"
        "    atmosphere_density: 0.2\n"
        "    motion_dynamism: 0.75\n"
        "    weapon_reliance: 0.3\n"
        "  self_assessment:\n"
        "    content_understanding: 0.8\n"
        "    color_confidence: 0.7\n"
        "    rhythm_confidence: 0.6\n"
        "    restraint_instinct: 0.9\n"
        "  caution_motion:\n"
        "    glow: 0.85\n"
        "---\n"
        "# Frame\n"
    )


def _frame_md_restraint() -> str:
    """低密度 + 高武器依赖 + 高克制 → 故意触发三类 mismatch。"""
    return (
        "---\n"
        "control_profile:\n"
        "  weights:\n"
        "    atmosphere_density: 0.1\n"
        "    weapon_reliance: 0.9\n"
        "    restraint_force: 0.9\n"
        "---\n"
        "# Frame\n"
    )


def _expanded_mismatch() -> str:
    """6 个氛围关键词 + 全 HANDWRITE manifest + 3 个 surprise。"""
    return (
        "# Expanded Prompt\n\n"
        "BG: particle grid-line gradient glow light-leak noise bokeh haze\n\n"
        "## Execution Manifest\n"
        "scene1: HANDWRITE\n"
        "scene2: HANDWRITE\n"
        "scene3: HANDWRITE\n\n"
        "This scene uses a surprise moment, another surprise beat, "
        "and a third surprise reveal to punctuate the rhythm.\n"
    )


def banner(t):
    print("\n" + "=" * 70)
    print(t)
    print("=" * 70)


def main():
    results = {}

    # ───────────────── 第 1 轮：frame.md 写入 → 权重指令通路（happy） ─────────────────
    banner("ROUND 1 — frame.md 写入 → 五行权重指令注入（LLM 正常）")
    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        (d / "frame.md").write_text(_frame_md_full(), encoding="utf-8")
        ctx = RecCtx(llm_text=FRAME_ANALYSIS_JSON)
        with patch("hooks.on_post_tool_call.hydrate_guardrails") as hg:
            register(ctx)
            ctx.call(tool_name="write_file", args={"path": str(d / "frame.md")})
        total = len(ctx.injected)
        wmsgs = ctx.weight_msgs()
        print(f"注入消息总数 (突触): {total}")
        print(f"权重通路消息数: {len(wmsgs)}")
        # 独立函数产出（基准对照）
        baseline = _build_weight_directive(_frame_md_full())
        print(f"独立 _build_weight_directive 非空: {baseline is not None}")
        hit = None
        if wmsgs:
            hit = wmsgs[0]
            for el in ("木", "金", "火", "水", "土"):
                print(f"  含元素 {el}: {el in hit}")
            print(f"  含 layer cap '约1层': {'约1层' in hit}")  # floor(0.2*7)=1
            print(f"  含高自主 '信任': {'信任' in hit}")
            print(f"  含高克制 '克制力高': {'克制力高' in hit}")
            print(f"  含高张力 'SLAM': {'SLAM' in hit}")
            # 突触完整性：sanitizer 是否原样放行
            verbatim = (hit == baseline)
            print(f"  突触完整性 (指令原样到达): {verbatim}")
        r1 = dict(total=total, weight_msgs=len(wmsgs), verbatim=(hit == baseline) if wmsgs else False,
                  has_all=wmsgs and all(e in wmsgs[0] for e in "木金火水土"),
                  has_cap=wmsgs and "约1层" in wmsgs[0])
        results["r1"] = r1
        print("R1 判定:", r1)

    # ───────────────── 第 2 轮：expanded-prompt 写入 → 一致性报告通路（mismatch） ─────────────────
    banner("ROUND 2 — expanded-prompt 写入 → 五行权重一致性报告（三类 mismatch）")
    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        (d / "frame.md").write_text(_frame_md_restraint(), encoding="utf-8")
        hf = d / ".hyperframes"
        hf.mkdir()
        (hf / "expanded-prompt.md").write_text(_expanded_mismatch(), encoding="utf-8")
        ctx = RecCtx(llm_text=EXPANDED_ANALYSIS_JSON)
        with patch("hooks.on_post_tool_call.hydrate_guardrails") as hg:
            register(ctx)
            ctx.call(tool_name="write_file", args={"path": str(hf / "expanded-prompt.md")})
        total = len(ctx.injected)
        wmsgs = ctx.weight_msgs()
        print(f"注入消息总数 (突触): {total}")
        print(f"权重通路消息数: {len(wmsgs)}")
        # 独立基准
        rep = _build_weight_consistency_report(_frame_md_restraint(), _expanded_mismatch())
        print(f"独立 _build_weight_consistency_report 非空: {rep is not None}")
        report = wmsgs[0] if wmsgs else ""
        if report:
            for code in ("atmosphere_density", "weapon_reliance", "restraint_force"):
                print(f"  含 mismatch '{code}': {code in report}")
            print(f"  全 P2 标记: {report.count('[P2]')}")
            print(f"  含要求解释结尾: {'请在 expanded-prompt.md 里对以上每项做出解释' in report}")
            print(f"  突触完整性 (报告原样到达): {report == rep}")
        r2 = dict(total=total, weight_msgs=len(wmsgs),
                  has_three=(report and all(c in report for c in
                             ("atmosphere_density", "weapon_reliance", "restraint_force"))),
                  all_p2=(report and report.count("[P2]") == 3),
                  verbatim=(report == rep) if report else False)
        results["r2"] = r2
        print("R2 判定:", r2)

    # ───────────────── 第 3 轮：LLM 宕机 → 权重通路是否存活（韧性） ─────────────────
    banner("ROUND 3 — LLM 宕机 → 权重通路是否存活（韧性探测）")
    # 3a: frame.md 写入，LLM 抛错
    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        (d / "frame.md").write_text(_frame_md_full(), encoding="utf-8")
        ctx = RecCtx(llm_raises=RuntimeError("LLM unavailable"))
        with patch("hooks.on_post_tool_call.hydrate_guardrails"):
            register(ctx)
            ctx.call(tool_name="write_file", args={"path": str(d / "frame.md")})
        wmsgs = ctx.weight_msgs()
        print(f"[3a frame.md] 权重指令到达突触: {len(wmsgs)} 条 (期望≥1)")
        # 直接调用纯函数验证其本身与 LLM 无关
        direct = _build_weight_directive(_frame_md_full())
        print(f"[3a] 直接调 _build_weight_directive 仍可用: {direct is not None}")
        r3a = dict(injected=len(wmsgs), direct_ok=direct is not None)
        results["r3a"] = r3a

    # 3b: expanded-prompt 写入（mismatch），LLM 抛错
    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        (d / "frame.md").write_text(_frame_md_restraint(), encoding="utf-8")
        hf = d / ".hyperframes"
        hf.mkdir()
        (hf / "expanded-prompt.md").write_text(_expanded_mismatch(), encoding="utf-8")
        ctx = RecCtx(llm_raises=RuntimeError("LLM unavailable"))
        with patch("hooks.on_post_tool_call.hydrate_guardrails"):
            register(ctx)
            ctx.call(tool_name="write_file", args={"path": str(hf / "expanded-prompt.md")})
        wmsgs = ctx.weight_msgs()
        print(f"[3b expanded-prompt] 一致性报告到达突触: {len(wmsgs)} 条 (期望≥1)")
        direct = _build_weight_consistency_report(_frame_md_restraint(), _expanded_mismatch())
        print(f"[3b] 直接调 _build_weight_consistency_report 仍可用 (非空): {direct is not None}")
        r3b = dict(injected=len(wmsgs), direct_ok=direct is not None)
        results["r3b"] = r3b

    results["r3_drop"] = (results["r3a"]["injected"] == 0 and results["r3b"]["injected"] == 0)
    print("\nR3 判定: 权重通路在 LLM 宕机下" +
          ("【静默断流】(BUG)" if results["r3_drop"] else "存活"))

    # ── 汇总 ──
    banner("汇总")
    import json
    print(json.dumps(results, ensure_ascii=False, indent=2))
    return results


if __name__ == "__main__":
    main()
