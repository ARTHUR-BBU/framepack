# Framepack

[English](./README.md)

Framepack 是一个面向 agent 的视频工程编译器。

它把 Markdown、帖子串、公开网页、产品/课程/品牌描述这类内容源，编译成可以继续执行的视频工程包。这个工程包通常不是最终给人看的成片，而是给 Codex、Claude Code 这类 agent 和 HyperFrames 继续加工的中间工作面。

Framepack 负责生成资产库、编排、生成模型、后期合成混合工作流里的编译层：它定义内容结构、分镜计划、资产需求、执行任务和运行时入口。Framepack 本身不是游戏引擎，也不是图像生成器。

## 快速开始

```bash
npm install
npm run build
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

这个包会包含角色、地图/背景、FX 的 forge 任务，但不会自动安装 `agent-sprite-forge`，也不会自动调用图像生成。

## 它输出什么

Framepack 会生成一个视频工程包。进入工程包后，优先看：

- `PACKAGE_MANIFEST.json`
- `HANDOFF.md`
- `SOURCE_MANIFEST.json`
- `VIDEO_BRIEF.json`
- `SCENE_PLAN.json`
- `SOURCE_SCENE_MAP.json`
- `ASSET_PLAN.json`
- `ASSET_EXECUTION_PLAN.json`

这些文件共同描述：

- 原始内容来自哪里
- 视频要讲什么
- 分镜怎么安排
- 哪些素材要生成、截取或外部生产
- 素材应该服务哪些镜头
- agent 下一步应该执行什么

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

`agent-sprite-forge` 是第一个推荐的 2D asset forge 参考后端。如果相关 skill 已安装，agent 可以根据工程包用 `$generate2dsprite` 生产 sprite、角色、prop、FX，用 `$generate2dmap` 生产地图/背景。Framepack 只生成标准化任务、提示词、预期输出和验收条件，不绑定单一后端。

## 常用命令

检查项目：

```bash
npm run typecheck
npm test
npm run build
```

生成工程包：

```bash
npx framepack generate --input examples/case-explainer-input.md --output-dir out --goal "Explain the case" --audience "Founders"
npx framepack generate --thread-file examples/thread.txt --output-dir out --goal "Explain the thread" --audience "Founders" --project-name thread-case
npx framepack generate --url https://example.com/product --output-dir out --goal "Explain the site" --audience "Founders" --project-name website-case
npx framepack generate --game-ad-description "A product story for a sprite-style video ad." --output-dir out --goal "Promote the product" --audience "Founders" --project-name sprite-video-demo
```

只验证，不生成完整工程包：

```bash
npx framepack validate --input examples/case-explainer-input.md --output-dir out --goal "Explain the case" --audience "Founders"
```

物化待处理素材：

```bash
npx framepack capture --project-dir out/thread-case
npx framepack sync-assets --project-dir out/thread-case
```

检查 HyperFrames runtime：

```bash
npx framepack runtime doctor
```

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
3. 查看 `SOURCE_SCENE_MAP.json` 和 `ASSET_EXECUTION_PLAN.json`
4. 运行 `capture` 生成待处理素材
5. 对 forge 任务，根据 `requiredSkill`、`prompt`、`expectedOutputs` 和 `acceptanceCriteria` 生产或交接素材
6. 运行 `sync-assets` 同步素材状态
7. 有 HyperFrames 时再运行 `preview` 或 `render`

## 这个项目的定位

Framepack 不是“输入一句话直接出视频”的工具。

它更像视频生产里的预制工程包系统：把内容、分镜、脚本、素材任务、执行计划都准备好，再交给 agent、可选素材 forge 后端和 HyperFrames 继续完成。
