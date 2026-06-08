---
name: svg-morph-transition
title: "SVG 形态过渡 · SVG Morph Transition"
type: part
category: transition
anime_version: "4.x"
used_by: ["[[blocks/logo-reveal-cinematic]]"]
---

# SVG Morph Transition

> **一句话**：一个 SVG 形状平滑变形为另一个形状。anime.js 原生强项。
>
> **不适合 GSAP 版本**：GSAP 需 MorphSVGPlugin（虽已免费但 API 不同）。直接用 anime.js。

## 参数

```yaml
parameters:
  from_path:
    type: svg_path_d_string

  to_path:
    type: svg_path_d_string

  duration:
    type: float
    default: 1.5

  easing:
    type: string
    default: "inOut(4)"
    note: "anime.js easing 语法，不同于 GSAP"

  stagger:
    type: float
    default: 0
    note: "多路径时可错开"
```

## 代码

> ⚠️ `autoplay: false` 是 HyperFrames 关键词

```js
import { animate } from 'animejs';

function svgMorph(el, fromPath, toPath, opts = {}) {
  const { duration = 1.5, easing = 'inOut(4)' } = opts;
  return animate(el, {
    d: [fromPath, toPath],
    duration,
    ease: easing,
    autoplay: false  // ← HyperFrames 手动 seek
  });
}
```

## 常见用途

- Logo 形态变化（圆形 → 品牌图标）
- 图标切换（播放 ▶ → 暂停 ⏸）
- 装饰元素的有机变形
