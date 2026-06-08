---
name: caption-clip-wipe
title: "文字擦除进场 · Caption Clip Wipe"
type: part
category: text
gsap_version: "3.x"
used_by: ["[[blocks/kinetic-caption-burst]]"]
---

# Caption Clip Wipe

> **一句话**：文字从左到右被"擦出来"——像有人用布从左往右擦，字才显现。
>
> **源自 HyperFrames Catalog `caption-clip-wipe`**，改用纯 GSAP + CSS clip-path 实现。

## 参数

```yaml
parameters:
  direction:
    type: enum
    options: [left-to-right, right-to-left, top-to-bottom, center-out]
    default: left-to-right

  stagger_per_word:
    type: float
    range: [0.05, 0.25]
    default: 0.1
    note: "多词时每个词的延迟。越大越从容"

  duration_per_word:
    type: float
    default: 0.4

  reveal_color:
    type: css_color
    default: "currentColor"
    note: "擦除线的颜色。'currentColor'=跟文字同色"
```

## 代码

> ⚠️ 完整实现: `references/caption-clip-wipe.js`

```js
function captionClipWipe(tl, textEl, opts = {}, position = '>') {
  const { direction = 'left-to-right', staggerPerWord = 0.1,
          durationPerWord = 0.4 } = opts;

  // 把文字拆成单词（用 span 包裹）
  const words = textEl.querySelectorAll('.word');
  if (!words.length) return tl;

  const clipMap = {
    'left-to-right':  'inset(0 100% 0 0)',
    'right-to-left':  'inset(0 0 0 100%)',
    'top-to-bottom':  'inset(100% 0 0 0)',
    'center-out':     'inset(0 50% 0 50%)'
  };
  const fromClip = clipMap[direction];
  const revealLineColor = opts.revealColor || 'rgba(255,255,255,0.5)';

  words.forEach((word, i) => {
    tl.fromTo(word,
      { clipPath: fromClip, opacity: 0 },
      { clipPath: 'inset(0 0 0 0)', opacity: 1,
        duration: durationPerWord, ease: 'power2.out' },
      position + (i > 0 ? `+=${staggerPerWord}` : '')
    );
  });

  return tl;
}
```

## HTML 预处理

文字需要在 setup 阶段按单词拆分：

```html
<!-- 原始 -->
<h1 class="kinetic-caption">Your pipeline is leaking</h1>

<!-- 预处理后 -->
<h1 class="kinetic-caption">
  <span class="word" style="clip-path: inset(0 100% 0 0)">Your</span>
  <span class="word" style="clip-path: inset(0 100% 0 0)">pipeline</span>
  <span class="word" style="clip-path: inset(0 100% 0 0)">is</span>
  <span class="word" style="clip-path: inset(0 100% 0 0)">leaking</span>
</h1>
```

## 注意事项

- 中文文字按字符拆分，不是单词
- `clip-path` 在中文字体上边缘可能不准——用 `overflow:hidden` 兜底
- 可配合 [[parts/text-split-enter]] 做组合效果：先 split 再 wipe
