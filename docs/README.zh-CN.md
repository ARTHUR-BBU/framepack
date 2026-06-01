# Framepack 中文说明

Framepack 是一个面向 Codex、Claude Code 等 coding agent 的**程式化视频工作台**，主要配合 HyperFrames 渲染运行时使用。

它把用户不成熟的想法、已有素材、参考视频和模糊审美词，翻译成 agent 可以执行的视频项目：设计方向、视觉令牌、素材缺口、模板路线、动效语言、HyperFrames composition 方案、构建输出、审计门禁和迭代记录。

## 小白版解释

很多用户其实不知道自己需要什么技术、模板、动画库或视频结构，只会说：

- 高级一点
- 商务一点
- 动感一点
- 字大一点
- 节奏快一点
- 多一点动画
- 像这个参考视频

Framepack 的作用就是把这些外行语言翻译成专业视频方案，让 coding agent 知道下一步该怎么做。它不负责凭空生成画面，而是组织用户已有素材，推荐模板和动画路线，写清楚制作方案，生成 HyperFrames 安全的 HTML，并在预览和渲染前做质检。

## 程式化视频 vs 生成式视频

**生成式视频**是让模型根据 prompt 生成新画面。

**程式化视频**是用 HTML、CSS、GSAP、图片、视频片段、文字、图标、UI 截图和模板，把已有素材编排成可控的视频。

| 对比项 | 生成式视频 | Framepack + HyperFrames |
| --- | --- | --- |
| 输入 | prompt | 素材 + 意图 + 参考 |
| 输出 | 新画面 | 可控的视频工程 |
| 控制粒度 | 偏整体风格 | 元素、时间线、布局、文案都可控 |
| 适合 | 开放式视觉生成 | 品牌视频、产品宣传、课程推广、数据动画、模板化内容 |
| Framepack 角色 | 不是生成器 | 工作台、导演助手、模板路由、质检层 |

## 安装

```bash
npm install framepack
```

## 三层机制

Framepack 通过三层机制工作：agent instructions / skills 负责触发和专业 playbook，MCP / CLI 负责工具调用和知识查询，workbench files 负责把用户意图、设计、素材、方案、审计和迭代记录持久化下来。

默认安装后，Framepack 会写入项目级 agent 指南：

```text
AGENTS.md
CLAUDE.md
.mcp.json
.framepack/agent/codex/SKILL.md
.framepack/agent/codex/skills/
.claude/skills/
```

如果不想自动写入这些文件，可以设置：

```bash
FRAMEPACK_SKIP_AGENT_INSTALL=1 npm install framepack
```

## 推荐用法

你可以直接对 Codex 或 Claude Code 说：

```text
用 Framepack 把我的想法和 assets 文件夹做成一个高级、动感、商务感强、文字焦点清晰的 HyperFrames 视频工作台。请用小白语言解释方案，运行审计门禁，然后构建和预览。
```

也可以直接运行命令：

```bash
npx framepack create \
  --idea "一个面向创业者的 30 秒高级产品发布视频" \
  --assets ./assets \
  --output-dir ./out \
  --project-name launch-video \
  --format 9:16 \
  --style "高级 SaaS 发布感，强动效，大字号焦点文字"
```

## 标准流程

```bash
# 1. 创建工作台
npx framepack create --idea "一个 30 秒产品发布视频" --assets ./assets --output-dir ./out --project-name launch-video --format 9:16

# 2. 用小白语言解释当前方案
npx framepack workbench brief --project-dir ./out/launch-video

# 3. 进入构建前审计
npx framepack workbench audit --phase preflight --project-dir ./out/launch-video
npx framepack workbench audit --phase design --project-dir ./out/launch-video
npx framepack workbench audit --phase composition --project-dir ./out/launch-video

# 4. 编译成 HyperFrames HTML
npx framepack build --project-dir ./out/launch-video

# 5. 预览和渲染
npx framepack preview --project-dir ./out/launch-video --open
npx framepack workbench audit --phase preview --project-dir ./out/launch-video
npx framepack render --project-dir ./out/launch-video --audio bgm.mp3
npx framepack workbench audit --phase render --project-dir ./out/launch-video
```

## 工作台文件

`framepack create` 会生成一组精简的工作台文件：

```text
launch-video/
  FRAMEPACK.md          agent 工作流和阅读顺序
  HUMAN.md              给用户看的小白摘要
  ASSETS.md             用户素材和素材角色
  ASSET_GAPS.md         阻塞性和可选素材缺口
  STYLE.md              品牌方向和调参信息
  DESIGN.md             匹配到的设计系统参考
  DESIGN_TOKENS.md      可执行的颜色和字体令牌
  DIRECTION.md          专业创意方向
  COMPOSITION.md        HyperFrames 制作方案和模板路线
  ITERATIONS.md         反馈、决策和迭代记录
  index.html            初始 HyperFrames HTML 骨架
  meta.json             预览和渲染需要的运行时元数据
  .framepack/state.json 机器可读状态
```

用户优先看 `HUMAN.md`。agent 优先读 `FRAMEPACK.md`。

## 质检员：Audit Gates

Framepack 不只是生成文件，还要监督 agent 不要跑偏。

```bash
npx framepack workbench audit --phase preflight --project-dir ./out/launch-video
npx framepack workbench audit --phase design --project-dir ./out/launch-video
npx framepack workbench audit --phase composition --project-dir ./out/launch-video
npx framepack workbench audit --phase preview --project-dir ./out/launch-video
npx framepack workbench audit --phase render --project-dir ./out/launch-video
npx framepack workbench audit --phase all --project-dir ./out/launch-video --json
```

如果出现 P0/P1 问题，agent 应该先修正或向用户确认，不能直接进入 build、preview 或 render。

审计会检查：小白摘要、设计令牌、素材缺口、用户确认点、技术路线、skill 暴露、HyperFrames 运行时文件、预览和渲染准备情况。

## 内置能力

Framepack 内置了一个轻量但可扩展的创意武器库：

- 内置模板 registry：`saas-launch`、`news-explainer`、`course-promo`、`game-ad`、`founder-story`、`data-shock`
- 6 个工作流模板：`saas-launch`、`news-explainer`、`course-promo`、`game-ad`、`founder-story`、`data-shock`
- 11 个 HyperFrames prompt-template 蓝图
- 20 个场景模板，覆盖 opening、name-reveal、stats、footage、cta、transition
- 22 个设计系统参考，例如 Apple、Stripe、SpaceX、Tesla、Nike、Nvidia、Linear、OpenAI、Notion
- HyperFrames Catalog bridge，用于组件和 block 推荐
- Polish Arsenal 推荐器，用于输出模板路线、动效语言、禁忌清单和验收标准

常用命令：

```bash
npx framepack templates
npx framepack templates recommend --idea "A course promo for founders" --style "premium dynamic" --format 9:16 --json
npx framepack templates prompt
npx framepack templates prompt recommend --idea "A TikTok founder video with karaoke captions" --style "big text fast social" --format 9:16 --json
npx framepack scene-templates list
npx framepack catalog recommend --template course-promo --idea "premium founder course promo" --style "business dynamic" --format 9:16 --json
```

## Agent Skills

Framepack 会安装四个核心 playbook：

- `framepack-director`：把模糊审美翻译成专业结构、视觉语言、动效语言、风险和验收标准。
- `framepack-template-fuser`：把用户素材、用户要求、工作流模板、prompt 模板和 Catalog 候选融合成 `COMPOSITION.md`。
- `framepack-hyperframes-builder`：把 `COMPOSITION.md` 变成 HyperFrames 安全代码，并执行检查。
- `framepack-reference-miner`：从参考视频或成品视频提取 `VIDEO_DNA.md` 和 `TEMPLATE_BLUEPRINT.md`。

Claude Code 的 skills 在 `.claude/skills/`。Codex 项目工作流的 skills 在 `.framepack/agent/codex/skills/`。

## MCP

Framepack MCP 是给 agent 用的知识和自动化接口：

```bash
npx framepack mcp --describe
```

当前核心知识工具：

- `querySceneTemplate`
- `recommendAnimation`
- `getComponentCode`

MCP 中仍保留一些 0.4 package 时代的工具，方便兼容和自动化测试。普通用户主线应优先使用 `create -> audit -> build -> preview -> render`。

## HyperFrames 安全规则

Framepack 会提醒 agent 避免常见渲染问题：

- 首场景必须在 CSS 中可见
- 场景切换用 `tl.set()`
- 不要把带时间属性的 video 嵌套进带时间属性的 scene 容器
- timeline 注册到 `window.__timelines`
- render timeline 中不要用 `Math.random()` 和无限循环
- 同一元素不要混用多个动画引擎
- render 前必须先 audit、lint、preview

## 开发验证

```bash
npm run typecheck
npm test
npm run build
npm run sandbox:benchmark
npm pack --dry-run --json
```

`sandbox:benchmark` 会跑 create、check、brief、build、五阶段 audit、模板、Catalog、MCP SDK 和 HyperFrames lint，是当前产品级内测的核心入口。
