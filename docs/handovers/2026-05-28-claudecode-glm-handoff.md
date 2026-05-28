# Framepack Claude Code / GLM 接手交接

交接时间：2026-05-28

当前仓库：`F:\hyperframes`

当前分支：`framepack-agent-platform`

当前 npm 公开线：`framepack@latest = 0.5.0-alpha.8`，`framepack@alpha = 0.5.0-alpha.8`，`framepack@beta = 0.4.0-beta.2`

## 一句话目标

Framepack 0.5 已经从 0.4 的重型 Agent Harness 切换成轻量的 HyperFrames 创意工作台。接手者不要被历史协议和旧目录带偏，下一阶段要围绕真实用户测试反馈，把 Framepack 做成“外行用户用自然语言 + 素材 + 参考视频，也能让 Claude Code/Codex 产出专业 HyperFrames 视频方案和可迭代项目”的产品。

## 小白版说明

这个项目不是视频软件本体，也不是图像/视频生成模型。它更像一个给 coding agent 用的“专业视频导演工作台”：用户说“我要高级一点、动感一点、商务一点、像这个参考视频”，Framepack 负责把这些模糊话翻译成清晰的文件、模板建议、素材清单、镜头结构、动效方向和 HyperFrames 执行提示。Claude Code 或 Codex 再根据这些文件继续写代码、接入模板、调试渲染、迭代修改。

## 接手前先读

只读这些，别先钻进全部历史文档：

1. `README.md`
2. `README.zh-CN.md`
3. `docs/rebirth/framepack-0.5-charter.md`
4. `CHANGELOG.md` 的 `0.5.0-alpha.1` 到 `0.5.0-alpha.8`
5. `src/workbench/index.ts`
6. `src/workbench/template-market.ts`
7. `src/workbench/hyperframes-prompt-templates.ts`
8. `src/workbench/hyperframes-catalog.ts`
9. `src/agent/init-agent.ts`
10. `src/interfaces/cli/index.ts`
11. `scripts/run-tests.mjs`

旧的 0.4 文档在 `docs/agent-platform/`，只能作为知识库参考，不要把 0.4 的大协议重新搬回 0.5 公共产品。

## 当前产品形态

Framepack 0.5 的主路径是：

```text
用户想法/素材/参考 -> framepack create -> 5 个核心 Markdown + hidden state
-> Claude Code/Codex skills 读取工作台
-> 选择模板/Prompt Template/Catalog 组件
-> 生成或修改 HyperFrames composition
-> lint/inspect/snapshot/render
-> ITERATIONS.md 记录修改循环
```

默认工作台文件应该围绕这些核心文档：

- `FRAMEPACK.md`：工作台入口和总体状态
- `ASSETS.md`：用户素材和可用资产
- `DIRECTION.md`：把用户模糊审美翻译成专业创意方向
- `COMPOSITION.md`：模板融合、场景结构、HyperFrames Prompt Template、Catalog 候选
- `ITERATIONS.md`：测试、反馈、修改历史
- `HUMAN.md`：给外行用户看的大白话说明，必须持续保留

隐藏状态：

- `.framepack/state.json`

当前原则：能用 Markdown 工作台表达，就不要先加新的重型协议 JSON。

## 当前已完成的重要能力

### 0.5.0-alpha.8

`framepack init-agent --target claude-code --scope project --force` 会生成真实 Claude Code 项目 skills：

```text
.claude/skills/framepack-director/SKILL.md
.claude/skills/framepack-template-fuser/SKILL.md
.claude/skills/framepack-hyperframes-builder/SKILL.md
.claude/skills/framepack-reference-miner/SKILL.md
```

`framepack init-agent --target codex --scope project --force` 会生成 Codex-facing skills：

```text
.framepack/agent/codex/skills/framepack-director/SKILL.md
.framepack/agent/codex/skills/framepack-template-fuser/SKILL.md
.framepack/agent/codex/skills/framepack-hyperframes-builder/SKILL.md
.framepack/agent/codex/skills/framepack-reference-miner/SKILL.md
```

四个 skills 的职责：

- `framepack-director`：模糊创意和审美翻译成专业方向
- `framepack-template-fuser`：把模板、用户素材、用户要求融合成定制 composition 方案
- `framepack-hyperframes-builder`：把 `COMPOSITION.md` 变成 HyperFrames-safe 代码并验证
- `framepack-reference-miner`：把参考视频/成品视频提炼成 `VIDEO_DNA.md` 和 `TEMPLATE_BLUEPRINT.md`

### 0.5.0-alpha.7

已内置 11 个 Open Design 风格的 HyperFrames Prompt Template 蓝图：

- `hyperframes-saas-product-promo-30s`
- `hyperframes-app-showcase-three-phones`
- `hyperframes-product-reveal-minimal`
- `hyperframes-website-to-video-promo`
- `hyperframes-tiktok-karaoke-talking-head`
- `hyperframes-data-bar-chart-race`
- `hyperframes-brand-sizzle-reel`
- `hyperframes-logo-outro-cinematic`
- `hyperframes-social-overlay-stack`
- `hyperframes-money-counter-hype`
- `hyperframes-flight-map-route`

相关文件：

- `src/workbench/hyperframes-prompt-templates.ts`
- `src/workbench/hyperframes-catalog.ts`
- `src/workbench/template-market.ts`

CLI：

```powershell
.\node_modules\.bin\framepack.cmd templates prompt --json
.\node_modules\.bin\framepack.cmd templates prompt recommend --idea "..." --style "..." --format 9:16
```

## 用户最新关注点

用户已经在 Claude Code 真实测试中发现 alpha.7 的问题：四个“角色”只是写在 `CLAUDE.md` 和 `AGENTS.md` 的文字，不是真正注册成 skills。

alpha.8 已修复这一点。但用户接下来会继续测试，可能会发现：

- skills 是否真能被 Claude Code 自动发现
- `postinstall` 是否足够可靠
- `create` 输出是否仍然偏“文件多/协议重”
- `HUMAN.md` 是否足够小白
- `COMPOSITION.md` 是否真的有导演感、商业感、动作感、动画感
- Template Market 和 Prompt Template 是否真的能让视频更 polished
- 生成的 HyperFrames 方案是否能直接进入真实渲染迭代

收到测试反馈时，不要先辩解，先复现、定位、做最小有效修复。

## 关键产品判断

### 不要回到 0.4 的重型路线

0.4 的思想有价值：MCP、Agent Harness、Capability Atlas、Asset Forge、Release Gate。但 0.5 的公开产品必须轻：

- 不默认输出一堆用户看不懂的 JSON
- 不把用户拉进复杂协议
- 不把 Framepack 伪装成完整视频引擎
- 不把模板/组件/skill 选择暴露成专家门槛

### Framepack 真正要解决的问题

外行用户通常不会说：

```text
请帮我使用某个动画库、某个 HyperFrames block、某个 Remotion template。
```

他们会说：

```text
高级一点，商务一点，动感一点，文字大一点，节奏快一点，像这个视频，更有冲击力。
```

Framepack 的核心价值就是把这些话翻译成：

- 视频结构
- 镜头节奏
- 视觉层级
- 动效语言
- 模板路线
- Catalog/组件候选
- 技术实现边界
- 验收标准
- 给用户看的确认摘要

### 模板市场是战略能力

Template Market 不是装饰功能。长期应该形成可扩展生态：

- 官方模板
- 社区模板
- 用户沉淀模板
- 付费模板
- 从参考视频反向沉淀的模板

HyperFrames 官方 catalog 的 `block/component` 思路可以借鉴。Framepack Template Market 可以用更面向视频导演的分类：

- `template`：完整视频结构模板
- `pattern`：可复用叙事/镜头模式
- `scene`：单段场景模板
- `motion-language`：动效语言包
- `reference-dna`：从参考视频提炼的结构 DNA
- `composition-blueprint`：可被 agent 融合成代码的工程蓝图

当前不要急着做远程市场和支付系统，先把本地 registry、格式、推荐、融合质量做扎实。

## 必须保留的工作流习惯

### 面向用户的“小白总结”

每轮功能或修复结束，必须给用户一个大白话总结：

- 这一轮编号或版本
- 改了什么
- 为什么这对真实用户重要
- 当前离可测试/可发布还有几步
- 用户下一步怎么测

工作台内部也要让 `HUMAN.md` 负责这个角色。

### 面向 agent 的文件按需披露

不要让用户或 agent 一上来读一堆历史文档。Claude Code 接手测试项目时，优先看：

1. `CLAUDE.md`
2. `.claude/skills/*/SKILL.md`
3. 工作台里的 `FRAMEPACK.md`
4. `HUMAN.md`
5. `DIRECTION.md`
6. `COMPOSITION.md`
7. `ITERATIONS.md`

### 测试反馈优先级

优先级从高到低：

1. 安装失败、命令不可用、版本不对
2. skills/MCP 没有被 agent 发现或不会用
3. `create` 产物无法指导真实 HyperFrames 工作
4. 文档误导用户或 agent
5. 创意质量不够专业、不够惊艳
6. 模板/组件推荐不准确
7. 内部结构优化

## 常用开发命令

本地验证：

```powershell
npm run typecheck
npm test
npm run build
npm pack --dry-run --json
```

发布前强门：

```powershell
npm run release:gate
```

真实安装测试建议不要过度依赖 `npx` 缓存，优先用临时空项目：

```powershell
$d = Join-Path $env:TEMP ("framepack-install-smoke-" + [guid]::NewGuid())
New-Item -ItemType Directory -Force -Path $d | Out-Null
Set-Location $d
npm init -y | Out-Null
npm install framepack@latest --no-audit --no-fund
.\node_modules\.bin\framepack.cmd --version
.\node_modules\.bin\framepack.cmd init-agent --target claude-code --scope project --force
.\node_modules\.bin\framepack.cmd create --idea "一个高端、动感、商务感强的课程宣传视频" --assets . --output-dir .\out --project-name test-video --style "premium dynamic business fast bigger text" --format 9:16
.\node_modules\.bin\framepack.cmd workbench brief --project-dir .\out\test-video
```

Claude Code 用户测试建议：

```powershell
npm install framepack@latest --no-audit --no-fund
.\node_modules\.bin\framepack.cmd --version
.\node_modules\.bin\framepack.cmd init-agent --target claude-code --scope project --force
.\node_modules\.bin\framepack.cmd templates prompt --json
.\node_modules\.bin\framepack.cmd create --idea "一个高端、动感、商务感强的课程宣传视频" --assets .\assets --output-dir .\out --project-name test-video --style "premium dynamic business fast bigger text" --format 9:16
.\node_modules\.bin\framepack.cmd workbench brief --project-dir .\out\test-video
```

## 发布流程

发布新 alpha 时：

1. 更新 `package.json` version
2. 更新 `src/interfaces/cli/index.ts` 的 `FRAMEPACK_CLI_VERSION`
3. 更新 `CHANGELOG.md`
4. 必要时更新 `README.md`、`README.zh-CN.md`
5. 跑验证：

```powershell
npm run typecheck
npm test
npm run build
npm pack --dry-run --json
```

6. 提交 git：

```powershell
git status --short --branch
git add <changed-files>
git commit -m "feat: ..."
```

7. 推 GitHub。当前机器 GitHub HTTPS 需要代理，使用：

```powershell
git -c http.proxy=http://127.0.0.1:59527 -c https.proxy=http://127.0.0.1:59527 push origin framepack-agent-platform
```

8. 发布 npm：

```powershell
npm publish --tag alpha
npm dist-tag add framepack@<version> latest
npm view framepack version dist-tags --json
```

9. 做真实安装测试。

不要用 `beta` tag 发布 0.5 alpha。当前 `beta` 保留给 `0.4.0-beta.2`。

## 已踩过的坑

### npm README

npm registry 不能直接显示单独的 `README.zh-CN.md` URL。`https://www.npmjs.com/package/README.zh-CN.md` 404 是正常的，因为 npm 包页面只渲染包的 readme。解决方向是把中文快速说明放进根 `README.md` 或 `package.json.readme`。

### npx / npm exec 缓存

用户机器曾出现 `D:/openclaw-cache/_npx` 执行链路异常。这个目录已经清过，用户说自己不用 OpenClaw。后续验证优先用临时项目 `npm install framepack@latest`，少用全局 npx 缓存路径判断产品是否正常。

### PowerShell 搜索

当前机器 `rg.exe` 可能报 `Access is denied`。这不是 Framepack 代码问题。可用：

```powershell
Get-ChildItem -Recurse -File | Select-String -Pattern "keyword"
```

### 中文乱码

PowerShell 有时显示中文文件 mojibake。不要误判文件损坏。必要时用 Node UTF-8 读取。

### GitHub 推送

SSH 未配置。HTTPS 直连可能失败。使用上面的 127.0.0.1:59527 代理参数。

### 子代理/预算

用户明确要求可以组织 subagents，但不能无节制。原则：

- 独立且并行的任务才开
- 文档检索、测试分析、代码审查可以分
- 版本发布、文件写入、npm publish 不要并行
- 每次开 subagent 都要有明确输入、输出和截止条件

## 下一轮建议目标

建议版本：`0.5.0-alpha.9`

主题：真实 Claude Code 测试反馈修复与 skill 可用性闭环。

建议范围：

1. 复现用户最新 Claude Code 测试问题
2. 检查 `.claude/skills` 是否符合 Claude Code 当前项目 skill 发现规则
3. 如果 Claude Code 更偏好用户级 skills 或不同目录结构，提供明确可选安装路径，但不要破坏项目级默认
4. 提升 `init-agent` 输出，让用户一眼看到“装了哪些 skills、下一句该怎么对 Claude Code 说”
5. 确保 `create` 产物里的 `HUMAN.md`、`DIRECTION.md`、`COMPOSITION.md` 能支撑外行用户确认
6. 增加回归测试：skills 文件存在、frontmatter 正确、README/CLAUDE 文案不再把 skill 写成纯角色
7. 发布 alpha.9 并做真实安装测试

如果用户的测试反馈证明 alpha.8 已解决 skill 注册问题，下一主题应转向：

```text
TEMPLATE-FUSION-QUALITY-01
```

目标是让 `COMPOSITION.md` 更像专业导演和编舞的方案，而不是普通需求文档。重点增强：

- hook 设计
- 镜头节奏
- 文字层级
- 动效语言
- 商务/激情/惊艳的翻译规则
- HyperFrames Catalog 组件组合建议
- 验收标准

## 代码修改原则

- 不要为了“架构正确”加胖代码
- 不要把 0.4 JSON 协议搬回 0.5 create 默认输出
- 不要引入远程市场、支付、自动下载模板等大功能，除非用户明确确认
- 优先把已有 registry、skills、Markdown 输出做好
- 修改前先加或定位测试
- 每次发布必须真实安装验证
- 每轮结束必须提交 git，用户经常要求“休息前提交”

## 接手者第一条建议执行命令

```powershell
git status --short --branch
npm view framepack version dist-tags --json
npm run typecheck
npm test
```

如果用户已经给出新的测试反馈文件，先读反馈文件，不要直接改代码。

## 给接手 agent 的工作态度

这个项目当前最大风险不是“代码没写够”，而是重新变成一个虚胖工程。用户已经明确要“完整切割旧 Framepack”，做轻量、实用、漂亮、面向真实 creative workflow 的新 Framepack。

真正的产品判断标准：

- 外行用户看得懂
- Claude Code/Codex 知道怎么接着做
- HyperFrames 能吃到清晰、高质量、可执行的 composition 方案
- 模板、Catalog、skills 真的提升作品 polish
- 每轮修改都能进入测试、发布、反馈循环

