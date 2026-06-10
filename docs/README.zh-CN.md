# Framepack

> HyperFrames 程式化商业视频创意与编排顾问。
> **Hermes Agent 插件。**

Framepack 是一个 Hermes Agent 插件，挂载到 Agent 循环中，为 HyperFrames
视频制作提供专业创意指导。Agent 是导演，Framepack 是导演的顾问、制片人、
武器库管理和 HyperFrames 质量门禁。

## 核心理念

```
HyperFrames 是设备齐全的摄影棚。
Framepack 是那个知道什么时候开哪盏灯的导演。
```

HyperFrames 提供设备——8 种视觉风格、Design Picker、52+ Catalog 预制件、
HyperShader 转场、lint/validate/render 管线。Framepack 提供创意智能——
把用户的模糊意图翻译成精确的 HyperFrames 参数，管理可复用武器，
确保每个作品通过渲染安全检查。

用户不需要知道 frame.md、Visual Styles 或 HyperFrames 内部机制。
他们说"高端科技感"，Framepack 翻译成 Data Drift。
他们说"换个颜色"，Framepack 自动更新 frame.md。

## 快速开始

### 前置条件

- [Hermes Agent](https://github.com/nousresearch/hermes-agent) 已安装
- Node.js 18+（用于 HyperFrames CLI）
- Python 3.10+（用于 Plugin hooks）

### 第一步：安装 HyperFrames

```bash
npm install hyperframes
```

### 第二步：安装插件

```bash
cd <你的-hermes-home>/plugins
git clone -b framepack-agent-platform https://github.com/ARTHUR-BBU/framepack.git framepack
```

### 第三步：启用插件

```bash
hermes plugins enable framepack
```

### 第四步：验证

```bash
hermes plugins list
```

你应该看到 `framepack` 状态为 **enabled**，版本为 **0.7.12**。

### 第五步：把 AGENTS.md 放到项目里

把 `AGENTS.md` 复制到任何你想让 Framepack 生效的项目根目录：

```bash
cp <hermes-home>/plugins/framepack/AGENTS.md <你的项目>/AGENTS.md
```

### 第六步：试试看

在项目目录里启动 Hermes 对话，然后说：

> "帮我做一个高端科技感的 AI 产品发布会视频"

Agent（在 Framepack 指导下）应该：
1. 把意图匹配到 **Data Drift** 视觉风格
2. 生成有正确场景结构的分镜
3. 写出符合 HyperFrames 规范的 HTML
4. 通过全部 11 条渲染安全检查

## 架构

```text
Hermes Agent Loop
  └── Plugin hooks（pre_tool_call + post_tool_call）
        ├── 🚨 pre_tool_call  → index.html（写入扫描）
        ├── 📋 post_tool_call → STORYBOARD.md（LLM 分析）
        ├── 🎬 post_tool_call → COMPOSITION.md（LLM 审计）
        ├── 🔍 post_tool_call → index.html（正则 + 结构化检查）
        ├── 🔫 post_tool_call → arsenal.json
        └── 🧬 post_tool_call → VIDEO_DNA.md / TEMPLATE_BLUEPRINT.md
      └── Skills（8 个知识库，注入 LLM 调用）
        ├── framepack-director（意图 → Visual Style + frame.md + 分镜）
        ├── framepack-design-picker（HyperFrames 可视化风格选择器）
        ├── framepack-template-fuser（Prompt Expansion + 模板匹配）
        ├── framepack-hyperframes-builder（构图规则 + 渲染安全）
        ├── framepack-arsenal（武器目录）
        ├── framepack-gsap（GSAP 动画引擎）
        ├── framepack-animation-library（GSAP + anime.js 武器目录）
        └── framepack-reference-miner（参考视频反推）
```

Plugin 在 Agent 写入被监听文件时自动触发。无需手动命令——Plugin 始终在监听。

## Framepack 懂什么

### 8 种视觉风格（来自 HyperFrames）

| 风格 | 感觉 | 适合场景 |
|------|------|----------|
| Swiss Pulse | 精确、临床 | SaaS、数据、开发者工具 |
| Velvet Standard | 高端、永恒 | 奢侈品、企业、峰会 |
| Deconstructed | 工业、原始 | 科技发布、安全产品 |
| Maximalist Type | 大声、动感 | 重大发布、产品上线 |
| Data Drift | 未来感、沉浸 | AI、ML、前沿科技 |
| Soft Signal | 亲切、温暖 | 健康、个人故事、生活方式 |
| Folk Frequency | 文化、鲜明 | 消费品、美食、社区 |
| Shadow Cut | 暗黑、电影感 | 戏剧性揭示、安全、调查 |

### 11 条渲染安全检查

| 检查 | 严重程度 |
|------|----------|
| 首场景 CSS 可见 | P0 |
| 场景 data 属性 | P0 |
| 根容器属性 | P0 |
| video 嵌套在定时容器 | P0 |
| 命令式媒体控制 | P0 |
| meta.json 存在 | P1 |
| Timeline 已注册 | P1 |
| 无 Math.random | P1 |
| 无无限循环 | P1 |
| 无 ScrollTrigger | P1 |
| 无 FLIP 动画 | P2 |

## 更新

Framepack 发新版本时，更新**两处**：

| 内容 | 位置 | 方法 |
|------|------|------|
| Plugin 代码 | `<hermes-home>/plugins/framepack/` | 在插件目录里 `git pull` |
| AGENTS.md | 每个项目根目录 | 从插件复制：`cp <hermes-home>/plugins/framepack/AGENTS.md <项目>/AGENTS.md` |

两处必须版本一致。检查 AGENTS.md 顶部的版本注释：

```html
<!-- version: 0.7.12 — sync with plugin.yaml and README -->
```

## 文档

- [AGENTS.md](../AGENTS.md) — 完整 Agent 指南（Hermes 运行时加载）
- [CHANGELOG.md](../CHANGELOG.md) — 发布历史
- [README.md](../README.md) — English documentation

## 许可证

MIT
