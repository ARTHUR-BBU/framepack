---
name: gradient-shift
title: "渐变流动 · Gradient Shift"
type: part
category: background
gsap_version: "3.x"
used_by: ["[[blocks/hero-3d-device-spin]]"]

# Gradient Shift

> **一句话**：背景渐变色彩平滑流动——给静态页面加"呼吸感"。科技风视频的底层氛围武器。

## 参数

```yaml
parameters:
  from_colors:
    type: array
    default: ["#667eea", "#764ba2"]
    description: "起始色（可2-4个颜色）"

  to_colors:
    type: array
    default: ["#f093fb", "#f5576c"]
    description: "目标色"

  angle:
    type: float
    default: 135
    range: [0, 360]

  duration:
    type: float
    default: 8
    note: "渐变变化一个周期的时间。建议 6-12s"
```

## 代码

> ⚠️ 完整: `references/gradient-shift.js`

```js
function gradientShift(tl, el, opts = {}, position = '>') {
  const { fromColors = ['#667eea', '#764ba2'],
          toColors = ['#f093fb', '#f5576c'],
          angle = 135, duration = 8 } = opts;

  // 用 CSS 变量 + GSAP 动画 CSS 变量
  const fromStr = fromColors.join(', ');
  const toStr = toColors.join(', ');

  // 设置初始渐变
  gsap.set(el, { '--grad-from': fromStr, '--grad-to': toStr,
    backgroundImage: `linear-gradient(${angle}deg, var(--grad-from))` });

  // 通过修改 CSS 字符串来过渡
  tl.to(el, {
    '--grad-from': toStr,
    '--grad-to': fromStr,
    duration,
    ease: 'sine.inOut',
    repeat: 0,  // ← HyperFrames: no repeat:-1
    onUpdate: function() {
      el.style.backgroundImage =
        `linear-gradient(${angle}deg, ${this.targets()[0].style.getPropertyValue('--grad-from')})`;
    }
  }, position);

  return tl;
}
```

## HyperFrames 注意

- ✅ CSS 变量动画在 HyperFrames 中正常渲染（Chromium 原生支持 `@property` 动画）
- ⚠️ `onUpdate` 中修改 style 是安全的（确定性，不依赖 Math.random）
