# Framepack

[English](./README.md)

Framepack 是一个面向 agent 的视频工程编译器。

它把 Markdown、帖子串、公开网页这类内容源，编译成可以继续执行的视频工程包。这个工程包通常不是最终给人看的成片，而是给 Codex、Claude Code 这类 agent 和 HyperFrames 继续加工的中间工作面。

简单说：

- Framepack 负责理解内容、规划分镜、整理素材任务、生成工程包。
- agent 负责检查、修改、补素材、执行命令。
- HyperFrames 负责预览和渲染最终视频。

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

## 它输出什么

Framepack 会生成一个视频工程包。进入工程包后，优先看：

- `PACKAGE_MANIFEST.json`
- `HANDOFF.md`
- `SOURCE_MANIFEST.json`
- `SCENE_PLAN.json`
- `SOURCE_SCENE_MAP.json`
- `ASSET_PLAN.json`
- `ASSET_EXECUTION_PLAN.json`

这些文件共同描述：

- 原始内容来自哪里
- 视频要讲什么
- 分镜怎么安排
- 哪些素材要生成或截取
- 素材应该服务哪些镜头
- agent 下一步应该执行什么

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
- `case-explainer` 视频类型
- `16:9` 和 `9:16`
- 工程包生成
- guardrail 校验
- 网站截图素材生成
- 帖子文字卡片生成
- HyperFrames runtime 探测、预览、渲染命令

当前限制：

- 网页输入只支持公开单页
- 不支持登录态页面
- 不支持多页爬取
- 网页结构提取仍是轻量版本
- Framepack 本身不是最终渲染器，最终成片依赖 HyperFrames

## 给 agent 的使用方式

如果你是 Codex、Claude Code 或其他 agent，先读：

- [AGENTS.md](./AGENTS.md)

拿到一个生成后的工程包时：

1. 先读 `PACKAGE_MANIFEST.json`
2. 再读 `HANDOFF.md`
3. 查看 `SOURCE_SCENE_MAP.json` 和 `ASSET_EXECUTION_PLAN.json`
4. 运行 `capture` 生成待处理素材
5. 运行 `sync-assets` 同步素材状态
6. 有 HyperFrames 时再运行 `preview` 或 `render`

## 这个项目的定位

Framepack 不是“输入一句话直接出视频”的工具。

它更像视频生产里的预制工程包系统：把内容、分镜、脚本、素材任务、执行计划都准备好，再交给 agent 和 HyperFrames 继续完成。

如果 HyperFrames 是厨房设备，agent 是厨师，Framepack 做的是备菜、菜单和工序安排。
