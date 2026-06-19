"""测试 1: ControlProfile 解析 + render_directive 端到端.

验证:
  - 五行元素标注 (木金火水土)
  - 氛围层数上限 (atmosphere_density * 7)
  - 各权重三档文案 (high/medium/low)
"""
import sys
from pathlib import Path

# 让脚本能直接 import framepack-plugin 模块
PLUGIN = Path("F:/hyperframes/framepack-plugin").resolve()
sys.path.insert(0, str(PLUGIN))

from core.control_profile import ControlProfile, Weights

# 构造一份真实的 frame.md, 五行权重覆盖到三档各档值
#   creative_autonomy 0.9 -> high (>0.7)
#   restraint_force   0.5 -> medium (0.3-0.7)
#   atmosphere_density 0.85 -> high (>0.7), 层数上限 = floor(0.85*7) = 5
#   motion_dynamism   0.2 -> low (<0.3)
#   weapon_reliance   0.5 -> medium
# 同时给出 self_assessment 与 caution_motion (新格式)
FRAME_MD = """\
---
title: 五行权重端到端测试
palette:
  primary: "#0A0A0A"
  accent:  "#FF3366"
  background: "#FFFFFF"
---

# Frame

control_profile:
  weights:
    creative_autonomy: 0.9
    restraint_force: 0.5
    atmosphere_density: 0.85
    motion_dynamism: 0.2
    weapon_reliance: 0.5
  self_assessment:
    content_understanding: 0.7
    color_confidence: 0.6
    rhythm_confidence: 0.5
    restraint_instinct: 0.8
  caution_motion:
    glow: 0.5
    shake: 0.8
"""

print("=" * 78)
print("测试 1 输入 frame.md (节选)")
print("=" * 78)
print(FRAME_MD)

cp = ControlProfile.from_frame_md(FRAME_MD)
assert cp is not None, "解析失败: 应当返回 ControlProfile 实例"

print("=" * 78)
print("解析结果 (cp)")
print("=" * 78)
print(f"weights           = {cp.weights}")
print(f"self_assessment   = {cp.self_assessment}")
print(f"caution_motion    = {cp.caution_motion}")
print(f"atmosphere_layer_cap() = {cp.weights.atmosphere_layer_cap()}  "
      f"(期望 floor(0.85*7)=5)")

# 验证关键不变量
assert cp.weights.creative_autonomy == 0.9
assert cp.weights.atmosphere_density == 0.85
assert cp.weights.atmosphere_layer_cap() == 5
assert cp.caution_motion == {"glow": 0.5, "shake": 0.8}
print("[OK] 解析结果与预期一致")

directive = cp.render_directive()
print()
print("=" * 78)
print("render_directive() 全文")
print("=" * 78)
print(directive)
print("=" * 78)

# 自动验证五项要求
checks = []
def check(name, cond, detail=""):
    checks.append((name, cond, detail))

# 1) 五行元素标注都出现
for elt in ("木", "金", "火", "水", "土"):
    check(f"五行标注:{elt}", elt in directive)

# 2) 氛围层数上限 = density*7
cap = cp.weights.atmosphere_layer_cap()
check("氛围层数上限出现在指令",
      str(cap) in directive,
      f"期望出现 {cap} (=floor(0.85*7))")

# 3) 三档文案
# creative_autonomy=0.9 应走 high 档 (>0.7), 出现"信任你的创意判断"
check("creative_autonomy high 档文案",
      "信任你的创意判断" in directive)
# motion_dynamism=0.2 应走 low 档 (<0.3), 出现"保持沉稳/平静的节奏"
check("motion_dynamism low 档文案",
      "保持沉稳/平静的节奏" in directive)
# restraint_force=0.5 走 medium 档, 出现"中庸克制力"
check("restraint_force medium 档文案",
      "中庸克制力" in directive)
# atmosphere_density=0.85 走 high 档, "氛围密度高"
check("atmosphere_density high 档文案",
      "氛围密度高" in directive)
# weapon_reliance=0.5 走 medium 档, "中庸武器依赖"
check("weapon_reliance medium 档文案",
      "中庸武器依赖" in directive)

print()
print("=" * 78)
print("测试 1 自动检查结果")
print("=" * 78)
all_pass = True
for name, cond, detail in checks:
    status = "PASS" if cond else "FAIL"
    if not cond:
        all_pass = False
    print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))

print()
print(f"测试 1 总体: {'PASS' if all_pass else 'FAIL'}")
sys.exit(0 if all_pass else 1)
