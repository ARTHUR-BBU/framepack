# v0.13.0 方向重定义：武器架构重构

> 状态：根因调查完成，方向已重新定义
> 日期：2026-06-18
> 来源：v0.12.0 测试报告 + 根因调查（子任务 30 次调用）
> 前置文档：本文件原为 taste-vocabulary-wiring 设计，经调查后废弃，重写为武器架构重构方向

## 0. 为什么改方向（根因发现）

v0.12.0 测试报告显示 S4 typewriterCursor 和 S5 cardCascadeReveal 被 Agent 跳过。
原以为是"Agent 不听话"。

调查员做了决定性对比（对照测试实例 index.html 的实际调用情况）：

| 武器类型 | 函数签名 | 测试结果 |
|---------|---------|---------|
| 元素注入型（5件） | `(tl, 已存在元素, opts)` | 5/5 正确调用 |
| 自建 DOM 型（2件） | 函数内部 createElement 自建 DOM | 0/2 被跳过 |

5/5 对 0/2，不是巧合。

根因：**"自建 DOM 型"武器与 HyperFrames "静态结构优先"铁律存在结构性冲突**。
- HyperFrames 铁律要求 HTML 预写静态 DOM（编译器做静态解析，运行时 createElement 看不到 → 黑屏）
- 自建 DOM 型武器的函数内部用 createElement 造元素，与已预写的静态 DOM 冲突（重复元素/结构违规）
- Agent 面对矛盾，理性选择保"不黑屏"，放弃"调武器"，自己手写等价动画

受影响武器（约库内一半 part 武器）：typewriter-cursor, card-cascade-reveal, light-leak-cinema, macos-notification, particle-blob-bg, bg-blur-mask, anime-text-split, sprite-animation。

**这才是 v0.13.0 的第一优先级**——不是 taste vocabulary 接线，不是参数漂移根治，是武器架构重构。

## 1. 重定义后的优先级

| 优先级 | 方向 | 理由 |
|-------|------|------|
| P0 | 武器架构重构：自建 DOM 型 → 元素注入型 | 直接阻碍武器被使用，影响视频质量 |
| P1 | taste vocabulary 接线（影子词表消除） | 数据漂移隐患，聚焦安全 |
| P2 | 参数漂移检测逻辑重设计 | 可能是伪问题，需重新定义"什么是真正的漂移" |

---

以下保留原 taste-vocabulary-wiring 设计内容（已暂停），供后续 P1 阶段参考。

## 1. 问题本质

Framepack 有一套精心设计的"品味词汇表"（`core/taste_grammar.py`）：
- 7 个 Kinetic Grammar（动能语法）
- 12 个 Taste Moves（品味招式）
- 10 个 Surprise Operators（惊喜操作）

以及 6 个 Reference Specimens（`core/taste_specimens.py`）。

**问题**：这套词汇表目前**只被测试文件 import**（test_taste_grammar.py, test_taste_specimens.py），没有任何运行时代码消费它。而 `taste_audit.py` 用正则 + 硬编码维护了一套"影子词表"做风格判断。

影子词表有两处：

**影子词表 A — 高能招式集合**（taste_audit.py:200-201）
```python
high_energy_moves = {"editorial_punch", "system_awakening",
                     "kinetic_typography_attack",
                     "data_cathedral", "interface_ballet"}
```
这些 ID 明明在 TASTE_MOVES 里，但审计代码手抄了一份。两套词表会漂移——grammar 表加了新招式，audit 不会自动知道它的 energy level。

**影子词表 B — emerging 风格 specimen ID**（taste_audit.py:91）
```python
if re.search(r"data_cathedral|kinetic_type_event|ambient_grid", frame_md, re.I):
    return True
```
这些 specimen ID（data_cathedral_explainer, kinetic_type_event）在 taste_specimens.py 的 REFERENCE_SPECIMENS 里定义，但 audit 手抄了缩写做正则匹配。

**结果**：v0.12.0 留下的 Known Limitation 原文：
> taste vocabulary not wired — taste_grammar.py + taste_specimens.py + ManifestWeapon taste fields are designed but not yet consumed by taste_audit.py (which uses a hardcoded vocabulary).

## 2. 设计目标

1. **消除影子词表** — taste_audit.py 从 taste_grammar.py 表驱动读取，不再手抄 ID 集合
2. **单一数据源** — energy_level / style_family 等元数据定义在 grammar 表里，audit 只消费不复制
3. **不引入误报** — 方向3 刚修好的 emerging/editorial 风格判断必须保持正确（回归测试保护）
4. **数据可扩展** — 未来加新招式只改 grammar 表，audit 自动感知

## 3. 方案对比

### 方案 A（推荐）：给 TASTE_MOVES 加 energy_level 元数据，audit 表驱动消费

在 TASTE_MOVES 每个条目加 `energy_level` 字段（值："high" | "medium" | "low"），taste_audit.py 从表派生高能集合：

```python
from .taste_grammar import TASTE_MOVES

_HIGH_ENERGY_MOVE_IDS = frozenset(
    m["id"] for m in TASTE_MOVES if m.get("energy_level") == "high"
)
```

影子词表 A 消失。energy_level 作为招式的固有属性，定义在 grammar 表里（数据内聚）。

**优点**：彻底消除影子词表、单一数据源、可扩展
**代价**：改 grammar 数据结构 + audit 消费逻辑

### 方案 B：新建独立分类映射表

新建 `TASTE_MOVE_CATEGORIES = {"high_energy": [...], "low_energy": [...]}`。

**否决**：这是第三套词表，让问题更严重。目标是"消除而非增加"。

### 方案 C：audit import TASTE_MOVES 后自己分类

audit import 全表后自己判断哪些是高能。

**否决**：energy 判断逻辑还是在 audit 侧，只是把手写集合换成 import 全表后 filter，分类规则仍然硬编码在 audit 里。没解决根本问题——分类规则应该跟数据走，不是跟消费代码走。

## 4. 方案 A 详细设计

### 4.1 energy_level 分配

基于现有影子词表 A 的硬编码集合（5 个 high）+ 招式语义推断其余 7 个：

| ID | energy_level | 依据 |
|----|-------------|------|
| editorial_punch | high | 影子词表原始成员 |
| interface_ballet | high | 影子词表原始成员 |
| data_cathedral | high | 影子词表原始成员 |
| kinetic_typography_attack | high | 影子词表原始成员 |
| system_awakening | high | 影子词表原始成员 |
| motif_reincarnation | medium | 持续流动型，有动感但不爆发 |
| liquid_brand | medium | 持续流动型 |
| cold_open | medium | 有冲击但靠悬念而非动能 |
| product_reveal_ritual | medium | 仪式感，中速 |
| object_worship | low | 慢速凝视，近乎静止 |
| silence_before_drop | low | 刻意静止 |
| human_imperfection | low | 微妙手感，低能量 |

**向后兼容验证**：现有 high 集合 = {editorial_punch, interface_ballet, data_cathedral, kinetic_typography_attack, system_awakening}。方案 A 的 high 集合必须与之完全一致，否则方向3 的回归测试会变红。

### 4.2 taste_audit.py 消费层改造

**影子词表 A 消除**（`_is_intentionally_restrained` 函数）：

原代码（line 200-206）：
```python
high_energy_moves = {"editorial_punch", "system_awakening",
                     "kinetic_typography_attack",
                     "data_cathedral", "interface_ballet"}
moves_found = set()
for move_match in re.finditer(r"-\s+(\w+)", moves_block):
    move = move_match.group(1).lower().strip()
    moves_found.add(move)
if moves_found and not (moves_found & high_energy_moves):
    return True
```

改造后：
```python
moves_found = set()
for move_match in re.finditer(r"-\s+(\w+)", moves_block):
    move = move_match.group(1).lower().strip()
    moves_found.add(move)
if moves_found and not (moves_found & _HIGH_ENERGY_MOVE_IDS):
    return True
```

其中 `_HIGH_ENERGY_MOVE_IDS` 在模块顶部从 taste_grammar 派生。

**影子词表 B 处理**（`_is_emerging_style` 函数 line 91）：

这里的 `data_cathedral|kinetic_type_event|ambient_grid` 是 specimen ID 的缩写正则，用于检测 frame.md 里是否提到 emerging 风格。这个属于"specimen 风格标记"，不在本次接线范围（它是 specimen 属性而非 move 属性）。

**决策**：影子词表 B 留到 specimen 接线（如果未来做），本次只接 move energy_level。理由：B 的正则匹配的是 frame.md 自由文本里的 specimen 引用，和 TASTE_MOVES 表结构不直接对应，硬接会过度设计。聚焦消除影子词表 A（最清晰的漂移风险）。

### 4.3 风险控制

方向3 的回归测试（test_taste_audit_style_awareness.py）是安全网：
- `test_restrained_editorial_no_surprise_not_suggestion` — editorial 风格（低能招式）不报 suggestion
- `test_high_energy_no_surprise_still_suggestion` — 高能风格仍报 suggestion

这两个测试直接依赖 high_energy_moves 的精确成员。只要 energy_level 分配保证原有 5 个 high 不变，回归测试就不会变红。

### 4.4 测试策略（TDD）

**新测试**（test_taste_vocabulary_wiring.py）：
1. `test_taste_moves_all_have_energy_level` — 每个招式必须有 energy_level 字段
2. `test_energy_levels_are_valid` — 值只能是 high/medium/low
3. `test_high_energy_set_matches_legacy` — high 集合 == 原 shadow 词表（回归保护）
4. `test_audit_consumes_grammar_not_hardcode` — taste_audit.py 不再包含硬编码集合字面量（用 ast 检查或 grep 断言）

**现有测试**保持不变，作为回归保护。

## 5. 不做的事（范围控制 + 后续方向登记）

本次只解决一个明确的问题：**消除影子词表 A（high_energy_moves 硬编码）**。

以下三项不是"可选的附加部分"，是**独立的后续方向**，各自需要单独设计和验证。

### 5.1 ManifestWeapon taste 字段消费审计（v0.13 后续候选方向）

ManifestWeapon 有 4 个 taste 字段：motion_role / grammar / taste_move / surprise。
execution_manifest.py 的解析器已经把它们从 expanded-prompt.md 解析出来，但**没有任何审计逻辑消费**（只有 test_execution_manifest.py 断言解析正确）。

这不是本次接线（消除影子词表）的一部分，而是**新增审计维度**——例如"Manifest 声明了 taste_move=object_worship，但场景描述没有体现物件崇拜"。这需要：
- 真实 expanded-prompt 样本验证误报率
- 审计规则的阈值设计
- 与现有 creative 审计的边界划分

混入本次会导致"修数据漂移"和"加新功能"纠缠在一个 commit 里，违反单一职责。登记为 v0.13 独立方向。

### 5.2 影子词表 B（emerging specimen 正则，已知歧义点）

taste_audit.py:91 的 `_is_emerging_style` 里有：
```python
re.search(r"data_cathedral|kinetic_type_event|ambient_grid", frame_md, re.I)
```

**已知歧义隐患**：`data_cathedral` 同时是 specimen ID（data_cathedral_explainer）的子串**和** taste_move ID（data_cathedral）。这个正则混用了两个命名空间。本次不接（范围聚焦在 move energy_level），但标注为已知歧义点——未来做 specimen 接线时必须先解决命名空间混淆。

### 5.3 KINETIC_GRAMMAR / SURPRISE_OPERATORS 接线（YAGNI 当前）

这两个表目前没有审计逻辑消费：
- KINETIC_GRAMMAR（动能语法）：没有任何审计函数引用
- SURPRISE_OPERATORS：surprise 审计用 `_surprise_mentions` 正则做计数（有没有/多不多），不校验算子 ID 合法性

没有消费方 + 没有明确的审计需求，强行接线 = YAGNI（为了接线而接线）。

**潜在接线点**（如果未来有需求）：surprise 审计可以新增"算子 ID 合法性校验"——检查 expanded-prompt 里的 `surprise: xxx` 是否在 SURPRISE_OPERATORS 表里。但当前没有这个需求驱动，不预先实现。

## 6. 验收标准

- [ ] TASTE_MOVES 每个条目有 energy_level 字段，值为 high/medium/low
- [ ] taste_audit.py 不再有 hardcode move ID 集合字面量
- [ ] test_taste_audit_style_awareness.py 全部通过（方向3 回归保护）
- [ ] 新增 wiring 测试通过
- [ ] 全量测试 0 回归（基线 390 passed）

## 7. 实现步骤预览

1. TDD RED：写 test_taste_vocabulary_wiring.py（断言 energy_level 字段存在 + high 集合匹配）
2. RED 确认失败
3. GREEN：taste_grammar.py 给 TASTE_MOVES 加 energy_level 字段
4. GREEN 确认新测试通过
5. taste_audit.py 消费层改造（import + 派生集合 + 替换硬编码）
6. 跑方向3 回归测试确认不变
7. 全量测试确认 0 回归
8. verification-before-completion skill 加载验证
