# Framepack 0.6 Workbench 中文手工测试指南

> ID: MANUAL-BETA-TEST-V0.6-01
> Scope: 0.6 workbench path
> Version under test: 0.6.0-alpha.3

## 测试目标

这份指南用于测试 Framepack 是否已经像一个“程式化视频项目制片主任”一样工作：能把用户模糊想法变成清晰方案，能让 agent 读懂下一步，能生成 HyperFrames 可用骨架，能在预览/渲染前拦住明显风险，并能把失败和绕路记录下来。

小白理解：不是看 Framepack 会不会“生成一堆文件”，而是看它能不能让一个普通用户和 coding agent 稳稳地把视频项目推进下去。

## 准备环境

```bash
npm install framepack
npx framepack --version
npx framepack mcp --describe
```

期望：

- 版本显示 `0.6.0-alpha.3` 或当前待测版本。
- 项目中存在 `AGENTS.md`、`CLAUDE.md`、`.mcp.json`。
- Codex skill 位于 `.framepack/agent/codex/SKILL.md` 和 `.framepack/agent/codex/skills/`。
- Claude Code skills 位于 `.claude/skills/`。

## 标准测试流程

```bash
npx framepack create --idea "一个 30 秒高级 SaaS 产品发布视频，节奏快，大字焦点，商务但不沉闷" --assets ./assets --output-dir ./out --project-name saas-launch-v06 --format 9:16 --style "premium dynamic business large text"
npx framepack workbench brief --project-dir ./out/saas-launch-v06
npx framepack workbench preferences --project-dir ./out/saas-launch-v06
npx framepack templates recommend --project-dir ./out/saas-launch-v06 --idea "premium SaaS launch" --style "dynamic business" --format 9:16 --json
npx framepack catalog recommend --project-dir ./out/saas-launch-v06 --template saas-launch --idea "premium SaaS launch" --style "dynamic business" --format 9:16 --json
npx framepack workbench audit --phase preflight --project-dir ./out/saas-launch-v06
npx framepack workbench audit --phase design --project-dir ./out/saas-launch-v06
npx framepack workbench audit --phase composition --project-dir ./out/saas-launch-v06
npx framepack build --project-dir ./out/saas-launch-v06
npx framepack preview --project-dir ./out/saas-launch-v06 --json
npx framepack workbench audit --phase preview --project-dir ./out/saas-launch-v06
npx framepack workbench friction --project-dir ./out/saas-launch-v06 --json
npx framepack workbench learnings --project-dir ./out/saas-launch-v06 --json
```

## 必查文件

每个测试项目都要检查：

- `FRAMEPACK.md`：agent 是否知道读取顺序和流程。
- `HUMAN.md`：小白用户是否能看懂当前方案。
- `ASSETS.md`：素材是否被记录。
- `ASSET_GAPS.md`：素材缺口是否分为 blocking / optional。
- `STYLE.md`：用户审美词是否被沉淀。
- `DESIGN.md` 和 `DESIGN_TOKENS.md`：是否有设计系统和可执行令牌。
- `DIRECTION.md`：是否把“高级/动感/商务”等模糊词翻译成专业创意语言。
- `COMPOSITION.md`：是否写清模板路线、Catalog 候选、场景节奏、动效语言和验收标准。
- `index.html`：是否有 HyperFrames 骨架。
- `meta.json`：是否存在 runtime 元数据。
- `.framepack/preferences.json`：是否记住用户偏好。
- `.framepack/interventions.jsonl`：是否记录拦截或 force。
- `.framepack/friction.jsonl`：是否记录失败、绕路和反复问题。

## 评分表

| 项目 | 目标 | 分数 |
| --- | --- | --- |
| 安装与 agent 暴露 | AGENTS/CLAUDE/MCP/skills 都存在 | 0-10 |
| 小白可理解性 | HUMAN/brief 能解释清楚当前阶段 | 0-15 |
| 创意导演能力 | DIRECTION 能把模糊审美变成专业语言 | 0-15 |
| 模板与 Catalog 使用 | COMPOSITION 有模板、Catalog、动效依据 | 0-15 |
| HyperFrames 工程正确性 | build 产出 index.html/meta.json，preview 可进入 | 0-15 |
| 审计有效性 | P0/P1 能阻断，interventionContext 能指导下一步 | 0-15 |
| 摩擦学习 | friction/learnings/recurringRisks 能解释风险 | 0-15 |

总分建议：

- `90-100`：可以进入客户项目试用。
- `75-89`：可以继续内部测试，但需要记录问题。
- `<75`：不要进入客户项目，先修 P0/P1。

## 三个推荐测试案例

可以手工逐条执行，也可以先跑内置内测脚本生成基线报告：

```bash
npm run workbench:trials
```

报告输出到：

```text
out/workbench-trials-v0.6/latest/WORKBENCH_TRIAL_REPORT.md
out/workbench-trials-v0.6/latest/workbench-trials.json
```

### Case A: SaaS Launch

用户说法：

```text
我有一个 AI SaaS 产品，想做 30 秒竖屏发布视频，要高级、商务、节奏快、大字清楚，有产品截图。
```

期望路线：`saas-launch` + product reveal + caption/CTA components。

### Case B: Course Promo

用户说法：

```text
我有一个面向创业者的课程，想做短视频宣传，要像创始人亲自推荐，信息密度高但不乱。
```

期望路线：`course-promo` + social overlay + karaoke/talking-head prompt-template。

### Case C: Data / News Explainer

用户说法：

```text
我有一组行业数据，想做一个冲击力强的数据解释视频，开头要抓人，数字要动起来，结尾要有观点。
```

期望路线：`data-shock` 或 `news-explainer` + stats templates + chart/counter Catalog candidates。

## 常见失败和处理

- 缺 `DESIGN_TOKENS.md`：先重建设计令牌，不要 build。
- 缺 `meta.json`：不能 preview/render，先 build 或修 runtime 输出。
- `interventionContext.blockers` 非空：按推荐命令修复，不要跳步。
- `recurringRisks` 出现：说明同类问题至少出现三次，不能进入客户 handoff。
- 用户看不懂：先更新 `HUMAN.md`，再继续技术工作。

## 测试结论模板

```text
项目：
版本：
总分：
是否可进入客户试用：
P0/P1：
最强能力：
最大风险：
下一步：
小白总结：
```
