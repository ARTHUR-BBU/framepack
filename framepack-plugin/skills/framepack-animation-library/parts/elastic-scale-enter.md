---
name: elastic-scale-enter
title: "弹性缩放入场 · Elastic Scale Enter"
type: part
category: entrance
gsap_version: "3.x"
used_by: ["[[blocks/card-cascade-reveal]]", "[[blocks/bento-stagger-reveal]]", "[[blocks/cta-impact-card]]", "[[blocks/logo-reveal-cinematic]]"]
---

# Elastic Scale Enter

> **一句话**：元素从缩小弹跳放大到 100%，像橡皮筋有回弹感。
>
> **视觉感受**：活泼、有生命力。Apple Keynote 图标弹出的感觉。
>
> **不适合**：严肃/悲伤/极简风格——用 `expo.out` 平缓进场。

## 参数

```yaml
parameters:
  from_scale:     { type: float,  range: [0,1],    default: 0.6 }
  bounce_amount:  { type: float,  range: [1.0,1.5], default: 1.15 }
  duration:       { type: float,  range: [0.3,0.8], default: 0.55 }
  ease:           { type: string, default: "back.out(1.4)" }
  apply_to:       { type: enum,   options: [scale_only, scale_and_opacity], default: scale_and_opacity }
```

- **from_scale**: 0=完全消失再弹出，0.6=缩小后弹出
- **bounce_amount**: 1.0=无回弹，1.15=轻微弹跳，1.5=果冻弹跳。通过 ease 的 back.out 参数控制
- **duration**: `elastic.out` 时建议 ≥ 0.8s
- **ease**: `back.out(1.2)`轻度 / `back.out(1.4)`标准 / `back.out(1.7)`明显 / `elastic.out(1,0.5)`弹簧
- **apply_to**: 是否同时处理透明度

## 代码

> ⚠️ 完整实现: `references/elastic-scale-enter.js`

```js
function elasticScaleEnter(tl, targets, opts = {}, position = '>') {
  const { fromScale = 0.6, duration = 0.55, ease = 'back.out(1.4)',
          applyTo = 'scale_and_opacity' } = opts;
  const from = { scale: fromScale, transformOrigin: 'center center' };
  if (applyTo === 'scale_and_opacity') from.opacity = 0;
  const to = { scale: 1, duration, ease, overwrite: 'auto' };
  if (applyTo === 'scale_and_opacity') to.opacity = 1;
  return tl.fromTo(targets, from, to, position);
}
```

## 注意事项

- 容器需有明确的 `width`/`height`，`transformOrigin: center center` 才准
- 配合 `stagger` 串联使用见 [[blocks/card-cascade-reveal#代码]]
