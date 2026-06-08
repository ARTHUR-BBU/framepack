---
name: glitch-flicker
title: "故障闪烁 · Glitch Flicker"
type: part
category: text
gsap_version: "3.x"
used_by: ["[[blocks/cta-impact-card]]"]
---

# Glitch Flicker

> **一句话**：文字间歇性"故障"——短促变色+偏移，像 CRT 屏幕干扰。科技/游戏视频必备。
>
> **源自 GSAP CodePen 社区最常用的 glitch text 模式**，改写为 HyperFrames 确定性版本。

## 参数

```yaml
parameters:
  flicker_count:
    type: int
    default: 3
    range: [1, 8]
    note: "闪烁次数。不是 Math.random()，是预设节奏"

  intensity:
    type: enum
    options: [subtle, medium, heavy]
    default: medium

  colors:
    type: array
    default: ["#0ff", "#f0f", "#fff"]
    note: "闪烁时的颜色序列"
```

## 代码

> ⚠️ 完整: `references/glitch-flicker.js`

```js
function glitchFlicker(tl, el, opts = {}, position = '>') {
  const { flickerCount = 3, intensity = 'medium' } = opts;
  const colors = opts.colors || ['#0ff', '#f0f', '#fff'];

  const flickerDuration = { subtle: 0.08, medium: 0.06, heavy: 0.04 }[intensity];
  const gapDuration = { subtle: 0.25, medium: 0.18, heavy: 0.10 }[intensity];
  const shiftDistance = { subtle: 2, medium: 5, heavy: 10 }[intensity];

  // 确定性的闪烁序列——用预设 pattern 替 Math.random()
  const flickerPatterns = [
    [[1, 0], [-2, 1], [3, 2]],          // pattern A
    [[-2, 1], [0, 2], [2, 0]],           // pattern B
    [[1, 2], [-1, 0], [0, 1]],           // pattern C
  ];
  const pattern = flickerPatterns[flickerCount - 1] || flickerPatterns[0];

  pattern.forEach(([xShift, colorIdx], i) => {
    tl.to(el, {
      x: xShift * shiftDistance,
      color: colors[colorIdx],
      textShadow: `${-xShift * 2}px 0 ${colors[colorIdx]}`,
      duration: flickerDuration,
      ease: 'steps(1)'
    }, position + (i > 0 ? `+=${gapDuration}` : ''));
  });

  // 恢复
  tl.to(el, { x: 0, color: '', textShadow: '', duration: 0.1, ease: 'power2.out' });

  return tl;
}
```

## HyperFrames 注意

- ✅ 使用预设 flicker pattern 替代 `Math.random()`
- ✅ `ease: 'steps(1)'` 确保帧内瞬切（无插值），值在时间戳上是确定的
- ⚠️ `textShadow` 在 HyperFrames 中渲染正常，但大量 shadow 可能影响性能
