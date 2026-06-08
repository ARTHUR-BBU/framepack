---
name: number-count-up
title: "数字跳动 · Number Count Up"
type: part
category: text
gsap_version: "3.x"
used_by: ["[[blocks/data-panel-expand]]", "[[blocks/cta-impact-card]]"]
---

# Number Count Up

> **一句话**：数字从 0 跳动到目标值，如 "$10,000+"、"4.9★"。数据视频的标配武器。

## 参数

```yaml
parameters:
  target_value:
    type: number
    description: "最终显示的数字"

  prefix:
    type: string
    default: ""
    example: "$", "€", "↑"

  suffix:
    type: string
    default: ""
    example: "+", "%", "★", "M"

  decimals:
    type: int
    default: 0

  duration:
    type: float
    default: 1.5

  ease:
    type: string
    default: "power2.out"
    note: "数字跳动用 power2.out 或 sine.out 最自然"

  snap:
    type: string
    default: null
    note: "GSAP snap 参数。'0.1'=保留1位小数，'1'=整数跳动"
```

## 代码

```js
function numberCountUp(tl, el, opts = {}, position = '>') {
  const { targetValue = 100, prefix = '', suffix = '',
          decimals = 0, duration = 1.5, ease = 'power2.out' } = opts;

  const obj = { val: 0 };
  const snapVal = decimals > 0 ? (1 / Math.pow(10, decimals)).toString() : '1';

  tl.to(obj, {
    val: targetValue,
    duration,
    ease,
    snap: { val: parseFloat(snapVal) },
    onUpdate: () => {
      el.textContent = `${prefix}${obj.val.toFixed(decimals)}${suffix}`;
    }
  }, position);

  return tl;
}
```

## HyperFrames 注意

- ✅ 使用 GSAP `snap` 确保每一步都是确定性的
- ✅ `onUpdate` 回调在 HyperFrames 中正常触发（每个渲染帧一次）
- ⚠️ 不要在 `onUpdate` 中修改 DOM 结构，只改 `textContent` 和 CSS
