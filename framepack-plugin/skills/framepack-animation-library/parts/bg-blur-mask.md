---
name: bg-blur-mask
title: "背景模糊遮罩 · Background Blur Mask"
type: part
category: background
gsap_version: "3.x"
used_by: ["[[blocks/card-cascade-reveal]]", "[[blocks/hero-3d-device-spin]]", "[[blocks/cta-impact-card]]"]
---

# Background Blur Mask

> **一句话**：背景逐渐模糊+变暗，聚光灯效果。
>
> **不是简单 overlay**——保留空间感但把注意力拉回前景。

## 参数

```yaml
parameters:
  blur_amount:     { type: css,    default: "8px" }
  darken_opacity:  { type: float,  range: [0,0.6], default: 0.3 }
  duration:        { type: float,  default: 0.4 }
  curve:           { type: string, default: "power2.inOut" }
```

- **blur_amount**: `backdrop-filter: blur()` 值。越大越梦幻
- **darken_opacity**: 0=不压暗，0.6=很暗
- **curve**: 与前景动画节奏匹配

## 代码

> ⚠️ 完整实现: `references/bg-blur-mask.js`

```js
function bgBlurMask(tl, container, opts = {}, position = '<') {
  const { blurAmount = '8px', darkenOpacity = 0.3,
          duration = 0.4, curve = 'power2.inOut' } = opts;
  let mask = container.querySelector('.bg-blur-mask');
  if (!mask) { /* 创建遮罩层，见 references/bg-blur-mask.js */ }
  return tl.to(mask, {
    backdropFilter: `blur(${blurAmount})`,
    backgroundColor: `rgba(0,0,0,${darkenOpacity})`,
    duration, ease: curve
  }, position);
}
```

## 兼容

- `backdrop-filter` 现代浏览器普遍支持
- HyperFrames 用 Chromium 渲染，无兼容问题
