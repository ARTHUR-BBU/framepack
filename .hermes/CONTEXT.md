# hyperframes 开发工程 — 工作交接台

> 新对话打开后，读完本文就能接上。

## 当前阶段
v0.7.12 已通过黑盒验收 (19/19 PASS)，可发布

## 上次结束位置 (2026-06-10)
### 做了什么
- v0.7.12：HyperFrames 深度集成 — 4 skills 重写/新增，8 种 Visual Style，frame.md 规范，Prompt Expansion，Beat Direction，HyperShader 转场，Design Picker
- 路线 B：DOM 结构化 HTML 检查（3 个新 P0），165 测试全通过
- 黑盒验收 19/19 PASS，零 BLOCKER，零 CRITICAL

### 当前版本
- plugin.yaml: 0.7.12
- AGENTS.md: 0.7.12
- README.md / README.zh-CN.md: 0.7.12
- Skills: 8 个
- 单元测试: 165 passed
- HTML 检查: 11 条 (8 regex + 3 structural)

### Skills 清单
1. framepack-director — Visual Style 匹配 + frame.md 生成 + Beat Direction
2. framepack-design-picker — HyperFrames Design Picker 编排
3. framepack-template-fuser — Prompt Expansion + Catalog 映射
4. framepack-hyperframes-builder — 构图规则 + Motion Principles + HyperShader
5. framepack-arsenal — 武器目录
6. framepack-gsap — GSAP 动画引擎
7. framepack-animation-library — GSAP + anime.js 武器
8. framepack-reference-miner — 参考视频反推

### 新增文件 (v0.7.12)
- core/html_parser.py — HTML 结构解析器
- skills/framepack-design-picker/SKILL.md — Design Picker skill
- skills/framepack-director/references/visual-styles.md — 8 种 Visual Style YAML
- skills/framepack-director/references/design-picker-workflow.md — Picker 工作流

## 关键路径
| 用途 | 路径 |
|------|------|
| 开发工程 | F:\hyperframes\framepack-plugin\ |
| Plugin 部署 | F:\Hermes_windows\hermes-agent\plugins\framepack\ |
| 测试工作目录 | F:\Framepack-01-test\ |
| 测试 AGENTS.md | F:\Framepack-01-test\AGENTS.md |
| 测试指南 | F:\Framepack-01-test\TEST-GUIDE-v0.7.12.md |
| 用户文档 | C:\Users\LENOVO\Documents\AI-Coach-Vault\ |

## 部署同步检查清单
每次发版时三方必须对齐：
1. `plugin.yaml` version
2. `AGENTS.md` <!-- version: X.X.XX -->
3. `README.md` / `README.zh-CN.md` 版本号 + Skills 描述
4. 部署 Plugin → HERMES_HOME
5. 同步 AGENTS.md → 测试项目
6. 跑 `python -m pytest tests/ -q -o "addopts="`

## 待办 / 想法池
- [ ] COMPOSITION.md LLM 分析偶尔无响应（easyrouter timeout）
- [ ] Design Picker 实战验证（真的起 HTTP server 跑一遍）
- [ ] frame.md → Prompt Expansion → 自动 lint 闭环
- [ ] HyperFrames Catalog 集成（npx hyperframes add 自动化）
- [ ] 考虑 HyperFrames 自身的 lint/validate/inspect 集成到 Plugin hook
- [ ] 质量门禁自动化：写完 HTML → auto lint → 修复 → re-lint

## 笔记
- 老田喜欢通俗化表达、类比比喻、务实幽默
- "摄影棚 vs 导演"定位：Framepack 是导演，HyperFrames 是摄影棚
- 不造灯，用摄影棚的灯。8 种 Visual Style、Design Picker、Catalog、HyperShader 全是 HyperFrames 的设备
- Plugin 双进程共享同一 HERMES_HOME，部署一次两边生效
- pytest 需 `-o "addopts="`
- CDN 下载走代理: `curl -x http://127.0.0.1:59527`
