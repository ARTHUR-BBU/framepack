# Framepack Department Architecture Draft

> Status: draft for user review — do not move into README until confirmed.
>
> Purpose: turn scattered Framepack capabilities into clear “business units” with boundaries, handoffs, and reusable intervention mechanics.

## 0. 一句话

Framepack 不是一堆 hook、detector、weapon、audit 的杂货铺。它应该像一家商业视频制作公司：每个事业部有自己的职责、产物、验收标准和交接单。

最核心的分层原则：

```text
前厅分诊 → 导演策划 → Taste 定标 → 武器制片 → Audit 验货 → Intervention 拉回轨道 → HyperFrames 出片
```

如果用厨房比喻：

- 前厅接单，弄清客人要吃什么。
- 主厨定菜单和风味。
- Taste 部门试菜，判断够不够端出去。
- 武器部门提供刀具、炉灶、标准菜谱。
- Audit 部门验货，检查承诺有没有兑现。
- Intervention 部门发现厨师乱来时，直接拍铃叫停，把人拉回流程。
- HyperFrames 是后厨生产线和出餐系统。

## 1. 为什么要事业部化

现在 Framepack 的功能已经很多：Intent Router、Asset Intake、frame.md、expanded-prompt、Taste Audit、Weapon Matching、Arsenal、Preset、Scorecard、Post-write Gate、Quality Audit、Guardrail Hydrator、HyperFrames warning bridge……

如果继续按“功能点”堆，会有三个问题：

1. **抢活**：Taste 层开始检查代码，武器层开始判断审美，Audit 层开始重新导演。
2. **散落**：gate、detector、waiver、receipt 到处各写一套。
3. **偏航难拉回**：Agent 犯错时，每个地方都临时写一句“别这样”，无法复用。

事业部化的目标：

- 每个部门只管自己的事。
- 每个部门有明确输入 / 输出 / 交接契约。
- “强硬介入”变成公共能力，不再散落在各个 detector 里。
- 后续优化可以按部门推进，而不是一锅乱炖。

## 2. 建议成立的事业部

### 2.1 前厅分诊事业部 — Intent & Intake Department

**通俗定义**：前厅经理。先听懂客人要什么，别一进门就冲进厨房开火。

**负责**：

- 判断用户请求属于哪类视频工作流：product launch、website-to-video、faceless explainer、PR video、captions、motion graphics、template reuse、reference mining。
- 主动问素材：logo、截图、产品页、参考片、BGM、旁白、比例、目标受众、证明点。
- 判断哪些决策必须共创，哪些可以 Agent 自己推进。

**不负责**：

- 不写分镜细节。
- 不评价 taste 好坏。
- 不选择具体 weapon。

**输入**：用户原话、URL、参考素材、已有项目状态。

**输出**：

- intent classification
- asset intake checklist
- user-gate decision points
- workflow route

**现有散落单位**：Intent Router、Asset Intake、Template Menu First、Reference intake。

---

### 2.2 导演策划事业部 — Director Bible Department

**通俗定义**：导演组 / 编剧组。把“我想做个高级视频”变成可拍的分镜圣经。

**负责**：

- 产出 `frame.md`：视觉身份、色彩、字体、氛围、control profile、taste_read / taste_dials。
- 产出 `.hyperframes/expanded-prompt.md`：节奏、场景、时间窗、层次、动效动词、motif、negative prompt、Execution Manifest。
- 把用户意图翻译成 HyperFrames 能消费的创意结构。

**不负责**：

- 不写 HTML。
- 不直接调用 weapon。
- 不做最终渲染验货。

**输入**：前厅分诊结果、素材清单、用户确认、参考 DNA。

**输出**：

- `frame.md`
- `.hyperframes/expanded-prompt.md`
- Handoff-ready Director Story Bible

**现有散落单位**：frame.md 生成、expanded-prompt 生成、control_profile、Director Story Bible、Execution Manifest。

---

### 2.3 Taste 事业部 — Taste Intelligence Department

**通俗定义**：主厨的舌头 + 商业审美委员会。判断这东西是不是商业上像样。

**负责**：

- 判断 register：brand_film、product_launch、website_to_video、explainer、product_ui、event_teaser。
- 管 `taste_read` / `taste_dials`。
- 发现 AI 味和商业弱点：文字扛全片、产品缺席、开场无视觉钩子、AI 标点、假精确数字、静态 mockup、泛泛 fade。
- 给出 taste debt、severity、acceptance、waiver 入口。

**不负责**：

- 不选择具体 weapon。
- 不检查 HTML 里是否真实调用 weapon。
- 不替用户决定必须修改；Taste advises, user decides。

**输入**：`frame.md`、`expanded-prompt.md`、未来的 HTML / proof frames。

**输出**：

- Taste findings
- `taste-audit.json`
- `taste-debt.md`
- Taste Control action cards

**现有散落单位**：taste_audit、taste_control、taste_rules、taste_read、taste_text_detectors、control_profile 五行权重、Taste Layer 2.0 PRD。

**近期优先级**：最高。先继续按已有 Taste Layer 2.0 计划推进。

---

### 2.4 武器制片事业部 — Weapon Production Department

**通俗定义**：厨房设备与标准菜谱部门。保证 Agent 不裸手炒菜，不乱拿工具。

**负责**：

- 根据 Director Story Bible 的场景意图匹配 weapon。
- 维护 Arsenal Registry：查找、下载、注册、hash、去重、unused warning。
- 维护 Preset Registry：给 weapon 配命名菜谱。
- 维护 Scorecards：商业可用性、风险、Studio editability。
- 生成 weapon-load-plan，指导 HTML 写作阶段必须加载什么。

**不负责**：

- 不判断整条片子 taste 是否高级。
- 不做 proof-frame 审片。
- 不把所有场景都强行 weapon 化；HANDWRITE 可以存在，但必须有理由。

**输入**：Execution Manifest、scene intent、arsenal、catalog、skills、project-local weapons。

**输出**：

- `.framepack/weapon-load-plan.json`
- `.framepack/weapon-load-plan.md`
- `.framepack/arsenal.json`
- `weapon-presets/*.json`
- `weapon-scorecards/*.json`
- HANDWRITE waiver

**现有散落单位**：weapon_matcher、weapon_load_plan、weapon_presets、weapon_scorecard、weapon_sources、framepack-animation-library、arsenal。

---

### 2.5 Audit 验货事业部 — Production Audit Department

**通俗定义**：出餐验货员。你菜单上写了什么，盘子里就要有什么。

**负责**：

- 检查承诺是否兑现：frame.md、expanded-prompt、weapon-load-plan、HTML、proof frames、lint outputs。
- 区分质量问题和上游限制。
- 检查 stale props、timeline/proof drift、asset gaps、semantic mismatch。
- 将 findings 转成报告，而不是直接抢方向盘。

**不负责**：

- 不重新设计创意方向。
- 不重新选择 weapon。
- 不替用户做最终 render 决策。

**输入**：项目文件、HyperFrames lint JSON、proof frames、weapon plan、taste cards。

**输出**：

- quality audit report
- upstream warning classification
- pre-render advisory
- production readiness summary

**现有散落单位**：quality_audit、pre_render_audit、warning_classifier、proof/timeline checks、HyperFrames warning bridge。

---

### 2.6 介入 / 轨道事业部 — Intervention & Railguard Department

**通俗定义**：店长 + 铁路调度员。发现 Agent 开始偏航，直接拉回轨道。

用户指出得很准：gate 不应该到处漂，它应该融合进自己的事业部。

**负责**：

- 统一管理 gate / intervention / corrective injection。
- 发现 Agent 跳步骤、假完成、假调用、越界手写、缺 proof、缺用户 gate。
- 把偏航事件分类，然后发出强硬但可解释的介入信息。
- 要求下一步具体动作：revise、load weapon、attach proof、write waiver、stop and ask。
- 记录 receipt，避免“拦了一下但没痕迹”。

**不负责**：

- 不内置具体 Taste 规则。
- 不内置具体 Weapon 选择逻辑。
- 不内置具体 Audit 规则。
- 它负责“拉回轨道机制”，不是各业务规则本身。

**输入**：来自 Taste / Weapon / Audit / Director / HyperFrames 结构规则的 violations。

**输出**：

- intervention message
- blocked/advisory classification
- required next action
- waiver requirement
- receipt / ledger

**现有散落单位**：post-write weapon gate、pre-render Taste Control injection、Guardrail Hydrator warnings、production command hooks、mandatory user gates、future gate_engine。

**关键设计原则**：

```text
业务部门发现问题 → 交给 Intervention 统一介入 → 介入层只负责把 Agent 拉回流程
```

这样 Taste 不需要自己写一套 gate，Weapon 不需要自己写一套 gate，Audit 也不需要自己写一套 gate。

---

### 2.7 知识资产事业部 — Knowledge Assets Department

**通俗定义**：资料库 / 菜谱档案馆。把每次好经验沉淀下来，不让 Agent 下次重新发明轮子。

**负责**：

- Template Arsenal。
- Reference Miner 输出的 DNA。
- reusable presets、scorecards、style profiles、case learnings。
- 外部研究资料的产品化吸收，例如 Taste Skill / Impeccable。

**不负责**：

- 不直接控制渲染。
- 不在没有验证的情况下把一次性 case 变成标准模板。

**输入**：成功 case、reference analysis、research、benchmark、rendered proof。

**输出**：

- templates
- visual style profiles
- reference DNA
- reusable recipes
- research PRDs

**现有散落单位**：template arsenal、reference miner、visual-styles、taste research docs、case library、Second Brain / external brain notes。

---

### 2.8 平台适配事业部 — Platform Integration Department

**通俗定义**：外联和运维。保证 Framepack 和 HyperFrames / Hermes / plugin runtime 对得上。

**负责**：

- HyperFrames compatibility classification。
- Plugin hook registration。
- Guardrail Hydrator sync。
- Deployment sync / MD5 verification。
- Release README / bilingual docs / version surfaces。
- CLI command intent classification。

**不负责**：

- 不判断创意好坏。
- 不选择 weapon。
- 不做具体商业审片。

**输入**：Hermes runtime、HyperFrames CLI version、plugin.yaml、AGENTS.md、README、hooks。

**输出**：

- compatibility reports
- hydrated guardrails
- deployment checks
- release docs
- runtime hook behavior

**现有散落单位**：compat adapter、guardrail hydrator、plugin hooks、deploy manifest tests、README refresh workflow。

## 3. 各事业部协作链路

### 3.1 标准视频生产链路

```text
Intent & Intake
  ↓ route + assets + user gates
Director Bible
  ↓ frame.md + expanded-prompt.md
Taste Intelligence
  ↓ taste_read/dials + taste debt/action cards
Weapon Production
  ↓ weapon-load-plan + presets + scorecards
HyperFrames Build
  ↓ HTML / Studio / lint / snapshot
Production Audit
  ↓ proof, drift, quality/upstream classification
Intervention & Railguard
  ↺ if Agent skipped, faked, drifted, or needs waiver
HyperFrames Render / Publish
```

### 3.2 发现问题时的链路

```text
业务部门发现 violation
  ↓
Intervention & Railguard 分类
  ↓
决定介入强度：
  - advisory：提醒，但不阻止
  - decision_required：要求 revise/proof/waiver
  - hard_stop：结构性错误或流程铁律，必须停
  ↓
Agent 执行下一步
  ↓
Audit / originating department 验证是否解除
```

## 4. 防冲突原则

### 4.1 Taste 不抢 Weapon 的活

Taste 可以说：

> “开场没有视觉钩子，这会像 PPT。”

Taste 不应该说：

> “必须用 captionClipWipe 参数 x/y/z。”

具体用什么 weapon，是 Weapon Production 的事。

### 4.2 Weapon 不抢 Taste 的活

Weapon 可以说：

> “这个 caption scene 有现成 lower-third preset。”

Weapon 不应该说：

> “这条片子高级 / 不高级。”

高级不高级，是 Taste 的事。

### 4.3 Audit 不抢 Director 的活

Audit 可以说：

> “expanded-prompt 说 product reveal，但 HTML 没有产品视觉。”

Audit 不应该重新写一版创意方向。

### 4.4 Intervention 不抢业务规则

Intervention 可以说：

> “Taste 报了 P1，你必须 revise/proof/waiver。”

Intervention 不应该自己判断什么叫 P1 taste debt。这个判断来自 Taste。

## 5. 复用型介入机制草案

所有 gate 最终应当收敛成统一 contract：

```python
InterventionEvent(
    department="taste|weapon|audit|director|platform",
    code="opening_visual_absence",
    severity="advisory|decision_required|hard_stop",
    reason="为什么偏航",
    required_action="revise|load_weapon|attach_proof|write_waiver|ask_user|stop",
    artifact="frame.md|expanded-prompt.md|index.html|proof-frames",
    acceptance="解除条件",
)
```

统一处理：

```text
collect events
  → dedupe
  → group by severity/action
  → inject message
  → write receipt
  → verify resolution
```

这就是“把 gate 融进自己的事业部”的产品化形态。

## 6. 当前功能单位归属矩阵

| 功能单位 | 应归属事业部 | 备注 |
|---|---|---|
| Intent Router | Intent & Intake | 前厅分诊 |
| Asset Intake | Intent & Intake | 素材意识 |
| Template Menu First | Intent & Intake / Knowledge Assets | 前厅菜单 + 模板资产 |
| frame.md | Director Bible | 视觉身份和控制权重 |
| expanded-prompt.md | Director Bible | Director Story Bible |
| control_profile | Director Bible / Taste | Director 写入，Taste 使用 |
| taste_read / taste_dials | Taste | Taste 事业部核心入口 |
| taste_rules.py | Taste | 规则注册表 |
| taste_text_detectors.py | Taste | Prompt-level taste 检测 |
| taste_control.py | Taste / Intervention | Taste 产卡，Intervention 介入 |
| weapon_matcher.py | Weapon Production | 场景意图 → weapon |
| weapon_load_plan.py | Weapon Production | 执行小票 |
| weapon_presets.py | Weapon Production | 菜谱 |
| weapon_scorecard.py | Weapon Production | 商业可用性评级 |
| weapon_enforcement.py | Intervention / Weapon | 业务来自 Weapon，介入归 Intervention |
| quality_audit.py | Production Audit | 质量验货 |
| pre_render_audit.py | Production Audit / Intervention | audit 出报告，intervention 拉回 |
| warning_classifier.py | Production Audit / Platform | 上游限制分类 |
| guardrail hydrator | Platform / Intervention | 分发规则 + 会话介入 |
| HyperFrames compatibility adapter | Platform Integration | 平台边界 |
| reference miner | Knowledge Assets | 参考 DNA 资产化 |
| template arsenal | Knowledge Assets | 模板资产化 |
| README refresh | Platform Integration | 发布门牌 |

## 7. 建议落地顺序

用户指定的顺序应固定为：

1. 先确认事业部划分。
2. 确认后，把架构进入 README / docs。
3. 写落地计划文档。
4. 开始调整代码/目录/测试/文档，让散落功能归位。
5. 回头优化每个事业部内部规则、流程、最佳实践。
6. 优先优化 Taste 事业部，因为 Taste Layer 2.0 已经有 PRD 和计划。

## 8. 初步建议：事业部数量别太多

建议先正式命名 8 个事业部：

1. Intent & Intake Department
2. Director Bible Department
3. Taste Intelligence Department
4. Weapon Production Department
5. Production Audit Department
6. Intervention & Railguard Department
7. Knowledge Assets Department
8. Platform Integration Department

其中最关键的四大生产治理部门是：

```text
Taste → Weapon → Audit → Intervention
```

它们构成 Framepack 从“提示词工厂”进化为“商业视频生产治理系统”的主骨架。

## 9. 待用户确认的问题

1. “事业部”这个中文命名是否保留？还是改成“部门 / 中台 / 作战群”？
2. Intervention & Railguard 是否单独成部？我建议必须单独成部，因为 gate 会越来越多。
3. Knowledge Assets 是否独立？我建议独立，否则 template / reference / research 会长期散落。
4. Platform Integration 是否独立？我建议独立，因为 Hermes / HyperFrames / deploy / README / hooks 是另一类运维问题。
5. Taste 事业部是否作为下一轮优先优化对象？我建议是，因为 PRD 和第一阶段代码已经落地。
