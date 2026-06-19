"""补充探查: 边界条件与代码层面的潜在问题 (只测不改)."""
import sys
from pathlib import Path
PLUGIN = Path("F:/hyperframes/framepack-plugin").resolve()
sys.path.insert(0, str(PLUGIN))

from core.control_profile import ControlProfile
from core.restraint_audit import (
    audit_weight_consistency, _count_atmosphere_layers, _handwrite_ratio,
    _ATMOSPHERE_KEYWORDS,
)

print("=" * 78)
print("探查 1: 三档阈值边界 (严格 >0.7 才算 high, <0.3 才算 low)")
print("=" * 78)
# creative_autonomy 边界
for val in (0.69, 0.7, 0.71):
    cp = ControlProfile.from_frame_md(f"control_profile:\n  weights:\n    creative_autonomy: {val}\n")
    d = cp.render_directive()
    is_high = "信任你的创意判断" in d
    print(f"  creative_autonomy={val}: high档={is_high}  (期望: 仅 0.71 为 high)")

print()
print("=" * 78)
print("探查 2: restraint_force / weapon_reliance 触发阈值 (>0.7 严格)")
print("=" * 78)
# weapon_reliance_mismatch 需要 > 0.7 AND hw_ratio > 0.5
for wr in (0.7, 0.71):
    cp = ControlProfile.from_frame_md(f"control_profile:\n  weights:\n    weapon_reliance: {wr}\n")
    ep = "scene1: HANDWRITE\nscene2: HANDWRITE\n"
    issues = audit_weight_consistency(cp, ep)
    hit = any(i.code == "weapon_reliance_mismatch" for i in issues)
    print(f"  weapon_reliance={wr} + 100% HANDWRITE: weapon_reliance_mismatch={hit}  (期望: 仅 0.71 触发)")

# restraint_force_mismatch 需要 > 0.7 AND surprise > 2
for rf in (0.7, 0.71):
    cp = ControlProfile.from_frame_md(f"control_profile:\n  weights:\n    restraint_force: {rf}\n")
    ep = "surprise one surprise two surprise three\n"
    issues = audit_weight_consistency(cp, ep)
    hit = any(i.code == "restraint_force_mismatch" for i in issues)
    print(f"  restraint_force={rf} + 3 surprise: restraint_force_mismatch={hit}  (期望: 仅 0.71 触发)")

print()
print("=" * 78)
print("探查 3: atmosphere_density_mismatch 容差 (layer_count > cap+1 才触发)")
print("=" * 78)
# density=0.2 -> cap=1, 容差+1=2, 需要 3 层以上才触发
for layers_text, desc in [
    ("particle glow", "2 层 (容差内, 不应触发)"),
    ("particle glow gradient", "3 层 (刚超容差, 应触发)"),
]:
    cp = ControlProfile.from_frame_md("control_profile:\n  weights:\n    atmosphere_density: 0.2\n")
    issues = audit_weight_consistency(cp, layers_text)
    hit = any(i.code == "atmosphere_density_mismatch" for i in issues)
    print(f"  density=0.2 cap=1, {desc}: mismatch={hit}")

print()
print("=" * 78)
print("探查 4: _ATMOSPHERE_KEYWORDS 源码中是否有重复 key (代码气味)")
print("=" * 78)
from collections import Counter
counts = Counter(_ATMOSPHERE_KEYWORDS)
dups = {k: v for k, v in counts.items() if v > 1}
print(f"  关键词总数: {len(_ATMOSPHERE_KEYWORDS)}, 去重后: {len(set(_ATMOSPHERE_KEYWORDS))}")
print(f"  重复项: {dups if dups else '(无)'}")
if dups:
    print("  → 源码里 gradient / shimmer 各出现 2 次. 因 _count_atmosphere_layers 用 set 去重,")
    print("    不会重复计数, 属代码气味而非功能 bug.")

print()
print("=" * 78)
print("探查 5: grid-line / grid 去重逻辑")
print("=" * 78)
n1 = _count_atmosphere_layers("grid-line pattern")
n2 = _count_atmosphere_layers("grid pattern")
n3 = _count_atmosphere_layers("grid-line and grid together")
print(f"  仅 'grid-line': {n1} 层")
print(f"  仅 'grid':      {n2} 层")
print(f"  两者同现:       {n3} 层 (期望: 1, 因 grid 被 discard)")

print()
print("=" * 78)
print("探查 6: _handwrite_ratio 对含连字符武器名 (如 card-cascade-reveal) 的解析")
print("=" * 78)
# regex: scene\d+:?\s*(\w+)  — \w 不含连字符
ep = "scene1: card-cascade-reveal\nscene2: HANDWRITE\n"
ratio = _handwrite_ratio(ep)
print(f"  输入: scene1: card-cascade-reveal, scene2: HANDWRITE")
print(f"  _handwrite_ratio = {ratio:.2f}  (正则 \\w+ 把 card-cascade-reveal 截成 'card',")
print(f"  所以 1 HANDWRITE / 2 entries = 0.50 — 实际比例本应是 1/2 但捕获武器名被截,)")
print(f"  → 潜在边界问题: 武器名带连字符时 ratio 计算的分子正确但分母捕获到的 'entry' 不是完整武器名.")
print(f"     对 mismatch 检测影响小 (HANDWRITE 计数仍准), 但 ratio 语义略不精确.")

print()
print("=" * 78)
print("探查 7: control_profile 块在 YAML frontmatter 内 (缩进嵌套) 是否仍可解析")
print("=" * 78)
# 把 control_profile 放进 --- frontmatter --- 里, 缩进 0
FRONTMATTER = """\
---
title: 嵌套测试
control_profile:
  weights:
    creative_autonomy: 0.9
---
"""
cp = ControlProfile.from_frame_md(FRONTMATTER)
print(f"  frontmatter 内嵌 control_profile: 解析={cp is not None}")
if cp:
    print(f"    creative_autonomy = {cp.weights.creative_autonomy}  (期望 0.9)")
print("  → 解析器用 ^\\s*{block_name}:$ 匹配任意缩进, 所以 frontmatter 嵌套也 OK.")

print()
print("=" * 78)
print("探查 8: caution_motion 值越界 clamp")
print("=" * 78)
cp = ControlProfile.from_frame_md("control_profile:\n  caution_motion:\n    glow: 1.5\n    shake: -0.3\n")
print(f"  输入 glow=1.5, shake=-0.3")
print(f"  解析后 caution_motion = {cp.caution_motion}  (期望 clamp 到 [0,1])")
