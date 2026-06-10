# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。

## 当前阶段
v0.8.0 已发布到 GitHub。定位从"HTML 审计 Plugin"彻底转变为"HyperFrames 的 Prompt Factory"。

## 上次结束位置 (2026-06-10)
### 做了什么
- v0.8.0：Framepack 定位重构 — Prompt Factory for HyperFrames
- 从 6 个 hooks 砍到 2 个（frame.md 质量 + expanded-prompt 质量）
- 从 8 个 skills 砍到 5 个（合并 design-picker/template-fuser/hyperframes-builder 进 director）
- 从 13 个工作台文件砍到 2 个交付物（frame.md + expanded-prompt.md）
- 删除 HTML parser（Framepack 不管 HTML 了）
- 代码从 1509+196 行砍到 413+77 行
- 测试从 165 个重写为 34 个（34/34 passed）
- 已部署到 HERMES_HOME + 测试项目
- 已 push 到 GitHub (447785a)

### 当前状态
- 版本：v0.8.0
- Skills：5（director, animation-library, arsenal, gsap, reference-miner）
- Hooks：2（post: frame.md + expanded-prompt, pre: handoff readiness）
- Tests：34 passed
- 代码量：~500 行 hooks + director skill

### 架构
```
用户意图 → Framepack (frame.md + expanded-prompt.md) → HyperFrames (HTML + render)
```
Framepack 是导演（创意翻译），HyperFrames 是摄影棚（制作执行）。
武器库是字典（Agent 写 HTML 时翻阅），不是自动注入。

## 新对话打开后
1. 读 AGENTS.md 确认版本号
2. 跑 `python -m pytest tests/ -q -o "addopts="`
3. 看测试项目有没有新反馈

## 关键路径
- 开发目录：F:\hyperframes\framepack-plugin\
- 部署目录：F:\Hermes_windows\hermes-agent\plugins\framepack\
- 测试项目：F:\Framepack-01-test\
- Git 分支：framepack-agent-platform
- 远程：https://github.com/ARTHUR-BBU/framepack

## 待办 / 想法池
- [ ] 真实视频项目端到端验证（用 v0.8.0 流程做一个完整视频）
- [ ] frame.md → HyperFrames 的自动 prompt expansion 是否需要 Framepack 自己做还是交给 HyperFrames
- [ ] 武器库在 HTML 阶段的介入方式具体化
- [ ] 更新 framepack-plugin-engineering skill 到 v0.8.0
