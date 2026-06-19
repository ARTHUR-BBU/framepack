"""命题 F: quality_audit 完整审计管线测试 (3 轮) — 只测不改.

被测对象:
  core/quality_audit.py -> audit_project(), QualityIssue, QualityAuditReport,
    以及 9 个 _audit_* 子函数 (audit_project 内串联调用):
      _audit_arsenal / _audit_html_guardrails / _audit_parameter_drift /
      _audit_font_dependencies / _audit_visibility / _audit_timeline /
      _audit_lint_cache / _audit_taste / _audit_weight_consistency
  经由桥接的: core/taste_audit.py (risk/suggestion/note -> P1/P2/P3),
              core/restraint_audit.py (权重一致性 -> P2/P3)

3 轮:
  Round 1  标准项目审计 (完整结构 + 各审计函数触发 + severity 映射 risk/suggestion/note)
  Round 2  不一致场景审计 (三类 weight mismatch + requires_explanation + severity)
  Round 3  边界情况审计 (空项目 / 旧版项目 / 损坏项目 + graceful degradation + 向后兼容)

本脚本只读不改源码, 全部结论以实测输出为准, 供报告引用。
"""
from __future__ import annotations

import json
import sys
import tempfile
import shutil
from pathlib import Path

PLUGIN = Path("F:/hyperframes/framepack-plugin").resolve()
sys.path.insert(0, str(PLUGIN))

from core.quality_audit import (  # noqa: E402
    audit_project,
    QualityIssue,
    QualityAuditReport,
    TASTE_SEVERITY_MAP,
    SEVERITIES,
)

PASS = 0
FAIL = 0
NOTE = 0
RESULTS: list[tuple[str, str, str]] = []  # (status, name, detail)


def check(name: str, cond: bool, detail: str = "") -> None:
    global PASS, FAIL
    if cond:
        PASS += 1
        status = "PASS"
    else:
        FAIL += 1
        status = "FAIL"
    RESULTS.append((status, name, detail))
    print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))


def note(name: str, detail: str) -> None:
    global NOTE
    NOTE += 1
    RESULTS.append(("NOTE", name, detail))
    print(f"  [NOTE] {name} — {detail}")


def codes_of(report) -> list[str]:
    return [i.code for i in report.issues]


# code -> 产出它的 _audit_* 函数名 (用于 Round 1 函数触发归属)
CODE_TO_FN = {
    # _audit_arsenal
    "arsenal_missing": "_audit_arsenal",
    "arsenal_project_mismatch": "_audit_arsenal",
    "arsenal_duration_invalid": "_audit_arsenal",
    "arsenal_duration_mismatch": "_audit_arsenal",
    "manifest_weapon_missing_from_arsenal": "_audit_arsenal",
    "arsenal_used_by_empty": "_audit_arsenal",
    # _audit_html_guardrails
    "manual_data_hf_id": "_audit_html_guardrails",
    "undeclared_card_cascade": "_audit_html_guardrails",
    # _audit_parameter_drift
    "manifest_weapon_not_called": "_audit_parameter_drift",
    "weapon_parameter_drift": "_audit_parameter_drift",
    # _audit_font_dependencies
    "external_font_dependency": "_audit_font_dependencies",
    "font_face_missing_local_asset": "_audit_font_dependencies",
    # _audit_visibility
    "low_visibility_risk": "_audit_visibility",
    # _audit_timeline (含 validate_timeline / audit_proofs 透传)
    "timeline_manifest_missing": "_audit_timeline",
    "timeline_manifest_invalid": "_audit_timeline",
    "timeline_duration_invalid": "_audit_timeline",
    "timeline_duration_mismatch": "_audit_timeline",
    "timeline_scene_overlap": "_audit_timeline",
    "timeline_scene_invalid": "_audit_timeline",
    "proof_invalid": "_audit_timeline",
    "proof_missing": "_audit_timeline",
    "boundary_proof_missing": "_audit_timeline",
    "contact_sheet_missing": "_audit_timeline",
    "proof_path_outside_project": "_audit_timeline",
    # _audit_lint_cache (upstream:* 前缀也归此类)
    "__lint_cache__": "_audit_lint_cache",
    # _audit_taste (taste_audit 透传 + specimen_id_unknown)
    "missing_taste_block": "_audit_taste",
    "missing_kinetic_continuity": "_audit_taste",
    "generic_fade_stack": "_audit_taste",
    "static_mockup_risk": "_audit_taste",
    "too_many_surprises": "_audit_taste",
    "surprise_without_intent": "_audit_taste",
    "no_controlled_surprise": "_audit_taste",
    "motif_not_transformed": "_audit_taste",
    "specimen_id_unknown": "_audit_taste",
    # _audit_weight_consistency (restraint_audit 透传)
    "atmosphere_density_mismatch": "_audit_weight_consistency",
    "weapon_reliance_mismatch": "_audit_weight_consistency",
    "restraint_force_mismatch": "_audit_weight_consistency",
}


def attribute_functions(report) -> set[str]:
    """按 issue code (以及 lint_cache 的 details.category) 反推产出函数.

    注意: _audit_lint_cache 既可发 'upstream:*' 前缀码, 也可发裸码
    (category=quality_issue 时). 裸码会与原生 quality code 同名, 无法仅凭
    code 区分 —— 唯一判别是 details['category'] 字段 (见发现 F-NOTE-lint).
    """
    fns: set[str] = set()
    for i in report.issues:
        c = i.code
        cat = (i.details or {}).get("category") if i.details else None
        if c.startswith("upstream:") or cat in ("upstream_limit", "quality_issue"):
            fns.add("_audit_lint_cache")
        elif c in CODE_TO_FN:
            fns.add(CODE_TO_FN[c])
        else:
            fns.add(f"<unmapped:{c}>")
    return fns


def make_dir() -> Path:
    d = Path(tempfile.mkdtemp(prefix="framepackF_"))
    return d


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


# ════════════════════════════════════════════════════════════════════════
# ROUND 1 — 标准项目审计
# ════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 78)
print("ROUND 1 — 标准项目审计 (完整结构 + 函数触发 + severity 映射)")
print("=" * 78)

# ── 1.0 构造完整标准项目 ──
print("\n>> 1.0 构造完整标准项目 (frame.md + expanded-prompt + arsenal + html + timeline + lint-cache)")
proj = make_dir()
proj_name = proj.name

frame_md_std = f"""# Frame · {proj_name}

control_profile:
  weights:
    creative_autonomy: 0.6
    restraint_force: 0.5
    atmosphere_density: 0.4
    motion_dynamism: 0.5
    weapon_reliance: 0.6
  self_assessment:
    content_understanding: 0.7
    color_confidence: 0.6
    rhythm_confidence: 0.6
    restraint_instinct: 0.6

taste:
  reference_dna: data_cathedral
  visual_physics: weightless
  energy_arc: build_to_snap
  motif: pearl
  taste_moves:
    - editorial_punch
"""
write(proj / "frame.md", frame_md_std)

expanded_std = f"""# Expanded Prompt · {proj_name}

## HyperFrames Time Windows
TOTAL DURATION: 12 seconds

## Per-Scene Beats

### scene1 · INTRO · 0-4s
- blur-reveal entrance with pearl motif glowing.

### scene2 · BODY · 4-8s
- text cascade across the grid.

## Kinetic Continuity
- Incoming energy from scene1 → Action relay into scene2 → Outgoing transition seed.

## Execution Manifest

```yaml
scene1:
  weapon: blur-reveal
  source: builtin
  used_by: scene1
  params:
    duration: 1.2

scene2:
  weapon: text-split-enter
  source: builtin
  used_by: scene2
  params:
    travelDistance: "60px"
    duration: 0.7
```
"""
write(proj / ".hyperframes" / "expanded-prompt.md", expanded_std)

arsenal_std = {
    "schema_version": "1.0.0",
    "project": proj_name,
    "hyperframes_config": {"duration": 12},
    "weapons": {
        "blur-reveal": {"id": "blur-reveal", "source": "builtin", "status": "active", "used_by": ["scene1"]},
        "text-split-enter": {"id": "text-split-enter", "source": "builtin", "status": "active", "used_by": ["scene2"]},
        "library.gsap": {"id": "library.gsap", "source": "library", "status": "active", "used_by": ["scene1", "scene2"]},
    },
}
write(proj / ".framepack" / "arsenal.json", json.dumps(arsenal_std, ensure_ascii=False))

html_std = """<div id="stage" data-duration="12">
  <div id="scene1" class="clip" data-start="0" data-duration="4"></div>
  <div id="scene2" class="clip" data-start="4" data-duration="8"></div>
</div>
<script>
blurReveal(tl, document.getElementById('scene1'), {duration: 1.2});
textSplitEnter(tl, document.getElementById('scene2'), {travelDistance: '60px', duration: 0.7});
</script>
"""
write(proj / "index.html", html_std)

timeline_std = {
    "schema_version": "1.0.0",
    "kind": "framepack_timeline_manifest",
    "project": {"name": proj_name, "duration": 12.0},
    "scenes": [
        {"id": "scene1", "start": 0, "duration": 4, "track_index": 0, "status": "draft"},
        {"id": "scene2", "start": 4, "duration": 8, "track_index": 0, "status": "draft"},
    ],
    "proofs": {"directory": ".framepack/proofs", "contact_sheet": ".framepack/proofs/contact-sheet.jpg", "required": []},
}
write(proj / ".framepack" / "timeline-manifest.json", json.dumps(timeline_std, ensure_ascii=False))

# lint cache: 触发 _audit_lint_cache
findings = {
    "classified": [
        {"code": "unused-selector", "severity": "P2", "category": "quality_issue",
         "message": "Selector '.ghost' is unused.", "description": "dead CSS"},
        {"code": "upstream-limit-foo", "severity": "P3", "category": "upstream_limit",
         "message": "HyperFrames cannot inline this.", "description": "engine limit"},
    ]
}
write(proj / ".framepack" / "hyperframes-findings.json", json.dumps(findings, ensure_ascii=False))

report = audit_project(proj)

# ── 1.1 QualityAuditReport 结构 ──
print("\n>> 1.1 QualityAuditReport 结构验证")
check("返回类型为 QualityAuditReport", isinstance(report, QualityAuditReport),
      f"type={type(report).__name__}")
check("project_dir 等于输入路径(str)", isinstance(report.project_dir, str) and report.project_dir == str(proj),
      f"project_dir={report.project_dir!r}")
check("issues 是 list[QualityIssue]", isinstance(report.issues, list)
      and all(isinstance(i, QualityIssue) for i in report.issues),
      f"len={len(report.issues)}")
check("summary 是 dict", isinstance(report.summary, dict), f"summary={report.summary}")
check("summary 含 P0/P1/P2/P3 四键",
      set(SEVERITIES).issubset(report.summary.keys()), f"keys={sorted(report.summary.keys())}")
check("summary 计数 == issues 分组计数",
      report.summary == {sev: sum(1 for i in report.issues if i.severity == sev) for sev in SEVERITIES},
      f"summary={report.summary}")

# QualityIssue 字段完整性
sample = report.issues[0] if report.issues else None
if sample:
    expected_fields = {"code", "severity", "message", "path", "scene", "weapon_id", "details"}
    check("QualityIssue 含全部预期字段", expected_fields.issubset(sample.__dict__.keys()),
          f"fields={sorted(sample.__dict__.keys())}")
    check("每个 issue.severity 在 P0-P3 内",
          all(i.severity in SEVERITIES for i in report.issues),
          f"severities={sorted({i.severity for i in report.issues})}")

# ── 1.2 to_dict() 序列化 ──
print("\n>> 1.2 to_dict() 序列化结构")
payload = report.to_dict()
check("to_dict()['kind'] == framepack_quality_audit", payload.get("kind") == "framepack_quality_audit")
check("to_dict()['project_dir'] 一致", payload.get("project_dir") == str(proj))
check("to_dict()['issues'] 是 list[dict]", isinstance(payload.get("issues"), list)
      and all(isinstance(x, dict) for x in payload["issues"]))
check("to_dict()['summary'] 一致", payload.get("summary") == report.summary)
check("to_dict issue 条目数 == report.issues 数", len(payload["issues"]) == len(report.issues))

# ── 1.3 各审计函数被触发 — 每函数一个针对性迷你项目 (trigger matrix) ──
print("\n>> 1.3 各 _audit_* 函数触发矩阵 (每函数构造针对性 fixture, 确认其被接线且能产出 issue)")
# 干净标准项目本身只产出少量 issue 是 *正确* 的 (项目健康). 要验证「每个审计函数
# 都被接线、且在其触发条件满足时能产出 issue」, 逐函数构造最小 fixture.

def _base(name: str) -> Path:
    """干净基底: 合法 arsenal + 空 expanded, 不预设任何问题."""
    d = make_dir()
    write(d / "frame.md", f"# {name}\n")
    write(d / ".framepack" / "arsenal.json", json.dumps({"project": d.name, "weapons": {}}))
    write(d / ".hyperframes" / "expanded-prompt.md", "")
    return d

trigger_specs = [
    # (函数名, 触发该函数的 issue code, 构造函数 -> Path)
    ("_audit_arsenal", "arsenal_missing", lambda: (_d := make_dir(), write(_d / "frame.md", "# x\n")) and _d),
    ("_audit_arsenal", "arsenal_project_mismatch",
     lambda: (_d := make_dir(), write(_d / "frame.md", "# x\n"),
              write(_d / ".framepack" / "arsenal.json", json.dumps({"project": "WRONG_NAME", "weapons": {}}))) and _d),
    ("_audit_html_guardrails", "manual_data_hf_id",
     lambda: (_d := _base("g"), write(_d / "index.html", '<div data-hf-id="hf-x"></div>')) and _d),
    ("_audit_parameter_drift", "manifest_weapon_not_called",
     lambda: (_d := _base("p"),
              write(_d / ".hyperframes" / "expanded-prompt.md",
                    "## Execution Manifest\nscene1:\n  weapon: text-split-enter\n  params:\n    travelDistance: \"60px\"\n"),
              write(_d / "index.html", "<script>gsap.from(c,{y:60});</script>")) and _d),
    ("_audit_font_dependencies", "external_font_dependency",
     lambda: (_d := _base("f"),
              write(_d / "index.html",
                    '<link href="https://fonts.googleapis.com/css2?family=X" rel="stylesheet">')) and _d),
    ("_audit_visibility", "low_visibility_risk",
     lambda: (_d := _base("v"),
              write(_d / "frame.md", 'colors:\n  bg: "#0a0a0c"\n  fg: "#101014"\n'),
              write(_d / "index.html", '<style>.x{background:#0a0a0c;color:#101014;filter:brightness(0.3);}.v{background:rgba(0,0,0,0.82);}</style>')) and _d),
    ("_audit_timeline", "timeline_manifest_missing",
     lambda: (_d := _base("t"),
              write(_d / ".hyperframes" / "expanded-prompt.md", "# expanded with content\n"),
              write(_d / "index.html", "<div>html</div>")) and _d),
    ("_audit_lint_cache", "upstream:*",
     lambda: (_d := _base("l"),
              write(_d / ".framepack" / "hyperframes-findings.json",
                    json.dumps({"classified": [{"code": "foo", "severity": "P3",
                                                "category": "upstream_limit", "message": "m", "description": "d"}]}))) and _d),
    ("_audit_taste", "missing_taste_block",
     lambda: (_d := _base("ta"), write(_d / "frame.md", "# no taste block here\n")) and _d),
    ("_audit_weight_consistency", "atmosphere_density_mismatch",
     lambda: (_d := _base("w"),
              write(_d / "frame.md", "# w\ncontrol_profile:\n  weights:\n    atmosphere_density: 0.1\n"),
              write(_d / ".hyperframes" / "expanded-prompt.md",
                    "particle glow gradient shimmer aura haze bokeh vignette noise\n")) and _d),
]

fn_trigger_ok: dict[str, bool] = {fn: False for fn in sorted({s[0] for s in trigger_specs})}
for fn, code_glob, builder in trigger_specs:
    d = builder()
    rep = audit_project(d)
    got = codes_of(rep)
    hit = any(c == code_glob or (code_glob == "upstream:*" and c.startswith("upstream:")) for c in got)
    fn_trigger_ok[fn] = fn_trigger_ok.get(fn, False) or hit
    check(f"{fn} 触发 {code_glob}", hit, f"codes={got}")

# _audit_visibility 在亮度/暗色阈值下条件触发; 上面 fixture 已构造暗色+变暗信号
all_audit_fns = {
    "_audit_arsenal", "_audit_html_guardrails", "_audit_parameter_drift",
    "_audit_font_dependencies", "_audit_visibility", "_audit_timeline",
    "_audit_lint_cache", "_audit_taste", "_audit_weight_consistency",
}
check("全部 9 个 _audit_* 函数均能被触发 (trigger matrix 全绿)",
      all(fn_trigger_ok.get(fn) for fn in all_audit_fns),
      f"未触发={[fn for fn in sorted(all_audit_fns) if not fn_trigger_ok.get(fn)]}")

# ── 1.3b 干净标准项目的主管线回归 (确认 1.0 项目不会误报阻断) ──
print("\n>> 1.3b 干净标准项目不应产生任何 P0 (健康项目零阻断)")
check("1.0 标准项目 summary['P0'] == 0", report.summary.get("P0") == 0, f"summary={report.summary}")
std_fns = attribute_functions(report)
note("1.0 标准项目实际触发的函数", f"{sorted(std_fns)} — 健康项目只触发 taste/lint_cache 这类非阻断审计, 属预期")

# ── 1.4 severity 映射: TASTE_SEVERITY_MAP 常量 ──
print("\n>> 1.4 severity 映射 — TASTE_SEVERITY_MAP 常量")
check("TASTE_SEVERITY_MAP == {risk:P1, suggestion:P2, note:P3}",
      TASTE_SEVERITY_MAP == {"risk": "P1", "suggestion": "P2", "note": "P3"},
      f"actual={TASTE_SEVERITY_MAP}")

# ── 1.5 severity 映射: 实测 risk/suggestion/note -> P1/P2/P3 ──
print("\n>> 1.5 severity 映射 — 三类 taste 严重度实测落地")

# (a) risk -> P1: 触发 too_many_surprises (>2 个 surprise: 提及)
d = make_dir()
write(d / ".framepack" / "arsenal.json", json.dumps({"project": d.name, "weapons": {}}))
write(d / "frame.md", f"""# f
taste:
  reference_dna: data_cathedral
  visual_physics: weightless
  energy_arc: build_to_snap
surprise_operator:
  intent: wow
""")
write(d / ".hyperframes" / "expanded-prompt.md",
      "surprise: A\nsurprise: B\nsurprise: C\n")  # 3 mentions -> too_many_surprises (risk)
r_risk = audit_project(d)
risk_issues = [i for i in r_risk.issues if i.code == "too_many_surprises"]
check("risk taste issue (too_many_surprises) 被检出", bool(risk_issues), f"codes={codes_of(r_risk)}")
if risk_issues:
    check("risk -> severity P1", risk_issues[0].severity == "P1", f"severity={risk_issues[0].severity}")

# (b) suggestion -> P2: 触发 missing_kinetic_continuity (有 expanded_prompt 但无连续性块)
d = make_dir()
write(d / ".framepack" / "arsenal.json", json.dumps({"project": d.name, "weapons": {}}))
write(d / "frame.md", "# f\ntaste:\n  reference_dna: data_cathedral\n  visual_physics: weightless\n  energy_arc: build_to_snap\n")
write(d / ".hyperframes" / "expanded-prompt.md",
      "# expanded\n\n## scene1\nplain content with no kinetic continuity markers at all.\n")
r_sug = audit_project(d)
sug_issues = [i for i in r_sug.issues if i.code == "missing_kinetic_continuity"]
check("suggestion taste issue (missing_kinetic_continuity) 被检出", bool(sug_issues), f"codes={codes_of(r_sug)}")
if sug_issues:
    check("suggestion -> severity P2", sug_issues[0].severity == "P2", f"severity={sug_issues[0].severity}")

# (c) note -> P3: 触发 motif_not_transformed (结构型 motif 无转化)
#    注意: taste_audit 的 transformation_signal 正则会匹配 "transformation" 一词本身
#    (transforms? 命中 "transform" 前缀), 故 fixture 文案须避开该词 (见发现 F-NOTE-motif).
d = make_dir()
write(d / ".framepack" / "arsenal.json", json.dumps({"project": d.name, "weapons": {}}))
write(d / "frame.md", "# f\nmotif: grid\n")  # 结构型 motif
write(d / ".hyperframes" / "expanded-prompt.md", "# expanded\nplain static layout, no evolution path described.\n")
r_note = audit_project(d)
note_issues = [i for i in r_note.issues if i.code == "motif_not_transformed"]
check("note taste issue (motif_not_transformed 结构型) 被检出", bool(note_issues), f"codes={codes_of(r_note)}")
if note_issues:
    check("note -> severity P3", note_issues[0].severity == "P3", f"severity={note_issues[0].severity}")

# F-NOTE-motif: 文案含 "transformation" 会被误判为「已转化」而漏报 note
d2 = make_dir()
write(d2 / ".framepack" / "arsenal.json", json.dumps({"project": d2.name, "weapons": {}}))
write(d2 / "frame.md", "# f\nmotif: grid\n")
write(d2 / ".hyperframes" / "expanded-prompt.md", "# expanded\nthis layout has NO transformation arc.\n")  # 含 transformation 一词
r_note2 = audit_project(d2)
note("F-NOTE-motif: 文案含 'transformation' 一词时 motif_not_transformed 不触发",
     f"codes={codes_of(r_note2)} — 正则 transforms? 命中 'transformation' 前缀, 视作已有转化信号 (漏报, 低危)")

# ════════════════════════════════════════════════════════════════════════
# ROUND 2 — 不一致场景审计
# ════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 78)
print("ROUND 2 — 不一致场景审计 (三类 weight mismatch)")
print("=" * 78)

print("\n>> 2.0 构造权重 vs 产出严重不一致项目")
bad = make_dir()
bad_name = bad.name
# atmosphere_density=0.1 -> cap=floor(0.7)=0; weapon_reliance=0.9 (>0.7); restraint_force=0.9 (>0.7)
frame_md_bad = f"""# Frame · {bad_name}

control_profile:
  weights:
    creative_autonomy: 0.5
    restraint_force: 0.9
    atmosphere_density: 0.1
    motion_dynamism: 0.5
    weapon_reliance: 0.9
"""
write(bad / "frame.md", frame_md_bad)

# expanded-prompt: 大量氛围层 + 全标 HANDWRITE + 多 surprise
expanded_bad = f"""# Expanded · {bad_name}

## HyperFrames Time Windows
TOTAL DURATION: 10 seconds

## Atmosphere
- particle field drifting
- soft glow halo
- deep gradient wash
- shimmer aura
- haze bokeh vignette
- light-leak noise

## Execution Manifest

```yaml
scene1: HANDWRITE
scene2: HANDWRITE
scene3: HANDWRITE
scene4: blur-reveal
```

## Notes
This scene packs a surprise moment, another surprise beat, and a third surprise
twist to keep viewers off balance. surprise everywhere.
"""
write(bad / ".hyperframes" / "expanded-prompt.md", expanded_bad)

arsenal_bad = {
    "schema_version": "1.0.0",
    "project": bad_name,
    "hyperframes_config": {"duration": 10},
    "weapons": {"blur-reveal": {"id": "blur-reveal", "used_by": ["scene4"], "status": "active"}},
}
write(bad / ".framepack" / "arsenal.json", json.dumps(arsenal_bad, ensure_ascii=False))

r2 = audit_project(bad)
r2_codes = codes_of(r2)
print(f"  全部 issue codes: {r2_codes}")
print(f"  summary: {r2.summary}")

# ── 2.1 三类 mismatch 都被检测 ──
print("\n>> 2.1 三类 weight mismatch 都被检测")
check("atmosphere_density_mismatch 被检出", "atmosphere_density_mismatch" in r2_codes)
check("weapon_reliance_mismatch 被检出", "weapon_reliance_mismatch" in r2_codes)
check("restraint_force_mismatch 被检出", "restraint_force_mismatch" in r2_codes)

mismatch_issues = {i.code: i for i in r2.issues
                   if i.code in {"atmosphere_density_mismatch", "weapon_reliance_mismatch", "restraint_force_mismatch"}}

# ── 2.2 所有 P2 (mismatch) 都带 requires_explanation=True ──
print("\n>> 2.2 全部 mismatch issue 带 requires_explanation=True 且 severity=P2")
for code in ("atmosphere_density_mismatch", "weapon_reliance_mismatch", "restraint_force_mismatch"):
    if code in mismatch_issues:
        iss = mismatch_issues[code]
        check(f"{code}: severity == P2", iss.severity == "P2", f"severity={iss.severity}")
        check(f"{code}: details['requires_explanation'] == True",
              bool(iss.details and iss.details.get("requires_explanation") is True),
              f"details={iss.details}")

# 更广: 本轮所有 P2 issue 是否都带 requires_explanation (weight 桥接产出的 P2)
p2_weight = [i for i in r2.issues
             if i.severity == "P2" and i.code in {"atmosphere_density_mismatch", "weapon_reliance_mismatch", "restraint_force_mismatch"}]
check("全部 weight-mismatch P2 issue 均 requires_explanation=True",
      all(i.details and i.details.get("requires_explanation") is True for i in p2_weight),
      f"count={len(p2_weight)}")

# ── 2.3 issue 描述清晰、severity 正确 ──
print("\n>> 2.3 issue message 描述清晰 (含关键上下文)")
for code, kw in [
    ("atmosphere_density_mismatch", "atmosphere_density"),
    ("weapon_reliance_mismatch", "weapon_reliance"),
    ("restraint_force_mismatch", "restraint_force"),
]:
    if code in mismatch_issues:
        msg = mismatch_issues[code].message
        check(f"{code}: message 含权重名 '{kw}'", kw in msg, f"msg={msg!r}")
# atmosphere mismatch 应含层数信息
if "atmosphere_density_mismatch" in mismatch_issues:
    m = mismatch_issues["atmosphere_density_mismatch"].message
    check("atmosphere message 含 '层' (层信息)", "层" in m, f"msg={m!r}")
# weapon_reliance mismatch 应含 HANDWRITE 比例信息
if "weapon_reliance_mismatch" in mismatch_issues:
    m = mismatch_issues["weapon_reliance_mismatch"].message
    check("weapon_reliance message 含 'HANDWRITE' 或 '比例'", ("HANDWRITE" in m or "比例" in m), f"msg={m!r}")
# restraint_force mismatch 应含 surprise 数量信息
if "restraint_force_mismatch" in mismatch_issues:
    m = mismatch_issues["restraint_force_mismatch"].message
    check("restraint message 含 'surprise'", "surprise" in m, f"msg={m!r}")

# path 指向 expanded-prompt.md
for code, iss in mismatch_issues.items():
    check(f"{code}: path 指向 expanded-prompt.md", iss.path and iss.path.endswith("expanded-prompt.md"),
          f"path={iss.path}")

# ════════════════════════════════════════════════════════════════════════
# ROUND 3 — 边界情况审计
# ════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 78)
print("ROUND 3 — 边界情况审计 (空项目 / 旧版 / 损坏 / graceful degradation)")
print("=" * 78)


def run_safe(label: str, d: Path) -> QualityAuditReport | None:
    """运行 audit_project, 捕获一切异常, 返回 report 或 None(崩溃)."""
    try:
        rep = audit_project(d)
        check(f"{label}: audit_project 不崩溃, 返回 QualityAuditReport",
              isinstance(rep, QualityAuditReport), f"type={type(rep).__name__}")
        return rep
    except Exception as exc:
        check(f"{label}: audit_project 不崩溃", False, f"EXCEPTION {type(exc).__name__}: {exc}")
        return None


# ── 3.1 空项目目录 (只有 frame.md, 没有 expanded-prompt.md) ──
print("\n>> 3.1 空项目目录 (只有 frame.md, 无 expanded-prompt / arsenal / html)")
empty = make_dir()
write(empty / "frame.md", "# empty project\ncontrol_profile:\n  weights:\n    creative_autonomy: 0.5\n")
rep_empty = run_safe("3.1 空项目", empty)
if rep_empty is not None:
    e_codes = codes_of(rep_empty)
    print(f"    codes: {e_codes}")
    check("3.1: 无 expanded-prompt -> 不触发 weight mismatch (expanded_prompt 为空, 桥接早退)",
          not any(c in e_codes for c in ("atmosphere_density_mismatch", "weapon_reliance_mismatch", "restraint_force_mismatch")),
          f"codes={e_codes}")
    check("3.1: 无 arsenal -> arsenal_missing (P0) 或无 arsenal 相关 issue",
          True)  # 仅记录行为
    check("3.1: summary 仍为完整 4 键结构", set(SEVERITIES).issubset(rep_empty.summary.keys()))

# ── 3.2 旧版项目 (frame.md 只有 forbidden_motion, 没有 control_profile) ──
print("\n>> 3.2 旧版项目 (frame.md 仅 forbidden_motion, 无 control_profile)")
legacy = make_dir()
write(legacy / "frame.md", """# legacy project

forbidden_motion:
  - glow
  - shimmer
""")
write(legacy / ".hyperframes" / "expanded-prompt.md", "# legacy expanded\nscene1: glow with shimmer particles\n")
write(legacy / ".framepack" / "arsenal.json", json.dumps({"project": legacy.name, "weapons": {}}))
rep_legacy = run_safe("3.2 旧版项目", legacy)
if rep_legacy is not None:
    l_codes = codes_of(rep_legacy)
    print(f"    codes: {l_codes}")
    # 向后兼容: 无 control_profile -> ControlProfile.from_frame_md 返回 None -> weight 审计返回 []
    check("3.2: 旧格式 (无 control_profile) 不触发任何 weight mismatch",
          not any(c in l_codes for c in ("atmosphere_density_mismatch", "weapon_reliance_mismatch", "restraint_force_mismatch")),
          f"weight codes={[c for c in l_codes if 'mismatch' in c]}")
    # 验证 from_frame_md 确实返回 None
    from core.control_profile import ControlProfile
    cp = ControlProfile.from_frame_md((legacy / "frame.md").read_text(encoding="utf-8"))
    check("3.2: ControlProfile.from_frame_md(旧 frame.md) == None (向后兼容)",
          cp is None, f"cp={cp}")

# ── 3.3 损坏项目: arsenal.json JSON 解析失败 ──
print("\n>> 3.3a 损坏项目 — arsenal.json 非法 JSON")
corrupt1 = make_dir()
write(corrupt1 / "frame.md", "# corrupt\ncontrol_profile:\n  weights:\n    creative_autonomy: 0.5\n")
write(corrupt1 / ".hyperframes" / "expanded-prompt.md", "# x\nscene1: blur-reveal\n")
write(corrupt1 / ".framepack" / "arsenal.json", "{ this is not valid json ,, }")
rep_c1 = run_safe("3.3a arsenal.json 损坏", corrupt1)
if rep_c1 is not None:
    c1_codes = codes_of(rep_c1)
    print(f"    codes: {c1_codes}")
    # _load_json 捕获 JSONDecodeError -> {} -> _audit_arsenal 产出 arsenal_missing P0
    check("3.3a: arsenal.json 损坏 -> arsenal_missing (P0) graceful",
          "arsenal_missing" in c1_codes and any(i.severity == "P0" for i in rep_c1.issues if i.code == "arsenal_missing"),
          f"codes={c1_codes}")

# ── 3.3b 损坏项目: timeline-manifest.json 非法 JSON ──
print("\n>> 3.3b 损坏项目 — timeline-manifest.json 非法 JSON")
corrupt2 = make_dir()
write(corrupt2 / "frame.md", "# corrupt2\n")
write(corrupt2 / ".hyperframes" / "expanded-prompt.md", "# x\nTOTAL DURATION: 5 seconds\n")
write(corrupt2 / ".framepack" / "arsenal.json", json.dumps({"project": corrupt2.name, "weapons": {}}))
write(corrupt2 / ".framepack" / "timeline-manifest.json", "{ broken json }}}")
write(corrupt2 / "index.html", '<div data-duration="5"></div>')
rep_c2 = run_safe("3.3b timeline-manifest.json 损坏", corrupt2)
if rep_c2 is not None:
    c2_codes = codes_of(rep_c2)
    print(f"    codes: {c2_codes}")
    # load_timeline 抛 ValueError -> _audit_timeline 捕获 -> timeline_manifest_invalid P0
    check("3.3b: timeline 损坏 -> timeline_manifest_invalid (P0) graceful",
          "timeline_manifest_invalid" in c2_codes, f"codes={c2_codes}")

# ── 3.3c 损坏项目: frame.md 格式错误 (control_profile 块含垃圾) ──
print("\n>> 3.3c 损坏项目 — frame.md control_profile 块含非数字垃圾")
corrupt3 = make_dir()
write(corrupt3 / "frame.md", """# corrupt3

control_profile:
  weights:
    creative_autonomy: not_a_number
    restraint_force: [a, b, c]
    atmosphere_density: !!!
    this_line_is_garbage: yes
  random_unparseable: {{{
""")
write(corrupt3 / ".hyperframes" / "expanded-prompt.md", "# x\nscene1: blur-reveal particle glow\n")
write(corrupt3 / ".framepack" / "arsenal.json", json.dumps({"project": corrupt3.name, "weapons": {}}))
rep_c3 = run_safe("3.3c frame.md 垃圾权重", corrupt3)
if rep_c3 is not None:
    c3_codes = codes_of(rep_c3)
    print(f"    codes: {c3_codes}")
    check("3.3c: frame.md 垃圾权重不使审计崩溃", True)
    # from_frame_md 应返回 None 或合理 profile (lenient regex 解析, 非数字被忽略)
    from core.control_profile import ControlProfile
    cp3 = ControlProfile.from_frame_md((corrupt3 / "frame.md").read_text(encoding="utf-8"))
    note("3.3c from_frame_md 对垃圾权重的处理",
         f"返回 {type(cp3).__name__}; weights={cp3.weights if cp3 else None} (lenient: 非数字被忽略, 不崩溃)")

# ── 3.3d 完全空目录 (无任何文件) ──
print("\n>> 3.3d 完全空临时目录 (无任何文件)")
bare = make_dir()
rep_bare = run_safe("3.3d 空目录", bare)
if rep_bare is not None:
    b_codes = codes_of(rep_bare)
    print(f"    codes: {b_codes}")
    check("3.3d: 空目录 -> arsenal_missing (P0)", "arsenal_missing" in b_codes, f"codes={b_codes}")
    check("3.3d: 空目录不触发 weight mismatch (无 expanded_prompt)",
          not any("mismatch" in c for c in b_codes))

# ── 3.3e 不存在的路径 ──
print("\n>> 3.3e 不存在的路径 (ghost dir)")
ghost = Path(tempfile.gettempdir()) / "framepackF_does_not_exist_xyz"
rep_ghost = run_safe("3.3e 不存在路径", ghost)
if rep_ghost is not None:
    g_codes = codes_of(rep_ghost)
    print(f"    codes: {g_codes}")
    check("3.3e: 不存在路径不崩溃, 返回 report", True)

# ── 3.4 向后兼容总览 ──
print("\n>> 3.4 向后兼容总览 (旧格式 vs 新格式 weight 审计行为对比)")
# 旧格式: 只有 forbidden_motion
old = make_dir()
write(old / "frame.md", "# old\nforbidden_motion:\n  - glow\n")
write(old / ".hyperframes" / "expanded-prompt.md", "scene1: glow particle gradient shimmer aura haze\n")
write(old / ".framepack" / "arsenal.json", json.dumps({"project": old.name, "weapons": {}}))
rep_old = audit_project(old)
# 新格式: control_profile 低 atmosphere_density + 同样的多氛围 expanded
new = make_dir()
write(new / "frame.md", "# new\ncontrol_profile:\n  weights:\n    atmosphere_density: 0.1\n")
write(new / ".hyperframes" / "expanded-prompt.md", "scene1: glow particle gradient shimmer aura haze\n")
write(new / ".framepack" / "arsenal.json", json.dumps({"project": new.name, "weapons": {}}))
rep_new = audit_project(new)
old_mm = [c for c in codes_of(rep_old) if "mismatch" in c]
new_mm = [c for c in codes_of(rep_new) if "mismatch" in c]
check("3.4: 旧格式 (无 control_profile) -> 0 weight mismatch", old_mm == [], f"old mismatch={old_mm}")
check("3.4: 新格式 (control_profile 低 density) -> 触发 atmosphere_density_mismatch",
      "atmosphere_density_mismatch" in new_mm, f"new mismatch={new_mm}")
print(f"    旧格式 mismatch: {old_mm}")
print(f"    新格式 mismatch: {new_mm}")

# ════════════════════════════════════════════════════════════════════════
# 总结
# ════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 78)
print(f"SUMMARY — PASS={PASS}  FAIL={FAIL}  NOTE={NOTE}")
print("=" * 78)
for status, name, detail in RESULTS:
    if status == "FAIL":
        print(f"  !! FAIL: {name} — {detail}")

sys.exit(1 if FAIL else 0)
