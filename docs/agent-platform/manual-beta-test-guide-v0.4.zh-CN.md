# Framepack Beta 手工测试指引

测试文档 ID：`BETA-MANUAL-TEST-14`

适用版本：`framepack@0.4.0-beta.1`

日期：2026-05-25

目标：帮助真实用户在空项目里测试 Framepack beta，验证安装、agent onboarding、MCP、项目包生成、状态判断、运行时检查和 Asset Forge 任务是否能形成一条可用的 agent-first 视频生产流程。

## 测试总原则

不要在 Framepack 源码仓库里测试。请新建一个空项目，模拟真实用户从零安装。

推荐根目录：

```powershell
mkdir F:\framepack-user-tests
cd F:\framepack-user-tests
```

每个测试案例单独建一个目录，避免互相污染。

## 基础安装检查

```powershell
mkdir test-01-basic-install
cd test-01-basic-install
npm init -y
npm install framepack@beta --no-audit --no-fund
npx framepack --version
npx framepack --help
npx framepack mcp --describe
```

期望结果：

- `npx framepack --version` 输出 `0.4.0-beta.1`。
- `--help` 里能看到 `generate`、`validate`、`status`、`runtime`、`mcp`。
- `mcp --describe` 能看到 MCP tools、resources、prompts。

如果 `npm install framepack` 没有装到 beta，这是正常的。beta 测试必须显式使用：

```powershell
npm install framepack@beta
```

## Agent 工作流初始化

在测试项目中运行：

```powershell
npx framepack init-agent --target codex --scope project
npx framepack init-agent --target claude-code --scope project
```

检查文件：

```powershell
dir .framepack
dir .mcp.json
dir CLAUDE.md
```

重点观察：

- Codex 是否能从 `.framepack/agent/codex/SKILL.md` 理解 Framepack 工作流。
- Claude Code 是否能从 `CLAUDE.md` 和 `.mcp.json` 理解 MCP 配置。
- 文件是否告诉 agent 先验证 version/help/MCP，再生成和验证工程包。
- 是否有让用户或 agent 不知道下一步该做什么的地方。

## 测试案例 1：Markdown 产品说明转视频项目

新建目录：

```powershell
cd F:\framepack-user-tests
mkdir test-02-course-explainer
cd test-02-course-explainer
npm init -y
npm install framepack@beta --no-audit --no-fund
```

创建 `case.md`：

```markdown
# Agent-Native Video Sprint

A four-week course that teaches founders and creative teams how to turn product notes into agent-ready video production packages.

## Problem

Teams waste time moving between scripts, screenshots, image generation, and editing tools.

## Solution

Framepack gives agents a package protocol, asset plan, runtime manifest, and validation loop.

## Offer

Join a practical sprint and ship your first agent-native video workflow.
```

推荐 packs：

```powershell
npx framepack packs recommend --source-type markdown --output-type case-explainer --goal "Explain the course" --audience "Founders" --format 16:9 --json
```

生成项目包：

```powershell
npx framepack generate --input case.md --output-dir out --goal "Explain the course" --audience "Founders" --project-name course-explainer --auto-pack
```

验证：

```powershell
npx framepack validate --project-dir out/course-explainer
npx framepack status --project-dir out/course-explainer --json
npx framepack runtime doctor --project-dir out/course-explainer
```

重点看这些文件：

```powershell
notepad out/course-explainer\HANDOFF.md
notepad out/course-explainer\PACKAGE_MANIFEST.json
notepad out/course-explainer\VIDEO_BRIEF.json
notepad out/course-explainer\SCENE_PLAN.json
notepad out/course-explainer\ASSET_EXECUTION_PLAN.json
```

判断标准：

- `HANDOFF.md` 是否能指导 agent 下一步。
- `status --json` 的 `readiness` 是否合理。
- `nextActionItems` 是否清楚。
- scene plan 是否像一个视频项目，而不是散乱文本。
- runtime doctor 是否能清楚说明 HyperFrames 可用性。

## 测试案例 2：游戏风广告 / Asset Forge

新建目录：

```powershell
cd F:\framepack-user-tests
mkdir test-03-game-ad
cd test-03-game-ad
npm init -y
npm install framepack@beta --no-audit --no-fund
```

生成游戏风广告包：

```powershell
npx framepack generate --game-ad-description "A founder course that teaches teams to ship agent-native video systems with Framepack, HyperFrames, and asset forge workflows." --output-dir out --goal "Promote the course" --audience "Founders" --project-name game-ad-course --format 9:16 --auto-pack
```

验证：

```powershell
npx framepack validate --project-dir out/game-ad-course
npx framepack status --project-dir out/game-ad-course --json
npx framepack runtime doctor --project-dir out/game-ad-course
```

重点看：

```powershell
notepad out/game-ad-course\HANDOFF.md
notepad out/game-ad-course\FORGE_TASKS.md
notepad out/game-ad-course\ASSET_EXECUTION_PLAN.json
notepad out/game-ad-course\CAPABILITY_GRAPH.json
```

期望结果：

- `readiness` 大概率是 `needs-assets`。
- Framepack 不应该假装素材已经生成。
- `ASSET_EXECUTION_PLAN.json` 应该包含 `forge-character-pack`、`forge-map-pack`、`forge-fx-pack`。
- `HANDOFF.md` 应该推荐 `agent-sprite-forge`。
- `HANDOFF.md` 应该提到 `$generate2dsprite` 和 `$generate2dmap`。
- 文档应该允许手工素材、自定义后端、已有素材，而不是强制绑定单一后端。

## 测试案例 3：真实产品或课程

把你自己的真实产品、课程、品牌或服务描述放进去。建议至少包含：

- 产品是什么
- 用户是谁
- 痛点是什么
- 为什么现在需要
- 希望视频完成什么目标
- 是否想要游戏风、SaaS 风、发布会风、教程风或证据叙事风

推荐命令：

```powershell
npx framepack generate --input your-source.md --output-dir out --goal "Explain the product" --audience "Potential customers" --project-name real-product-test --auto-pack
npx framepack validate --project-dir out/real-product-test
npx framepack status --project-dir out/real-product-test --json
npx framepack runtime doctor --project-dir out/real-product-test
```

观察重点：

- agent 是否能理解生成包结构。
- `HANDOFF.md` 是否能让下一位 agent 接着工作。
- `VIDEO_BRIEF.json` 是否抓住产品重点。
- `SCENE_PLAN.json` 是否有视频节奏。
- `ASSET_EXECUTION_PLAN.json` 是否明确缺什么资产。

## 测试案例 4：网站转视频

如果你有真实网址，可以测试：

```powershell
npx framepack generate --url https://example.com --output-dir out --goal "Explain the website" --audience "Potential customers" --project-name website-video --auto-pack
npx framepack validate --project-dir out/website-video
npx framepack status --project-dir out/website-video --json
```

观察重点：

- 抓取失败时错误是否清楚。
- 成功时 capture 任务是否合理。
- `SOURCE_MANIFEST.json` 和 `SOURCE_SCENE_MAP.json` 是否能解释网页内容如何进入场景。

## 测试案例 5：模糊创意输入

可以故意给一个模糊需求：

```text
帮我做一个很炸裂的 AI 产品宣传片，面向创业者，要有游戏感。
```

推荐让 Codex 或 Claude Code 先读项目，并自然语言执行：

```text
Install Framepack beta in this project. Initialize the agent workflow, recommend a route, generate a small package, validate it, inspect status, and tell me what is missing. Do not claim the video is visually ready unless runtime inspect or snapshots provide evidence.
```

观察重点：

- agent 是否先推荐 workflow pack 和 creative direction pack。
- agent 是否追问必要目标，而不是乱生成。
- Framepack 输出是否让模糊需求变成可执行工程包。

## 问题记录模板

每次测试都按下面格式记录：

```markdown
## 测试名称

## 环境

- OS:
- Node:
- Framepack:
- Agent: Codex / Claude Code / 手工 CLI

## 输入

贴原始 markdown / 描述 / URL

## 命令

贴实际运行命令

## 结果

- install 是否通过:
- version/help/MCP 是否通过:
- generate 是否通过:
- validate 是否通过:
- readiness:
- nextActionItems:
- runtime doctor:
- 是否有困惑:

## 问题等级

- P0: 安装、CLI、MCP、generate、validate、status 直接坏
- P1: 主流程被卡住，或者 readiness / nextActionItems 误导
- P2: 能跑通，但用户或 agent 明显困惑
- P3: 文案、增强、体验建议
```

## 推荐测试顺序

1. 先测基础安装。
2. 再测 Markdown explainer。
3. 再测 game-ad forge。
4. 再测你的真实项目内容。
5. 最后让 Codex 或 Claude Code 只看自然语言要求，不给手工命令，观察它是否能自己完成流程。

## 小白总结

这份测试不是为了证明 Framepack 能一键出最终成片，而是为了验证它能不能把内容变成一个 agent 看得懂、能继续执行、能验证状态的视频工程包。测试时重点看三件事：装得上、生成包看得懂、下一步说得清。如果这三件事在真实项目里卡住了，就记录成 beta patch 问题。
