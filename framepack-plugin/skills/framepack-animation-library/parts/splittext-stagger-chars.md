---
name: splittext-stagger-chars
title: "逐字交错进场 · SplitText Char Stagger"
type: part
category: text
gsap_version: "3.13+"
requires_plugin: "SplitText (现已免费，npm install gsap)"
used_by: ["[[blocks/kinetic-caption-burst]]", "[[blocks/cta-impact-card]]"]
---

# SplitText Char Stagger

> **一句话**：文字逐字交错飞入，每个字独立动画。
>
> **⚠️ HyperFrames 关键**：SplitText 在 setup 阶段拆分 DOM，渲染时不再修改 DOM 结构。拆分后的 `.char` 元素是静态的，GSAP 只操作 transform/opacity。

## 参数

```yaml
parameters:
  split_type:
    type: enum
    options: [chars, words, lines, chars_words]
    default: chars

  direction:
    type: enum
    options: [up, down, left, right, random]
    default: up

  stagger_amount:
    type: float
    range: [0.01, 0.08]
    default: 0.03

  travel_distance:
    type: float
    default: 30

  rotation:
    type: float
    range: [-45, 45]
    default: 0
    note: "初始旋转角度。0=不旋转"

  duration:
    type: float
    default: 0.5
```

## 代码

> ⚠️ 完整实现: `references/splittext-stagger-chars.js`

```js
function splitTextStagger(tl, textEl, opts = {}, position = '>') {
  const { splitType = 'chars', direction = 'up',
          staggerAmount = 0.03, travelDistance = 30,
          rotation = 0, duration = 0.5 } = opts;

  // SplitText 在 setup 阶段执行（不在渲染时）
  const split = SplitText.create(textEl, { type: splitType });
  const elements = split[splitType]; // .chars or .words

  const dirMap = {
    up:    { y: travelDistance, x: 0 },
    down:  { y: -travelDistance, x: 0 },
    left:  { x: travelDistance, y: 0 },
    right: { x: -travelDistance, y: 0 },
  };
  const from = dirMap[direction] || dirMap.up;
  from.opacity = 0;
  if (rotation) from.rotation = rotation;

  tl.fromTo(elements, from,
    { y: 0, x: 0, opacity: 1, rotation: 0,
      duration, stagger: staggerAmount, ease: 'back.out(1.2)' },
    position
  );

  return { tl, split }; // 返回 split 以便 cleanup
}
```

## HyperFrames 规则

- ✅ SplitText 在 setup 阶段调用一次，不在渲染循环中
- ✅ `.char` 元素创建后不再增减——DOM 结构确定
- ✅ timeline 注册到 `window.__timelines`
- ⚠️ `direction: random` 不可用——改用预设的 stagger `from: "random"` 替代（确定性 seed）
- ⚠️ SplitText 拆分后需在场景卸载时 `split.revert()`

## 注意事项

- 中文按字符拆分正常（SplitText 支持 CJK）
- 大量文字（>200 字）拆分会创建大量 DOM 节点，性能下降
- 配合 [[parts/bg-blur-mask]] 聚焦文字效果更佳
