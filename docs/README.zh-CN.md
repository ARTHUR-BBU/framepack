# Framepack

Framepack 是一个**面向 Codex 的编程式视频导演工作台**。

它先把需求与本地素材变成可播放、可审片的 HTML/CSS/GSAP 动画样片；你在 Codex 内置浏览器中确认动态效果后，再把已经确认的样片交给 HyperFrames 做最终渲染、音频、配音、字幕与媒体质检。

```text
需求 + 素材 → 导演方向 + 分镜 → HTML 样片 → 快照 + 品味审片
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

把最后打印出的本地地址放进 Codex 内置浏览器，即可看到导演台、动态样片、关键帧、审片结论与批准按钮。

## 职责分工

| Framepack | HyperFrames |
| --- | --- |
| 导演方向、分镜、HTML 样片、预览快照、品味闸门、交接包 | lint/check/render、音频、TTS、字幕、媒体 QA、导出与发布 |

技术问题不能豁免；审美问题必须返工，或由用户留下明确豁免理由。系统绝不擅自把“看起来差不多”当作批准。

详见 [Codex 工作台说明](codex-director-workbench.md) 与 [历史资产继承记录](migration/legacy-inheritance.md)。
