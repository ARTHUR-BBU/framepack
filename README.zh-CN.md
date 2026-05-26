# Framepack

Framepack 是面向 agent 的轻量 HyperFrames 创意视频工作台。

它帮助 Codex、Claude Code 和其他 coding agent，把用户不成熟的想法和已有素材，整理成一个可以继续生产的视频工作区：素材库、创意简报、HyperFrames prompt、composition 方案和迭代记录。

Framepack 不替代 HyperFrames。Framepack 的目标是让 agent 更好地使用 HyperFrames。

## 核心逻辑

真实工作流是：

```text
想法 + 素材
-> Framepack 工作台
-> 创意简报
-> HyperFrames prompt
-> composition 方案
-> 预览 / 渲染 / 反馈
-> 下一轮迭代
```

Framepack 不是视频大模型，不是游戏引擎，也不是封闭创意流水线。用户和 agent 可以自由讨论创意，Framepack 负责把讨论结果收束成可执行的视频生产表面。

## 开始使用

```bash
npx -y -p framepack@alpha framepack create \
  --idea "一个面向创业者的 45 秒 agent-native workflow 发布视频" \
  --assets ./assets \
  --output-dir ./out \
  --project-name launch-video \
  --style "高级 SaaS 发布会风格，带程序化界面动效"
```

它会生成：

```text
launch-video/
  framepack.json
  ASSET_LIBRARY.md
  prompts/
    creative-brief.md
    hyperframes-prompt.md
  hyperframes/
    composition-plan.md
  iterations/
    v001.md
```

然后把 `prompts/hyperframes-prompt.md` 交给你的 agent，让它继续生成或修改 HyperFrames composition。

## Framepack 管什么

- 用户素材：图片、视频、音频、文字、截图、logo、参考资料。
- 创意方向：目标、风格、节奏、张力、结尾、场景逻辑。
- HyperFrames prompt 工程：composition 结构、动画语言、素材引用、渲染检查。
- 多轮迭代：改了什么、失败了什么、下一轮怎么改。

Framepack 默认不评价用户提供的素材。用户选择的素材先视为有意图。只有在 review loop 中发现素材影响清晰度、节奏或渲染质量时，Framepack 才给出建议。

## Agent-First 用法

你可以直接对 Codex 或 Claude Code 说：

> 读取我的素材文件夹，用 Framepack 创建一个 HyperFrames 工作台，先和我讨论三套创意方向，然后生成高质量 HyperFrames prompt 和 composition 方案。

CLI 只是工具表面。主要入口应该是你和 agent 的自然语言协作。

## 和 HyperFrames 的关系

Framepack 专注于帮助 agent 吃透并用好 HyperFrames：

- composition 结构
- 素材引用
- timeline 和程序化动效
- preview、lint、inspect、snapshot、render
- 基于反馈的多轮修改

## 旧版说明

Framepack `0.4.x` 探索过更重的 Agent Harness 和 package protocol。这部分经验仍然有价值，但从 `0.5` 开始，公开产品方向回到更轻的主线：素材、Prompt、编排、迭代、HyperFrames。

## 命令

```bash
framepack --version
framepack --help
framepack create --idea <idea> --assets <dir> --output-dir <dir>
framepack mcp --describe
```

旧兼容命令如 `generate`、`validate`、`status`、`runtime doctor` 暂时保留，但新版主线是 `create` 工作台。
