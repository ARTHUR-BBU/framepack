---
name: external-sources
title: "外部源地图 · External Sources Index"
type: reference
purpose: "当武器库不够用时的挖矿指南。不是让 Agent 一次全读，是有需求时按关键词查。"
---

# 外部源地图

> **使用原则**：Agent 先查武器库 → 库里没有 → 来这儿查有没有对应源 → 用 `web_search` 搜 → 走 [[SKILL#四步入库流程]]。

## HyperFrames Catalog

```yaml
source: "HyperFrames Official Catalog"
url: "https://hyperframes.mintlify.app/llms.txt"
quality: "★★★★★ — 官方，HyperFrames 原生"
search_hint: "搜索 llms.txt 全文，或在 https://hyperframes.mintlify.app/catalog/blocks/<name> 直接访问"

best_for:
  - "3D 设备展示（vfx-iphone-device, ios26-liquid-glass）"
  - "Shader 转场（whip-pan, cinematic-zoom, flash-through-white, glitch）"
  - "社交媒体卡片（instagram-follow, x-post, yt-lower-third）"
  - "字幕效果（caption-clip-wipe, editorial-emphasis）"

how_to_use:
  install: "npx hyperframes add <name>"
  note: "部分 Block 需要 Chrome flag（html-in-canvas 系列）。渲染时 CLI 自动开启。"
```

## GSAP Skills (GreenSock 官方)

```yaml
source: "GSAP Skills Repository"
url: "https://github.com/greensock/gsap-skills"
quality: "★★★★☆ — GreenSock 官方维护"

available_skills:
  - "gsap-core — 核心 API：to/from/fromTo, stagger, easing"
  - "gsap-timeline — 时间线：sequencing, position 参数"
  - "gsap-plugins — SplitText, Flip, ScrollToPlugin, MorphSVG, Draggable"
  - "gsap-scrolltrigger — ScrollTrigger（HyperFrames 不可用，但可学模式）"

best_for:
  - "SplitText 文字动画模式学习"
  - "Flip 布局过渡模式学习"
  - "Stagger 高级用法（grid, from, axis）"
```

## anime.js Demos

```yaml
source: "freefrontend.com anime.js examples"
url: "https://freefrontend.com/anime-js-examples/"
quality: "★★★☆☆ — 社区整理，质量参差不齐"
note: "约 50+ 效果，大部分可直接用 anime.js 实现。需逐个评估 HyperFrames 兼容性。"

best_for:
  - "SVG morphing 效果"
  - "粒子/有机体动画"
  - "文字逐字动画（anime.js v4 原生支持）"
  - "简单的卡片交错进场"

official_docs: "https://animejs.com/documentation"
```

## GSAP CodePen

```yaml
source: "GSAP CodePen Collections"
url: "https://codepen.io/GreenSock/collections"
quality: "★★★☆☆ — 社区作品，需评估"

best_for:
  - "创意 UI 动画灵感和模式"
  - "复杂 SVG 动画"
  - "鼠标交互效果（需改写为 auto-play 版本）"

search_hint: "在 codepen.io 搜索 'gsap <效果关键字>'"
```

## 社区 HyperFrames 模板

```yaml
source: "社区 HyperFrames 模板"
locations:
  - "https://github.com/heygen-com/hyperframes — 官方 repo 的 docs/guides/"
  - "https://github.com/nexu-io/open-design — 开放设计社区的视频 prompt 模板"
quality: "★★★☆☆"
best_for:
  - "SaaS 产品发布视频结构参考"
  - "完整 HyperFrames 项目结构参考"
```

## 何时不挖矿

```yaml
skip_external_search_when:
  - "效果用现有 Part 组合即可实现 → 用 MOC 的引用关系图查替代方案"
  - "只需一个简单 fade/slide/scale → 直接写 GSAP to/from，不入库"
  - "效果仅此视频用 → 直接写代码，不注册武器"
```
