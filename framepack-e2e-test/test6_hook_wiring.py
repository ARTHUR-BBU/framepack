"""测试 6: Hook 接线验证.

模拟 _handle_frame_md 的权重注入路径:
  - 直接调用 hooks/on_post_tool_call.py 的 _build_weight_directive
  - 直接调用 _build_weight_consistency_report
"""
import sys
from pathlib import Path

PLUGIN = Path("F:/hyperframes/framepack-plugin").resolve()
sys.path.insert(0, str(PLUGIN))

# on_post_tool_call 通过包相对导入, 需要把 hooks 当包导入
# 加 PLUGIN 作为顶层, hooks 作为包 (hooks/__init__.py 存在)
import importlib
hook_mod = importlib.import_module("hooks.on_post_tool_call")

FRAME_MD = """\
---
title: Hook 注入测试
---

# Frame

control_profile:
  weights:
    creative_autonomy: 0.6
    restraint_force: 0.45
    atmosphere_density: 0.3
    motion_dynamism: 0.7
    weapon_reliance: 0.85
  self_assessment:
    content_understanding: 0.7
    color_confidence: 0.6
    rhythm_confidence: 0.5
    restraint_instinct: 0.7
  caution_motion:
    shake: 0.8
"""

print("=" * 78)
print("6.A _build_weight_directive (frame.md 含 control_profile)")
print("=" * 78)
directive = hook_mod._build_weight_directive(FRAME_MD)
print(f"返回类型: {type(directive).__name__}")
print(f"返回非空: {directive is not None and len(directive) > 0}")
print()
print("--- 指令全文 ---")
print(directive)
print("--- 全文结束 ---")

# 6.B: _build_weight_consistency_report
print()
print("=" * 78)
print("6.B _build_weight_consistency_report (frame.md 与 expanded-prompt 不匹配)")
print("=" * 78)

FRAME_MD_MISMATCH = """\
control_profile:
  weights:
    atmosphere_density: 0.2
    weapon_reliance: 0.9
    restraint_force: 0.8
"""
EXPANDED = """\
scene1: HANDWRITE
scene2: HANDWRITE
scene3: HANDWRITE
scene4: HANDWRITE
particle dust, glow halo, gradient wash, noise grain, bokeh, vignette.
surprise one, surprise two, surprise three, surprise four.
"""

report = hook_mod._build_weight_consistency_report(FRAME_MD_MISMATCH, EXPANDED)
print(f"返回类型: {type(report).__name__}")
print(f"返回非空: {report is not None and len(report) > 0}")
print()
print("--- 报告全文 ---")
print(report)
print("--- 全文结束 ---")

# 6.C 边界: 没有 control_profile 的旧 frame.md 应返回 None
print()
print("=" * 78)
print("6.C 向后兼容: 旧 frame.md (无 control_profile)")
print("=" * 78)
OLD_FRAME = """\
---
title: 旧项目无权重
palette:
  primary: "#000000"
---
"""
d_old = hook_mod._build_weight_directive(OLD_FRAME)
r_old = hook_mod._build_weight_consistency_report(OLD_FRAME, EXPANDED)
print(f"_build_weight_directive           返回: {d_old!r}")
print(f"_build_weight_consistency_report  返回: {r_old!r}")

# 自动评估
checks = []
checks.append(("6.A directive 非 None", directive is not None))
checks.append(("6.A directive 文本非空", bool(directive and directive.strip())))
for elt in ("木", "金", "火", "水", "土"):
    checks.append((f"6.A directive 含五行 {elt}", elt in (directive or "")))
checks.append(("6.A directive 含 'control_profile' 提示",
               "control_profile" in (directive or "")))
checks.append(("6.B report 非 None", report is not None))
checks.append(("6.B report 含 'P2'", "P2" in (report or "")))
checks.append(("6.B report 含 '解释'", "解释" in (report or "")))
checks.append(("6.B report 含 atmosphere 密度项",
               "atmosphere_density" in (report or "")))
checks.append(("6.B report 含 weapon 依赖项",
               "weapon_reliance" in (report or "")))
checks.append(("6.B report 含 restraint 克制项",
               "restraint_force" in (report or "")))
checks.append(("6.C 旧 frame.md: directive 返回 None", d_old is None))
checks.append(("6.C 旧 frame.md: report 返回 None", r_old is None))

print()
print("=" * 78)
print("测试 6 自动检查结果")
print("=" * 78)
all_pass = True
for name, cond in checks:
    status = "PASS" if cond else "FAIL"
    if not cond:
        all_pass = False
    print(f"  [{status}] {name}")
print(f"\n测试 6 总体: {'PASS' if all_pass else 'FAIL'}")
sys.exit(0 if all_pass else 1)
