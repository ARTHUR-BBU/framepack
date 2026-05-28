# Framepack

## 程式化视频 vs 生成式视频

AI 视频有两条完全不同的路线：

**生成式视频**（Runway、Sora、Kling、Project Luxo）：AI 从噪声里"画"出画面，像素级生成人物、场景、动作。没有素材、没有 HTML、没有代码编排——prompt 进去，视频出来。

**程式化视频**（Framepack + HyperFrames）：用 HTML/CSS/GSAP 代码编排现成素材（图片、文字、视频片段）+ 包装动画（转场、字幕动效、特效），渲染成 MP4。不生成画面，只编排画面。

| | 生成式（Runway） | 程式化（Framepack） |
|---|---|---|
| 输入 | 文字 prompt | 素材文件 + 创意意图 |
| 输出 | 全新画面 | 素材的编排 + 包装 |
| 控制粒度 | 粗（整体风格） | 细（每个像素、每一帧） |
| 适用场景 | 剧情片、广告创意 | 品牌视频、数据可视化、模板化内容 |
| 画面来源 | AI 生成 | 用户提供 |
| 技术核心 | 扩散模型 | GSAP + CSS 动画引擎 |

Framepack 站在程式化这一边。它不生成画面，它给 coding agent 提供设计系统、代码模板、安全规则和创作上下文，让 agent 把用户素材编排成专业的 HyperFrames composition。

## 0.5 工作台：从模糊愿望到可执行视频方案

Framepack 是一个**程式化视频创意工作台**，面向 coding agent（Codex、Claude Code）和 HyperFrames 渲染引擎。

用户只需要说"更酷一点""更商务""字大一点""节奏快一点""动画多一点""像这个参考视频"，Framepack 会把这些模糊愿望翻译成设计系统、视觉令牌、HTML 骨架、素材说明、用户摘要、风格方向、视频结构、模板路线、动效语言、composition 方案、验收标准和迭代记忆——让 coding agent 能通过 HyperFrames 直接执行。

## 为什么需要 Framepack

大多数用户并不知道自己需要什么动画库、模板、动效语法或渲染运行时。用户通常只会说：

- 更酷一点
- 更商务一点
- 字更大
- 节奏更快
- 动画更多
- 像这个参考视频

Framepack 的价值，是把外行人的自然语言翻译成专业视频方案，让 coding agent 能通过 HyperFrames 继续执行。

## 三层机制

Framepack 通过三层工作：

1. **Agent instructions / skills**：让 coding agent（Codex、Claude Code）知道什么时候触发 Framepack。
2. **MCP / CLI**：创建工作台，并暴露工具调用入口。
3. **Workbench files**：把项目上下文保存成文件，让 agent 下次恢复时不依赖模型记忆。

通过 npm 安装时，Framepack 会运行一个小的 postinstall 钩子，在项目中写入 agent 指令：

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

然后直接对你的 coding agent 说：

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

它会生成完整的 agent-ready 工作台：

```text
launch-video/
  FRAMEPACK.md          agent 工作流和三层机制
  ASSETS.md             用户素材和素材角色
  HUMAN.md              给用户看的通俗摘要
  STYLE.md              品牌方向、视觉令牌、动效令牌
  DIRECTION.md          用户模糊表达 → 专业创意方向
  COMPOSITION.md        HyperFrames 生产路线、场景方案、代码模板、安全规则
  ITERATIONS.md         渲染反馈和下一轮修改
  DESIGN.md             自动匹配的设计系统 spec（22 个可选）
  DESIGN_TOKENS.md      提取的颜色 hex 和字体
  ASSET_GAPS.md         阻塞和可选的素材缺口分析
  index.html            HyperFrames 可用的 HTML 骨架
  .framepack/
    state.json          机器可读项目状态
```

从 `FRAMEPACK.md` 开始读。

在开始写第一个 composition 前，可以先检查工作台是否可用，也可以输出给人看的摘要：

```bash
framepack workbench check --project-dir ./out/launch-video
framepack workbench check --project-dir ./out/launch-video --json
framepack workbench brief --project-dir ./out/launch-video
```

## Workbench Arsenal

`framepack create` 输出 12 个工作台文件，不制造旧式目录负担：

- `FRAMEPACK.md`：agent 工作流和三层机制。
- `ASSETS.md`：用户素材和素材角色。
- `HUMAN.md`：给用户看的通俗摘要，包括当前进度、视频结构、下一步决策和技术解释。
- `STYLE.md`：品牌方向、视觉令牌、动效令牌和可调参数。
- `DIRECTION.md`：把用户模糊表达翻译成专业创意方向。
- `COMPOSITION.md`：HyperFrames 生产路线、场景方案、代码模板、Catalog Pre-Flight、安全规则和验收标准。
- `ITERATIONS.md`：渲染反馈和下一轮修改。
- `DESIGN.md`：自动匹配的设计系统 spec，从 22 个精选设计系统中选择（Apple、Stripe、Nike、SpaceX、Tesla 等）。
- `DESIGN_TOKENS.md`：从匹配的设计系统中提取 hex 颜色和字体。
- `ASSET_GAPS.md`：阻塞和可选的素材缺口分析，附带工具推荐。
- `index.html`：HyperFrames 可用的 HTML 骨架，包含正确的 data 属性、场景结构、GSAP timeline、CSS 首场景可见。
- `.framepack/state.json`：机器可读项目状态。

内置模板 registry 包含：

- `saas-launch`
- `news-explainer`
- `course-promo`
- `game-ad`
- `founder-story`
- `data-shock`

## Skill Playbooks

`init-agent` 会把 Framepack 安装为 coding agent 的 skill pack。安装后的指令包含四个 playbook：

- `framepack-director`：把外行人的模糊审美翻译成专业结构、视觉语言、动效语言、风险和验收标准。包含 22 个设计系统参考文件。
- `framepack-template-fuser`：把用户素材、模板、要求和 Catalog 候选融合成 `COMPOSITION.md`。
- `framepack-hyperframes-builder`：把方案交给 HyperFrames 安全实现。包含 15 条兼容性规则和 8 个代码模板。
- `framepack-reference-miner`：把参考视频沉淀成 `VIDEO_DNA.md` 和 `TEMPLATE_BLUEPRINT.md`。

Skill 遵循渐进式披露模式——`SKILL.md` 是简洁索引，详细参考按需加载：

```text
.claude/skills/framepack-director/SKILL.md
.claude/skills/framepack-director/references/designs/
.claude/skills/framepack-template-fuser/SKILL.md
.claude/skills/framepack-template-fuser/references/catalog-usage.md
.claude/skills/framepack-hyperframes-builder/SKILL.md
.claude/skills/framepack-hyperframes-builder/references/compatibility-rules.md
.claude/skills/framepack-hyperframes-builder/references/code-templates.md
.claude/skills/framepack-reference-miner/SKILL.md
```

## 设计系统匹配

Framepack 会根据用户的风格关键词，自动匹配 22 个精选设计系统中的一个，并将完整 spec 拷贝到项目中作为 `DESIGN.md`。这样 agent 就有了精确的颜色、字体、间距和动效规则，不再需要猜测。

包含的设计系统：SpaceX、Tesla、Nvidia、Apple、Stripe、Nike、Ferrari、Lamborghini、Bugatti、BMW M、Vercel、Linear、Spotify、Discord、Figma、PlayStation、Shopify、Meta、Uber、Raycast、OpenAI、Notion。

`DESIGN_TOKENS.md` 会从匹配的设计系统中提取 hex 颜色和字体，方便代码直接使用。

## HyperFrames Prompt Templates

Framepack 内置 11 个 HyperFrames prompt-template 蓝图：

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

## 外部能力推荐

`COMPOSITION.md` 会根据用户的创意方向推荐外部工具：

- `agent-sprite-forge`：适合 game-ad 路线（精灵图、角色包、特效）
- Three.js：适合 3D 和 WebGL 场景
- D3 / Chart.js：适合数据可视化
- Web Audio API：适合音频响应式动画

这些只是推荐，Framepack 不会自动安装外部工具。

## 模板市场

Framepack 现在已经有第一版本地 Template Market index。它刻意保持很小、很适合 agent 阅读：这一版不做远程下载、不做支付系统、不做账号层。

每个模板都带着未来生态需要的字段：

- market item kind，目前从 `workflow-template` 开始
- GitHub PR review 式贡献模型
- access 和 license
- 价格元数据
- tags 和模糊匹配词
- HyperFrames 实现路线
- 所需素材
- 画面语言
- 动效语言
- 验收标准

可以通过 CLI 使用：

```bash
framepack templates
framepack templates --json
framepack templates recommend --idea "A course promo for founders" --style "premium dynamic" --format 9:16 --json
framepack templates prompt --json
framepack templates prompt recommend --idea "A TikTok founder video with karaoke captions" --style "big text fast social" --format 9:16 --json
```

未来付费模板可以接入同一套形状。当前版本只发布内置免费模板，方便马上开始测试。

## HyperFrames Catalog Bridge

HyperFrames Catalog 是官方视频预制件仓库。Framepack 把它当成"可被 runtime 使用的视频零部件来源"，而不是拿它替代 Template Market。

- HyperFrames Catalog 贡献 `block` 和 `component`。
- Framepack Template Market 贡献导演工作流、创意工程模板和 agent review 系统。

可以通过 CLI 使用：

```bash
framepack catalog
framepack catalog --json
framepack catalog recommend --template course-promo --idea "A premium course promo for founders" --style "business dynamic" --format 9:16 --json
```

`COMPOSITION.md` 现在包含 Catalog Pre-Flight 部分，列出强制的"安装-然后-编码"步骤。agent 必须完成这些步骤后才能写场景代码。Framepack 只做推荐，不自动安装 Catalog 组件。

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
- `COMPOSITION.md` 把确认后的方向拆成 HyperFrames 场景代码、Catalog 组装和动画技术指导。
- `ITERATIONS.md` 记录用户选择、预览反馈、每轮改了什么、为什么改、下一轮怎么改。
- `.framepack/state.json` 保存同一套机器可读状态。

当用户审美表达还比较模糊时，agent 应该先让用户选择或修改方向，再锁定第一版 composition。

随时查看用户友好的当前摘要：

```bash
framepack workbench brief --project-dir ./out/launch-video
```

## HyperFrames 渲染引擎

Framepack 以 HyperFrames 为主要渲染引擎：

- HyperFrames：程式化商业视频渲染。
- GSAP：HyperFrames 安全的 timeline 动效。
- Anime.js、SVG、Canvas、PixiJS、asset forge：在创意目标需要时按需使用。

## HyperFrames 安全规则

Framepack 工作台会提醒 agent 避免常见渲染坑：

- 首场景用 CSS 保证可见。
- 场景切换用 `tl.set()`，不要用极短 `.to()`。
- 不要让多个动画引擎控制同一个元素。
- timeline 注册到 `window.__timelines`。
- 动画中不要用 `Math.random()`。
- 不要用 `repeat: -1` 无限循环。
- 不要异步构建 timeline。

生成的 `index.html` 骨架已经遵循以上所有规则：正确的 data 属性、场景结构、入场动画、以及暂停的 GSAP timeline，agent 只需扩展即可。

## 命令

```bash
framepack --version
framepack --help
framepack create --idea <idea> --assets <dir> --output-dir <dir>
framepack init-agent --target auto --scope project
framepack workbench check --project-dir <dir>
framepack workbench brief --project-dir <dir>
framepack templates
framepack templates recommend --idea <idea> --style <style> --format <format> --json
framepack templates prompt --json
framepack mcp --describe
```

旧的 `generate`、`validate`、`status` 和 runtime 命令在过渡期可能保留，但 0.5 的公开主线是 workbench。
