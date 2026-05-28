# Framepack

## 0.5 Skill Layer 与 HyperFrames Prompt Templates

Framepack 现在不是只给用户一堆命令，而是给 Codex / Claude Code 安装一套视频制作 playbook：`framepack-director`、`framepack-template-fuser`、`framepack-hyperframes-builder`、`framepack-reference-miner`。

这四个 playbook 分别负责：把外行人的模糊审美愿望翻译成专业导演方案；把用户素材、模板和要求融合成 `COMPOSITION.md`；把方案交给 HyperFrames 安全实现；把参考视频沉淀成 `VIDEO_DNA.md` 和 `TEMPLATE_BLUEPRINT.md`。

Framepack 也内置了 11 个 HyperFrames prompt-template 蓝图：

- `hyperframes-saas-product-promo-30s`
- `hyperframes-app-showcase-three-phones`
- `hyperframes-product-reveal-minimal`
- `hyperframes-website-to-video-promo`
- `hyperframes-tiktok-karaoke-talking-head`
- `hyperframes-data-bar-chart-race`
- `hyperframes-brand-sizzle-reel`
- `hyperframes-logo-outro-cinematic`
- `hyperframes-social-overlay-stack`
- `hyperframes-money-counter-hype`
- `hyperframes-flight-map-route`

这些不是最终视频，也不是远程下载的付费模板，而是给 agent 使用的导演蓝图。`COMPOSITION.md` 会把推荐模板、用户资产、用户要求、Catalog 候选、动效规则和验收标准融合到一起。

Framepack 让不懂动画技术的用户，也可以用自然语言获得专业的视频生产工作台。

用户只需要说“更酷一点”“更商务”“字大一点”“节奏快一点”“动画多一点”“像这个参考视频”，Framepack 会把这些模糊愿望翻译成 Codex、Claude Code、HyperFrames 和 Remotion 能执行的工作台：素材说明、用户摘要、风格方向、视频结构、模板路线、动效语言、composition 方案、验收标准和迭代记忆。

## 为什么需要 Framepack

大多数用户并不知道自己需要什么动画库、模板、动效语法或渲染运行时。用户通常只会说：

- 更酷一点
- 更商务一点
- 字更大
- 节奏更快
- 动画更多
- 像这个参考视频

Framepack 的价值，是把外行人的自然语言翻译成专业视频方案，让 agent 能继续执行，让 HyperFrames / Remotion 能继续生产。

## 三层机制

Framepack 通过三层工作：

1. **Agent instructions / skills**：让 Codex 和 Claude Code 知道什么时候触发 Framepack。
2. **MCP / CLI**：创建工作台，并暴露工具调用入口。
3. **Workbench files**：把项目上下文保存成文件，让 agent 下次恢复时不依赖模型记忆。

通过 npm 安装时，Framepack 会运行一个小的 postinstall 钩子，在项目中写入 Codex 和 Claude Code 的 agent 指令：

```text
AGENTS.md
CLAUDE.md
.mcp.json
.framepack/agent/codex/SKILL.md
```

如果不想自动写入项目文件，可以设置 `FRAMEPACK_SKIP_AGENT_INSTALL=1`。

## 开始使用

```bash
npm install framepack
```

然后直接对 Codex 或 Claude Code 说：

```text
用 Framepack 读取我的 assets 文件夹，创建一个高级、动感、商务感强、焦点文字清晰的 HyperFrames 视频工作台。
```

也可以直接运行：

```bash
npx framepack create \
  --idea "一个面向创业者的 45 秒 agent-native workflow 发布视频" \
  --assets ./assets \
  --output-dir ./out \
  --project-name launch-video \
  --style "高级 SaaS 发布会风格，带程序化界面动效"
```

它会生成：

```text
launch-video/
  FRAMEPACK.md
  ASSETS.md
  HUMAN.md
  STYLE.md
  DIRECTION.md
  COMPOSITION.md
  ITERATIONS.md
  .framepack/
    state.json
```

从 `FRAMEPACK.md` 开始读。

在开始写第一个 composition 前，可以先检查工作台是否可用，也可以输出给人看的摘要：

```bash
framepack workbench check --project-dir ./out/launch-video
framepack workbench check --project-dir ./out/launch-video --json
framepack workbench brief --project-dir ./out/launch-video
```

## Workbench Arsenal

`framepack create` 默认输出 6 个核心 Markdown 文件，不再制造旧式目录负担：

- `FRAMEPACK.md`：agent 工作流和三层机制。
- `ASSETS.md`：用户素材和素材角色。
- `HUMAN.md`：给用户看的通俗摘要，包括当前进度、视频结构、下一步决策和技术解释。
- `STYLE.md`：品牌方向、视觉令牌、动效令牌和可调参数。
- `DIRECTION.md`：把用户模糊表达翻译成专业创意语言。
- `COMPOSITION.md`：HyperFrames / Remotion 生产路线和验收标准。
- `ITERATIONS.md`：渲染反馈和下一轮修改。

内置模板 registry 包含：

- `saas-launch`
- `news-explainer`
- `course-promo`
- `game-ad`
- `founder-story`
- `data-shock`

## 模板市场

Framepack 现在已经有第一版本地 Template Market index。它刻意保持很小、很适合 agent 阅读：这一版不做远程下载、不做支付系统、不做账号层。

每个模板都带着未来生态需要的字段：

- market item kind，目前从 `workflow-template` 开始
- GitHub PR review 式贡献模型
- access 和 license
- 价格元数据
- tags 和模糊匹配词
- HyperFrames / Remotion 实现路线
- 所需素材
- 画面语言
- 动效语言
- 验收标准

可以通过 CLI 使用：

```bash
framepack templates
framepack templates --json
framepack templates recommend --idea "A course promo for founders" --style "premium dynamic" --format 9:16 --json
```

未来付费模板可以接入同一套形状。当前版本只发布内置免费模板，方便马上开始测试。

## HyperFrames Catalog Bridge

HyperFrames Catalog 是官方视频预制件仓库。Framepack 把它当成“可被 runtime 使用的视频零部件来源”，而不是拿它替代 Template Market。

- HyperFrames Catalog 贡献 `block` 和 `component`。
- Framepack Template Market 贡献导演工作流、创意工程模板和 agent review 系统。

可以通过 CLI 使用：

```bash
framepack catalog
framepack catalog --json
framepack catalog recommend --template course-promo --idea "A premium course promo for founders" --style "business dynamic" --format 9:16 --json
```

Workbench 的 `COMPOSITION.md` 会提醒 agent：先用 `npx hyperframes catalog --json` 检查官方实时 Catalog，再决定是否安装候选组件。Framepack 只做推荐，不自动安装 Catalog 组件。

Polish Arsenal 推荐器会根据 idea、style、format、duration 输出：

- 推荐模板
- HyperFrames Catalog blocks / components
- 节奏、文字密度、动效强度、Catalog 使用程度、商务质感等可调参数
- 动画技术
- 动效语言
- 审美方向
- 禁忌清单
- 验收标准

## Agentic HITL Loop

Framepack 工作台内置人类参与决策的生产循环：

- `HUMAN.md` 用小白语言告诉用户：现在在做什么、视频结构是什么、进度到哪里、下一步要用户决定什么、技术选择是什么意思。
- `DIRECTION.md` 给出方案选项、导演翻译、结构摘要和需要用户确认的检查点。
- `COMPOSITION.md` 把确认后的方向拆成 HyperFrames / Catalog / 动画技术组合，并附带“人话解释”。
- `ITERATIONS.md` 记录用户选择、预览反馈、每轮改了什么、为什么改、下一轮怎么改。
- `.framepack/state.json` 保存同一套机器可读状态。

当用户审美表达还比较模糊时，agent 应该先让用户选择或修改方向，再锁定第一版 composition。

随时查看用户友好的当前摘要：

```bash
framepack workbench brief --project-dir ./out/launch-video
```

## HyperFrames 和 Remotion

Framepack 不要求用户自己选择底层技术。它会在项目需要时推荐合适路线：

- HyperFrames：适合程序化商业视频。
- Remotion：适合可复用模板和社交视频工作流。
- GSAP：适合 HyperFrames 安全的 timeline 动效。
- Anime.js、SVG、Canvas、PixiJS、asset forge：在创意目标需要时按需使用。

## HyperFrames 安全规则

Framepack 工作台会提醒 agent 避免常见渲染坑：

- 首场景用 CSS 保证可见。
- 场景切换用 `tl.set()`，不要用极短 `.to()`。
- 不要让多个动画引擎控制同一个元素。
- timeline 注册到 `window.__timelines`。

## 命令

```bash
framepack --version
framepack --help
framepack create --idea <idea> --assets <dir> --output-dir <dir>
framepack init-agent --target auto --scope project
framepack workbench check --project-dir <dir>
framepack workbench brief --project-dir <dir>
framepack mcp --describe
```

旧的 `generate`、`validate`、`status` 和 runtime 命令在过渡期可能保留，但 0.5 的公开主线是 workbench。
