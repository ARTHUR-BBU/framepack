---
name: stagger-grid-reveal
title: "网格交错揭示 · Stagger Grid Reveal"
type: part
category: entrance
gsap_version: "3.x"
used_by: ["[[blocks/bento-stagger-reveal]]", "[[blocks/card-cascade-reveal]]"]
---

# Stagger Grid Reveal

> **一句话**：二维网格中的元素按行、列、或从中心向外依次揭示。
>
> **源自 GSAP 官方 `stagger.grid`**——GSAP v3.12+ 内置网格 stagger。

## 参数

```yaml
parameters:
  rows:
    type: int
    default: 3

  cols:
    type: int
    default: 3

  from:
    type: enum
    options: [start, center, end, edges, random]
    default: center
    note: "random 在 HyperFrames 中不可用——改用预设的行列顺序"

  axis:
    type: enum
    options: [rows, cols, both]
    default: both
    note: "stagger 沿哪个轴传播"

  stagger_each:
    type: float
    default: 0.05
    note: "每格之间的延迟"

  animation:
    type: enum
    options: [fade-up, scale-in, flip-in, slide-left]
    default: fade-up
```

## 代码

> ⚠️ 完整实现: `references/stagger-grid-reveal.js`

```js
function staggerGridReveal(tl, container, opts = {}, position = '>') {
  const { rows = 3, cols = 3, from = 'center',
          axis = 'both', staggerEach = 0.05,
          animation = 'fade-up' } = opts;

  // 确保容器有 grid 布局且子元素已知
  const items = container.children;
  if (!items.length) return tl;

  const animMap = {
    'fade-up':    { y: 40, opacity: 0 },
    'scale-in':   { scale: 0.5, opacity: 0 },
    'flip-in':    { rotationX: -90, opacity: 0 },
    'slide-left': { x: -60, opacity: 0 },
  };
  const fromVars = animMap[animation] || animMap['fade-up'];

  tl.fromTo(items, fromVars,
    { y: 0, x: 0, scale: 1, rotationX: 0, opacity: 1,
      duration: 0.5,
      stagger: {
        each: staggerEach,
        grid: [rows, cols],
        from: from,
        axis: axis
      },
      ease: 'back.out(1.2)'
    },
    position
  );

  return tl;
}
```

## HyperFrames 规则

- ✅ `stagger.grid` 是 GSAP 原生功能，确定性计算
- ⚠️ `from: "random"` 在渲染时不可用——GSAP 的 random 使用 Math.random()，结果不重复
- ✅ 改用 `from: "center"` / `"edges`" / `"end"` 等都是确定性的
