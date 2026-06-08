# Framepack 中文说明

Framepack 服务的是 **面向 HyperFrames 程式化商业视频创意与编排**。

换成小白话：它是给 agent 用的商业视频创意武器库和编排工作台，主要服务 HyperFrames。现在 v0.7 是一个 **Hermes Agent Plugin**——寄生在 agent 身体里的"器官"。

一句话：

> Framepack 不做导演。agent 是导演；Framepack 是导演顾问、制片、武器库管理员和 HyperFrames 质检官。

它不替 agent 想创意，也不假装一键生成好视频。它更像一个懂行的制片办公室：把模板、活动宣传片节奏、设计参考、动效语汇、技术库、参考视频反推、下载缓存、二创组合、成品模板沉淀和渲染检查都管理起来。

## 架构大转弯（v0.7）

v0.6 时代，Framepack 是一个 CLI 工具——agent 像打电话一样主动调用它。v0.7 时代，Framepack 是一个**寄生 Plugin**——它住在 agent 的身体里，监视 agent 的每一次工具调用，在关键时刻"借脑"注入建议。

```text
v0.6（旧）：CLI + MCP — agent 主动调用 Framepack
v0.7（新）：Hermes Plugin — Framepack 主动向 agent 注入反馈
```

类比：v0.6 是"外卖电话"——你饿了叫外卖，Framepack 给你送饭。v0.7 是"器官移植"——Framepack 直接接入你的神经，你拿起筷子的时候它已经在提醒你"这个菜太烫了先吹一下"。

## Plugin 架构

```
Hermes Agent Loop（agent 的神经中枢）
  └── Plugin hooks（两个钩子函数）
        ├── 🚨 pre_tool_call  → index.html 写入前拦截
        ├── 📋 post_tool_call → STORYBOARD.md 结构分析（LLM 借脑）
        ├── 🎬 post_tool_call → COMPOSITION.md 模板审查（LLM 借脑）
        ├── 🔍 post_tool_call → index.html 正则审计（零 token）
        ├── 🔫 post_tool_call → arsenal.json 武器验证
        └── 🧬 post_tool_call → VIDEO_DNA.md / TEMPLATE_BLUEPRINT.md 结构检查
      └── Skills（6 个知识库，注入 LLM 调用）
        ├── framepack-director（导演指南）
        ├── framepack-template-fuser（模板匹配引擎）
        ├── framepack-hyperframes-builder（渲染安全规则）
        ├── framepack-arsenal（武器目录）
        ├── framepack-gsap（GSAP 动画引擎）
        └── framepack-reference-miner（参考视频反推）
```

## 安装

### v0.7 — Hermes Plugin

```bash
# 复制到 Hermes plugins 目录
cp -r framepack-plugin ~/.hermes/plugins/framepack

# 启用并重启
hermes plugins enable framepack
# 重启 Hermes
```

### v0.6 — CLI（旧版，保留兼容）

```bash
npm install framepack
```

## 小白类比

agent 是导演，Framepack 是制片办公室加器材库。它不抢导演的椅子，但它会把分镜参考、灯光方案、器材、素材清单、历史成功案例和验收清单准备好。

现在 v0.7 的比喻更准确：agent 是司机，Framepack 是副驾驶座上的导航仪——你不用低头操作，它自己会在你接近路口时说"前面左转"。

## Framepack 管什么

- **模板路线**：活动宣传片、SaaS 发布、课程推广、数据/新闻解释、游戏广告、体育集锦、转会官宣、球员致敬。
- **Storyboard**：`STORYBOARD.md` 先把创意主线说清楚，再进入代码。
- **武器库**：`.framepack/arsenal.json` 记录项目用到的武器、候选资源、二创组合。
- **参考反推**：`VIDEO_DNA.md` 和 `TEMPLATE_BLUEPRINT.md` 把参考视频或成品视频变成可复用结构。
- **设计参考**：精选视觉系统，给 agent 具体的颜色、字体、间距、节奏语言。
- **动效配方**：GSAP 安全模式，可改编，不盲抄。
- **可信资源**：注册来源可缓存，搜索结果只当候选。
- **HyperFrames 质检**：首帧可见、场景切换用 `tl.set()`、禁止随机渲染时间线、`window.__timelines` 已注册。

## 工作台文件

```text
FRAMEPACK.md              agent 入口
HUMAN.md                  人类可读摘要
ASSETS.md                 用户素材
ASSET_GAPS.md             缺失或可选素材
STORYBOARD.md             agent 创意主线
STYLE.md                  视觉和动效风格
DESIGN.md                 匹配的设计参考
DESIGN_TOKENS.md          可执行的颜色和字体
DIRECTION.md              创意方向和选项
COMPOSITION.md            HyperFrames 编排计划
ITERATIONS.md             反馈和修改历史
index.html                HyperFrames 安全脚手架
meta.json                 运行时元数据
VIDEO_DNA.md              参考视频结构分析
TEMPLATE_BLUEPRINT.md     从 DNA 派生的可复用模板
.framepack/arsenal.json   项目武器清单
.framepack/content-graph.json
.framepack/state.json
```

## 开发

```bash
# Plugin 测试（Python）
cd framepack-plugin
python -m pytest tests/ -q

# 旧版 CLI 测试（TypeScript）
npm test
npm run build
```

127/127 Plugin 测试通过，221/221 CLI 测试通过。

## License

MIT