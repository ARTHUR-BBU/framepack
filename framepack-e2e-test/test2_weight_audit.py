"""测试 2: 权重一致性检查端到端.

构造 frame.md (atmosphere_density=0.2, weapon_reliance=0.9, restraint_force=0.8)
+ 故意不匹配的 expanded-prompt (6 层氛围 + 全 HANDWRITE + 4 个 surprise),
验证 audit_weight_consistency() 检测出三个 P2 issue 且 message 含"解释"。
"""
import sys
from pathlib import Path

PLUGIN = Path("F:/hyperframes/framepack-plugin").resolve()
sys.path.insert(0, str(PLUGIN))

from core.control_profile import ControlProfile
from core.restraint_audit import audit_weight_consistency

# atmosphere_density=0.2 -> cap=floor(0.2*7)=1, 容差+1=2, 6 层必然超标
# weapon_reliance=0.9 (>0.7) + HANDWRITE 多 -> 触发 weapon_reliance_mismatch
# restraint_force=0.8 (>0.7) + 4 个 surprise (>2) -> 触发 restraint_force_mismatch
FRAME_MD = """\
control_profile:
  weights:
    atmosphere_density: 0.2
    weapon_reliance: 0.9
    restraint_force: 0.8
"""

# 故意构造 mismatch:
#  - 6 个氛围关键词: particle, glow, gradient, noise, bokeh, vignette
#  - 全 HANDWRITE: scene1..scene4 全 HANDWRITE -> 比例 100% > 50%
#  - 4 个 "surprise" -> > 2
EXPANDED = """\
# Expanded Prompt

scene1: HANDWRITE
scene2: HANDWRITE
scene3: HANDWRITE
scene4: HANDWRITE

Atmosphere layers:
- particle dust
- glow halo
- gradient wash
- noise grain
- bokeh circles
- vignette frame

We pack in surprise moment one, surprise moment two, surprise moment three,
and one more surprise moment four to delight the viewer.
"""

cp = ControlProfile.from_frame_md(FRAME_MD)
assert cp is not None
print("解析 weights:")
print(f"  atmosphere_density = {cp.weights.atmosphere_density}  cap={cp.weights.atmosphere_layer_cap()}")
print(f"  weapon_reliance    = {cp.weights.weapon_reliance}")
print(f"  restraint_force    = {cp.weights.restraint_force}")

issues = audit_weight_consistency(cp, expanded_prompt=EXPANDED)

print()
print("=" * 78)
print(f"audit_weight_consistency 检测到 {len(issues)} 个 issue")
print("=" * 78)
for i, iss in enumerate(issues, 1):
    print(f"\n[Issue {i}]")
    print(f"  code                = {iss.code}")
    print(f"  severity            = {iss.severity}")
    print(f"  requires_explanation= {iss.requires_explanation}")
    print(f"  message             = {iss.message}")

# 期望: 三个特定 issue, 全部 P2, 全部含"解释"
expected = {
    "atmosphere_density_mismatch",
    "weapon_reliance_mismatch",
    "restraint_force_mismatch",
}
got_codes = {iss.code for iss in issues}

checks = []
checks.append(("检测到 3 个 issue", len(issues) == 3, f"实际 {len(issues)}"))
for code in expected:
    checks.append((f"检测到 {code}", code in got_codes))
all_p2 = all(iss.severity == "P2" for iss in issues)
checks.append(("所有 issue 是 P2", all_p2))
all_explain = all(iss.requires_explanation for iss in issues)
checks.append(("所有 issue requires_explanation=True", all_explain))
all_msg_has_explain = all("解释" in iss.message for iss in issues)
checks.append(("所有 message 含\"解释\"", all_msg_has_explain))

print()
print("=" * 78)
print("测试 2 自动检查结果")
print("=" * 78)
all_pass = True
for name, cond, *rest in checks:
    detail = rest[0] if rest else ""
    status = "PASS" if cond else "FAIL"
    if not cond:
        all_pass = False
    print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))

print(f"\n测试 2 总体: {'PASS' if all_pass else 'FAIL'}")
sys.exit(0 if all_pass else 1)
