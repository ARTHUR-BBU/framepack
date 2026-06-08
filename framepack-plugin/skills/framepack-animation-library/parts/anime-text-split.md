---
name: anime-text-split
title: "Anime.js 文字拆分进场 · Text Split Entrance"
type: part
category: text
anime_version: "4.x"
used_by: ["[[blocks/kinetic-caption-burst]]"]
---

# Anime.js Text Split Entrance

> **一句话**：anime.js 原生的文字逐字动画——比 SplitText 轻，不依赖 GSAP。
>
> **适用场景**：项目已用 anime.js 做其他动画，不想引入 GSAP 只为文字拆分。

## 参数

```yaml
parameters:
  split_by:
    type: enum
    options: [letter, word]
    default: letter

  direction:
    type: enum
    options: [up, down, scale, rotate]
    default: up

  stagger_amount:
    type: float
    default: 40
    note: "anime.js stagger 用毫秒"

  duration:
    type: float
    default: 800
    note: "anime.js duration 用毫秒"
```

## 代码

```js
import { animate, stagger } from 'animejs';

function animeTextSplit(tl, textEl, opts = {}) {
  const { splitBy = 'letter', direction = 'up',
          staggerAmount = 40, duration = 800 } = opts;

  // 预处理：拆文字为 span
  const text = textEl.textContent.trim();
  const unit = splitBy === 'letter' ? text.split('') : text.split(' ');
  textEl.innerHTML = '';

  const spans = unit.map(ch => {
    const span = document.createElement('span');
    span.textContent = ch === ' ' ? '\u00A0' : ch; // 保留空格
    span.style.display = 'inline-block';
    textEl.appendChild(span);
    return span;
  });

  // anime.js 动画
  const dirMap = {
    up:    { translateY: [24, 0], opacity: [0, 1] },
    down:  { translateY: [-24, 0], opacity: [0, 1] },
    scale: { scale: [0, 1], opacity: [0, 1] },
    rotate:{ rotate: ['0.25turn', 0], opacity: [0, 1] },
  };
  const props = dirMap[direction] || dirMap.up;

  return animate(spans, {
    ...props,
    duration,
    delay: stagger(staggerAmount),
    ease: 'out(3)',
    autoplay: false  // ← HyperFrames 关键
  });
}
```

## 与 SplitText 对比

| | anime-text-split | splittext-stagger-chars |
|--|-----------------|------------------------|
| 引擎 | anime.js | GSAP + SplitText |
| 大小 | ~3KB | ~60KB (GSAP) + SplitText |
| 中文 | ✅ 按字符 | ✅ 按字符 |
| 自动 cleanup | ❌ 需手动 | ✅ `revert()` |
