# 命题 F — quality_audit 完整审计管线测试报告（3 轮）

- 测试日期: 2026-06-19
- 被测版本: Framepack v0.14.0
- 运行环境: Windows 10, Python 3.14.2 (`C:\Python314\python.exe`)
- 被测代码: `F:/hyperframes/framepack-plugin/`
  - `core/quality_audit.py` — `audit_project(project_dir)`, `QualityIssue`, `QualityAuditReport`, 以及 9 个 `_audit_*` 子函数
  - 经由桥接: `core/taste_audit.py`（risk/suggestion/note → P1/P2/P3）、`core/restraint_audit.py`（权重一致性 → P2/P3）、`core/control_profile.py`（`ControlProfile.from_frame_md`）
- 探针脚本: `F:/hyperframes/framepack-e2e-test/testF_quality_audit_pipeline.py`（只测不改，未触碰任何源码）
- 模式: **只测不改**。发现问题全部标记等级，未做任何修复。
- 结论速览: **71 项断言全部 PASS / 0 FAIL / 3 条 NOTE 观察**。`audit_project()` 主管线（9 个 `_audit_*` 函数串联）接线完整、severity 映射正确、graceful degradation 到位；发现 2 处非阻断的检测器脆弱点（列于文末）。

基线对照: 插件自带 `tests/test_quality_audit.py` + `tests/test_production_quality_audit.py` + `tests/test_restraint_audit.py` 共 49 项，本报告测试期间持续 PASS（未回归）。

> ⚠️ 命名澄清（信息级）: 本命题任务书引用了 `_audit_param_drift()` 与 `_audit_stale_arsenal()` 两个名字，但 v0.14.0 源码中的实际函数名是 `_audit_parameter_drift()`（"parameter" 全拼）与 `_audit_arsenal()`（无 "stale_" 前缀）。这是任务书与源码的命名漂移，不影响功能；下文一律以源码实际名（`_audit_parameter_drift` / `_audit_arsenal`）为准。

`audit_project()` 实际串联的 9 个 `_audit_*` 函数（`quality_audit.py:760-768`）:

| 函数 | 产出 issue code | 典型 severity |
|---|---|---|
| `_audit_arsenal` | arsenal_missing / arsenal_project_mismatch / arsenal_duration_* / manifest_weapon_missing_from_arsenal / arsenal_used_by_empty | P0/P1 |
| `_audit_html_guardrails` | manual_data_hf_id / undeclared_card_cascade | P1 |
| `_audit_parameter_drift` | manifest_weapon_not_called / weapon_parameter_drift | P0/P2 |
| `_audit_font_dependencies` | external_font_dependency / font_face_missing_local_asset | P1/P2 |
| `_audit_visibility` | low_visibility_risk | P2 |
| `_audit_timeline` | timeline_manifest_missing/invalid / timeline_duration_* / timeline_scene_* / proof_* / contact_sheet_missing / boundary_proof_missing | P0/P1/P2/P3 |
| `_audit_lint_cache` | upstream:* / 裸码（quality_issue） | 透传 lint severity |
| `_audit_taste` | missing_taste_block / missing_kinetic_continuity / generic_fade_stack / too_many_surprises / motif_not_transformed / … + specimen_id_unknown | P1/P2/P3 |
| `_audit_weight_consistency` | atmosphere_density_mismatch / weapon_reliance_mismatch / restraint_force_mismatch | P2 |

---

## 轮 1 — 标准项目审计

目标: 用 tempdir 建一个完整的 Framepack 项目（frame.md + .hyperframes/expanded-prompt.md + .framepack/arsenal.json + index.html + timeline-manifest.json + hyperframes-findings.json），验证 `audit_project()` 返回的 `QualityAuditReport` 结构、各审计函数被接线触发、severity 映射正确。

### 1.1 输入场景

构造一个**健康、完整**的标准项目:
- `frame.md`: 含 `control_profile` 块，五行权重齐全（creative_autonomy/restraint_force/atmosphere_density/motion_dynamism/weapon_reliance）+ self_assessment + taste 块。
- `.hyperframes/expanded-prompt.md`: 含 HyperFrames Time Windows、Per-Scene Beats（scene1 用 blur-reveal）、Kinetic Continuity 块、Execution Manifest（`scene1: blur-reveal`、`scene2: text-split-enter`，均带 params）。
- `.framepack/arsenal.json`: 武器注册表，3 个武器（blur-reveal / text-split-enter / library.gsap），`project` 字段匹配目录名，duration=12 匹配 expanded。
- `index.html`: 含 blurReveal / textSplitEnter 的规范函数调用。
- `.framepack/timeline-manifest.json`: 合法 timeline，duration=12 匹配。
- `.framepack/hyperframes-findings.json`: lint cache，含 1 条 quality_issue + 1 条 upstream_limit。

### 1.2 审计结果 — QualityAuditReport 结构

| 维度 | 实测 | 结论 |
|---|---|---|
| 返回类型 | `QualityAuditReport` | ✅ |
| `project_dir` | str，等于输入路径 | ✅ |
| `issues` | list[QualityIssue]，len=3 | ✅ |
| `summary` | `{'P0':0,'P1':0,'P2':2,'P3':1}` 含 P0/P1/P2/P3 四键，且与 issues 分组计数一致 | ✅ |
| QualityIssue 字段 | code/details/message/path/scene/severity/weapon_id 七字段齐全 | ✅ |
| 每个 issue.severity ∈ P0-P3 | ✅ | |
| `to_dict()` | kind=`framepack_quality_audit`，project_dir/summary 一致，issues 为 list[dict]，条目数匹配 | ✅ |

关键观察: **健康标准项目产出零 P0（零阻断）**——3 个 issue 全部来自 `_audit_taste`（2×P2）与 `_audit_lint_cache`（1×P3），即非阻断的「导演评论」层。Arsenal / HTML / 参数漂移 / 字体 / 可见性 / timeline / 权重一致性七路审计全部静默通过（项目健康）。这正是 report-first 设计的预期行为：审计不打扰健康项目。

### 1.3 验证各审计函数被触发 — Trigger Matrix

> 方法论纠正: 干净标准项目本身只触发少数审计函数是**正确**行为（项目健康）。要验证「每个 `_audit_*` 函数都被接线、且在其触发条件满足时能产出 issue」，正确做法是**逐函数构造针对性 fixture**（而非要求一个健康项目同时触发全部）。下表即此 trigger matrix，每行一个最小 fixture。

| `_audit_*` 函数 | 触发 fixture | 预期 code | 实测命中 | 结论 |
|---|---|---|---|---|
| `_audit_arsenal` | 无 arsenal.json | arsenal_missing | ✅ | ✅ |
| `_audit_arsenal` | arsenal.project 与目录名不符 | arsenal_project_mismatch | ✅ | ✅ |
| `_audit_html_guardrails` | index.html 含 `data-hf-id=` | manual_data_hf_id | ✅ | ✅ |
| `_audit_parameter_drift` | Manifest 声明 weapon 但 HTML 用 inline gsap | manifest_weapon_not_called (P0) | ✅ | ✅ |
| `_audit_font_dependencies` | index.html 引 google fonts | external_font_dependency | ✅ | ✅ |
| `_audit_visibility` | 暗调 + brightness(0.3) + 黑遮罩 | low_visibility_risk | ✅ | ✅ |
| `_audit_timeline` | 有 expanded/html 但无 timeline-manifest.json | timeline_manifest_missing | ✅ | ✅ |
| `_audit_lint_cache` | hyperframes-findings.json 含 classified | upstream:foo | ✅ | ✅ |
| `_audit_taste` | frame.md 无 taste 块 | missing_taste_block | ✅ | ✅ |
| `_audit_weight_consistency` | density=0.1 + 多氛围层 | atmosphere_density_mismatch | ✅ | ✅ |

**结论: 全部 9 个 `_audit_*` 函数均被接线且能产出 issue（trigger matrix 全绿）。** 主管线无断线、无死代码。

### 1.4 severity 映射验证（taste risk→P1, suggestion→P2, note→P3）

两层验证:

**(a) 常量层** — `TASTE_SEVERITY_MAP == {'risk':'P1','suggestion':'P2','note':'P3'}`（`quality_audit.py:55-59`）。实测一致 ✅。

**(b) 实测落地** — 构造 3 个针对性项目，分别触发 taste 的 risk/suggestion/note 三档，验证经 `_audit_taste` 桥接后在 `QualityIssue` 上的 severity:

| taste 原始 severity | 触发 code | 触发 fixture | 桥接后 QualityIssue.severity | 结论 |
|---|---|---|---|---|
| risk | too_many_surprises | expanded 含 3 个 `surprise:` 提及 | **P1** | ✅ risk→P1 |
| suggestion | missing_kinetic_continuity | expanded 无 Kinetic Continuity 块 | **P2** | ✅ suggestion→P2 |
| note | motif_not_transformed（结构型） | frame.md `motif: grid` + expanded 无转化信号 | **P3** | ✅ note→P3 |

**结论: severity 映射在常量层与端到端实测层均正确，risk/suggestion/note → P1/P2/P3 无损落地。**

**轮 1 小结**: 结构正确、9 路审计全接线、severity 映射正确。健康项目零阻断。✅

---

## 轮 2 — 不一致场景审计

目标: 构造权重与产出严重不一致的项目，验证三类 weight mismatch 都被检测、所有 P2 issue 带 `requires_explanation=True`、描述清晰。

### 2.1 输入场景

构造一个**五行权重与 expanded-prompt 产出全面打架**的项目:
- `atmosphere_density=0.1`（cap=floor(0.7)=0）但 expanded-prompt 铺了 10 层氛围关键词（particle / glow / gradient / shimmer / aura / haze / bokeh / vignette / noise / light-leak）。
- `weapon_reliance=0.9`（>0.7 高依赖）但 Execution Manifest 全标 HANDWRITE（`scene1-3: HANDWRITE`，`scene4: blur-reveal`），HANDWRITE 比例 = 3/4 = 75%（>0.5）。
- `restraint_force=0.9`（>0.7 克制）但 expanded-prompt 含 4 处 surprise。

### 2.2 审计结果

`audit_project()` 返回 `{'P0':0,'P1':1,'P2':5,'P3':0}`，issue codes:
```
['timeline_manifest_missing', 'missing_taste_block', 'missing_kinetic_continuity',
 'atmosphere_density_mismatch', 'weapon_reliance_mismatch', 'restraint_force_mismatch']
```

**2.2.1 三类 mismatch 全部检出 ✅**

| 预期 mismatch | 被检出 | severity | requires_explanation |
|---|---|---|---|
| atmosphere_density_mismatch | ✅ | P2 | True ✅ |
| weapon_reliance_mismatch | ✅ | P2 | True ✅ |
| restraint_force_mismatch | ✅ | P2 | True ✅ |

**2.2.2 全部 weight-mismatch P2 issue 带 `requires_explanation=True` ✅**

桥接层 `_audit_weight_consistency`（`quality_audit.py:731-741`）将 `ConsistencyIssue.requires_explanation` 透传进 `QualityIssue.details['requires_explanation']`。实测 3/3 mismatch 的 details 均为 `{'requires_explanation': True}`。

**2.2.3 issue 描述清晰、severity 正确 ✅**

实测 message（均含权重名 + 量化上下文，可读性强）:

| code | message（实测） |
|---|---|
| atmosphere_density_mismatch | `atmosphere_density=0.1 建议上限约0层，但 expanded-prompt 检测到10层。请在 expanded-prompt.md 里解释为何超出，或削减层数。` |
| weapon_reliance_mismatch | `weapon_reliance=0.9（高依赖）但 HANDWRITE 比例=75%。高依赖应多用武器兜底，请解释为何大量裸写。` |
| restraint_force_mismatch | `restraint_force=0.9（克制倾向）但检测到4个 surprise。克制高时建议 ≤1 个 surprise，请解释。` |

附加验证:
- 三个 message 均含对应权重名（atmosphere_density / weapon_reliance / restraint_force）✅
- atmosphere message 含「层」、weapon message 含「HANDWRITE/比例」、restraint message 含「surprise」✅
- 三个 issue 的 path 均指向 `.hyperframes/expanded-prompt.md` ✅

> 数据校验: atmosphere 实测检出 10 层（与 fixture 的 10 个关键词一致）；HANDWRITE 比例 75%（=3/4，与 fixture 一致）；surprise 计数 4（fixture 有 "surprise moment / surprise beat / surprise twist / surprise everywhere" 共 4 个 `\bsurprise\b`）。检测器数值与输入精确对应。

**轮 2 小结**: 三类 mismatch 全检出、全 P2、全带 requires_explanation、message 清晰且量化准确。✅

---

## 轮 3 — 边界情况审计（graceful degradation + 向后兼容）

目标: 验证 `audit_project()` 在各种边界/损坏输入下**不崩溃**，且旧格式项目不触发 weight 审计（向后兼容）。

### 3.1 空项目目录（只有 frame.md，无 expanded-prompt.md）

- 输入: 仅 `frame.md`（含 control_profile），无 expanded-prompt / arsenal / html / timeline。
- 结果: 不崩溃 ✅。codes = `['arsenal_missing', 'missing_taste_block']`。
- 验证: 因 expanded_prompt 为空，`_audit_weight_consistency` 桥接早退（`restraint_audit.py:39` `not expanded_prompt.strip()`），**不触发任何 weight mismatch** ✅。summary 仍为完整 4 键结构 ✅。

### 3.2 旧版项目（frame.md 只有 forbidden_motion，无 control_profile）

- 输入: `frame.md` 仅含 `forbidden_motion:` list（旧格式），有 expanded-prompt + 合法 arsenal。
- 结果: 不崩溃 ✅。codes = `['timeline_manifest_missing','missing_taste_block','missing_kinetic_continuity']`。
- 验证: `ControlProfile.from_frame_md()` 对无 `control_profile` 关键字的文本返回 `None`（`control_profile.py:164-165`），桥接早退（`quality_audit.py:727-728`），**零 weight mismatch** ✅。
- 直接验证: `ControlProfile.from_frame_md(旧frame.md) is None` ✅。

### 3.3 损坏的项目（graceful degradation）

| 损坏类型 | 输入 | 是否崩溃 | graceful 处理 |
|---|---|---|---|
| **3.3a arsenal.json 非法 JSON** | `{ this is not valid json ,, }` | ❌ 不崩溃 ✅ | `_load_json` 捕获 `JSONDecodeError` → `{}`（`quality_audit.py:79-80`）→ `_audit_arsenal` 产出 `arsenal_missing` (P0) ✅ |
| **3.3b timeline-manifest.json 非法 JSON** | `{ broken json }}}` | ❌ 不崩溃 ✅ | `load_timeline` 抛 `ValueError` → `_audit_timeline` 捕获（`quality_audit.py:545-553`）→ `timeline_manifest_invalid` (P0) ✅ |
| **3.3c frame.md control_profile 块含非数字垃圾** | weights 全是 `not_a_number` / `[a,b,c]` / `!!!` | ❌ 不崩溃 ✅ | lenient 正则解析忽略非数字（`control_profile.py:247-253`）；实测 `from_frame_md` 返回 `None`（无任何有效权重） |

附加边界:
- **3.3d 完全空临时目录**（无任何文件）: 不崩溃 ✅，codes=`['arsenal_missing']`，不触发 weight mismatch ✅。
- **3.3e 不存在的路径**（ghost dir）: 不崩溃 ✅，codes=`['arsenal_missing']`，返回合法 report ✅。

### 3.4 向后兼容总览（旧格式 vs 新格式 weight 审计对比）

同一段 expanded-prompt（`glow particle gradient shimmer aura haze` 多氛围），分别配旧/新 frame.md:

| frame.md 格式 | ControlProfile | weight mismatch 结果 |
|---|---|---|
| 旧: 仅 `forbidden_motion:`（无 control_profile） | `None` | **0 mismatch** ✅（不审计权重） |
| 新: `control_profile: weights: atmosphere_density: 0.1` | 有效 profile | `['atmosphere_density_mismatch']` ✅（审计生效） |

**结论: 旧格式严格向后兼容——无 control_profile 即不触发 weight 审计，零误报。**

**轮 3 小结: 7 类边界/损坏输入全部 graceful（无崩溃），损坏 JSON 一律降级为对应 P0 issue，旧格式向后兼容确认。✅**

---

## 问题清单（汇总）

| # | 类别 | 位置 | 现象 | 等级 | 类型 |
|---|---|---|---|---|---|
| F-1 | 检测器 | `taste_audit.py:288` transformation_signal 正则 `transforms?` | 该正则匹配名词 "transformation" 的前缀（`transform`），导致文案中只要出现 "transformation" 一词（哪怕是 "NO transformation arc"），即被判为「已有转化信号」，`motif_not_transformed`（note）**漏报**。实测: `motif: grid` + expanded 含 "NO transformation arc" → 不触发 note | 低 | 词法漏报（note 级，非阻断） |
| F-2 | 归属歧义 | `warning_classifier.py:240` merge_classified_into_quality_issues | `_audit_lint_cache` 在 `category='quality_issue'` 时会发**裸码**（如 `unused-selector`，无 `upstream:` 前缀），与原生 quality-audit code 同命名空间。仅凭 issue.code 无法区分来源，唯一判别是 `details['category']` 字段。若 lint cache 注入与原生同名的 code 会造成归属混淆 | 低 | 命名空间冲突（非阻断，但削弱可观测性） |
| F-3 | 命名 | 任务书 vs `quality_audit.py` | 任务书引用 `_audit_param_drift()` / `_audit_stale_arsenal()`，源码实际为 `_audit_parameter_drift()` / `_audit_arsenal()`。任务书命名漂移 | 信息 | 文档/任务书漂移 |

> 说明: 以上 3 项均**非阻断**。F-1 是 note 级漏报（最弱 severity），F-2 是可观测性削弱（不影响 issue 本身的检出与 severity），F-3 纯命名澄清。`audit_project()` 主管线功能经三轮验证完全正确。

## 设计性观察（非缺陷，记录备查）

- **桥接层静默容错**: `_audit_weight_consistency`（`quality_audit.py:722,742-747`）与 `_audit_taste`（`quality_audit.py:685,704-709`）均整体包在 `try/except Exception`，异常被 `logging.warning` 吞掉返回 `[]`，绝不阻断主审计流程。这是有意的「report-first、绝不 crash」取舍；代价是权重/taste 审计阶段的异常会**无声返回空**而非告警（与命题 C 报告 3.5 一致，已知设计）。
- **健康项目零阻断**: 标准/健康项目（1.0 场景）产出 `P0=0`，全部 issue 来自 taste/lint_cache 等非阻断「导演评论」层。report-first 设计达成「不打扰健康项目」目标。

## 未发现问题（确认正常）

- `QualityAuditReport` / `QualityIssue` 数据结构、字段、`to_dict()` 序列化: 正确。
- 9 个 `_audit_*` 函数全部接线、条件触发正确（trigger matrix 全绿）。
- TASTE_SEVERITY_MAP 映射（risk/suggestion/note → P1/P2/P3）: 常量层 + 端到端实测层均正确。
- 三类 weight mismatch（atmosphere/weapon_reliance/restraint）: 全检出、全 P2、全带 `requires_explanation=True`、message 量化准确、path 指向 expanded-prompt.md。
- 7 类边界/损坏输入（空项目 / 旧版 / arsenal.json 损坏 / timeline.json 损坏 / frame.md 垃圾权重 / 空目录 / 不存在路径）: 全部 graceful，无崩溃。
- 向后兼容: 旧格式（无 control_profile）严格不触发 weight 审计，零误报。

## 复现

```bash
cd /f/hyperframes/framepack-e2e-test
python testF_quality_audit_pipeline.py     # 71 PASS / 0 FAIL / 3 NOTE, exit 0
```

基线回归:
```bash
cd /f/hyperframes/framepack-plugin
python -m pytest tests/test_quality_audit.py tests/test_production_quality_audit.py tests/test_restraint_audit.py -q   # 49 passed
```
