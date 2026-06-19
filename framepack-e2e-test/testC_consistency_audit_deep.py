"""命题 C: 权重一致性审计深度测试 (3 轮) — 只测不改.

被测对象:
  core/restraint_audit.py  -> audit_weight_consistency(), ConsistencyIssue, helpers
  core/quality_audit.py    -> _audit_weight_consistency() (bridge), audit_project()

3 轮:
  Round 1  阈值/边界精确矩阵 (3 个 P2 检查的严格触发面)
  Round 2  检测器鲁棒性 (atmosphere 关键词 / handwrite 正则 / surprise 计数)
  Round 3  集成接线层 (_audit_weight_consistency 桥接 + audit_project 端到端 + 容错)

本脚本只读不改源码, 全部结论以实测输出为准, 供报告引用。
"""
from __future__ import annotations

import sys
import tempfile
import shutil
from pathlib import Path

PLUGIN = Path("F:/hyperframes/framepack-plugin").resolve()
sys.path.insert(0, str(PLUGIN))

from core.control_profile import ControlProfile, Weights  # noqa: E402
from core.restraint_audit import (  # noqa: E402
    audit_weight_consistency,
    ConsistencyIssue,
    _count_atmosphere_layers,
    _handwrite_ratio,
    _ATMOSPHERE_KEYWORDS,
)
from core.quality_audit import (  # noqa: E402
    audit_project,
    QualityIssue,
    _audit_weight_consistency,
)

R = 0  # round assertions passed
F = 0  # findings (non-blocking observations worth reporting)
RESULTS: list[tuple[str, str, str]] = []  # (status, name, detail)


def check(name: str, cond: bool, detail: str = "") -> None:
    global R
    status = "PASS" if cond else "FAIL"
    if cond:
        R += 1
    RESULTS.append((status, name, detail))
    print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))


def note(name: str, detail: str) -> None:
    global F
    F += 1
    RESULTS.append(("NOTE", name, detail))
    print(f"  [NOTE] {name} — {detail}")


def codes(issues):
    return [i.code for i in issues]


# ──────────────────────────────────────────────────────────────────────────
# ROUND 1 — 阈值/边界精确矩阵
# ──────────────────────────────────────────────────────────────────────────
print("\n" + "=" * 78)
print("ROUND 1 — 阈值/边界精确矩阵 (atmosphere / weapon_reliance / restraint_force)")
print("=" * 78)

print("\n>> 1.1 atmosphere_layer_cap 公式 = floor(density * 7)")
cap_cases = [
    (0.0, 0), (0.1, 0), (0.14, 0), (0.15, 1), (0.2, 1), (0.3, 2),
    (0.4, 2), (0.5, 3), (0.7, 4), (0.71, 4), (0.85, 5), (1.0, 7),
]
for density, expected_cap in cap_cases:
    w = Weights(atmosphere_density=density)
    got = w.atmosphere_layer_cap()
    check(f"cap({density}) == {expected_cap}", got == expected_cap,
          f"实际 {got}")

print("\n>> 1.2 atmosphere 触发面 = layer_count > cap+1 (严格大于, 含 +1 容差)")
# density=0.2 -> cap=1 -> 容差2 -> 3层触发, 2层不触发
cp_low = ControlProfile(weights=Weights(atmosphere_density=0.2))
for n_layers, n_kws in [(0, ""), (1, "particle"), (2, "particle glow"),
                        (3, "particle glow gradient"),
                        (4, "particle glow gradient noise")]:
    hit = any(i.code == "atmosphere_density_mismatch"
              for i in audit_weight_consistency(cp_low, n_kws))
    expect = n_layers > cp_low.weights.atmosphere_layer_cap() + 1
    check(f"density=0.2 cap=1, {n_layers}层 触发={hit}", hit == expect,
          f"期望触发={expect}")

print("\n>> 1.3 weapon_reliance 触发 = reliance>0.7 AND hw_ratio>0.5 (双严格大于)")
for wr, expect_hit in [(0.69, False), (0.70, False), (0.71, True), (1.0, True)]:
    cp = ControlProfile(weights=Weights(weapon_reliance=wr))
    # hw_ratio=1.0 (全 HANDWRITE) 远超 0.5
    hit = any(i.code == "weapon_reliance_mismatch"
              for i in audit_weight_consistency(cp, "scene1: HANDWRITE\nscene2: HANDWRITE"))
    check(f"reliance={wr} + 100%HW 触发", hit == expect_hit, f"期望 {expect_hit}")

# hw_ratio 边界: reliance=0.9 固定, 扫描比例 (注意正则要求字面 scene\d+)
cp_hw = ControlProfile(weights=Weights(weapon_reliance=0.9))
for label, ep, expect in [
    ("1/3=0.333", "scene1: HANDWRITE\nscene2: gun\nscene3: gun", False),
    ("2/4=0.500", "scene1: HANDWRITE\nscene2: HANDWRITE\nscene3: gun\nscene4: gun", False),
    ("3/5=0.600", "scene1: HANDWRITE\nscene2: HANDWRITE\nscene3: HANDWRITE\nscene4: gun\nscene5: gun", True),
]:
    hit = any(i.code == "weapon_reliance_mismatch"
              for i in audit_weight_consistency(cp_hw, ep))
    check(f"reliance=0.9, hw_ratio {label} 触发", hit == expect, f"期望 {expect}")

print("\n>> 1.4 restraint_force 触发 = force>0.7 AND surprise_count>2 (双严格大于)")
for rf, expect_hit in [(0.70, False), (0.71, True)]:
    cp = ControlProfile(weights=Weights(restraint_force=rf))
    ep = "surprise one surprise two surprise three"  # exactly 3
    hit = any(i.code == "restraint_force_mismatch"
              for i in audit_weight_consistency(cp, ep))
    check(f"force={rf} + 3 surprise 触发", hit == expect_hit, f"期望 {expect_hit}")

# surprise count 边界: force=0.9 固定
cp_rf = ControlProfile(weights=Weights(restraint_force=0.9))
for n, ep in [(2, "surprise one surprise two"),
              (3, "surprise one surprise two surprise three")]:
    hit = any(i.code == "restraint_force_mismatch"
              for i in audit_weight_consistency(cp_rf, ep))
    check(f"force=0.9, {n} surprise 触发", hit == (n > 2), f"期望 {n > 2}")

print("\n>> 1.5 三检查相互独立 (调一个权重不影响另外两个检查)")
cp_iso = ControlProfile(weights=Weights(
    atmosphere_density=0.1, weapon_reliance=0.9, restraint_force=0.9))
ep = ("particle glow gradient noise bokeh "      # atmosphere only (5 层)
      "scene1: gun\nscene2: gun\nscene3: gun\n")  # 无 HANDWRITE, 无 surprise
got = codes(audit_weight_consistency(cp_iso, ep))
check("隔离: 只 atmosphere 触发", got == ["atmosphere_density_mismatch"],
      f"got {got}")


# ──────────────────────────────────────────────────────────────────────────
# ROUND 2 — 检测器鲁棒性
# ──────────────────────────────────────────────────────────────────────────
print("\n" + "=" * 78)
print("ROUND 2 — 检测器鲁棒性 (关键词 / handwrite 正则 / surprise 计数)")
print("=" * 78)

print("\n>> 2.1 _count_atmosphere_layers 基本计数 (12 关键词, grid-line 与 grid 去重)")
check("无关键词=0", _count_atmosphere_layers("nothing here") == 0)
check("grid-line + grid 同现=1 (grid 被 discard)",
      _count_atmosphere_layers("grid-line and grid") == 1)
check("仅 grid=1", _count_atmosphere_layers("grid") == 1)
check("仅 grid-line=1", _count_atmosphere_layers("grid-line") == 1)

print("\n>> 2.2 atmosphere 关键词大小写不敏感 (函数已 lower)")
check("大写 PARTICLE 被识别",
      _count_atmosphere_layers("PARTICLE field") == 1)
check("混合大小写 Glow 被识别",
      _count_atmosphere_layers("Glow halo") == 1)

print("\n>> 2.3 子串匹配导致的潜在误报 (检测器脆弱性记录)")
# 真实 expanded-prompt 里常见的派生词包含关键词子串
for word, kw in [("noisy", "noise"), ("afterglow", "glow"),
                 ("glowing", "glow"), ("gridline", "grid"),
                 ("gradients", "gradient"), ("hazel", "haze")]:
    n = _count_atmosphere_layers(word)
    note(f"'{word}' 含子串 '{kw}'", f"被计为 {n} 层 → 派生词/同源词会虚增层数")

print("\n>> 2.4 复数形式: surprise 复数不被 \\bsurprise\\b 计入")
import re as _re
check("surprise(单数) 计3", len(_re.findall(r'\bsurprise\b', "surprise surprise surprise", _re.I)) == 3)
check("surprises(复数) 不计入",
      len(_re.findall(r'\bsurprise\b', "surprises surprises", _re.I)) == 0,
      "→ 'surprises' 词尾 s 使 \\b 失效, 真实文案可能漏报")
cp_sur = ControlProfile(weights=Weights(restraint_force=0.9))
hit_plural = any(i.code == "restraint_force_mismatch"
                 for i in audit_weight_consistency(cp_sur, "surprises surprises surprises"))
note("3 个 'surprises' 不触发 restraint_force_mismatch",
     f"触发={hit_plural} → 高克制 + 多个复数 surprise 漏报, 非阻断但语义不准")

print("\n>> 2.5 _handwrite_ratio — 连字符武器名 (源码现为 [\\w-]+, 非 \\w+)")
# 验证 test7_edge_probes.py 中"被截断为 card"的旧评论是否仍成立
ratio = _handwrite_ratio("scene1: card-cascade-reveal\nscene2: HANDWRITE")
check("card-cascade-reveal 完整捕获, ratio=0.5",
      abs(ratio - 0.5) < 1e-9, f"实际 ratio={ratio}")
note("源码正则为 [\\w-]+ (含连字符)", "test7_edge_probes.py 探查6 的旧评论('截成 card')已过时; 源码已修复")

print("\n>> 2.6 _handwrite_ratio — 边界/异常输入")
check("空串=0.0", _handwrite_ratio("") == 0.0)
check("无 scene 前缀=0.0", _handwrite_ratio("hello world") == 0.0)
check("大小写 Scene1 仍匹配 (re.IGNORECASE)",
      _handwrite_ratio("Scene1: HANDWRITE\nScene2: gun") == 0.5)
check("handwrite 小写也识别",
      _handwrite_ratio("scene1: handwrite\nscene2: gun") == 0.5)

print("\n>> 2.7 'scene' 子串在他词中可能误匹配 (无词首锚定)")
ratio2 = _handwrite_ratio("obscene1: HANDWRITE\nobscene2: gun")
note("'obscene1: HANDWRITE' 被正则匹配",
     f"ratio={ratio2} → 正则 scene\\d 无词首边界, 可嵌入他词")

print("\n>> 2.8 真实检测器脆弱性: 裸 sceneN: 行 (无武器名) 跨行吞词")
# 正则 scene\d+:?\s*([\w-]+) 中 \s* 含换行: 'scene1:' 后无词, 会吞下一行首词
import re as _re2
entries = _re2.findall(r'scene\d+:?\s*([\w-]+)', 'scene1:\nscene2: HANDWRITE', _re2.I)
ratio_bare = _handwrite_ratio('scene1:\nscene2: HANDWRITE')
check("裸 scene1: 行后接 scene2: HANDWRITE, ratio 被污染为 0.0",
      ratio_bare == 0.0, f"findall={entries}")
note("正则 \\s* 跨换行吞词",
     f"'scene1:' 无武器名时, 第一个 entry 捕获到下一行的 'scene2' ({entries}), "
     "ratio 降为 0.0 → 裸行 + 高 reliance 时可能漏报 weapon_reliance_mismatch")


# ──────────────────────────────────────────────────────────────────────────
# ROUND 3 — 集成接线层 + 容错
# ──────────────────────────────────────────────────────────────────────────
print("\n" + "=" * 78)
print("ROUND 3 — 集成接线层 (_audit_weight_consistency 桥接 + audit_project 端到端 + 容错)")
print("=" * 78)


def make_project(frame_md: str, expanded: str = "", extra_files: dict | None = None) -> Path:
    d = Path(tempfile.mkdtemp())
    d.joinpath("frame.md").write_text(frame_md, encoding="utf-8")
    if expanded:
        exp_dir = d / ".hyperframes"
        exp_dir.mkdir()
        exp_dir.joinpath("expanded-prompt.md").write_text(expanded, encoding="utf-8")
    if extra_files:
        for rel, content in extra_files.items():
            p = d / rel
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(content, encoding="utf-8")
    return d


TMP_DIRS: list[Path] = []


def cleanup():
    for d in TMP_DIRS:
        shutil.rmtree(d, ignore_errors=True)


print("\n>> 3.1 桥接: ConsistencyIssue -> QualityIssue 字段映射")
frame_md = ("---\ncontrol_profile:\n  weights:\n"
            "    atmosphere_density: 0.1\n---\n# Frame\n")
expanded = ("BG: particle grid-lines gradient glow light-leak haze bokeh\n"
            "## Execution Manifest\nscene1: kinetic-type")
d = make_project(frame_md, expanded)
TMP_DIRS.append(d)
cis = audit_weight_consistency(ControlProfile.from_frame_md(frame_md), expanded)
qis = _audit_weight_consistency(d, frame_md, expanded)
check("桥接后 issue 数量一致", len(cis) == len(qis))
if qis:
    ci, qi = cis[0], qis[0]
    check("code 保留", ci.code == qi.code)
    check("severity 保留 (P2)", ci.severity == qi.severity == "P2")
    check("message 保留", ci.message == qi.message)
    check("requires_explanation 进 details",
          qi.details is not None and qi.details.get("requires_explanation") is True)
    check("path 指向 expanded-prompt.md",
          qi.path is not None and qi.path.endswith("expanded-prompt.md"),
          f"path={qi.path}")
    check("scene=None", qi.scene is None)

print("\n>> 3.2 audit_project 端到端 — 三 P2 同发")
frame_md3 = ("---\ncontrol_profile:\n  weights:\n"
             "    atmosphere_density: 0.1\n    weapon_reliance: 0.9\n"
             "    restraint_force: 0.9\n---\n# Frame\n")
expanded3 = ("particle grid-lines gradient glow light-leak haze\n"
             "scene1: HANDWRITE\nscene2: HANDWRITE\n"
             "surprise a surprise b surprise c\n")
d3 = make_project(frame_md3, expanded3)
TMP_DIRS.append(d3)
rep = audit_project(d3)
weight_codes = [i.code for i in rep.issues if "mismatch" in i.code]
check("audit_project 三 mismatch 同发",
      sorted(weight_codes) == sorted([
          "atmosphere_density_mismatch", "weapon_reliance_mismatch",
          "restraint_force_mismatch"]),
      f"got {weight_codes}")
all_p2 = all(i.severity == "P2" for i in rep.issues if "mismatch" in i.code)
check("全部 mismatch 为 P2", all_p2)

print("\n>> 3.3 无 control_profile (旧项目向后兼容) -> 无 weight issue")
d_old = make_project("---\ncolors:\n  primary: \"#fff\"\n---\n# Frame\n",
                     "scene1: whatever")
TMP_DIRS.append(d_old)
rep_old = audit_project(d_old)
check("无 control_profile 无 mismatch",
      not any("mismatch" in i.code for i in rep_old.issues))

print("\n>> 3.4 一致项目 -> 无 weight issue")
frame_ok = ("---\ncontrol_profile:\n  weights:\n"
            "    atmosphere_density: 0.8\n    weapon_reliance: 0.3\n"
            "    restraint_force: 0.5\n---\n# Frame\n")
expanded_ok = ("grid-lines gradient glow\n## Execution Manifest\nscene1: HANDWRITE")
d_ok = make_project(frame_ok, expanded_ok)
TMP_DIRS.append(d_ok)
rep_ok = audit_project(d_ok)
check("一致权重 无 mismatch",
      not any("mismatch" in i.code for i in rep_ok.issues))

print("\n>> 3.5 容错 — 桥接 try/except 吞异常, 不使 audit_project 崩溃")
# 传一个会让权重极端但合法的 frame.md, 确认不抛
d_robust = make_project(
    "---\ncontrol_profile:\n  weights:\n    atmosphere_density: 1.0\n---\n# Frame\n",
    "particle glow")
TMP_DIRS.append(d_robust)
try:
    rep_rob = audit_project(d_robust)
    crashed = False
except Exception as exc:  # pragma: no cover
    crashed = True
    rep_rob = None
    print(f"  CRASH: {exc}")
check("audit_project 不因权重审计崩溃", not crashed)

print("\n>> 3.6 空 expanded-prompt -> audit_weight_consistency 返回空")
check("cp + 空expanded => []",
      audit_weight_consistency(ControlProfile(), "") == [])
check("None cp + 任意 => []",
      audit_weight_consistency(None, "anything") == [])

print("\n>> 3.7 全部 P2 issue 携带 requires_explanation=True")
cp_all = ControlProfile(weights=Weights(
    atmosphere_density=0.1, weapon_reliance=0.9, restraint_force=0.9))
ep_all = ("particle grid-lines gradient glow light-leak haze "
          "scene1: HANDWRITE scene2: HANDWRITE "
          "surprise surprise surprise surprise")
iss_all = audit_weight_consistency(cp_all, ep_all)
check("至少产生 issue", len(iss_all) > 0)
check("所有 P2 requires_explanation=True",
      all(i.requires_explanation for i in iss_all if i.severity == "P2"))

# ── 汇总 ──
cleanup()
print("\n" + "=" * 78)
print(f"汇总: {R} PASS 断言通过, {F} 条 NOTE 观察 (非阻断, 供报告)")
fails = [r for r in RESULTS if r[0] == "FAIL"]
if fails:
    print(f"FAIL 项 ({len(fails)}):")
    for s, n, d in fails:
        print(f"  - {n} — {d}")
print("=" * 78)
sys.exit(0 if not fails else 1)
