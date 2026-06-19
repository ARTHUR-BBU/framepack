"""命题 B: 向后兼容 + 版本迁移（3 轮）.

被测代码: F:/hyperframes/framepack-plugin/  (Framepack v0.14.0, Python 3.14.2)

核心模块:
  - core/control_profile.py   — ControlProfile.from_frame_md(), caution_motion 解析
  - core/restraint_audit.py   — audit_weight_consistency()
  - hooks/on_post_tool_call.py — _build_weight_directive()

向后兼容契约:
  旧版 frame.md 用 forbidden_motion (list 格式)
  v0.14 用 caution_motion (dict 格式, 0-1 权重值)
  解析时 forbidden_motion 每项自动迁移为 caution_motion[name] = 0.9
  显式 caution_motion 值优先于 forbidden 的默认 0.9（新格式胜出）

只测不改: 发现的问题全部记入报告，不修改被测代码。

结果分层:
  - check() = 硬契约断言 (失败 = 真 bug/回归, 驱动 exit code)
  - probe() = 信息性探针 (可能"失败"恰好印证某个 finding, 不驱动 exit code)
"""
from __future__ import annotations

import io
import json
import logging
import re as _re
import sys
from collections import Counter
from pathlib import Path

PLUGIN = Path("F:/hyperframes/framepack-plugin").resolve()
sys.path.insert(0, str(PLUGIN))

from core.control_profile import ControlProfile  # noqa: E402
from core import restraint_audit  # noqa: E402
from hooks.on_post_tool_call import _build_weight_directive  # noqa: E402

_FORBIDDEN_CAUTION = ControlProfile._FORBIDDEN_CAUTION  # class attr, 期望 0.9


# ── 结果收集 ──────────────────────────────────────────────────────────────────
class Result:
    def __init__(self):
        self.checks: list[tuple[str, str, bool, str]] = []   # 硬契约
        self.probes: list[tuple[str, str, bool, str]] = []   # 信息性探针
        self.findings: list[tuple[str, str, str]] = []       # (round, severity, desc)

    def check(self, round_name, name, cond, detail=""):
        self.checks.append((round_name, name, bool(cond), detail))

    def probe(self, round_name, name, cond, detail=""):
        self.probes.append((round_name, name, bool(cond), detail))

    def finding(self, round_name, severity, desc):
        self.findings.append((round_name, severity, desc))

    def failed_checks(self):
        return [(r, n, d) for r, n, ok, d in self.checks if not ok]


R = Result()


def hr(title):
    print()
    print("=" * 78)
    print(title)
    print("=" * 78)


# ════════════════════════════════════════════════════════════════════════════
# 第 1 轮: 纯旧版（v0.13-era）项目 — 只有 forbidden_motion
# ════════════════════════════════════════════════════════════════════════════
ROUND1 = "R1 纯旧版 forbidden_motion"

LEGACY_FRAME_MD = """\
---
title: Legacy Brand Reel (authored pre-v0.14)
palette:
  primary: "#101010"
  accent:  "#FF4500"
---

# Frame

control_profile:
  forbidden_motion:
    - shake
    - spin
    - "flash"
    - 'snap-zoom'
"""

hr("第 1 轮: 纯旧版项目 (forbidden_motion list only)")
print("输入 control_profile 块:")
print("  control_profile:")
print("    forbidden_motion:")
print("      - shake / - spin / - \"flash\" / - 'snap-zoom'")
print()

cp_legacy = ControlProfile.from_frame_md(LEGACY_FRAME_MD)

# 硬契约
R.check(ROUND1, "from_frame_md 不返回 None (向后兼容)", cp_legacy is not None,
        f"实际 {cp_legacy!r}")

if cp_legacy is not None:
    expected = {"shake": _FORBIDDEN_CAUTION, "spin": _FORBIDDEN_CAUTION,
                "flash": _FORBIDDEN_CAUTION, "snap-zoom": _FORBIDDEN_CAUTION}
    R.check(ROUND1, "旧 forbidden_motion 全部迁移为 caution_motion (=0.9)",
            cp_legacy.caution_motion == expected,
            f"期望 {expected}  实际 {cp_legacy.caution_motion}")
    R.check(ROUND1, "_FORBIDDEN_CAUTION == 0.9",
            _FORBIDDEN_CAUTION == 0.9, f"实际 {_FORBIDDEN_CAUTION}")
    R.check(ROUND1, "引号变体 (\"flash\" / 'snap-zoom') 引号被剥离",
            "flash" in cp_legacy.caution_motion
            and "snap-zoom" in cp_legacy.caution_motion,
            f"实际 keys = {list(cp_legacy.caution_motion)}")
    R.check(ROUND1, "无 weights 块 → weights 字段存在且可读",
            cp_legacy.weights is not None, "")

    # Hook 路径不崩溃
    try:
        directive = _build_weight_directive(LEGACY_FRAME_MD)
        hook_ok = True
    except Exception as e:
        directive = None
        hook_ok = False
        R.finding(ROUND1, "BUG",
                  f"_build_weight_directive 在纯旧版输入上抛异常: "
                  f"{type(e).__name__}: {e}")
    R.check(ROUND1, "_build_weight_directive 不崩溃 (hook 路径)", hook_ok,
            f"返回类型 {type(directive).__name__}")

    # audit 不崩溃
    try:
        issues = restraint_audit.audit_weight_consistency(cp_legacy, "")
        audit_ok = (issues == [])
    except Exception as e:
        audit_ok = False
        R.finding(ROUND1, "BUG",
                  f"audit_weight_consistency 在纯旧版 profile 上抛异常: "
                  f"{type(e).__name__}: {e}")
    R.check(ROUND1, "audit_weight_consistency(cp_legacy, '') 不崩溃且返回 []",
            audit_ok)

    # ── 信息性探针 ──
    # 探针 P1: 迁移结果是否在 hook directive 里可见?
    if directive is not None:
        visible = any(k in directive for k in ("shake", "spin", "flash", "snap-zoom")) \
                  or "caution" in directive.lower() or "forbidden" in directive.lower()
        R.probe(ROUND1, "render_directive 是否输出迁移后的 caution_motion",
                visible, "(期望: 可见)")
        if not visible:
            R.finding(ROUND1, "INFO-LOSS",
                      "纯旧版项目迁移出的 caution_motion (shake/spin/flash/snap-zoom=0.9) "
                      "在 render_directive() 输出中完全不可见。hook 注入给 Agent 的 "
                      "weight directive 只含五行权重档位文案 (木金火水土), caution_motion "
                      "迁移结果对下游 Agent 隐形——Agent 拿不到 '这些 motion 需要高谨慎度' "
                      "的信息, 迁移事实上对产出无影响。")

    # 探针 P2: 迁移结果是否被 audit 消费?
    probe_prompt = ("scene1: HANDWRITE\n"
                    "shake shake shake spin spin spin flash flash flash")
    probe_issues = restraint_audit.audit_weight_consistency(cp_legacy, probe_prompt)
    audited = any("motion" in i.message.lower() or "caution" in i.message.lower()
                  or "shake" in i.message.lower() for i in probe_issues)
    R.probe(ROUND1, "audit_weight_consistency 是否审计 caution_motion",
            audited, "(期望: 审计)")
    if not audited:
        R.finding(ROUND1, "AUDIT-GAP",
                  "audit_weight_consistency 只检查 atmosphere_density / "
                  "weapon_reliance / restraint_force 三个权重维度, 完全不审计 "
                  "caution_motion。即使 expanded-prompt 里反复使用 caution_motion 中"
                  "已声明的高谨慎度 motion (shake/spin), 也不会产生任何 P2/P3 issue。"
                  "迁移数据进了 ControlProfile 却没有任何下游消费它——形成解析层有数据、"
                  "审计层无消费的断层。")

    # 探针 P3: 解析时是否打印弃用/迁移日志?
    buf = io.StringIO()
    h = logging.StreamHandler(buf)
    h.setLevel(logging.DEBUG)
    log = logging.getLogger("framepack")
    prev_level = log.level
    log.addHandler(h)
    log.setLevel(logging.DEBUG)
    try:
        ControlProfile.from_frame_md(LEGACY_FRAME_MD)
    finally:
        log.removeHandler(h)
        log.setLevel(prev_level)
    log_text = buf.getvalue()
    warned = any(t in log_text.lower()
                 for t in ("deprecat", "forbidden_motion", "legacy", "migrat"))
    R.probe(ROUND1, "解析 forbidden_motion 时是否打印弃用/迁移日志",
            warned, "(期望: 至少一条)")
    if not warned:
        R.finding(ROUND1, "MIGRATION-SILENCE",
                  "解析旧 forbidden_motion 时完全静默, 不打印任何弃用警告或迁移提示。"
                  "用户在 v0.14 下保留旧格式不会被引导迁移到 caution_motion, 也不被"
                  "告知每项被默认设为 0.9。缺乏迁移引导, 旧格式可能长期滞留。")

    # 探针 P4: 缺失权重的回退值是否与 Weights 数据类默认一致?
    # from_frame_md 用 weight_vals.get(k, 0.5) 全部回退 0.5;
    # 但 Weights 数据类默认 atmosphere_density=0.4. 二者不一致.
    bare = ControlProfile()  # 用数据类默认
    parsed_ad = cp_legacy.weights.atmosphere_density
    bare_ad = bare.weights.atmosphere_density
    R.probe(ROUND1,
            "from_frame_md 缺失 atmosphere_density 的回退值是否与 Weights 默认 (0.4) 一致",
            parsed_ad == bare_ad, f"parsed={parsed_ad} bare={bare_ad}")
    if parsed_ad != bare_ad:
        R.finding(ROUND1, "DEFAULT-INCONSISTENCY",
                  "from_frame_md 对缺失权重统一回退到 0.5 (Weights(**{k: "
                  "weight_vals.get(k, 0.5) for k in _WEIGHT_KEYS}), 但 Weights "
                  "数据类的原生默认是 atmosphere_density=0.4。结果: 旧项目(无 weights "
                  f"块)解析后 atmosphere_density={parsed_ad} → atmosphere_layer_cap="
                  f"{int(parsed_ad*7)}, 而裸构造 ControlProfile() 得 "
                  f"atmosphere_density={bare_ad} → cap={int(bare_ad*7)}。"
                  "同一段代码两套默认语义, 可能导致氛围层数上限判断不一致。")


# ════════════════════════════════════════════════════════════════════════════
# 第 2 轮: 混合/迁移期项目 — forbidden_motion + caution_motion 共存
# ════════════════════════════════════════════════════════════════════════════
ROUND2 = "R2 混合格式 (迁移期)"

hr("第 2 轮: 混合格式 (forbidden_motion + caution_motion 共存)")

# 场景 A: 同名 key 两边都有, 显式 caution 应胜出 (setdefault 语义)
MIXED_SAME_KEY = """\
---
title: Mixed Migration - Same Key
---
# Frame
control_profile:
  caution_motion:
    shake: 0.3
  forbidden_motion:
    - shake
"""
cp_a = ControlProfile.from_frame_md(MIXED_SAME_KEY)
R.check(ROUND2, "A 同名 key: 显式 caution 0.3 胜过 forbidden 默认 0.9",
        cp_a is not None and cp_a.caution_motion.get("shake") == 0.3,
        f"实际 {cp_a.caution_motion if cp_a else None}")

# 场景 B: 不同名 key 互补
MIXED_DISJOINT = """\
---
title: Mixed Migration - Disjoint Keys
---
# Frame
control_profile:
  caution_motion:
    glow: 0.4
  forbidden_motion:
    - spin
"""
cp_b = ControlProfile.from_frame_md(MIXED_DISJOINT)
expected_b = {"glow": 0.4, "spin": _FORBIDDEN_CAUTION}
R.check(ROUND2, "B 不同名 key: caution 与 forbidden 各自填入, 互补合并",
        cp_b is not None and cp_b.caution_motion == expected_b,
        f"期望 {expected_b}  实际 {cp_b.caution_motion if cp_b else None}")

# 场景 C: 部分权重缺失
MIXED_PARTIAL_W = """\
---
title: Mixed Migration - Partial Weights
---
# Frame
control_profile:
  weights:
    creative_autonomy: 0.9
  caution_motion:
    shake: 0.2
  forbidden_motion:
    - spin
"""
cp_c = ControlProfile.from_frame_md(MIXED_PARTIAL_W)
R.check(ROUND2, "C 部分权重: 声明项保留 0.9, 未声明项退回默认",
        cp_c is not None
        and cp_c.weights.creative_autonomy == 0.9
        and cp_c.weights.restraint_force == 0.5,
        f"实际 ca={cp_c.weights.creative_autonomy if cp_c else None} "
        f"rf={cp_c.weights.restraint_force if cp_c else None}")
R.check(ROUND2, "C caution_motion 合并保留两边",
        cp_c is not None
        and cp_c.caution_motion == {"shake": 0.2, "spin": _FORBIDDEN_CAUTION},
        f"实际 {cp_c.caution_motion if cp_c else None}")

# 场景 D: 畸形条目 — caution 值非数字 / forbidden 非 list 行
MIXED_MALFORMED = """\
---
title: Mixed Migration - Malformed Entries
---
# Frame
control_profile:
  caution_motion:
    shake: 0.5
    bad_motion: high
  forbidden_motion:
    - good_motion
    this_is_not_a_list_item
"""
cp_d = ControlProfile.from_frame_md(MIXED_MALFORMED)
R.check(ROUND2, "D 畸形 caution 值 'high' 被丢弃不崩溃, profile 仍返回",
        cp_d is not None and "bad_motion" not in cp_d.caution_motion,
        f"实际 {cp_d.caution_motion if cp_d else None}")
R.check(ROUND2, "D 合法 caution 'shake: 0.5' 保留",
        cp_d is not None and cp_d.caution_motion.get("shake") == 0.5,
        f"实际 {cp_d.caution_motion if cp_d else None}")
R.check(ROUND2, "D 非法 list 行不被当作 motion",
        cp_d is not None
        and "this_is_not_a_list_item" not in cp_d.caution_motion,
        f"实际 keys = {list(cp_d.caution_motion) if cp_d else None}")

# 探针 P5: forbidden_motion 误写为 dict 格式 (用户混淆新旧语法)
MISUSED_DICT = """\
---
title: forbidden_motion accidentally written as dict
---
# Frame
control_profile:
  forbidden_motion:
    shake: 0.5
    spin: 0.8
"""
cp_e = ControlProfile.from_frame_md(MISUSED_DICT)
# dict 格式不被 _parse_list_block 识别 → caution_vals 为空 → 无 weights → 返回 None
R.probe(ROUND2, "forbidden_motion 误写为 dict 仍能解析出非空 profile",
        cp_e is not None and cp_e.caution_motion != {},
        f"cp_e={cp_e!r}")
R.finding(ROUND2, "SILENT-DATA-LOSS",
          "用户若把 forbidden_motion 误写为新版 dict 格式 (forbidden_motion:\\n  "
          "shake: 0.5\\n  spin: 0.8), _parse_list_block 只识别 '- item' 列表项, "
          "dict 内容被完全静默丢弃。又因为 caution_vals/weight_vals/assess_vals "
          "全空, from_frame_md 直接返回 None——整个 control_profile 块被当作不存在, "
          f"实测 cp_e={cp_e!r}。用户得不到任何提示知道自己的 motion 约束完全失效且"
          "整个权重系统被跳过。建议在 forbidden_motion 块解析到非列表内容 (如检测到 "
          "'key: value' 行) 时打印警告。")


# ════════════════════════════════════════════════════════════════════════════
# 第 3 轮: 纯新版 v0.14-native + 版本迁移元数据探针
# ════════════════════════════════════════════════════════════════════════════
ROUND3 = "R3 v0.14-native + 版本元数据"

hr("第 3 轮: 纯新版 v0.14-native + 版本迁移元数据探针")

NATIVE_FRAME_MD = """\
---
title: v0.14 Native Project
palette:
  primary: "#0A0A0A"
  accent:  "#3366FF"
---
# Frame
control_profile:
  weights:
    creative_autonomy: 0.85
    restraint_force: 0.75
    atmosphere_density: 0.6
    motion_dynamism: 0.4
    weapon_reliance: 0.55
  self_assessment:
    content_understanding: 0.8
    color_confidence: 0.7
    rhythm_confidence: 0.6
    restraint_instinct: 0.85
  caution_motion:
    glow: 0.5
    shake: 0.8
    pulse: 0.65
"""

cp_native = ControlProfile.from_frame_md(NATIVE_FRAME_MD)
R.check(ROUND3, "新版 frame.md 解析成功", cp_native is not None)

if cp_native is not None:
    R.check(ROUND3, "caution_motion 任意 key (glow/shake/pulse) 完整保留",
            cp_native.caution_motion == {"glow": 0.5, "shake": 0.8, "pulse": 0.65},
            f"实际 {cp_native.caution_motion}")
    w = cp_native.weights
    R.check(ROUND3, "五个权重完整保留",
            (w.creative_autonomy == 0.85 and w.restraint_force == 0.75
             and w.atmosphere_density == 0.6 and w.motion_dynamism == 0.4
             and w.weapon_reliance == 0.55),
            f"实际 {w}")

    # 越界 clamp
    CLAMP_MD = """\
---
title: clamp probe
---
# Frame
control_profile:
  caution_motion:
    over: 1.5
    under: -0.3
    edge_hi: 1.0
    edge_lo: 0.0
"""
    cp_clamp = ControlProfile.from_frame_md(CLAMP_MD)
    R.check(ROUND3, "越界 caution clamp: 1.5→1.0, -0.3→0.0, 边界保留",
            cp_clamp is not None
            and cp_clamp.caution_motion["over"] == 1.0
            and cp_clamp.caution_motion["under"] == 0.0
            and cp_clamp.caution_motion["edge_hi"] == 1.0
            and cp_clamp.caution_motion["edge_lo"] == 0.0,
            f"实际 {cp_clamp.caution_motion if cp_clamp else None}")

    WCLAMP_MD = """\
---
title: weight clamp probe
---
# Frame
control_profile:
  weights:
    creative_autonomy: 2.5
    restraint_force: -1.0
"""
    cp_w = ControlProfile.from_frame_md(WCLAMP_MD)
    R.check(ROUND3, "越界权重 clamp: 2.5→1.0, -1.0→0.0",
            cp_w is not None
            and cp_w.weights.creative_autonomy == 1.0
            and cp_w.weights.restraint_force == 0.0,
            f"实际 ca={cp_w.weights.creative_autonomy if cp_w else None} "
            f"rf={cp_w.weights.restraint_force if cp_w else None}")

    directive = _build_weight_directive(NATIVE_FRAME_MD)
    R.check(ROUND3, "_build_weight_directive(native) 返回非空指令",
            directive is not None and len(directive) > 0,
            f"长度 {len(directive) if directive else 0}")

    consistent_prompt = "scene1: ARSENAL\nscene2: ARSENAL\nscene3: HANDWRITE"
    issues = restraint_audit.audit_weight_consistency(cp_native, consistent_prompt)
    R.check(ROUND3, "audit_weight_consistency(native, consistent) 无 issue",
            issues == [], f"实际 {[i.code for i in issues]}")

# 版本元数据一致性
plugin_yaml = (PLUGIN / "plugin.yaml").read_text(encoding="utf-8")
support_json = json.loads((PLUGIN / "compat/hyperframes-support.json")
                          .read_text(encoding="utf-8"))
m = _re.search(r'^version:\s*"([^"]+)"', plugin_yaml, _re.MULTILINE)
plugin_ver = m.group(1) if m else None
support_ver = support_json.get("framepack_version")
R.check(ROUND3, "[元数据] plugin.yaml 与 compat/hyperframes-support.json 版本一致 (0.14.0)",
        plugin_ver == support_ver == "0.14.0",
        f"plugin.yaml={plugin_ver}  support.json={support_ver}")
if not (plugin_ver == support_ver == "0.14.0"):
    R.finding(ROUND3, "VERSION-DRIFT",
              f"plugin.yaml version ({plugin_ver}) 与 compat/hyperframes-support.json "
              f"framepack_version ({support_ver}) 不一致。")

# 探针 P6: 是否存在源文件改写工具? (期望: 不存在, 零侵入设计)
scripts_dir = PLUGIN / "scripts"
migration_tool_exists = False
if scripts_dir.exists():
    for p in scripts_dir.glob("*.py"):
        try:
            txt = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        if ("forbidden_motion" in txt
                and ("caution_motion" in txt or "migrate" in txt.lower())
                and ("write_text" in txt or ".replace(" in txt)):
            migration_tool_exists = True
            R.finding(ROUND3, "INFO",
                      f"发现可能改写源文件的工具: {p.name}")
            break
R.probe(ROUND3, "是否存在 forbidden_motion→caution_motion 源文件改写工具",
        migration_tool_exists, "(期望: 不存在, 迁移仅解析期)")
if not migration_tool_exists:
    R.finding(ROUND3, "OBSERVATION",
              "forbidden_motion→caution_motion 的迁移完全是解析期 in-memory 行为, "
              "没有任何脚本/工具会改写用户的 frame.md 源文件。这是有意设计 (零侵入), "
              "但意味着旧项目的源文件永远不会被自动升级——用户必须手动改写才能用上新语法。"
              "建议在 doctor 报告里加一条 'deprecated field detected' 提示以引导迁移。")

# 探针 P7: 块名碰撞 — taste.visual_physics.forbidden_motion vs control_profile
COLLISION_MD = """\
---
title: Block-name collision probe
---
# Frame

taste:
  visual_physics:
    forbidden_motion:
      - generic slide-in
      - random bounce

control_profile:
  weights:
    restraint_force: 0.8
"""
cp_collide = ControlProfile.from_frame_md(COLLISION_MD)
leaked = False
if cp_collide is not None:
    cm_str = str(cp_collide.caution_motion).lower()
    leaked = ("slide-in" in cm_str or "generic" in cm_str
              or "random bounce" in cm_str
              or "bounce" in cm_str)
R.probe(ROUND3, "taste.visual_physics.forbidden_motion 不泄漏进 control_profile",
        not leaked, "(期望: 不泄漏)")
if leaked:
    R.finding(ROUND3, "BLOCK-COLLISION",
              "_extract_yaml_block(text, 'forbidden_motion') 按裸块名全文匹配第一个"
              "出现的 'forbidden_motion:' 行, 不绑定 control_profile 父 YAML 上下文。"
              "当 frame.md 同时含 control_profile 块和另一个父级 (如 "
              "taste.visual_physics) 下的同名 forbidden_motion 块时, 解析器会越过块"
              "边界抓取先出现的那个, 把无关的 motion 列表误迁移进 "
              "ControlProfile.caution_motion。实测泄漏: "
              f"{cp_collide.caution_motion}。skills/framepack-director/SKILL.md "
              "第 293 行的示例恰好就是 taste.visual_physics.forbidden_motion, "
              "说明该结构是真实存在的合法用法, 碰撞风险非空想。")
else:
    R.finding(ROUND3, "FRAGILE-DESIGN",
              "_extract_yaml_block 用裸块名全文匹配, 不绑定 control_profile 父上下文。"
              "本次未泄漏 (顺序巧合), 但属于脆弱设计, 建议把解析约束在 control_profile "
              "缩进范围内。")


# ════════════════════════════════════════════════════════════════════════════
# 汇总
# ════════════════════════════════════════════════════════════════════════════
hr("汇总")

n_checks = len(R.checks)
n_pass = sum(1 for *_, ok, _ in R.checks if ok)
n_probes = len(R.probes)
n_probe_pass = sum(1 for *_, ok, _ in R.probes if ok)
print(f"硬契约断言: {n_pass}/{n_checks} PASS")
print(f"信息性探针: {n_probe_pass}/{n_probes} PASS (探针失败=印证 finding, 非回归)")
print(f"问题标记:   {len(R.findings)} 项")

print()
print("─" * 78)
print("按轮次分布的问题")
print("─" * 78)
round_counts: dict[str, int] = Counter()
sev_counts: Counter = Counter()
for rnd, sev, _ in R.findings:
    round_counts[rnd] += 1
    sev_counts[sev] += 1
for rnd in (ROUND1, ROUND2, ROUND3):
    print(f"  {rnd}: {round_counts.get(rnd, 0)} 项")

print()
print("按严重度分布:")
for sev, n in sev_counts.most_common():
    print(f"  {sev}: {n}")

print()
print("─" * 78)
print("全部问题清单")
print("─" * 78)
for i, (rnd, sev, desc) in enumerate(R.findings, 1):
    print(f"\n[{i}] {rnd}  [{sev}]")
    print(f"    {desc}")

failed = R.failed_checks()
if failed:
    print()
    print("─" * 78)
    print("硬契约失败 (真 bug/回归)")
    print("─" * 78)
    for rnd, name, det in failed:
        print(f"  [FAIL] {rnd} :: {name}" + (f" — {det}" if det else ""))

# 持久化机器可读结果
out = {
    "rounds": [ROUND1, ROUND2, ROUND3],
    "checks": [{"round": r, "name": n, "ok": ok, "detail": d}
               for r, n, ok, d in R.checks],
    "probes": [{"round": r, "name": n, "ok": ok, "detail": d}
               for r, n, ok, d in R.probes],
    "findings": [{"round": r, "severity": s, "desc": d}
                 for r, s, d in R.findings],
    "summary": {
        "checks_pass": n_pass, "checks_total": n_checks,
        "probes_pass": n_probe_pass, "probes_total": n_probes,
        "findings_total": len(R.findings),
        "hard_failures": len(failed),
    },
}
Path("F:/hyperframes/framepack-e2e-test/testB_results.json").write_text(
    json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

# exit code 仅由硬契约驱动
sys.exit(0 if not failed else 1)
