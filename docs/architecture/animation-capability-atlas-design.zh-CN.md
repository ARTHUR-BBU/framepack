# 动画能力图谱设计

## 目的

动画能力图谱是 Framepack 面向视频生产能力的结构化知识层。

它回答的问题和 `CAPABILITY_GRAPH.json` 不一样：

- 图谱描述 Framepack 理解的外部能力世界。
- 能力图描述某个具体工程包实际使用了哪些能力、缺哪些能力、推荐哪些能力、被哪些能力卡住。

Framepack 不应该变成所有动画库、媒体模型、skill、plugin、渲染器和创意工具本身。Framepack 应该足够理解这些能力，从而完成分类、推荐、组合、路由、约束和验证。

这个图谱的意义是：把“这个视频该用什么技术路线？”变成 agent 可以读取、比较、调用和持续更新的决策面。

## 核心判断

面向 agent 的视频生产有两类重要素材来源：

1. **大模型生成的音视频素材**
   例如 Seedance 2.0、Gemini Omni、Kling 3.0 这类前沿多模态视频模型，可以从文本、图片、音频、视频参考直接生成或编辑视频素材。

2. **程序化动画素材**
   例如 Anime.js、GSAP、WAAPI、SVG、Canvas、PixiJS、Three.js、Lottie、Rive、sprite sheet、Remotion、FFmpeg、HyperFrames 等 Web、运行时和动画技术，可以从结构化代码、资产和时间线生成可控运动。

Framepack 的最终工作结果不是单纯的大模型视频，也不是单纯的动画库输出。Framepack 生产的是一个**工程视频包**：它包含内容理解、场景规划、资产需求、已完成或待完成的素材、动画与合成决策、运行时入口和验证证据。

简单说：

```text
大模型音视频素材
+ 程序化动画素材
+ 合成与运行时编排
+ agent 工作流与验证
= 工程视频包
```

“程序化动画”这个类目很重要。它把 Anime.js 这类技术从“大模型生成视频”的叙事里区分出来，也为 Framepack 保留了工程可控、可复现、可调试、可验证的生产路线。

## 与现有 Framepack 概念的关系

| 概念 | 作用 |
| --- | --- |
| Workflow Pack | 描述生产任务，例如产品解释、游戏广告、课程推广、投资人更新。 |
| Creative Direction Pack | 描述审美方向，例如视觉语言、运动语言、节奏、密度和验收标准。 |
| Capability Atlas | 描述模型、库、运行时、skill、MCP 工具、plugin、人工交付等外部能力世界。 |
| Capability Graph | 描述某个具体工程包里已选择、已检测、缺失或阻塞的能力状态。 |
| Runtime Manifest | 描述某个工程包如何在 HyperFrames 等运行时里变成可执行项目。 |
| Asset Execution Plan | 描述具体资产生产任务。 |

能力图谱是生态知识和单个工程包能力图之间的桥。

## 分类结构

图谱必须有分层结构，不能做成扁平清单。它要能同时表达“技术栈级别的分类”和“具体 API、MCP、skill、plugin 的调用面”。

```text
domain 领域
  -> category 类别
    -> technique 技术手法
      -> provider 提供方
        -> library / model / runtime / tool / skill / plugin
          -> API / CLI / MCP tool / skill command / human handoff
            -> input contract 输入契约
            -> output contract 输出契约
            -> verification contract 验证契约
            -> recommendation score 推荐分
            -> lifecycle state 生命周期状态
```

建议的顶层领域：

1. `source-understanding`：来源理解
2. `planning`：规划
3. `generative-media`：生成式媒体
4. `programmatic-animation`：程序化动画
5. `asset-forge`：资产生成后端
6. `composition-runtime`：合成运行时
7. `post-production`：后期处理
8. `agent-interface`：agent 接口
9. `verification`：验证
10. `creative-direction`：创意方向

## 能力节点结构

图谱节点要足够结构化，才能支持推荐和自动化；但也不能细到每个第三方 API 小改动都导致协议破裂。

```ts
export interface CapabilityAtlasNode {
  id: string;
  name: string;
  domain: CapabilityDomain;
  category: string;
  layer:
    | "stack"
    | "technique"
    | "model"
    | "library"
    | "runtime"
    | "cli"
    | "mcp-tool"
    | "skill"
    | "plugin"
    | "manual";
  provider: string;
  deliveryModes: CapabilityDeliveryMode[];
  invocationSurfaces: InvocationSurface[];
  techniques: string[];
  inputContracts: string[];
  outputContracts: string[];
  verificationContracts: string[];
  bestUseCases: string[];
  notFor: string[];
  compatibleWith: string[];
  risks: string[];
  lifecycle: "emerging" | "recommended" | "stable" | "watch" | "deprecated" | "blocked";
  localFirst: boolean;
  requiresNetwork: boolean;
  requiresAccount: boolean;
  requiresApiKey: boolean;
  agentFriendliness: number;
  verifiability: number;
  creativeRange: number;
  controllability: number;
  operationalCost: number;
  maturity: number;
  score: number;
  sourceRefs: SourceReference[];
  lastVerifiedAt: string;
}
```

v1 阶段推荐分不需要复杂。先用可解释的加权公式：

```text
score =
  agentFriendliness * 0.22
+ verifiability * 0.22
+ controllability * 0.18
+ maturity * 0.14
+ creativeRange * 0.12
+ localFirstBonus
- operationalCost * 0.12
- integrationRiskPenalty
```

它不是要假装“审美完全客观”，而是让 agent 的推荐理由可以被检查、被调整、被迭代。

## 示例节点：Anime.js

Anime.js 应该作为第一批“程序化动画”能力的锚点样本。

```json
{
  "id": "library.animejs",
  "name": "Anime.js",
  "domain": "programmatic-animation",
  "category": "web-motion",
  "layer": "library",
  "provider": "animejs",
  "deliveryModes": ["npm-local", "cdn-runtime"],
  "invocationSurfaces": ["typescript-api", "browser-runtime"],
  "techniques": [
    "timeline-animation",
    "stagger-animation",
    "svg-animation",
    "text-animation",
    "draggable-interaction",
    "spring-easing",
    "waapi-adjacent-animation"
  ],
  "inputContracts": ["dom-elements", "svg-elements", "css-properties", "timeline-spec"],
  "outputContracts": ["browser-motion", "runtime-observable-animation"],
  "verificationContracts": ["runtime-inspect", "runtime-snapshot", "text-overflow-check"],
  "bestUseCases": [
    "kinetic-typography",
    "logo-motion",
    "icon-motion",
    "ui-micro-animation",
    "agent-generated-motion-prototype"
  ],
  "notFor": [
    "photorealistic-video-generation",
    "long-form-cinematic-generation",
    "full-render-pipeline-by-itself"
  ],
  "compatibleWith": ["video-runtime.hyperframes", "browser-snapshot", "svg-assets"],
  "lifecycle": "recommended",
  "localFirst": true,
  "requiresNetwork": false,
  "requiresAccount": false,
  "requiresApiKey": false,
  "agentFriendliness": 0.86,
  "verifiability": 0.82,
  "creativeRange": 0.78,
  "controllability": 0.88,
  "operationalCost": 0.18,
  "maturity": 0.82,
  "score": 0.84,
  "lastVerifiedAt": "2026-05-20"
}
```

Anime.js 不应该被看成完整视频运行时，而应该被看成“程序化动画素材”的生产和控制工具。它的强项是让 agent 能生成、检查、修改并组合到 HyperFrames 里的可控运动。

## 示例节点：前沿视频模型

前沿视频模型不能和本地动画库用同一种假设。

```json
{
  "id": "model.gemini-omni-flash",
  "name": "Gemini Omni Flash",
  "domain": "generative-media",
  "category": "frontier-video-model",
  "layer": "model",
  "provider": "google-deepmind",
  "deliveryModes": ["remote-api", "hosted-product"],
  "invocationSurfaces": ["remote-api", "hosted-ui"],
  "techniques": ["text-to-video", "image-to-video", "audio-video-reference", "conversational-video-editing"],
  "inputContracts": ["text", "image", "audio", "video"],
  "outputContracts": ["video-with-audio"],
  "verificationContracts": ["asset-exists", "license-policy-check", "visual-review", "runtime-ingest-check"],
  "bestUseCases": ["cinematic-source-material", "video-reference-editing", "concept-visualization"],
  "notFor": ["local-first-repeatable-rendering", "deterministic-motion-timing"],
  "lifecycle": "watch",
  "localFirst": false,
  "requiresNetwork": true,
  "requiresAccount": true,
  "requiresApiKey": true,
  "lastVerifiedAt": "2026-05-20"
}
```

Framepack 可以跟踪 Seedance 2.0、Gemini Omni、Kling 3.0 这类模型，但不能默认它们永远可用、稳定、便宜、合规或可本地执行。

## 推荐组合结构

图谱不应该只推荐单点技术，而应该推荐能力组合。

```ts
export interface RecommendedCapabilityStack {
  id: string;
  name: string;
  appliesTo: {
    workflowPackIds: string[];
    creativeDirectionPackIds: string[];
    outputTypes: string[];
    formats: string[];
  };
  nodes: {
    capabilityId: string;
    role: "source" | "asset-forge" | "motion" | "composition" | "verification" | "handoff";
    required: boolean;
    alternatives: string[];
  }[];
  rationale: string[];
  acceptanceCriteria: string[];
  riskNotes: string[];
}
```

示例：

```text
game-ad-sprite-video-stack
- 资产生成：agent-sprite-forge
- sprite 素材：透明 PNG sprite sheet 和 FX pack
- 程序化运动：Anime.js 或 PixiJS，用于小型可控循环
- 运行时合成：HyperFrames
- 验证：validate、status、runtime inspect、runtime snapshot
- 兜底：人工资产或自定义 forge backend
```

另一个例子：

```text
web-motion-explainer-stack
- 视觉素材：SVG、截图、图标、文字卡片
- 程序化动画：Anime.js / WAAPI / GSAP
- 合成运行时：HyperFrames
- 验证：文本溢出检查、关键帧截图、runtime inspect
- 兜底：减少动效复杂度，转为 HyperFrames 原生时间线
```

## 更新与淘汰机制

这个图谱必须为变化而设计。动画技术、社区最佳实践和多模态模型都会快速变化。

每类信息源都应该有不同权重：

| 来源 | 用途 |
| --- | --- |
| 官方文档、模型卡、release notes | 判断当前能力和接入方式的主事实来源。 |
| GitHub 仓库与 releases | 判断库的成熟度、API 变化和维护状态。 |
| 论文与技术报告 | 判断模型架构、评测和能力声明。 |
| X/Twitter、Reddit、Discord、社区帖子 | 用于发现趋势、坑点和真实使用感受，但不能单独作为稳定事实。 |
| Framepack 本地测试和 smoke run | 判断 Framepack 是否真的能使用该能力的最高置信证据。 |

每个节点都应该支持：

- `lastVerifiedAt`
- `sourceRefs`
- `lifecycle`
- `replacementCandidates`
- `knownBreakages`
- `policyNotes`
- `communitySignals`
- `framepackSupportLevel`

生命周期变化应该显式记录：

```text
emerging -> watch -> recommended -> stable
recommended -> watch
watch -> deprecated
deprecated -> blocked
```

这样 Framepack 就能持续吸收 Twitter、GitHub、Reddit、社区 skill、plugin 和库生态里的最佳实践，也能及时把过时路线降级或淘汰。

## Framepack 支持级别

图谱不能让人误以为“Framepack 知道一个技术”就等于“Framepack 已经完整支持它”。

需要明确支持级别：

| 支持级别 | 含义 |
| --- | --- |
| `known` | Framepack 知道这个能力，并能描述它。 |
| `recommended` | Framepack 可以在某些路线中推荐它。 |
| `contracted` | Framepack 可以为它写任务契约或工程包契约。 |
| `detectable` | Framepack 可以检测它是否存在于本地或工程包状态中。 |
| `invokable` | Framepack 可以通过 CLI、MCP、skill、plugin 或运行时适配器调用它。 |
| `verifiable` | Framepack 可以用结构化检查验证它的输出。 |

这个分级能保证产品诚实，同时允许图谱先于实现成长。

## Atlas v1 范围

第一版应该小而硬：

1. TypeScript 内置 atlas registry。
2. 程序化动画类别，以 Anime.js 作为锚点节点。
3. 已有 HyperFrames runtime 节点。
4. 已有 agent-sprite-forge backend 节点。
5. Seedance 2.0、Gemini Omni、Kling 3.0 的前沿模型 watchlist 节点。
6. 三组推荐能力组合：
   - `game-ad-sprite-video`
   - `clean-saas-explainer`
   - `web-motion-explainer`
7. MCP 和 CLI 只读接口：
   - 列出 atlas 节点
   - 获取 atlas 节点
   - 推荐 capability stack
   - 解释为什么推荐或不推荐某个能力

Atlas v1 不自动安装外部 skills，不调用 hosted model，也不自动重写现有工程包。

## 产品边界

Framepack 应该足够懂动画技术，能专业指导 agent；但它不能假装自己拥有所有动画引擎。

稳定边界是：

```text
Framepack 负责能力分类、推荐、契约、工程包状态和验证证据。

后端负责真实媒体生成、动画执行、渲染和外部服务行为。
```

这能让 Framepack 继续保持 agent-native、backend-neutral，并且能被社区持续扩展。

## 参考来源

- Anime.js documentation: https://animejs.com/documentation/
- ByteDance Seedance 2.0 official launch: https://seed.bytedance.com/blog/seedance-2-0-official-launch
- Google DeepMind Gemini Omni: https://deepmind.google/models/gemini-omni/
- Google DeepMind Gemini Omni Flash model card: https://deepmind.google/models/model-cards/gemini-omni-flash/
- Kuaishou Kling AI 3.0 launch release: https://ir.kuaishou.com/news-releases/news-release-details/kling-ai-launches-30-model-ushering-era-where-everyone-can-be
