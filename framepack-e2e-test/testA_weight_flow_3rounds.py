"""命题 A: 五行权重端到端流程 + 相生相克验证（3 轮）.

被测代码（只测不改）:
  - core/control_profile.py
      ControlProfile.from_frame_md(), render_directive(), atmosphere_layer_cap()
  - core/restraint_audit.py
      audit_weight_consistency()
  - hooks/on_post_tool_call.py
      _build_weight_directive(), _build_weight_consistency_report()

五行映射:
  木 = creative_autonomy   金 = restraint_force
  火 = atmosphere_density  水 = motion_dynamism   土 = weapon_reliance

设计意图 (来自 control_profile.py / guardrails.md 的文档承诺):
  五个权重"正交但相生相克"——
    木 克 土 — 自主高，武器依赖自然降低（V1 模式）
    土 克 水 — 武器兜底多，动作更规范可控
    水 克 火 — 动作张力高，氛围不需要太浓（动静互补）
    火 克 金 — 氛围越浓，克制力被消耗（V3 死因）
    金 克 木 — 克制力约束自主，防止自主变放纵

3 轮测试目标:
  轮 1: 端到端 happy-path 全链路贯通（解析→渲染→Hook→审计），
        + 五元素独立性探测（改一不牵动他）。
  轮 2: 5 条"克链"逐条证伪——文档承诺的相生相克在代码层是否真实存在。
  轮 3: audit 是否做跨元素一致性检查；构造"五克全违背"的极端场景，
        观察审计输出，判定相生相克是否仅为叙述、无强制。

输出: 标准打印 + 退出码。任何 assert 失败 → exit 1。
"""
from __future__ import annotations

import importlib
import sys
from pathlib import Path

PLUGIN = Path("F:/hyperframes/framepack-plugin").resolve()
sys.path.insert(0, str(PLUGIN))

from core.control_profile import ControlProfile, Weights
from core.restraint_audit import audit_weight_consistency

hook_mod = importlib.import_module("hooks.on_post_tool_call")

# ──────────────────────────────────────────────────────────────────────────
# 辅助
# ──────────────────────────────────────────────────────────────────────────

SEP = "=" * 78
RESULTS: list[tuple[str, str, bool, str]] = []  # (轮次, 项目, ok, 备注)


def record(round_label: str, item: str, ok: bool, note: str = "") -> None:
    RESULTS.append((round_label, item, ok, note))
    tag = "PASS" if ok else "FAIL"
    print(f"  [{tag}] {item}" + (f" — {note}" if note else ""))


def make_frame_md(weights: dict[str, float]) -> str:
    """构造一份只含 control_profile.weights 的 frame.md 文本。"""
    lines = ["---", "title: 命题A测试", "---", "", "# Frame", "", "control_profile:", "  weights:"]
    for k, v in weights.items():
        lines.append(f"    {k}: {v}")
    return "\n".join(lines) + "\n"


def parse_weights(text: str) -> Weights:
    cp = ControlProfile.from_frame_md(text)
    assert cp is not None, f"解析失败，frame.md=\n{text}"
    return cp.weights


# ──────────────────────────────────────────────────────────────────────────
# 轮 1: 端到端 happy-path + 五元素独立性探测
# ──────────────────────────────────────────────────────────────────────────

print(SEP)
print("轮 1: 五行权重端到端 happy-path + 元素独立性")
print(SEP)

R1 = make_frame_md({
    "creative_autonomy": 0.9,   # 木 high
    "restraint_force": 0.45,    # 金 medium
    "atmosphere_density": 0.85, # 火 high → cap = floor(0.85*7) = 5
    "motion_dynamism": 0.2,     # 水 low
    "weapon_reliance": 0.5,     # 土 medium
})

cp1 = ControlProfile.from_frame_md(R1)
record("1", "from_frame_md 返回非 None", cp1 is not None)

# atmosphere_layer_cap 设计不变量
cap1 = cp1.weights.atmosphere_layer_cap()
record("1", f"atmosphere_layer_cap = {cap1} (期望 floor(0.85*7)=5)", cap1 == 5,
       f"实际 {cap1}")

# render_directive 含全部五行标注 + 各自档位
dir1 = cp1.render_directive()
for elt in ("木", "金", "火", "水", "土"):
    record("1", f"render_directive 含五行 {elt}", elt in dir1)
record("1", "render_directive 含 high 木文案('信任你的创意')",
       "信任你的创意" in dir1)
record("1", "render_directive 含 low 水文案('drift')",
       "drift" in dir1)
record("1", "render_directive 含 high 火氛围上限 '5'",
       ("上限约5层" in dir1) or ("上限约 5 层" in dir1))

# Hook 1: _build_weight_directive 直接调用（绕过 ctx）
hd = hook_mod._build_weight_directive(R1)
record("1", "_build_weight_directive 非 None 且 == render_directive()",
       hd is not None and hd == dir1)

# Hook 2: _build_weight_consistency_report —— 一致场景应返回 None
EXPANDED_OK = (
    "scene1: gsap-blur\nscene2: splittext\n"
    "Atmosphere: glow halo.\n"   # 1 层 ≤ cap+1=6
)
rpt_ok = hook_mod._build_weight_consistency_report(R1, EXPANDED_OK)
record("1", "_build_weight_consistency_report 一致场景返回 None (向后兼容/干净)",
       rpt_ok is None, f"实际返回: {rpt_ok!r}")

# 独立性探测: 只改 creative_autonomy(木), 检查 weapon_reliance(土)是否被牵动
R1b = make_frame_md({
    "creative_autonomy": 0.1,   # 木 从 0.9 → 0.1
    "restraint_force": 0.45,
    "atmosphere_density": 0.85,
    "motion_dynamism": 0.2,
    "weapon_reliance": 0.5,
})
w1a = cp1.weights
w1b = parse_weights(R1b)
independent = (
    w1b.creative_autonomy == 0.1
    and w1b.weapon_reliance == w1a.weapon_reliance
    and w1b.restraint_force == w1a.restraint_force
    and w1b.atmosphere_density == w1a.atmosphere_density
    and w1b.motion_dynamism == w1a.motion_dynamism
)
record("1", "独立性: 改木(0.9→0.1)后, 其余四行不变", independent,
       f"土 {w1a.weapon_reliance}→{w1b.weapon_reliance}")

# ──────────────────────────────────────────────────────────────────────────
# 轮 2: 相生相克 5 条克链 —— 代码层是否真实存在耦合
# ──────────────────────────────────────────────────────────────────────────

print()
print(SEP)
print("轮 2: 相生相克 5 条克链证伪/证实 (文档 vs 代码)")
print(SEP)
print("  方法: 把'克者'设到极端，看'被克者'是否被代码自动调整。")
print("  若被克者保持用户原值不变 → 该克链在代码层【不强制】，仅为叙述。\n")

# 每条: (克者键, 被克者键, 文档语义)
CHAINS = [
    ("creative_autonomy", "weapon_reliance",    "木 克 土"),
    ("weapon_reliance",   "motion_dynamism",    "土 克 水"),
    ("motion_dynamism",   "atmosphere_density", "水 克 火"),
    ("atmosphere_density","restraint_force",    "火 克 金"),
    ("restraint_force",   "creative_autonomy",  "金 克 木"),
]

chain_findings: list[tuple[str, bool]] = []  # (语义, 是否有代码耦合)

for killer, victim, label in CHAINS:
    # 基线: 两元素都 0.5
    base = {k: 0.5 for k in Weights().__dict__}
    w_base = parse_weights(make_frame_md(base))

    # 克者拉到 0.95, 被克者仍写 0.5 (用户明确给定)
    probe = dict(base)
    probe[killer] = 0.95
    probe[victim] = 0.5
    w_probe = parse_weights(make_frame_md(probe))

    victim_base = getattr(w_base, victim)
    victim_probe = getattr(w_probe, victim)
    killer_probe = getattr(w_probe, killer)

    coupled = (victim_probe != victim_base)  # 被克者被动改变了
    chain_findings.append((label, coupled))

    note = (f"克者{killer}={killer_probe} → 被克者{victim}: "
            f"{victim_base} → {victim_probe} "
            f"({'被动改变=有耦合' if coupled else '不变=无耦合'})")
    # 这里 PASS 仅表示"测试成功完成", 不是判定耦合对错
    record("2", f"{label} 探测完成", True, note.split(' → ', 1)[1])

    # 额外: 克者自身的 clamp 正常
    record("2", f"{label} 克者 {killer} clamp 到 0.95 正常",
           killer_probe == 0.95)

any_coupled = any(c for _, c in chain_findings)
record("2", "汇总: 至少一条克链存在代码级耦合", any_coupled,
       "若 FAIL=文档承诺的相生相克在代码层完全未实现" if not any_coupled else "")

# ──────────────────────────────────────────────────────────────────────────
# 轮 3: audit 是否做跨元素一致性 + 五克全违背极端场景
# ──────────────────────────────────────────────────────────────────────────

print()
print(SEP)
print("轮 3: audit 跨元素一致性 + 五克全违背极端场景")
print(SEP)

# 3a: 构造一个"五克全违背"的 frame.md——所有五行都拉到 0.95
#     按文档相生相克逻辑这是内部矛盾的，但每行单看都没越界。
#     expanded-prompt 也写得"克制"(低层数/低HANDWRITE/少surprise)，
#     所以三条 element-vs-output 检查都不会触发。
#     若 audit 返回 0 issue → 证明 audit【从不】检查元素之间的相生相克。
W_FULL = make_frame_md({k: 0.95 for k in (
    "creative_autonomy", "restraint_force", "atmosphere_density",
    "motion_dynamism", "weapon_reliance")})
cp_full = ControlProfile.from_frame_md(W_FULL)
record("3", "五元素全 0.95 解析成功", cp_full is not None)

# 全 0.95 → atmosphere_density cap = floor(0.95*7) = 6, 容差+1 = 7
cap_full = cp_full.weights.atmosphere_layer_cap()
record("3", f"全 0.95 时 atmosphere_layer_cap = {cap_full} (期望 6)",
       cap_full == 6, f"实际 {cap_full}")

# expanded 写得'干净': 低氛围(3层≤7), 武器兜底(0 HANDWRITE), 0 surprise
EXPANDED_CONTRADICTION = (
    "# Expanded\n"
    "scene1: gsap-blur\nscene2: splittext\nscene3: gsap-stagger\n"
    "Atmosphere: glow halo, gradient wash, particle dust.\n"  # 3 层
)
issues_full = audit_weight_consistency(cp_full, expanded_prompt=EXPANDED_CONTRADICTION)
cross_issues = [i for i in issues_full if "mismatch" in i.code]
record("3", "五克全违背场景: element-vs-output mismatch 数 = 0 (产出本身干净)",
       len(issues_full) == 0,
       f"实际 {len(issues_full)} 个: {[i.code for i in issues_full]}")

record("3", "五克全违背场景: 跨元素(相生相克) issue 数 = 0 (无此类检查)",
       len(cross_issues) == 0,
       f"实际 {len(cross_issues)}")

# 3b: 反向 sanity——确保 audit 本身没坏: 故意触发 atmosphere mismatch
#     atmosphere_density=0.1 → cap=floor(0.1*7)=0, 容差+1=1, 铺 4 层必触发
W_LOW_ATMOS = make_frame_md({"atmosphere_density": 0.1})
cp_low = ControlProfile.from_frame_md(W_LOW_ATMOS)
EXPLODE = ("particle glow gradient bokeh " * 4)  # 4 个不同关键词
issues_low = audit_weight_consistency(cp_low, expanded_prompt=EXPLODE)
atmos_hit = any(i.code == "atmosphere_density_mismatch" for i in issues_low)
record("3", "sanity: atmosphere_density=0.1 + 多层 → 触发 atmosphere_density_mismatch",
       atmos_hit, f"issues={[i.code for i in issues_low]}")

# 3c: 反向 sanity——restraint_force 跨元素也不查: 金高 + 木也高 不报错
#     只 expanded 不含 surprise 就干净
W_JIN_MU = make_frame_md({"restraint_force": 0.95, "creative_autonomy": 0.95})
cp_jm = ControlProfile.from_frame_md(W_JIN_MU)
issues_jm = audit_weight_consistency(cp_jm, expanded_prompt="clean scene, no surprise.")
record("3", "金高+木高(违背金克木): audit 不报跨元素 issue",
       len(issues_jm) == 0,
       f"实际 {len(issues_jm)} 个")

# ──────────────────────────────────────────────────────────────────────────
# 汇总
# ──────────────────────────────────────────────────────────────────────────

print()
print(SEP)
print("汇总")
print(SEP)
total = len(RESULTS)
passed = sum(1 for _, _, ok, _ in RESULTS if ok)
failed = total - passed
for rl, item, ok, note in RESULTS:
    if not ok:
        print(f"  [FAIL] {rl} | {item}" + (f" — {note}" if note else ""))

print()
print(f"总计: {total} 项, PASS {passed}, FAIL {failed}")
print()
if failed == 0:
    print("脚本退出码 0 (所有探针成功完成 — 注意: '成功完成'≠'相生相克已实现')")
else:
    print("脚本退出码 1 (存在探针失败)")

sys.exit(0 if failed == 0 else 1)
