# Framepack 主动介入层设计

日期：2026-06-01
状态：供用户审阅的草案
目标版本：Framepack 0.6.x；第 5 阶段推迟到 0.7.0

## 目标

Framepack 不应该只是一个“Agent 可能会想起来用”的工具箱。它应该成为一个视频制作工作台，主动引导 Codex、Claude Code 等 coding agent 进入专业的 HyperFrames 工作流。

GBrain 的参考文章给我们的核心启发是：一个 Harness 真正有力量，不是因为它写了更多说明，而是因为它会在 Agent 容易忘记上下文、绕过规则、产出弱文件、丢失失败经验的时候主动介入。

Framepack 现在已经有很好的基础：workbench 文件、审计门禁、项目 skills、MCP、模板/Catalog/设计资产库、build/preview/render 命令、sandbox benchmark。下一步要加的是一层 **Active Intervention Layer 主动介入层**，让这些能力在正确的时刻自动出现。

## Harness 控制论

Framepack 是外挂型 Harness，不是基础设施控制器。它不能物理强制 Codex 或 Claude Code 使用自己的 workflow：宿主 Agent 拥有终端、文件系统、环境变量，也有足够能力自己写 HTML、调用 HyperFrames、甚至绕开 Framepack 直接做视频。

这个边界非常重要。Framepack 不应该照搬 proxy 型控制模型，因为那类模型只有在 Harness 控制网络、容器、凭据或执行边界时才成立。Framepack 的控制模型应该是摩擦力设计：

```text
Framepack 控制力 = Harness 规则 x 低摩擦路径 x 可见反馈 x 项目记忆
```

产品目标不是“让 Agent 无法离开”，而是“让 Framepack 路线成为最省力、最清楚、最专业的路线”。Agent 永远是自由的，但最好的路应该正好是 Framepack 设计的路。

这会把主动介入层升级成摩擦感知型 Harness：

- Skills 在 Agent 即兴发挥前定义战术手册。
- CLI 和 MCP 命令让正确动作比手工乱写更快。
- Intervention context 不要求 Agent 自己查，就把下一步递到手边。
- Cost gates 只在继续推进会造成高返工成本时阻止。
- Friction logs 把绕路和失败变成未来产品改进证据。

网球双打这个比喻很准确：Codex 是技术更强的选手，Framepack 是更懂战术的搭档。Framepack 不拥有球场。它要赢，是靠在下一拍到来前就站到正确位置。

## 设计原则

采用折中的介入模型：

- P0 阻塞项默认阻止不安全或无效的流程推进。
- P1 和 P2 问题不阻止流程，但必须强提醒、解释下一步，并写入记录。
- `--force` 可以绕过 P0，但必须是显式动作，并且绕过行为必须写入项目证据。

这样 Framepack 足够“有牙”，但不会变成过度阻碍 Agent 创作的黑盒。

## 非目标

本设计不做全局 daemon、不做自动 skill 改写、不做持续监听聊天、不做跨项目个人记忆、不做自动修改模板。这些属于第 5 阶段，推迟到 Framepack 0.7.0。

本设计不替代 Codex 或 Claude Code。Framepack 仍然是叠加在通用 coding agent 之上的垂类视频 Harness 和工作台。

本设计不自动安装外部动画库、asset forge 后端或模型服务。

## 第 1 阶段：低摩擦介入上下文

每个重要 Framepack 命令都应该返回一个简短的指导块，告诉 Agent：刚才发生了什么、项目现在处于什么阶段、下一步应该做什么，以及为什么这条路比临场乱写更省力。

首批覆盖命令：

- `create`
- `workbench brief`
- `workbench audit`
- `build`
- `preview`
- `render`
- `templates recommend`
- `catalog recommend`

上下文块应包含：

- 当前项目阶段
- 必读文件
- 推荐下一条命令
- 未解决的 P0/P1 阻塞项
- 相关 workbench 文件
- 已选择的 template / Catalog / design 路线
- skill 提醒：例如 `framepack-director`、`framepack-template-fuser`、`framepack-hyperframes-builder`、`framepack-reference-miner`
- `why` 字段：说明按建议走能避免什么成本
- `shortcut` 字段：让 Framepack 路径看起来比手工处理更省事

CLI 的普通输出要短，JSON 输出要包含结构化的 `interventionContext`。

示例结构：

```json
{
  "interventionContext": {
    "phase": "composition",
    "status": "needs-review",
    "requiredReads": ["HUMAN.md", "DIRECTION.md", "COMPOSITION.md"],
    "nextCommand": "npx framepack workbench audit --phase composition --project-dir <dir>",
    "why": "This catches missing design tokens and asset gaps before build, avoiding a failed HyperFrames preview.",
    "shortcut": "Run this before editing index.html manually.",
    "blockers": [],
    "warnings": ["Confirm asset gaps before build."],
    "skillHints": ["framepack-template-fuser"]
  }
}
```

## 第 2 阶段：生命周期成本闸门

Framepack 应该阻止 Agent 随意跳过关键制作门禁，但产品语言上要把它解释为成本闸门，而不是权力闸门。它阻止继续，是因为继续会制造高返工成本，而不是因为 Framepack 想控制宿主 Agent。

门禁策略：

- `build` 前检查 `preflight`、`design`、`composition`。
- `preview` 前检查 build 输出、runtime metadata、preview readiness。
- `render` 前检查 preview readiness 和 render safety。
- P0 阻塞项默认阻止命令继续，除非使用 `--force`。
- P1/P2 不阻止命令，但必须出现在 CLI 输出、JSON 输出和 intervention log 中。
- 每次阻止都要解释避免了什么成本，例如反复 preview 修复、render metadata 损坏、字体和设计令牌不一致

必须写入的持久记录：

- `.framepack/interventions.jsonl`
- 使用 `--force` 时，在 `ITERATIONS.md` 写入摘要记录

第一版只门禁 Framepack 自己拥有的生命周期命令，不尝试拦截 Agent 在 CLI 之外的任意文件写入。

## 第 3 阶段：摩擦捕获

每一次失败、绕过、卡住，都应该变成可用证据，而不是蒸发。

新增项目本地文件：

```text
.framepack/friction.jsonl
.framepack/interventions.jsonl
```

捕获事件：

- 命令失败
- audit blocker
- 反复出现的 blocker
- `--force` 绕过
- 缺失 `meta.json`
- 缺失 `data-width`、`data-height` 或 `data-start`
- 引用了不存在的 block HTML
- timed video 嵌套进 timed scene container
- render 输出缺失或文件大小异常
- 绕路信号，例如手工重写 HTML、不跑 audit 直接 render，或用户/测试反馈说 workflow 被跳过

新增命令：

```bash
npx framepack workbench friction --project-dir <dir>
npx framepack workbench learnings --project-dir <dir>
```

`friction` 汇总原始问题。`learnings` 把问题归类成产品级改进线索，例如 “composition build contract drift” 或 “agent skipped design-token gate”。

摩擦捕获要区分普通技术错误和引力失败。引力失败是指 Agent 或用户因为 Framepack 路径显得慢、不清楚、产出弱或没帮助，而选择离开 Framepack 路线。这类信号是最重要的产品证据。

示例：

```json
{
  "type": "bypass-signal",
  "where": "after-composition",
  "agentBehavior": "manual-html-rewrite",
  "likelyCause": "Framepack build output was not expressive enough",
  "suggestedDesignResponse": "Improve template-fuser guidance or build skeleton defaults"
}
```

## 第 4 阶段：项目级场力偏好

Framepack 应该把用户模糊的审美愿望捕获到项目内，而不是依赖 Agent 记忆。

第一版只做项目本地，不做全局个人记忆。

输入来源：

- `--idea`
- `--style`
- 已存在的 `STYLE.md`
- 已存在的 `DIRECTION.md`
- 可选读取 `HUMAN.md` 和 `ITERATIONS.md`

输出：

```text
.framepack/preferences.json
```

捕获维度：

- 气质：高级、活泼、电影感、编辑感、技术感、能量感
- 节奏：快、中、慢、冲击、克制
- 文字处理：大字、密集文字、极简文字、字幕
- 动效语言：kinetic、smooth、hard cuts、parallax、data motion
- 参考风格线索
- 禁忌项
- 置信度：explicit、inferred、weak
- 场力约束：带权重的约束，作用于 composition、template selection、caption、pacing 和 visual style

`create` 运行时也应该更新 `STYLE.md` 和 `DIRECTION.md`。后续命令可以读取偏好文件来改进推荐。

示例：

```json
{
  "fieldForces": [
    {
      "id": "large-focal-text",
      "strength": "high",
      "source": "explicit-user-style",
      "appliesTo": ["composition", "template-selection", "caption-design"]
    }
  ]
}
```

## 第 5 阶段：场域自维护循环推迟到 0.7.0

GBrain 式长循环机制很有价值，但不应该塞进 0.6 的主动介入切片里。

推迟到 0.7.0：

- 跨项目偏好记忆
- 本地 daemon 或定时维护
- 模板使用挖掘
- 自动模板废弃建议
- skill benchmark scoring
- skill 改进建议
- 摩擦驱动的模板更新
- 跨项目 calibration profile
- 引力分析：哪些步骤最常被 Agent 绕过，以及为什么
- 场力强度分析：哪些项目偏好经常被忽略或误译

0.6 要做的是为未来准备干净数据：`friction.jsonl`、`interventions.jsonl`、`preferences.json`。0.6 不尝试让系统自动进化。

## 架构

新增聚焦的 intervention 模块，不把逻辑散落到各个命令 handler 里。

建议模块：

```text
src/workbench/intervention-context.ts
src/workbench/lifecycle-gates.ts
src/workbench/friction-log.ts
src/workbench/preferences.ts
src/workbench/field-forces.ts
```

CLI 层在已有 workbench/build/audit 逻辑之后调用这些模块。MCP 层后续可以暴露同样的结构化数据，但第一优先级是 CLI 行为。

数据流：

```text
command input
  -> existing command handler
  -> intervention context builder
  -> lifecycle gate evaluator when applicable
  -> friction/intervention event writer
  -> CLI text or JSON output
```

## CLI 行为

普通文本输出应该可读：

```text
Framepack intervention:
- Phase: design
- Next: run workbench audit --phase design
- Read: DESIGN.md, DESIGN_TOKENS.md, ASSET_GAPS.md
- Blockers: none
```

JSON 输出应该方便 Agent 调用：

```json
{
  "ok": true,
  "interventionContext": {},
  "interventionEvents": []
}
```

当 P0 阻止命令：

```text
Framepack blocked build because design-token-contract failed.
Fix: regenerate or repair DESIGN_TOKENS.md, then run workbench audit --phase design.
Use --force only if you intentionally want to bypass this gate.
```

## 测试

新增或更新测试：

- JSON 模式下命令输出包含 `interventionContext`
- `build` 遇到 P0 design/composition audit failure 时阻止继续
- `build --force` 会记录 intervention event
- `preview` 和 `render` 会执行生命周期门禁
- 命令失败和 P0 blocker 会写入 friction event
- `workbench friction` 能总结项目事件
- `workbench learnings` 能归类反复出现的问题
- 偏好捕获会写入 `.framepack/preferences.json`
- template / Catalog 推荐可以使用捕获到的偏好
- sandbox benchmark 纳入主动介入评分

必跑验证：

```bash
npm run typecheck
npm test
npm run build
npm run sandbox:benchmark
npm pack --dry-run --json
```

## 文档更新

需要更新：

- `README.md`
- `docs/README.zh-CN.md`
- `AGENTS.md`
- `templates/agent/codex/SKILL.md`
- `templates/agent/claude-code/CLAUDE.md`
- `docs/agent-platform/codex.md`
- `docs/agent-platform/claude-code.md`
- `CHANGELOG.md`

文档要用简单语言讲清楚：

Framepack 不只是创建文件。它会观察制作阶段，提醒 Agent 什么重要，阻止不安全跳跃，记录失败，并让用户能看懂视频方案。

## 风险

最大风险是过度介入。如果每个 warning 都阻止流程，Agent 会绕开 Framepack。所以只有 P0 默认阻止。

第二个风险是输出太吵。普通 CLI 输出里的 intervention context 必须短，详细信息只放到 JSON。

第三个风险是假装拥有不存在的记忆。第 4 阶段只做项目本地偏好，全局偏好记忆明确推迟。

第四个风险是误解宿主/外挂边界。Framepack 无法强制 CLI/MCP/skill surface 之外的任意 Agent 行为。设计重点必须持续放在提升 Framepack 路径的吸引力上，而不是假装自己拥有整个环境。

## 验收标准

功能完成的标准：

- 主要生命周期命令暴露 intervention context
- P0 生命周期门禁默认阻止继续
- `--force` 绕过行为持久可见
- 项目内存在 friction 和 intervention 日志
- 能从用户意图中捕获项目偏好
- sandbox benchmark 能给主动介入层打分
- 文档能教会 Agent 和人类如何使用主动介入层

## 小白总结

以前 Framepack 更像一个工具箱：Agent 记得用就用，不记得就绕过去。

这次升级要让 Framepack 更像一个视频项目的现场导演和质检员。每一步它都会提醒 Agent：现在到了哪一步、该看哪些文件、下一步该做什么、哪里不能跳过。如果 Agent 想硬闯，也可以，但必须留下记录。

这样用户不需要懂技术，也能让 Agent 在一个更专业的视频制作流程里工作。
