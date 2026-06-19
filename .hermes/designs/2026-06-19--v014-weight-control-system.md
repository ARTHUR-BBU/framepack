# Framepack v0.14 设计方案：权重控制系统

> 日期: 2026-06-19
> 状态: 设计草案，待用户确认
> 理论基础: 权重系统与中间层架构（场论工程）
> 触发: 测试报告 claude-brand-30s-overall-test-report + agent-sprite-forge 引入

---

## 一句话定位

Framepack 的控制方式从**状态机**（离散开关、固定铁轨）升级为**权重系统**（连续倾向、自定河道），加上 sprite-forge 能力升级。

## 为什么——从测试报告说起

三版实验证明了一个矛盾：

| 版本 | 控制方式 | 结果 |
|------|----------|------|
| V1 | Agent 自定权重（高 creative_control） | 最好 ✅ |
| V2 | 系统强制铁轨（creative_control=0） | 干瘪 ❌ |
| V3 | 拆掉铁轨但无场（权重全满但无克制维度） | 堆砌 ❌ |

V1 赢在 Agent 有设计直觉时，自己给了自己高自由度权重。V2 输在系统不管 Agent 能力，强制套铁轨。V3 输在没有"克制"维度来平衡"自由"。

**核心问题**：当前 Framepack 几乎所有控制都是状态机——选/不选、禁/不禁、在 Phase 几。没有连续权重，没有多状态混合，没有 Agent 自我感知的机会。

## 理论基础：场论工程

来自《权重系统与中间层架构》的核心洞察：

> **控制粒度要匹配系统能力。对低能力系统用流程控制（铁轨），对高能力系统用边界和倾向控制（场）。**

场论的三条工程原则，直接映射到 Framepack：

1. **权重代替开关** — 风格不是"选一个"，是"多个风格各有权重，可以混合"
2. **驱动源和执行对象通过权重表解耦** — Phase 0 的试菜感知写权重，Phase 1/2 读权重执行
3. **权重是 Agent 自定的，不是外部施加的** — Agent 试菜后理解自己的能力边界，自己挖河道

### 自适应 = 自定权重

系统感知就是 Agent 自己。流程是：

```
试菜（读素材+创意，判断自己的理解程度和直觉信心）
    ↓
自定权重（根据试菜结果，给自己在各维度定权重）
    ↓
自执行（Phase 1/2 读自己的权重，行为自然偏移）
```

类比：厨师尝了一口食材（试菜），自己决定火候多大火、调味放多重（自定权重），然后自己做菜（自执行）。不是经理尝了告诉他怎么做，也不是不管他随便做。

## 架构设计

### 核心新增：Control Profile（权重表）

类比 Three.js 的 sceneWeights。它是 frame.md 里的一个新块，Agent 在试菜后自己填写，后续所有环节读它。

```yaml
# frame.md 新增块
control_profile:
  # 试菜结果：Agent 对自己能力的自我评估
  self_assessment:
    content_understanding: 0.85    # 我对这个内容的气质理解有多到位
    color_confidence: 0.8          # 我对配色判断有多有信心
    rhythm_confidence: 0.7         # 我对节奏设计有多有把握
    restraint_instinct: 0.9        # 我的克制直觉有多强（高=不需要外部约束别堆砌）
  
  # 五个核心控制权重——像五行，正交但相生相克，涵盖所有创意控制场景
  weights:
    creative_autonomy: 0.8         # 木｜创意自主度：信任自己的创意判断
    restraint_force: 0.7           # 金｜克制力：自我约束堆砌倾向
    atmosphere_density: 0.3        # 火｜氛围密度：视觉氛围的浓淡
    motion_dynamism: 0.6           # 水｜动作张力：动画的激进程度
    weapon_reliance: 0.5           # 土｜武器依赖度：对武器库的依赖程度
```

### 权重化的控制点映射

| 控制点 | 现在（状态机） | 权重化后 | 驱动权重 |
|--------|---------------|----------|----------|
| 风格选择 | 选 1 个模板 | top-3 候选+匹配度，允许混合 | creative_autonomy |
| forbidden_motion | 在清单=禁，不在=随便 | 整体动作调性由 motion_dynamism 决定，不逐项禁止 | motion_dynamism |
| 氛围层数 | 随意加 | 默认低密度，加层需要理由，有上限 | atmosphere_density |
| 武器引用 | 每场景必须引用或 HANDWRITE | 匹配度高的武器建议用 | weapon_reliance |
| taste moves | 选 1-3 个 | 按 restraint_force 调整建议强度 | restraint_force |
| surprise | 1-2 个 | 按 restraint_force 调整上限 | restraint_force |
| 氛围+武器叠加控制 | 无 | restraint_force 越高，越倾向少而精 | restraint_force |
| Phase 流程 | 0→1→2 固定 | creative_autonomy 高时可并行/跳步 | creative_autonomy |

### 五行相生相克——为什么5个维度够了

5个权重不是孤立的开关，是通过相生相克自然覆盖所有控制场景的连续场：

```
木（creative_autonomy）─克→ 土（weapon_reliance）
  Agent 越信任自己的直觉，越少依赖武器库（V1 模式）

土（weapon_reliance）─克→ 水（motion_dynamism）
  武器依赖度高时，动作更规范、更可控（V2 模式）

水（motion_dynamism）─克→ 火（atmosphere_density）
  动作张力高时，氛围自然不需要太浓（动静互补）

火（atmosphere_density）─克→ 金（restraint_force）
  氛围越浓烈，克制力越被消耗（V3 的失败——七层氛围击穿了克制）

金（restraint_force）─克→ 木（creative_autonomy）
  克制力约束创意自主度，防止自主变放纵
```

用三版实验验证这个框架：

| 版本 | autonomy | restraint | atmosphere | dynamism | weapon_reliance | 结果 |
|------|----------|-----------|------------|----------|-----------------|------|
| V1 | 高(0.85) | 高(0.9) | 低(0.2) | 中(0.5) | 低(0.2) | 最好 ✅ |
| V2 | 低(0.1) | 中(0.5) | 低(0.1) | 低(0.3) | 高(0.8) | 干瘪 ❌ |
| V3 | 高(0.9) | 低(0.1) | 高(0.9) | 高(0.8) | 高(0.7) | 堆砌 ❌ |

V1 赢在金（克制）和木（自主）双高——信任自己的直觉，同时自我约束。
V3 输在火（氛围）克了金（克制）——七层氛围把克制力击穿了。

**具体控制行为的推导**（不再需要逐项定义，由5维自然推导）：

- 风格选择方式 ← creative_autonomy（高=自选，低=库选）
- 风格是否混合 ← creative_autonomy > 0.7 时允许
- 动作是否激进 ← motion_dynamism（高=SLAM/CRASH，低=fade/drift）
- 氛围层数上限 ← atmosphere_density × 7（权重0.3 → 上限2层）
- 武器引用强度 ← weapon_reliance（高=必须引用，低=可选）
- surprise 上限 ← restraint_force 高时≤1，低时≤3
- taste moves 数量 ← restraint_force 高时1-2，低时2-3
- Phase 流程弹性 ← creative_autonomy 高时可跳步

### 不动的铁轨（质量底线）

这些保持状态机模式——它们是编译器/渲染的硬约束，不是创意决策：

- HyperFrames 结构规则（class="clip", data-start, window.__timelines）
- font-family 字面名
- video/audio 根级放置
- npx hyperframes lint → 0 errors
- clip 根元素不做 opacity/filter/transform

铁轨只留在编译器层。创意层全部权重化。

### 权重穿透机制——五行如何到达神经末梢

五行权重不能停在 frame.md 这个"意识层"。它要像神经信号一样，沿着 Framepack 的 hook 通路，注入到每一个执行环节。Framepack 的"神经系统"是 `_safe_inject(ctx, message, role="user")`——每个 hook 在 Agent 做完一个动作后，往 Agent 上下文注入指令。权重穿透就是让每条注入都带着权重信号。

#### 神经通路图

```
[Phase 0.5] Agent 试菜 → 自定五行权重 → 写入 frame.md
     │
     ▼
[Hook 1] post_tool_call: frame.md 写入完成
     │  读取 control_profile 权重，注入权重执行指令：
     │  "你的五行权重：creative_autonomy=0.8(高，信任你的风格选择)，
     │                restraint_force=0.7(高，倾向少而精)，
     │                atmosphere_density=0.3(低，默认克制氛围)，
     │                motion_dynamism=0.6(中高，动作可激进)，
     │                weapon_reliance=0.5(中，武器可选可不用)"
     │  + 各权重对应的具体行为指引（从五行推导表生成）
     │  → 权重信号注入到 Phase 2 的上下文中
     │
     ▼
[Phase 1-2] Agent 读自己的权重做创意决策
     │  风格选择方式 ← creative_autonomy
     │  氛围层数 ← atmosphere_density
     │  动作调性 ← motion_dynamism
     │  武器引用强度 ← weapon_reliance
     │  surprise/taste moves 数量 ← restraint_force
     │
     ▼
[Hook 2] post_tool_call: expanded-prompt.md 写入完成
     │  读取 control_profile 权重 + expanded-prompt.md 实际产出
     │  执行权重一致性检查（5维全覆盖）：
     │    木：风格选择是否匹配 creative_autonomy？（autonomy 高但没自己选风格 → 告警）
     │    金：surprise/taste moves 数量是否匹配 restraint_force？（克制高但堆了3个surprise → 告警）
     │    火：氛围层数是否匹配 atmosphere_density？（密度低但加了6层 → P2告警+要求解释）
     │    水：动作动词强度是否匹配 motion_dynamism？（张力高但全是fade/drift → 告警）
     │    土：武器引用比例是否匹配 weapon_reliance？（依赖高但全裸写 → 告警）
     │  + 注入 param_guard card（现有，不改）附带权重标记
     │  → 权重信号穿透到 HTML 写入阶段
     │
     ▼
[Phase 3] Agent 写 index.html
     │  读 param_guard card（带权重标记的参数卡）
     │  读注入的权重一致性告警（如果有）
     │  武器参数的弹性范围由 weapon_reliance 影响：
     │    高依赖 → 参数严格（drift 阈值收紧）
     │    低依赖 → 参数弹性（drift 阈值放宽，允许创意调整）
     │
     ▼
[Hook 3] pre_tool_call: npx hyperframes lint/preview/render
     │  执行 Quality Audit（现有，扩展）
     │  新增 restraint_audit：基于 control_profile 检查 HTML 产出
     │    氛围层数（atmosphere_density）
     │    武器叠加数（restraint_force）
     │    动作强度分布（motion_dynamism）
     │  → 最终质量检查带权重上下文
     │
     ▼
[输出] lint 0 errors → render 出片
```

#### 关键设计：权重不是被动的标签，是主动的信号

每个 hook 读权重后，生成的是**面向当前阶段的具体行为指令**，不是"请参考你的权重"这种空话。例如：

atmosphere_density=0.3 时，Hook 2 注入的不是"你的氛围密度是0.3"，而是：
```
你的氛围密度权重是0.3（克制倾向）。
expanded-prompt.md 中 Scene 3 检测到 5 层氛围（particle-field, grid-lines, 
gradient-shift, radial-glow, light-leak）。
你的权重建议上限是 floor(0.3 × 7) = 2 层。
请在 expanded-prompt.md 中解释为什么需要超出，或削减到 2 层。
（P2 提醒，不阻断 lint/render）
```

这就是权重穿透到神经末梢的方式——不是 Agent "记得"去读权重，而是每个执行节点的 hook 主动把权重信号推到 Agent 面前，并用权重检查当前产出，生成具体指令。

#### 五行在 Quality Audit 中的映射

| 五行 | 审计检查项 | 告警条件 | 严重度 |
|------|-----------|----------|--------|
| 木 creative_autonomy | 风格选择方式 | autonomy>0.7 但风格库强制选了模板而非自选 | P3 |
| 金 restraint_force | surprise + taste moves 总数 | restraint>0.7 但总数>2 | P2 |
| 火 atmosphere_density | 氛围层数 | 层数 > floor(density × 7) + 1 | P2 + 解释 |
| 水 motion_dynamism | 动作动词强度分布 | dynamism>0.7 但动词全是低能(fade/drift) | P3 |
| 土 weapon_reliance | 武器引用 vs 裸写比例 | reliance>0.7 但裸写比例>50% | P2 |

所有权重一致性检查都是 P2/P3，不阻断。但 P2 要求 Agent 在产出中写明解释，解释缺失或牵强时升级 P1。

## 工作流变化

### Phase 0：试菜环节（新增）

在现有 Phase 0（素材收集）之后、Phase 1（frame.md）之前，新增一个试菜步骤：

```
Phase 0 Asset Intake（现有，不改）
    ↓
Phase 0.5: Tasting（试菜）— 新增
    │  Agent 读素材 + 用户创意 + 内容气质，做以下判断：
    │  1. 这个内容的气质我理解吗？（content_understanding）
    │  2. 我对配色有信心吗？（color_confidence）
    │  3. 我对节奏有把握吗？（rhythm_confidence）
    │  4. 我的克制直觉够吗？（restraint_instinct）
    │  ↓
    │  基于判断，填 control_profile 权重块
    │  ↓
    │  展示给用户："我对这个内容的把握：科技感配色我很有信心(0.8)，
    │              但复杂转场节奏我把握一般(0.7)，所以武器库会多兜底。"
    │  用户可以调整权重
    ↓
Phase 1: frame.md（读 control_profile 执行）
    ↓
Phase 2: expanded-prompt.md（读 control_profile 执行）
```

试菜不是一个"考试"，是 Agent 的自我感知。它试的是自己，不是试用户的内容好不好。

### Phase 1 变化：风格选择权重化

现在：读 visual-styles.md → 选 1 个最匹配的 → 生成 frame.md token block

权重化后：

1. 读 visual-styles.md，对每个风格计算匹配度（基于内容理解）
2. 展示 top-3 候选 + 各自匹配度权重 + 混合建议
3. 根据 style_selection 权重决定：
   - style_selection 高（>0.7）：Agent 有信心自己定，风格库只做参考
   - style_selection 中（0.4-0.7）：风格库引导，Agent 微调
   - style_selection 低（<0.4）：严格从风格库选，附理由
4. 根据 style_mixing 权重决定是否混合多个风格
5. forbidden_motion 改为 caution_motion：每项带谨慎度而非禁止

### Phase 2 变化：武器/氛围权重化

现在：每个场景必须 resolve 武器或标 HANDWRITE；氛围随意加层

权重化后：

1. 武器匹配：每个场景列 top-3 武器 + 匹配度
   - weapon_reliance 高：匹配度 >0.7 的武器建议用
   - weapon_reliance 低：Agent 有信心裸写，武器只是参考
   - Execution Manifest 里每项加 `match_weight` 字段
2. 氛围层：根据 atmosphere_density 权重
   - 默认低密度（克制倾向）
   - 加层需要理由（在 Manifest 里写明为什么这层是必要的）
   - 上限 = 3 + atmosphere_density × 4（最多 7 层，但权重低时自然不会加那么多）

### Quality Audit 变化

现有审计逻辑（P0-P3）保留。新增基于 control_profile 的审计：

1. **权重一致性检查（P2）**：frame.md 的实际产出是否与 control_profile 的权重匹配
   - 例：atmosphere_density=0.3 但实际加了 6 层氛围 → P2 告警 + 要求 Agent 在 expanded-prompt.md 中做出解释
   - 例：weapon_reliance=0.8 但 6 个场景全裸写 → P2 告警 + 要求解释
   - **P2 不阻断**，但 Agent 必须在产出中写明"为什么偏离了自己的权重"——如果解释缺失或牵强，升级为 P1
2. **克制审计**：新增 _audit_restraint() 函数
   - 检查氛围层数与 atmosphere_density 是否匹配
   - 检查武器叠加数与 restraint_force 是否匹配
   - 检查 surprise 数量是否超过克制线
3. 现有 taste_audit 保留，但 forbidden_motion 相关检查改为读 caution_motion（向后兼容：旧 frame.md 的 forbidden_motion 仍能解析，自动转换为高 caution 值）

### forbidden_motion → caution_motion 语义修正

现在 frame.md 的 taste block：

```yaml
taste:
  forbidden_motion:
    - generic slide-in
    - random bounce
```

改为：

```yaml
taste:
  caution_motion:
    generic slide-in: 0.8    # 高=很谨慎，接近禁止
    random bounce: 0.7
    slow_fade: 0.5           # 中等=有意识地可以用
    glow: 0.1                # 低=放开（glow 是 atmosphere 不是 motion，不该被禁）
```

关键修正：glow 从 forbidden_motion 移除，归入 atmosphere 层管理（由 atmosphere_density 权重控制）。

## sprite-forge 集成

作为 v0.14 的能力升级一并加入。设计文档见：
`F:/hyperframes/.hermes/designs/2026-06-19--sprite-forge-integration.md`

集成点：

1. Phase 0.5 试菜时，如果用户创意涉及帧动画效果，Agent 在 control_profile 里自然提高 sprite 相关权重
2. sprite-forge 作为独立 skill（`framepack-sprite-forge`），不被 control_profile 直接管辖——它是素材生成工具，不是创意控制点
3. 后处理脚本（process_sprite.py）是确定性工具，走铁轨模式（精确参数，不走权重）

## 文件影响范围

### 新增

| 文件 | 说明 |
|------|------|
| `core/control_profile.py` | ControlProfile 数据结构 + 权重读取/验证逻辑 |
| `core/restraint_audit.py` | 克制审计函数 |
| `skills/framepack-sprite-forge/` | 整个 sprite-forge skill（SKILL.md + references + scripts） |
| `tests/test_control_profile.py` | 权重系统测试 |
| `tests/test_restraint_audit.py` | 克制审计测试 |

### 修改

| 文件 | 改动 |
|------|------|
| `skills/framepack-director/SKILL.md` | 新增 Phase 0.5 试菜 + 风格权重化 + caution_motion |
| `skills/framepack-director/references/visual-styles.md` | 加匹配度计算说明 + Kinetic Tech 风格 |
| `core/quality_audit.py` | 加权重一致性检查 + restraint 审计接线 |
| `core/taste_audit.py` | forbidden_motion 检查改为读 caution_motion |
| `skills/framepack/SKILL.md` | 版本号 + 产品描述更新 |
| `plugin.yaml` | 版本号 + changelog |
| `hooks/` | Quality Audit hook 更新（如果审计逻辑变了） |

### 不动

| 文件 | 原因 |
|------|------|
| HyperFrames 三件套（hyperframes/cli/gsap skill） | 结构铁轨不权重化 |
| 武器库代码（animation-library 的 .js/.css） | 武器本身不变，变的是引用方式 |
| arsenal.json 格式 | 注册表不变，变的是"必须注册"变成"建议注册" |
| builtin_weapons.py | 武器定义不变 |

## 测试策略

### 权重系统测试（TDD）

- ControlProfile 数据结构：验证权重范围、默认值、缺失字段处理
- 权重一致性审计：构造 control_profile + frame.md 不匹配的 case
- 克制审计：构造不同 atmosphere_density 下氛围层数超标的 case
- caution_motion：验证 glow 不再被 motion 审计管辖

### 回归测试

- 现有 432 个测试全过
- forbidden_motion → caution_motion 的向后兼容（旧 frame.md 的 forbidden_motion 仍能解析）

### 端到端验证

- 用 V1 的内容（AI 建品牌月入 $8400）重跑，验证 Agent 试菜后自定权重能复现 V1 的克制美学
- 用弱模型内容（简单文字动画）重跑，验证低 creative_control 时铁轨兜底

## 版本归属

v0.14.0 — 权重控制系统 + sprite-forge

## 风险

1. **Agent 可能不会"试菜"** — 自我感知是高级能力，弱模型可能填不好 control_profile。**缓解**：权重框架本身是引导，有默认值兜底；试菜质量差最多回到当前铁轨水平，不会更差。

2. **权重太多 Agent 认知负荷大** — 7 个权重维度可能太多。**缓解**：Phase 0.5 只展示关键 3-4 个（content_understanding, restraint_instinct, atmosphere_density, weapon_reliance），其余自动推导。

3. **向后兼容** — 旧项目没有 control_profile 块。**缓解**：缺失时用默认权重（中等铁轨，保守值），不阻断流程。
