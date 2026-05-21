# Framepack

Framepack 是一个运行在 Codex、Claude Code 等通用 coding agent 之上的视频生产垂类 Agent Harness。

它不是简单的视频生成小工具，而是给通用大脑装上的“视频生产神经系统”：告诉 agent 应该看什么、调用什么工具、缺什么能力、需要留下什么证据，以及什么时候可以继续推进。

一句话理解：Codex / Claude Code 是大脑，Framepack 是视频生产神经系统，HyperFrames 是实际渲染的身体。

## Agent Harness 五维架构

Framepack 0.4 按五维 Agent Harness 组织：

- 感觉过滤器：`CAPABILITY_GRAPH.json` 告诉 agent 当前工程有什么能力、缺什么能力、能力从哪里来。
- 武器库暴露：MCP `exposeArsenal`、`getCapabilityGraph`、`explainCapabilityGaps` 和 Animation Capability Atlas 把 workflow packs、creative direction packs、能力状态、技术路线和常见技术适配情况摊开给 agent 看，但不替 agent 做创意判断。
- 运动通路：MCP tools 和 CLI commands 把 agent 的判断变成生成、校验、修复、截图、运行时检查和渲染动作。
- 脊髓反射：`validate`、`repair`、`runtime lint`、`runtime inspect` 和后续能力扫描会自动发现明显漂移，减少 agent 猜测。
- 记忆编码：工程包文件系统持久化 brief、scene plan、asset map、execution plan、capability graph、`RUNTIME_MANIFEST.json` 和证据。
- 反馈循环：runtime inspect report、snapshot manifest、visual QA notes 和 validation report 让“完成”基于证据，而不是基于感觉。

## 当前可用的 Workflow Packs

Framepack 现在有一个内置的工作流包和审美方向包注册表。用户不需要先记住所有命令，可以让 Codex 或 Claude Code 先运行：

```bash
npx framepack packs
npx framepack packs --json
npx framepack atlas --json
npx framepack atlas get library.animejs --json
npx framepack atlas recommend --workflow-pack game-ad-sprite-video --creative-direction-pack game-ad-retro-arcade --output-type game-ad --format 9:16 --json
```

`packs` 会告诉 agent：现在适合走产品解释、帖子转视频、网页转视频、游戏风 sprite 宣传片、课程宣传、发布复盘还是投资人更新；同时也会给出审美方向，比如干净 SaaS 解释片、证据叙事片、复古游戏广告片。

这些 pack 不是最终视频模板本身，而是给 agent 的“工作选择器”和“审美指南”。agent 先选对工作流，再生成工程包，再按 `status`、`capture`、`sync-assets`、`validate`、`runtime snapshot` 继续推进。

agent 可以先让 Framepack 做保守推荐：

```bash
npx framepack packs recommend --source-type game-ad --output-type game-ad --goal "Promote a course with game-style visuals" --audience "Founders" --format 9:16
npx framepack packs recommend --source-type game-ad --output-type game-ad --goal "Promote a course with game-style visuals" --audience "Founders" --format 9:16 --json
```

MCP 里对应工具是 `recommendPacks`。

如果用户只说了一个模糊目标，例如“做一个苹果发布会风格的 AI 产品视频”，agent 应先用 MCP `exposeArsenal` 看 Framepack 的完整武器库：全部 workflow packs、全部 creative direction packs、当前工程的 capability graph 摘要，以及 Three.js、GSAP、Anime.js、PixiJS、agent-sprite-forge 等常见技术是否已经在能力图里。需要判断动画/视频技术路线时，再用 CLI `framepack atlas` 或 MCP `listCapabilityAtlas` / `recommendCapabilityStack` 查看能力图谱和推荐组合。Framepack 只提供信息场；Codex 或 Claude Code 才负责理解用户意图、追问、权衡和选择。

选中路线后，可以把选择写进工程包：

```bash
npx framepack generate --game-ad-description "A course that teaches founders to ship agent-native video systems." --output-dir out --goal "Promote the course" --audience "Founders" --project-name sprite-video-demo --workflow-pack game-ad-sprite-video --creative-direction-pack game-ad-retro-arcade
```

这样 `VIDEO_BRIEF.json` 和 `HANDOFF.md` 都会记录工作流与审美方向，后续 agent 不需要重新猜。

也可以让 Framepack 在生成时自动套用保守推荐：

```bash
npx framepack generate --game-ad-description "A course that teaches founders to ship agent-native video systems." --output-dir out --goal "Promote the course" --audience "Founders" --project-name sprite-video-demo --format 9:16 --auto-pack
```

## 产品形态

Framepack 正在演进成一个面向 agent 安装和调用的视频工作流系统：

- Framepack Core：CLI、工程包协议、校验和 HyperFrames 桥接。
- Framepack MCP：agent 可以直接调用的 tools、resources 和 prompts。
- Framepack Skills：给 Codex、Claude Code 和未来 agent 平台使用的视频生产 playbook。
- Framepack Workflow Packs：可安装的视频工作流，比如产品解释、帖子视频、网页视频、游戏风广告、课程宣传、发布复盘和投资人更新。
- Framepack Creative Direction Layer：设计审美、动画审美、运动语言、叙事节奏、模板选择和视觉验收标准。
- Framepack Animation Capability Atlas：程序化动画、大模型音视频素材、运行时、asset forge、skill、plugin、MCP 和验证能力的结构化地图。
- Framepack Connectors：内容源、asset forge 后端、渲染系统、发布系统和未来社区集成。

长期目标不只是让工程包“协议正确”，而是让 agent 生成的工程包拥有清晰叙事、稳定审美、可复用动画模式，并且能被设计师、爱好者和社区持续共建。

## Animation Capability Atlas 能力图谱

Animation Capability Atlas 是 Framepack 的只读能力地图。它把 **程序化动画素材** 和 **大模型生成音视频素材** 分开描述：Anime.js、SVG、Canvas、PixiJS、HyperFrames 这类技术适合可控、可复现、可验证的工程动画；Seedance 2.0、Gemini Omni、Kling AI 3.0 这类模型更适合作为外部生成式媒体素材来源。

agent 可以用 `framepack atlas --json` 或 MCP `listCapabilityAtlas` 查看已知能力，用 `framepack atlas recommend ... --json` 或 MCP `recommendCapabilityStack` 根据 workflow / creative direction / output type 推荐能力组合。Atlas 不负责安装外部 skill，也不直接调用 hosted model；它负责分类、打分、推荐和说明边界。

当生成流程已经选择了 workflow pack 或 creative direction pack，Framepack 会把匹配到的能力组合写入 `VIDEO_BRIEF.json` 的 `capabilityStackSelection`，并在 `HANDOFF.md` 里重复说明。没有 pack selection 的自定义/手工工程包保持中立，Framepack 不会偷偷把它们改成 agent-sprite-forge 或 Anime.js 路线。

[English](./README.md)

## 让 Codex 安装 Framepack

Framepack 的主入口是 agent-first。用户不需要先记住一串 CLI 命令，而是直接让 Codex 阅读仓库并安装配置。

在 Codex 里说：

```text
请阅读 https://github.com/ARTHUR-BBU/framepack，把 Framepack 安装到当前项目，配置 MCP server，并验证 generate/status/validate 可以使用。
```

Codex 应运行 `framepack init-agent --target codex --scope project`，连接 Framepack MCP，然后用 `generateProject`、`getStatus`、`validatePackage`、`captureAssets`、`runtimeSnapshot` 等工具推进工程包。

Claude Code 预览支持可用 `framepack init-agent --target claude-code --scope project`。

Framepack 是一个面向 agent 的视频工程编译器。

它把 Markdown、帖子串、公开网页、产品/课程/品牌描述这类内容源，编译成可以继续执行的视频工程包。这个工程包通常不是最终给人看的成片，而是给 Codex、Claude Code 这类 agent 和 HyperFrames 继续加工的中间工作面。

Framepack 负责生成资产库、编排、生成模型、后期合成混合工作流里的编译层：它定义内容结构、分镜计划、资产需求、执行任务和运行时入口。Framepack 本身不是游戏引擎，也不是图像生成器。

## 快速开始

```bash
npm install
npm run build
npx framepack release-smoke --output-dir out/release-smoke --json
npm run release:smoke:install
npm run release:scenarios
npm run release:gate
npx framepack generate --input examples/case-explainer-input.md --output-dir out --goal "Explain the case" --audience "Founders"
```

生成帖子视频工程包：

```bash
npx framepack generate --thread-file examples/thread.txt --output-dir out --goal "Explain the thread" --audience "Founders" --project-name thread-case
npx framepack capture --project-dir out/thread-case
npx framepack sync-assets --project-dir out/thread-case
```

生成网页视频工程包：

```bash
npx http-server . -p 8080
npx framepack generate --url http://127.0.0.1:8080/examples/website.html --output-dir out --goal "Explain the site" --audience "Founders" --project-name website-case
npx framepack capture --project-dir out/website-case
npx framepack sync-assets --project-dir out/website-case
```

生成游戏风宣传片工程包：

```bash
npx framepack generate --game-ad-description "A course that teaches founders to ship agent-native video systems." --output-dir out --goal "Promote the course" --audience "Founders" --project-name sprite-video-demo
```

这个包会包含角色、地图/背景、FX 的 forge 任务，并推荐 `agent-sprite-forge` 作为第一套 2D 素材后端；但它不会自动安装 `agent-sprite-forge`，也不会自动调用图像生成。

## 它输出什么

Framepack 会生成一个视频工程包。进入工程包后，优先看：

- `PACKAGE_MANIFEST.json`
- `HANDOFF.md`
- `SOURCE_MANIFEST.json`
- `VIDEO_BRIEF.json`
- `SCENE_PLAN.json`
- `SCENE_ASSET_MAP.json`
- `SOURCE_SCENE_MAP.json`
- `ASSET_PLAN.json`
- `ASSET_EXECUTION_PLAN.json`
- `FORGE_TASKS.md`

这些文件共同描述：

- 原始内容来自哪里
- 视频要讲什么
- 分镜怎么安排
- 哪些素材要生成、截取或外部生产
- 素材应该服务哪些镜头
- agent 下一步应该执行什么

`SCENE_ASSET_MAP.json` 是按镜头查看素材任务的统一入口。新字段 `recommendedAssets` 和顶层 `assets` 会同时覆盖网页截图、帖子文字卡片和 forge 素材任务；旧字段 `recommendedCaptures` 和 `captures` 会继续保留，方便老流程读取网页截图映射。

## Asset Forge Layer

`ASSET_EXECUTION_PLAN.json` 是素材物化任务的稳定协议。已有任务类型包括：

- `capture-screenshot`
- `compose-text-card`

Framepack 现在也能表达 2D 素材生产任务：

- `forge-sprite-sheet`
- `forge-map-pack`
- `forge-fx-pack`
- `forge-prop-pack`
- `forge-character-pack`

Forge 任务可以包含：

- `forgeBackend`
- `requiredSkill`
- `expectedOutputs`
- `prompt`
- `recommendedSceneIds`
- `styleNotes`
- `acceptanceCriteria`

执行项状态包括 `pending`、`available`、`failed`、`skipped`、`external`。Forge 生产方可以在输出路径旁写入 metadata JSON，让 `sync-assets` 把状态同步回工程包。对于 `available` 或 `external` forge metadata，需要提供 `outputs` 数组，里面是相对工程包的输出文件路径；只有这些声明文件真实存在时，`sync-assets` 才会把任务标为可用。

`agent-sprite-forge` 是第一个推荐的 2D asset forge 参考后端。如果用户希望 Codex 直接接着工程包生产 2D 素材，建议先安装或启用 `agent-sprite-forge` skills。相关 skill 已安装后，agent 可以根据工程包用 `$generate2dsprite` 生产 sprite、角色、prop、FX，用 `$generate2dmap` 生产地图/背景。

这个推荐不是强制绑定。Framepack 只生成标准化任务、提示词、预期输出和验收条件；用户也可以手工生产素材、使用自定义 forge 后端，或者复用已有素材，只要输出文件和 metadata 符合工程包协议即可。

## 常用命令

检查项目：

```bash
npm run typecheck
npm test
npm run build
npm run release:smoke:install
npm run release:scenarios
npm run release:gate
```

`npm test` 里包含 markdown、thread、game-ad 三类工程包的 golden 协议摘要检查。它不会锁时间戳和本机绝对路径，而是检查 manifest、scene asset map、execution kinds、forge 任务数量和 handoff 指令是否稳定。

工程包协议版本说明见 [`docs/architecture/package-protocol-v1.md`](docs/architecture/package-protocol-v1.md)。

发布候选版本说明见 [`docs/agent-platform/release-candidate-v0.4.0-alpha.1.md`](docs/agent-platform/release-candidate-v0.4.0-alpha.1.md)。真实场景测试报告见 [`docs/agent-platform/real-scenario-test-report-v0.4.0-alpha.1.md`](docs/agent-platform/real-scenario-test-report-v0.4.0-alpha.1.md)。上一版 `v0.3.0-rc.1` 说明保留在 [`docs/agent-platform/release-candidate-v0.3.0-rc.1.md`](docs/agent-platform/release-candidate-v0.3.0-rc.1.md)。下一阶段架构学习和升级路线见 [`docs/architecture/next-architecture-uplift.md`](docs/architecture/next-architecture-uplift.md)。

0.4 的具体架构方案见 [`docs/architecture/framepack-0.4-capability-runtime-architecture.md`](docs/architecture/framepack-0.4-capability-runtime-architecture.md)。

生成工程包：

```bash
npx framepack generate --input examples/case-explainer-input.md --output-dir out --goal "Explain the case" --audience "Founders"
npx framepack generate --thread-file examples/thread.txt --output-dir out --goal "Explain the thread" --audience "Founders" --project-name thread-case
npx framepack generate --url https://example.com/product --output-dir out --goal "Explain the site" --audience "Founders" --project-name website-case
npx framepack generate --game-ad-description "A product story for a sprite-style video ad." --output-dir out --goal "Promote the product" --audience "Founders" --project-name sprite-video-demo
```

发布候选版本前，agent 可以跑一次完整烟测：

```bash
npx framepack release-smoke --output-dir out/release-smoke
npx framepack release-smoke --output-dir out/release-smoke --json
```

`release-smoke` 会生成 Codex 和 Claude Code 的 agent 工作流文件，检查 MCP surface，验证 Arsenal Exposure，自动推荐 workflow / creative direction packs，生成一个 `--auto-pack` 游戏风宣传片工程包，检查 `CAPABILITY_GRAPH.json` 和 `RUNTIME_MANIFEST.json`，然后跑 `status` 和 `validate`。它不安装外部 forge skills，不调用图像生成，也不要求 HyperFrames 渲染可用。

更严格的发布候选版本验证可以运行：

```bash
npm run release:smoke:install
```

它会先 build，再 `npm pack` 打出 npm tarball，把 tarball 安装进一个临时空项目，然后用安装后的 `framepack` 真实执行 MCP discovery、`release-smoke`、`generate --auto-pack`、`validate` 和 `status --json`。

最终发布候选版本门禁是：

```bash
npm run release:gate
```

它会一次性运行 typecheck、全量测试、npm pack dry-run 和真实安装烟测。

如果要做更接近真实用户路线的发布前演练，可以运行：

```bash
npm run release:scenarios
```

它会真实生成 markdown、thread 和 game-ad sprite-video 三类工程包，并分别运行 `validate` 和 `status --json`。这个脚本不安装外部 forge skills，不调用图像生成，也不要求 HyperFrames 渲染可用。

只验证，不生成完整工程包：

```bash
npx framepack validate --input examples/case-explainer-input.md --output-dir out --goal "Explain the case" --audience "Founders"
```

验证已经生成的工程包协议：

```bash
npx framepack validate --project-dir out/sprite-video-demo
```

查看已经生成的工程包状态：

```bash
npx framepack status --project-dir out/sprite-video-demo
npx framepack status --project-dir out/sprite-video-demo --json
```

`status` 会汇总协议健康、素材执行状态、forge 任务进度、runtime 可用性、readiness 和建议下一步。agent、UI 或自动化工具需要结构化数据时，用 `--json`；结构化消费方应优先读取 `readiness` 和 `nextActionItems`，不要解析 `nextActions` 文本。每条结构化下一步都包含稳定的 `id`、`category`、`command` 和 `reason`。

`readiness` 故意保持粗粒度：`blocked` 表示协议验证失败，`needs-assets` 表示源素材或 forge 素材仍待完成，`needs-runtime` 表示包本身已经清爽但 HyperFrames 不可用，`ready` 表示可以进入预览或渲染。

| readiness | 常见 action id | 是否可预览/渲染 |
| --- | --- | --- |
| `blocked` | `repair-protocol`、`validate-protocol`、`inspect-failed-assets`、`inspect-failed-forge-assets` | 否 |
| `needs-assets` | `sync-assets`、`produce-forge-assets` | 否 |
| `needs-runtime` | `runtime-doctor` | 否 |
| `ready` | `preview` | 是 |

对 forge 工程包，`status --json` 还会输出 `forgeBreakdown`，让 agent 不必先扫描 `ASSET_EXECUTION_PLAN.json` 也能分派素材工作。它会按 `executionKind`、`forgeBackend` 和 `requiredSkill` 汇总 forge 任务数量；缺失的 backend 或 skill 会归入 `unspecified`。

`status --json` 也会输出 `capabilityGraph` 摘要：能力图是否存在、有哪些节点、哪些节点缺失或被阻塞、不同状态和交付方式各有多少。MCP 里对应 `getCapabilityGraph`、`explainCapabilityGaps`，以及 `framepack://project/{projectName}/capability-graph` 资源。包验证会检查能力图结构、必需的 runtime/MCP 节点、边引用、forge backend 节点和 required skill 节点。

包协议验证会检查 `PACKAGE_MANIFEST.json`、`SCENE_PLAN.json`、`SCENE_ASSET_MAP.json`、`SOURCE_SCENE_MAP.json` 和 `ASSET_EXECUTION_PLAN.json` 是否互相对齐。如果某个任务已经标为 `available` 或 `external`，但声明的输出文件不存在，验证会失败。

`PACKAGE_MANIFEST.json` 还会暴露 `capabilities.packageCommands`，让 agent 或工具不用解析 `COMMANDS.md`，也能直接知道这个工程包支持 `status`、`validate`、`repair`、`sync-assets`、`capture`、`runtime-doctor`、`preview` 和 `render` 这些包级操作。

新版 `capabilities.packageCommands` 还包括 `runtime-lint`、`runtime-inspect`、`runtime-snapshot` 和 `runtime-upgrade-check`，用于 HyperFrames 侧的 lint、视觉检查、关键帧截图和显式升级检查。

`RUNTIME_MANIFEST.json` 是给 agent 看的运行时契约。它记录 HyperFrames backend、根入口、runtime config/meta 文件、composition 和 asset 目录、检测到的 runtime capabilities、可执行 command specs，以及 validation report、guardrails、snapshot、runtime inspect report 的证据路径。

修复已经生成的工程包协议漂移：

```bash
npx framepack repair --project-dir out/sprite-video-demo
```

`repair` 会根据已有 `VIDEO_BRIEF.json`、`SCENE_PLAN.json`、`ASSET_PLAN.json`、`SOURCE_MANIFEST.json` 和 `ASSET_EXECUTION_PLAN.json`，重新生成可推导的 `SCENE_ASSET_MAP.json`、`SOURCE_SCENE_MAP.json`、`PACKAGE_MANIFEST.json`、`CAPABILITY_GRAPH.json` 和 `RUNTIME_MANIFEST.json`，并重新写入验证报告。它不会物化素材，不会执行 forge，也不会安装外部 skill。

给小白的说法：如果工程包像一个视频项目文件夹，`repair` 修的是目录、索引和“哪个素材服务哪个镜头”的清单；它不会替你画图、截图或生成角色，只是把这些清单重新对齐。

物化待处理素材：

```bash
npx framepack capture --project-dir out/thread-case
npx framepack sync-assets --project-dir out/thread-case
```

检查 HyperFrames runtime：

```bash
npx framepack runtime doctor
npx framepack runtime doctor --project-dir out/thread-case
npx framepack runtime lint --project-dir out/thread-case
npx framepack runtime inspect --project-dir out/thread-case --json --samples 9
npx framepack runtime snapshot --project-dir out/thread-case --frames 5
npx framepack runtime upgrade-check
```

第二条命令会同时检查 HyperFrames runtime 和工程包协议是否健康。

`runtime lint` 用来检查 HyperFrames composition 错误；`runtime inspect` 用来检查时间线里的视觉布局和文字溢出；`runtime snapshot` 用来截取 PNG 关键帧做视觉验收；`runtime upgrade-check` 只在明确需要检查 HyperFrames 更新时运行。Framepack 0.2 不封装 HyperFrames 的 `publish`，因为它会上传到外部并返回公开 URL。

预览和渲染：

```bash
npx framepack preview --project-dir out/thread-case
npx framepack render --project-dir out/thread-case
```

## 当前支持范围

当前版本支持：

- Markdown 输入
- 本地 thread/post 文本文件
- 公开单页网页 URL
- 产品/课程/品牌描述到 `game-ad` sprite-video demo
- `case-explainer` 输出类型
- `game-ad` 输出类型
- `16:9` 和 `9:16`
- 工程包生成
- guardrail 校验
- 网站截图素材生成
- 帖子文字卡片生成
- forge 任务协议生成
- HyperFrames runtime 探测、预览、渲染命令

当前限制：

- 网页输入只支持公开单页
- 不支持登录态页面
- 不支持多页爬取
- 网页结构提取仍是轻量版本
- forge 任务只生成协议，不自动安装外部 skill，不自动执行图像生成
- Framepack 本身不是最终渲染器，最终成片依赖 HyperFrames

## 给 agent 的使用方式

如果你是 Codex、Claude Code 或其他 agent，先读：

- [AGENTS.md](./AGENTS.md)

拿到一个生成后的工程包时：

1. 先读 `PACKAGE_MANIFEST.json`
2. 再读 `HANDOFF.md`
3. 查看 `SCENE_ASSET_MAP.json`、`SOURCE_SCENE_MAP.json` 和 `ASSET_EXECUTION_PLAN.json`
4. 运行 `status` 看协议、素材、forge、runtime 和下一步建议
5. 运行 `capture` 生成待处理素材
6. 对 forge 任务，根据 `requiredSkill`、`prompt`、`expectedOutputs` 和 `acceptanceCriteria` 生产或交接素材
7. 运行 `sync-assets` 同步素材状态
8. 如果 manifest、scene asset map 或 source scene map 这类派生文件和源 JSON 不一致，运行 `repair`
9. 运行 `validate` 确认工程包协议健康
10. 有 HyperFrames 时再运行 `preview` 或 `render`

## 这个项目的定位

Framepack 不是“输入一句话直接出视频”的工具。

它更像视频生产里的预制工程包系统：把内容、分镜、脚本、素材任务、执行计划都准备好，再交给 agent、可选素材 forge 后端和 HyperFrames 继续完成。
