# 命题 C — 权重一致性审计深度测试报告（3 轮）

- 被测版本：Framepack v0.14.0
- 运行环境：Python 3.14.2（Windows）
- 被测代码：`F:/hyperframes/framepack-plugin/`
  - `core/restraint_audit.py` — `audit_weight_consistency()` / `ConsistencyIssue` / `_count_atmosphere_layers()` / `_handwrite_ratio()`
  - `core/quality_audit.py` — `_audit_weight_consistency()`（桥接）/ `audit_project()` / `QualityIssue`
  - `core/control_profile.py` — `Weights.atmosphere_layer_cap()`
- 探针脚本：`F:/hyperframes/framepack-e2e-test/testC_consistency_audit_deep.py`（只测不改，未触碰任何源码）
- 模式：只测不改。发现问题全部标记等级，未做任何修复。
- 结论速览：**59 项断言全部 PASS / 0 FAIL；10 条非阻断 NOTE 观察**。三个 P2 检查的阈值语义与集成接线层完全正确；检测器（关键词 / 正则）存在若干脆弱点，列于下文。

基线对照：插件自带 `tests/test_restraint_audit.py` + `tests/test_quality_audit_weight_bridge.py` 共 22 项，本报告测试期间持续 PASS（未回归）。

---

## Round 1 — 阈值/边界精确矩阵

目标：逐点确认三个一致性检查的**严格触发面**（strict `>` vs `>=`、容差、cap 公式），消除「边界处偶发误报/漏报」风险。

### 1.1 atmosphere_layer_cap 公式 = floor(density × 7)
`control_profile.py:42-44`。在 [0,1] 上扫描 12 个点，全部命中：

| density | cap（实测） | 备注 |
|---|---|---|
| 0.0 / 0.1 / 0.14 | 0 | floor 截断 |
| 0.15 / 0.2 | 1 | 0.15×7=1.05→1 |
| 0.3 / 0.4 | 2 | |
| 0.5 | 3 | |
| 0.7 / 0.71 | 4 | |
| 0.85 | 5 | |
| 1.0 | 7 | 满量程 |

结论：cap 公式与预期一致，无 off-by-one。

### 1.2 atmosphere 触发面 = layer_count > cap+1（严格大于，含 +1 容差）
`restraint_audit.py:46-56`（`if layer_count > cap + 1`）。density=0.2 → cap=1：
- 0/1/2 层 → 不触发；3 层 → 触发；4 层 → 触发。
- 即容差允许「cap+1」层，第「cap+2」层起报 P2。与单测 `test_one_layer_over_cap_ok` 一致。✅

### 1.3 weapon_reliance 触发 = reliance>0.7 AND hw_ratio>0.5（双严格大于）
`restraint_audit.py:60`（`if w.weapon_reliance > 0.7 and hw_ratio > 0.5`）。
- reliance 边界：0.69/0.70 → 不触发；0.71/1.0 → 触发。✅（`0.7` 不触发，符合 strict `>`）
- hw_ratio 边界（reliance 固定 0.9）：1/3=0.333、2/4=0.500 → 不触发；3/5=0.600 → 触发。✅（`0.5` 不触发，符合 strict `>`）

### 1.4 restraint_force 触发 = force>0.7 AND surprise_count>2（双严格大于）
`restraint_audit.py:72`。
- force 边界：0.70 → 不触发；0.71 → 触发。✅
- surprise 边界（force 固定 0.9）：2 个 → 不触发；3 个 → 触发。✅

### 1.5 三检查相互独立
构造 atmosphere_density=0.1 + weapon_reliance=0.9 + restraint_force=0.9，但 expanded-prompt 只铺 5 层氛围、无 HANDWRITE、无 surprise：仅 `atmosphere_density_mismatch` 触发。✅ 证明三条分支互不串扰。

**Round 1 小结：阈值逻辑全部正确，无边界 bug。**

---

## Round 2 — 检测器鲁棒性

目标：压力测试三个底层探测器（关键词计数 / HANDWRITE 正则 / surprise 计数）的真实世界健壮性。此处发现的问题均为**非阻断**（不影响 P0/P1，且 P2 自带「需解释」软约束），但属于真实的检测器脆弱点。

### 2.1 / 2.2 atmosphere 关键词计数（正确行为确认）
- 12 个关键词（`_ATMOSPHERE_KEYWORDS`），`grid-line` 与 `grid` 去重逻辑正确：两者同现计 1 层（`restraint_audit.py:102-103`）。✅
- 大小写不敏感（函数对 text 取 `.lower()`，`restraint_audit.py:96`）：`PARTICLE`、`Glow` 均识别。✅

### 2.3 子串匹配导致的关键词误报（NOTE — 低）
`_count_atmosphere_layers` 用纯 `in` 子串匹配（`restraint_audit.py:98`）。真实文案中的**同源/派生词**会虚增层数，可能把本不该触发的 `atmosphere_density_mismatch` 推过阈值（误报，P2 软约束可解释，影响小）：

| 文案词 | 命中关键词 | 实测层数 |
|---|---|---|
| `afterglow` | glow | 1 |
| `glowing` | glow | 1 |
| `gridline` | grid | 1 |
| `gradients` | gradient | 1 |
| `hazel` | haze | 1 |
| `noisy` | — | 0（**不**含 "noise"，无 e；属正确不匹配，非误报）|

> 注：探针脚本里把 `noisy` 误标为误报，实测返回 0 层，说明该词不受影响。真正会误报的是上表前 5 行。等级：**低（P2 软约束 + 解释要求可兜底）**。

### 2.4 surprise 复数漏报（NOTE — 低/中）
`restraint_audit.py:71`：`re.findall(r'\bsurprise\b', ..., re.IGNORECASE)`。词边界 `\b` 使复数 **`surprises` 不被计数**（"surprise" + "s" 之间是 word-word，无 `\b`）。实测 3 个 `surprises` 在 restraint_force=0.9 下**不触发** `restraint_force_mismatch`。
- 影响：高克制项目里若文案用复数 "surprises"，可能漏报。等级：**低/中**（取决于文案习惯）。

### 2.5 连字符武器名（确认已修复 + 旧测试评论过时）
`restraint_audit.py:113`：`r'scene\d+:?\s*([\w-]+)'`。字符类 **`[\w-]+` 含连字符**，`card-cascade-reveal` 完整捕获，ratio=0.5。✅
- 附带发现：`test7_edge_probes.py` 探查 6 的评论仍写「正则 `\w+` 把 card-cascade-reveal 截成 'card'」——**该评论已过时**，源码早已改为 `[\w-]+`。属文档/测试注释漂移，不影响功能。等级：**信息**。

### 2.6 / 2.7 handwrite 正则边界（部分 NOTE — 低）
- 空串 / 无 `scene` 前缀 → ratio=0.0；`Scene1`（大写）/`handwrite`（小写）→ 正确识别。✅
- NOTE：正则 `scene\d+` **无词首锚定**，`obscene1: HANDWRITE` 会被匹配（`obscene` 内含 `scene1`）。等级：**低**（真实场景 unlikely）。

### 2.8 裸 sceneN: 行跨行吞词（NOTE — 中）⚠️ 本轮最实质发现
正则 `scene\d+:?\s*([\w-]+)` 中 `\s*` **包含换行符**（Python `\s` = `[ \t\n\r\f\v]`）。当某行是裸 `scene1:`（冒号后无武器名）时，`\s*` 会跨行吞掉**下一行的首词**：

```
输入: "scene1:\nscene2: HANDWRITE"
findall → ['scene2']          # 第一个 entry 错误地抓到下一行的 'scene2'
ratio  → 0.0                   # 'scene2' 非 handwrite
```

- 后果：若 Execution Manifest 里存在空占位行（`scene1:` 后无内容），且 weapon_reliance 高（>0.7），HANDWRITE 比例会被错误压低，**可能漏报** `weapon_reliance_mismatch`。
- 复现：探针 2.8 实测 `ratio=0.0`、`findall=['scene2']`，与源码 `restraint_audit.py:113-119` 行为一致。
- 等级：**中**（需特定输入形态：裸占位行；规范 Manifest 不会出现，但属真实的解析腐蚀路径）。位置：`restraint_audit.py:113` 的 `\s*`。

**Round 2 小结：阈值与基本计数正确；检测器在「子串误报 / 复数漏报 / 裸行跨行吞词」三处存在脆弱点，均为非阻断，最实质者为 2.8。**

---

## Round 3 — 集成接线层（桥接 + audit_project 端到端 + 容错）

目标：验证 `restraint_audit.ConsistencyIssue` 经 `quality_audit._audit_weight_consistency()` 桥接进 `audit_project()` 全链路的正确性与健壮性。

### 3.1 桥接字段映射 ✅
`quality_audit.py:714-747`。ConsistencyIssue → QualityIssue：
- code / severity / message 全部保留；P2 保留为 P2；
- `requires_explanation=True` 进入 `details`；
- `path` 指向 `.hyperframes/expanded-prompt.md`；`scene=None`。
全 7 项 PASS。

### 3.2 端到端三 P2 同发 ✅
合成项目（density=0.1 + reliance=0.9 + restraint=0.9，对应 expanded-prompt 同时铺氛围/全 HANDWRITE/3 surprise）：`audit_project()` 一次性产出全部三个 mismatch code，且均为 P2。

### 3.3 / 3.4 向后兼容与一致项目 ✅
- 无 `control_profile` 块（旧项目）→ 不产出任何 mismatch；`ControlProfile.from_frame_md` 返回 None 时桥接早退（`quality_audit.py:727-728`）。✅
- 权重与产出一致 → 0 mismatch。✅

### 3.5 容错 ✅
桥接整体包在 `try/except`（`quality_audit.py:722, 742-747`），异常被 `logging.warning` 吞掉返回 `[]`，**不会使 `audit_project()` 崩溃**。极端权重（atmosphere_density=1.0）实测不抛异常。✅
- 附带说明（信息级，非缺陷）：该 `except Exception` 会**静默丢弃**权重审计阶段的任何异常，意味着若 `ControlProfile.from_frame_md` 解析异常，权重一致性会「无声返回空」而非告警。设计为「绝不阻断主审计流程」，属有意取舍。

### 3.6 / 3.7 空输入与解释标志 ✅
- `cp=None` 或空 expanded_prompt → `[]`（`restraint_audit.py:39-40`）。✅
- 所有 P2 issue 的 `requires_explanation=True`（`restraint_audit.py:55,67,79` 默认）。✅

**Round 3 小结：集成接线层完全正确，映射无损、端到端可用、容错到位。**

---

## 问题清单（汇总）

| # | 类别 | 位置 | 现象 | 等级 | 类型 |
|---|---|---|---|---|---|
| C-1 | 检测器 | `restraint_audit.py:113` `\s*` | 裸 `sceneN:` 行（无武器名）跨行吞下一行首词，污染 hw_ratio（实测 ratio 被压到 0.0），高 reliance 下可能**漏报** weapon_reliance_mismatch | 中 | 解析腐蚀 |
| C-2 | 检测器 | `restraint_audit.py:71` `\bsurprise\b` | 复数 `surprises` 不被计数，高克制项目可能**漏报** restraint_force_mismatch | 低/中 | 词法漏报 |
| C-3 | 检测器 | `restraint_audit.py:98` 子串匹配 | 同源/派生词（afterglow/glowing/gridline/gradients/hazel）虚增氛围层数，可能**误报** atmosphere_density_mismatch | 低 | 误报（P2 可解释兜底）|
| C-4 | 检测器 | `restraint_audit.py:113` `scene\d+` 无词首锚定 | `obscene1:` 等含 `scene` 子串的词被误匹配 | 低 | 边界 |
| C-5 | 文档 | `framepack-e2e-test/test7_edge_probes.py` 探查6 | 评论称连字符武器名「被截成 card」已过时；源码正则现为 `[\w-]+`，功能正常 | 信息 | 注释漂移 |

> 说明：以上 5 项均**非阻断**。三个一致性检查本身被定位为 P2（提醒 + 要求解释），阈值与接线逻辑经 Round 1/3 验证完全正确。C-1/C-2 属真实漏报路径，C-3 属真实误报路径，建议后续在 `[\w-]+` 前考虑词首锚定 / 复数归一，但本次按「只测不改」未做任何修改。

## 未发现问题（确认正常）
- atmosphere_layer_cap 公式、+1 容差：正确。
- 三个 strict `>` 阈值（reliance/force/hw_ratio/surprise）：正确，`0.7`/`0.5`/`2` 均不触发。
- 三检查相互独立：正确。
- 桥接字段映射（code/severity/message/requires_explanation/path）：无损。
- audit_project 端到端、向后兼容、容错、空输入：全部正常。

## 复现
```bash
cd /f/hyperframes/framepack-e2e-test
python testC_consistency_audit_deep.py     # 59 PASS / 0 FAIL / 10 NOTE，exit 0
```
