# 命题 A — 五行权重端到端流程 + 相生相克验证（3 轮）

- 测试日期: 2026-06-19
- 被测版本: Framepack v0.14.0（`F:/hyperframes/framepack-plugin/plugin.yaml`）
- 环境: Windows 10, Python 3.14.2 (`C:\Python314\python.exe`)
- 测试脚本: `F:/hyperframes/framepack-e2e-test/testA_weight_flow_3rounds.py`
- 原则: **只测不改**，发现问题写报告不改代码
- 被测模块:
  - `core/control_profile.py` — `ControlProfile.from_frame_md()` / `render_directive()` / `atmosphere_layer_cap()`
  - `core/restraint_audit.py` — `audit_weight_consistency()`
  - `hooks/on_post_tool_call.py` — `_build_weight_directive()` / `_build_weight_consistency_report()`

五行映射：木=creative_autonomy，金=restraint_force，火=atmosphere_density，水=motion_dynamism，土=weapon_reliance。

---

## 一句话结论

端到端流程（解析 → 渲染 → Hook 注入 → 一致性审计）**完全按设计工作，零阻断性 bug**；但文档反复承诺的"相生相克"（木克土 / 土克水 / 水克火 / 火克金 / 金克木）在**代码层完全不存在**——五个权重是彻底正交、互相独立的标量，无任何跨元素耦合或交叉校验。这是一个"文档承诺 vs 代码实现"的语义落差（见发现 F1），属设计性发现而非功能 bug。

| 维度 | 结果 |
|------|------|
| 轮 1 端到端 happy-path（12 项） | **PASS 12/12** |
| 轮 2 相生相克 5 条克链探测（11 项） | PASS 10/11（1 项为"证实落差"的预期 FAIL） |
| 轮 3 跨元素审计探针（7 项） | **PASS 7/7** |
| **探针总计 30 项，PASS 29，FAIL 1（FAIL = 预期落差，非代码 bug）** | |

---

## 轮 1：五行权重端到端 happy-path + 元素独立性 — PASS

### 输入 frame.md
```yaml
control_profile:
  weights:
    creative_autonomy: 0.9    # 木 high
    restraint_force: 0.45     # 金 medium
    atmosphere_density: 0.85  # 火 high → cap = floor(0.85×7) = 5
    motion_dynamism: 0.2      # 水 low
    weapon_reliance: 0.5      # 土 medium
```

### 1.1 解析 + atmosphere_layer_cap
- `from_frame_md()` 返回非 None ✓
- `atmosphere_layer_cap() == 5`，等于 `floor(0.85×7)`，符合设计 ✓

### 1.2 render_directive() 全文
```
## 五行权重指令（自动生成，来自你的 control_profile）

木 creative_autonomy=0.9: 信任你的创意判断，可以自主选择风格、混合独特元素，不必拘泥风格库。
金 restraint_force=0.45: 中庸克制力——适度即可，但警惕过度堆砌。
火 atmosphere_density=0.85: 氛围密度高，层数上限约5层，可以铺多层氛围。
水 motion_dynamism=0.2: 动作张力低，保持沉稳/平静的节奏，用 drift、fade 这类温和动词。
土 weapon_reliance=0.5: 中庸武器依赖——武器和裸写搭配使用。

以上指令基于你试菜后的自评权重，请在后续阶段遵循。
```
- 五行标注 木/金/火/水/土 全部出现 ✓
- 三档文案命中正确：木 high("信任你的创意")、水 low("drift")、火 high("上限约5层") ✓

### 1.3 Hook 接线（直接调用，绕过 ctx）
- `_build_weight_directive()` 非 None，且字节级等于 `render_directive()` ✓ —— Hook 1 是 ControlProfile 的薄封装，无逻辑分叉。
- `_build_weight_consistency_report()` 在产出"干净"时返回 `None` ✓（向后兼容路径正常）。

### 1.4 元素独立性探测
将 木 creative_autonomy 从 0.9 改为 0.1，其余四行写死不变：

| 权重 | 改前 | 改后 | 结论 |
|------|------|------|------|
| creative_autonomy(木) | 0.9 | 0.1 | 按输入变化 ✓ |
| weapon_reliance(土) | 0.5 | 0.5 | **不受木影响** |
| restraint_force(金) | 0.45 | 0.45 | 不受影响 |
| atmosphere_density(火) | 0.85 | 0.85 | 不受影响 |
| motion_dynamism(水) | 0.2 | 0.2 | 不受影响 |

→ 第一次信号：单元素改动不牵动任何其它元素，五行彼此独立。

---

## 轮 2：相生相克 5 条克链 — 证伪（核心发现 F1）

### 方法
对文档承诺的每一条克链（`control_profile.py` 第 10-15 行、`guardrails.md` 第 59 行），把"克者"权重拉到极端 0.95，"被克者"仍由用户明确给定 0.5，观察被克者是否被代码**自动调整**。若保持原值 → 该克链在代码层无强制。

### 文档承诺的 5 条克链
```
木 克 土 — 自主高，武器依赖自然降低（V1 模式）
土 克 水 — 武器兜底多，动作更规范可控
水 克 火 — 动作张力高，氛围不需要太浓（动静互补）
火 克 金 — 氛围越浓，克制力被消耗（V3 死因）
金 克 木 — 克制力约束自主，防止自主变放纵
```

### 探测结果

| 克链 | 克者(设值) | 被克者(输入) | 被克者(解析后) | 代码级耦合 |
|------|-----------|-------------|---------------|-----------|
| 木 克 土 | creative_autonomy=0.95 | weapon_reliance=0.5 | **0.5** | ✗ 无 |
| 土 克 水 | weapon_reliance=0.95 | motion_dynamism=0.5 | **0.5** | ✗ 无 |
| 水 克 火 | motion_dynamism=0.95 | atmosphere_density=0.5 | **0.5** | ✗ 无 |
| 火 克 金 | atmosphere_density=0.95 | restraint_force=0.5 | **0.5** | ✗ 无 |
| 金 克 木 | restraint_force=0.95 | creative_autonomy=0.5 | **0.5** | ✗ 无 |

**5 条克链全部证伪：0 条存在代码级耦合。** 各克者自身 clamp 到 0.95 正常，被克者一律保持用户原值不变。

### 代码层佐证（为何必然如此）
- `Weights.__post_init__`（`control_profile.py:37-40`）：仅对每个字段单独 `_clamp`，无跨字段运算。
- `from_frame_md`（`control_profile.py:184-190`）：每个权重独立 `.get(k, 0.5)` 后传入 `Weights(**...)`，无任何联动。
- `render_directive`（`control_profile.py:96-150`）：5 个 if/elif 分支各看自己的值，文案里不引用任何其它元素。

→ "相生相克"是**纯叙述**，仅作为给 Agent 读的哲学隐喻存在于注释/文案中，没有任何数值或校验层面的落实。

---

## 轮 3：跨元素审计探针 + 五克全违背极端场景 — PASS

### 3a 五克全违背极端场景
构造所有五行都 = 0.95 的 frame.md（按文档相生相克逻辑这是内部矛盾的，但每行单看都没越界），配一份"干净"的 expanded-prompt（3 层氛围 ≤ cap+1=7、0 HANDWRITE、0 surprise）：

- 解析成功 ✓
- `atmosphere_layer_cap() == 6`（= floor(0.95×7)）✓
- `audit_weight_consistency()` 返回 **0 个 issue** ✓ —— 因为三条审计检查全是 element-vs-output，产出本身干净就不触发。
- 跨元素（相生相克）issue 数 = **0** ✓ —— 确认审计里根本没有"跨元素"这类检查代码。

→ 第二次信号：即便五行内部完全矛盾，审计也毫无反应。

### 3b 反向 sanity（确认审计本身没坏）
- `atmosphere_density=0.1`（cap=0，容差+1=1）+ expanded 含 4 个氛围关键词 → 正确触发 `atmosphere_density_mismatch` ✓
- `restraint_force=0.95 + creative_autonomy=0.95`（违背"金克木"）+ expanded 干净 → audit 返回 0 issue ✓

审计的三条检查维度均为**单元素 vs 产出**：
```
火 atmosphere_density  vs  expanded-prompt 的氛围层数
土 weapon_reliance     vs  Manifest 的 HANDWRITE 比例
金 restraint_force     vs  expanded-prompt 的 surprise 数量
```
注意：木(creative_autonomy) 与 水(motion_dynamism) **完全没有对应的产出端审计**——这是 F2。

---

## 发现的问题

### F1（中·文档与实现落差，非阻断）相生相克在代码层完全未实现
- **现象**：`control_profile.py` 模块 docstring（第 1-16 行）、`Weights` 类 docstring（第 30 行"像五行，正交但相生相克"）、`guardrails.md`（第 59 行"五个权重正交但相生相克（木克土、土克水、水克火、火克金、金克木）"）三处反复承诺五行"相生相克"，但代码里五个权重是完全正交、互不影响的独立标量，无任何耦合或交叉校验（轮 2 五条克链 0 命中）。
- **影响**：对阅读代码的开发者是误导性承诺；对最终 Agent 行为无影响（文案层面"相生相克"仍作为隐喻引导）。这大概率是**有意的隐喻设计**（类 docstring 第 30 行同时强调"正交"），但当前措辞（"覆盖万控""V3 死因"）容易让人误以为是计算约束。
- **建议（仅供参考，未改动）**：在 docstring 明确"相生相克为指导隐喻，非数值耦合"；或在 `render_directive` 里把跨元素引导作为文字补强（例如 木 high 时在文案里提示"武器依赖可适当降低"），让叙述与行为更自洽。

### F2（低·审计覆盖盲点）木与水两行无对应产出端审计
- **现象**：`audit_weight_consistency` 只覆盖 火/土/金 三条 element-vs-output 检查；木(creative_autonomy) 与 水(motion_dynamism) 在审计里没有任何对应检查项。
- **影响**：Agent 若在 expanded-prompt 里偏离 木/水 设定（例如 自主度低却大量自由发挥、动作张力高却全程静态），审计不会提示。
- **建议（仅供参考，未改动）**：考虑为 水(motion_dynamism) 增加动画动词强度匹配、为 木(creative_autonomy) 增加"风格库引用比例"等启发式检查。

### F3（提示·脚本退出码）测试脚本以 exit 1 收尾属预期
- `testA_weight_flow_3rounds.py` 的汇总探针"至少一条克链存在代码级耦合"被设计为 FAIL=落差存在，故脚本退出码 1。这是**测试设计选择**（把发现固化为断言），不代表脚本本身出错；30 项探针中 29 PASS、1 FAIL 全部是预期行为。

---

## 附录：被测核心代码定位

| 关注点 | 文件:行 | 结论 |
|--------|--------|------|
| 五权重字段定义 + clamp | `control_profile.py:28-44` | 每字段独立 clamp，无跨字段逻辑 |
| atmosphere_layer_cap | `control_profile.py:42-44` | `int(density×7)`，按设计 |
| render_directive 三档文案 | `control_profile.py:88-154` | 五行各看自己值，无相互引用 |
| from_frame_md 解析 | `control_profile.py:156-190` | 每权重独立 `.get(k,0.5)`，无联动 |
| audit 三检查维度 | `restraint_audit.py:45-82` | 仅 火/土/金 vs 产出，无跨元素 |
| Hook 1 _build_weight_directive | `on_post_tool_call.py:585-597` | ControlProfile 薄封装 |
| Hook 2 _build_weight_consistency_report | `on_post_tool_call.py:626-650` | audit 薄封装 |

**报告生成自实际执行 `python testA_weight_flow_3rounds.py` 的真实输出，无任何捏造。**
