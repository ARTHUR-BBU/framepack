"""测试 3: caution_motion 向后兼容.

A) 新格式 caution_motion: {glow: 0.5, shake: 0.8}
B) 旧格式 forbidden_motion: [glow, shake]  -> 期望 {glow: 0.9, shake: 0.9}
"""
import sys
from pathlib import Path

PLUGIN = Path("F:/hyperframes/framepack-plugin").resolve()
sys.path.insert(0, str(PLUGIN))

from core.control_profile import ControlProfile

NEW_FMT = """\
control_profile:
  caution_motion:
    glow: 0.5
    shake: 0.8
"""

OLD_FMT = """\
control_profile:
  forbidden_motion:
    - glow
    - shake
"""

# 同时存在的混合场景: 新格式应优先
MIXED_FMT = """\
control_profile:
  caution_motion:
    glow: 0.3
  forbidden_motion:
    - shake
"""

cp_new = ControlProfile.from_frame_md(NEW_FMT)
cp_old = ControlProfile.from_frame_md(OLD_FMT)
cp_mixed = ControlProfile.from_frame_md(MIXED_FMT)

print("=" * 78)
print("A) 新格式 caution_motion")
print("=" * 78)
print(f"  输入: caution_motion: {{glow: 0.5, shake: 0.8}}")
print(f"  解析: caution_motion = {cp_new.caution_motion}")

print()
print("=" * 78)
print("B) 旧格式 forbidden_motion (向后兼容)")
print("=" * 78)
print(f"  输入: forbidden_motion: [glow, shake]")
print(f"  解析: caution_motion = {cp_old.caution_motion}")

print()
print("=" * 78)
print("C) 混合: 新格式 + 旧格式 (显式 caution_motion 应胜出)")
print("=" * 78)
print(f"  输入: caution_motion: {{glow: 0.3}} + forbidden_motion: [shake]")
print(f"  解析: caution_motion = {cp_mixed.caution_motion}")

checks = []
def c(name, cond, detail=""):
    checks.append((name, cond, detail))

c("A 新格式 glow=0.5", cp_new.caution_motion.get("glow") == 0.5,
  f"实际 {cp_new.caution_motion.get('glow')}")
c("A 新格式 shake=0.8", cp_new.caution_motion.get("shake") == 0.8,
  f"实际 {cp_new.caution_motion.get('shake')}")

c("B 旧格式 glow 转为 0.9", cp_old.caution_motion.get("glow") == 0.9,
  f"实际 {cp_old.caution_motion.get('glow')}")
c("B 旧格式 shake 转为 0.9", cp_old.caution_motion.get("shake") == 0.9,
  f"实际 {cp_old.caution_motion.get('shake')}")

# 混合: glow 走显式 0.3 (新胜出), shake 只有 forbidden -> 0.9
c("C 混合 glow=0.3 (显式胜出)",
  cp_mixed.caution_motion.get("glow") == 0.3,
  f"实际 {cp_mixed.caution_motion.get('glow')}")
c("C 混合 shake=0.9 (forbidden 默认)",
  cp_mixed.caution_motion.get("shake") == 0.9,
  f"实际 {cp_mixed.caution_motion.get('shake')}")

print()
print("=" * 78)
print("测试 3 自动检查结果")
print("=" * 78)
all_pass = True
for name, cond, detail in checks:
    status = "PASS" if cond else "FAIL"
    if not cond:
        all_pass = False
    print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))
print(f"\n测试 3 总体: {'PASS' if all_pass else 'FAIL'}")
sys.exit(0 if all_pass else 1)
