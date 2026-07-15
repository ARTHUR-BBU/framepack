# Framepack

Framepack 是一个**面向 Codex 的编程式视频 Build Studio（导演构建台）**。

它先把需求与本地素材变成可播放、可审片的 HTML/CSS/GSAP 动画样片；每次构建都会冻结成可追溯版本，后续修改不会悄悄覆盖你已看过的样片。你在 Codex 内置浏览器中确认动态效果后，再把**这一版**已确认样片交给 HyperFrames 做最终渲染、音频、配音、字幕与媒体质检。

```text
需求 + 素材 → 导演方向 + 分镜 → 不可变 Build → 快照 + 品味审片
→ 明确批准 / 明确豁免 → HyperFrames lint、check、render、音频、字幕、最终 QA
```

## 当前支持范围

第一版**只支持 Codex**。在 Codex 真实项目闭环被验证稳定前，Hermes 与 Claude Code 不做适配。旧 Hermes 插件只留在 Git 历史中，不再进入新工作树。

## 快速开始

```powershell
npm install
npm run director -- init C:\work\my-preview --aspect 16:9 --duration 30 --title "产品发布"
npm run director -- build C:\work\my-preview
npm run director -- snapshot C:\work\my-preview
npm run director -- audit C:\work\my-preview
npm run director -- approve C:\work\my-preview --reason "已确认样片"
npm run director -- handoff C:\work\my-preview
npm run director:serve -- C:\work\my-preview
```

把最后打印出的本地地址放进 Codex 内置浏览器。Build Studio 只保留三块核心区域：**Builds（版本与证据）**、**Preview（动态样片）**、**Judgment（审片决定）**；创意工作继续留在 Codex 对话中完成。

## 0.2.0 有什么变化

- **不可变 Build**：每次 `build` 都写入 `.framepack/builds/<build-id>/`；`.framepack/current-build.json` 指向 Studio 正在展示的版本。项目根目录的 `index.html` 不再是唯一事实来源。
- **Skill 分类有证据**：Framepack 会记录技能在本次任务中担任导演、制片或技术支持的角色，以及它影响的产物路径与哈希。
- **武器编排不再是一锤子特效**：一个场景可在入场、强调、退场安排多段已验证动作；运动覆盖率报告会在批准前提示“太静”或动作不足的场景。
- **页面更少，但决定更强**：Studio 不重复 Codex 的创意能力，只把版本、预览、证据与人的最终判断做得清楚好用。

## 职责分工

| Framepack | HyperFrames |
| --- | --- |
| 创意方向、分镜、武器编排、不可变 Build、预览证据、品味闸门、交接包 | 技术兼容、lint/check/render、音频、TTS、字幕、媒体 QA、导出与发布 |

技术问题不能豁免；审美问题必须返工，或由用户留下明确豁免理由。交接单始终指向已批准的不可变 Build，系统绝不擅自把“看起来差不多”当作批准。

详见 [Codex 工作台说明](codex-director-workbench.md) 与 [历史资产继承记录](migration/legacy-inheritance.md)。

部署到其他 Codex 环境请看 [Codex 部署说明](codex-deployment.zh-CN.md)。
