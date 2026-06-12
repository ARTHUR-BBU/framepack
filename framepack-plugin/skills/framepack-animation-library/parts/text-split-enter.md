---
name: text-split-enter
title: "文字分裂进场 · Text Split Enter"
type: part
category: text
gsap_version: "3.x"
used_by: ["[[blocks/kinetic-caption-burst]]"]
---

# Text Split Enter

> **一句话**：文字劈成两半或逐字飞入拼合。
>
> **视觉感受**：文字有重量和速度感。信息正在降临的感觉，但快且利落。

## 参数

```yaml
parameters:
  split_mode:        { type: enum,   options: [horizontal, vertical, char], default: horizontal }
  direction:         { type: enum,   options: [inward, outward],           default: inward }
  travel_distance:   { type: css,    default: "40px" }
  stagger_per_char:  { type: float,  range: [0.01,0.06],                  default: 0.03 }
  duration:          { type: float,  default: 0.5 }
  clip_path:         { type: bool,   default: true }
```

- **split_mode**: `horizontal`=左右劈开，`vertical`=上下，`char`=逐字（需 SplitText）
- **direction**: `inward`=从外往内拼合，`outward`=从中间弹开（退场用）
- **clip_path**: `true`=clip-path 裁剪（精确但性能稍低），`false`=translate（快但不精确）

## 代码

> ⚠️ 完整实现: `references/text-split-enter.js`

```js
function textSplitEnter(tl, textEl, opts = {}, position = '>') {
  const { splitMode = 'horizontal', direction = 'inward',
          travelDistance = '40px', duration = 0.5 } = opts;
  if (splitMode === 'horizontal') {
    const half1 = textEl.querySelector('.split-left');
    const half2 = textEl.querySelector('.split-right');
    const sign = direction === 'inward' ? -1 : 1;
    tl.fromTo(half1,
      { x: sign * -parseFloat(travelDistance), opacity: 0 },
      { x: 0, opacity: 1, duration, ease: 'power3.out' }, position);
    tl.fromTo(half2,
      { x: sign * parseFloat(travelDistance), opacity: 0 },
      { x: 0, opacity: 1, duration, ease: 'power3.out' }, position);
  }
  // char mode → 见 references/text-split-enter.js
  return tl;
}
```

## HTML 结构

文字需在 setup 阶段预处理（不在渲染时做）。左右两半必须是**完全相同文字**，用 `clip-path` 各裁一半；`.split-right` 必须绝对定位叠在 `.split-left` 上，不能 inline-block 并排。

```html
<div class="text-split" data-split="horizontal">
  <span class="split-left">Framepack</span>
  <span class="split-right">Framepack</span>
</div>
```

```css
.text-split {
  position: relative;
  display: inline-block;
}
.text-split .split-left,
.text-split .split-right {
  display: inline-block;
  will-change: transform, opacity;
}
.text-split .split-left {
  clip-path: inset(0 50% 0 0);
}
.text-split .split-right {
  position: absolute;
  left: 0;
  top: 0;
  clip-path: inset(0 0 0 50%);
}
```

> 反例：不要把文字拆成 "Frame" + "pack" 两个 span；两个 span 都要写完整 "Framepack"，靠 clip-path 互补拼合。

## 注意

- 中文按字符拆分，不是单词
- 响应式字号用 SplitText 比 clip-path 更稳
- 详细见 `references/text-split-enter.js`
