---
name: float-3d-card
title: "3D 卡片悬浮 · Float 3D Card"
type: part
category: environment
gsap_version: "3.x"
used_by: ["[[blocks/card-cascade-reveal]]", "[[blocks/hero-3d-device-spin]]"]
---

# Float 3D Card

> **一句话**：卡片在 3D 空间中微微悬浮（缓慢的 Y 轴上下+小幅旋转），营造"高端感"。
>
> **源自 GSAP CodePen 最经典的三层 parallax card 模式**。原版依赖鼠标位置，我们改为 auto-play 版本。

## 参数

```yaml
parameters:
  float_distance:
    type: float
    default: 15
    range: [5, 40]
    note: "Y 轴浮动距离（px）"

  rotation_range:
    type: float
    default: 3
    range: [1, 10]
    note: "X 轴旋转范围（度）"

  duration:
    type: float
    default: 4
    note: "一次浮动周期"

  shadow_depth:
    type: float
    default: 40
    note: "阴影最大偏移"
```

## 代码

```js
function float3DCard(tl, card, opts = {}, position = '>') {
  const { floatDistance = 15, rotationRange = 3,
          duration = 4, shadowDepth = 40 } = opts;

  tl.to(card, {
    y: floatDistance,
    rotationX: rotationRange,
    boxShadow: `0 ${shadowDepth}px ${shadowDepth * 1.5}px rgba(0,0,0,0.2)`,
    duration: duration / 2,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: 1  // ← 确定性：固定 1 次 repeat，不是 -1
  }, position);

  return tl;
}
```

## HyperFrames 注意

- ✅ `yoyo: true` + `repeat: 1` 是确定性的——往返一次后停止
- ⚠️ 如需在整个视频中持续浮动，用多个固定 repeat 的 tween 串联
- ✅ `boxShadow` 动画在 Chromium 中渲染正常
