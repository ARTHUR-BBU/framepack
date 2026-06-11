---
name: library-anime
title: "Anime.js 引擎 · HyperFrames 适配层"
type: library
anime_version: "4.x"
description: >
  anime.js 作为 Framepack 第二动画引擎，与 GSAP 平级。
  v4.0+ 原生 timeline.seek() 支持 HyperFrames 确定性渲染。
---

# library.anime — HyperFrames 适配层

> **anime.js v4.0+ 原生支持 `timeline.seek(time)`，与 GSAP `timeline.seek()` 完全等效。**

## 为什么用 anime.js

| 场景 | 选 anime.js | 选 GSAP |
|------|-----------|---------|
| SVG morphing | ✅ 原生强项 | ⚠️ 需 MorphSVGPlugin |
| 粒子/物理效果 | ✅ stagger + 函数值 | ⚠️ 需手动循环 |
| 轻量需求（<20KB） | ✅ 17KB | ⚠️ 60KB core |
| 复杂序列+插件 | ⚠️ 插件少 | ✅ 插件生态丰富 |
| ScrollTrigger | ❌ 无对应 | ✅ 行业标准 |

## HyperFrames 适配模式

```js
import { createTimeline, animate, utils } from 'animejs';

// ✅ 正确：autoplay: false + seek
const tl = createTimeline({
  autoplay: false,  // ← 关键！HyperFrames 手动控制
  onUpdate: (self) => {
    // HyperFrames 不需要 onUpdate
  }
});

// 在 HyperFrames 帧循环中：
// renderFrame(timestamp) { tl.seek(timestamp); }

// ✅ 正确：用 composition-id 作为 key 注册（不是 push）
// 必须匹配 data-composition-id，HyperFrames 框架通过 key 查找
const compId = "my-scene";  // ← 必须等于 <div data-composition-id="my-scene">
window.__timelines[compId] = { seek: (t) => tl.seek(t) };

// ❌ 错误：autoplay: true（默认值）
// ❌ 错误：loop: true（无限循环，非确定性）
// ❌ 错误：Math.random() 在动画参数中
```

## 哪些 anime.js 效果直接可用

以下来自 freefrontend.com/anime-js-examples/ 的效果无需翻译：

| 效果 | 入库为 | hyperframes 改写 |
|------|--------|-----------------|
| SVG Morphing | [[parts/svg-morph-transition]] | 加 `autoplay:false` |
| Particle Blob | [[parts/particle-blob-bg]] | 去 `Math.random()` 种子 |
| Staggered Grid | [[parts/staggered-grid-reveal]] | 用预设顺序替 `random` |
| Text Split v4 | [[parts/anime-text-split]] | 加 `autoplay:false` |

## 安装

```bash
npm install animejs
# CDN: https://cdn.jsdelivr.net/npm/animejs@4/lib/anime.min.js
```
