---
name: typewriter-cursor
title: "打字机光标 · Typewriter Cursor"
type: part
category: text
gsap_version: "3.x"
used_by: ["[[blocks/kinetic-caption-burst]]", "[[blocks/hero-3d-device-spin]]"]
source: "nexu-io/html-anything vfx-text-cursor — 改写为 GSAP 确定性版本"
---

# Typewriter Cursor

> **一句话**：文字逐字"打出来"，光标闪烁 + 彩色像散残影。视频开场揭示金句的神器。

## 参数

```yaml
parameters:
  text:
    type: string
    description: "要逐字揭示的文字"

  char_interval:
    type: float
    default: 0.08
    range: [0.04, 0.15]
    note: "每个字符的间隔（秒）"

  cursor_char:
    type: string
    default: "▍"
    note: "光标形状"

  cursor_color:
    type: css_color
    default: "#ff3b6f"
    note: "光标颜色。推荐 hot pink #ff3b6f / cyan #00d4ff / amber #ffb547"

  chromatic_pair:
    type: array
    default: ["#ff3b6f", "#00d4ff"]
    note: "像散双色——不要超过 2 个色"

  chromatic_duration:
    type: float
    default: 0.2
    note: "像散残影持续多久"

  reveal_ease:
    type: string
    default: "steps(1)"
    note: "逐字 = steps(1)，不需要插值"

  shimmer_at_end:
    type: bool
    default: true
    note: "打完字后是否有光带横扫"
```

## 代码

```js
function typewriterCursor(tl, container, opts = {}) {
  const { text = '', charInterval = 0.08, cursorChar = '▍',
          cursorColor = '#ff3b6f', chromaticPair = ['#ff3b6f', '#00d4ff'],
          chromaticDuration = 0.2, shimmerAtEnd = true } = opts;

  const chars = text.split('');
  const textEl = document.createElement('div');
  textEl.className = 'typewriter-text';
  textEl.style.cssText = 'font-family:Inter Tight,Noto Sans SC,sans-serif;font-weight:700;font-size:6vw;color:#f5f5f7;text-align:center;';

  const cursorEl = document.createElement('span');
  cursorEl.className = 'typewriter-cursor';
  cursorEl.style.cssText = `display:inline-block;width:3px;height:1em;background:${cursorColor};margin-left:2px;vertical-align:middle;`;

  container.appendChild(textEl);
  textEl.appendChild(cursorEl);

  // 确定性的闪烁 pattern（不用 setInterval）
  const blinkPattern = [1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0]; // 14 帧，7 次闪烁
  let blinkFrame = 0;

  // 逐字揭示（每个字符一个 tween）
  chars.forEach((ch, i) => {
    const span = document.createElement('span');
    span.textContent = ch;
    span.style.cssText = 'opacity:0;display:inline;';
    textEl.insertBefore(span, cursorEl);

    tl.to(span, {
      opacity: 1,
      duration: 0.01,
      ease: 'steps(1)'
    }, `>+${charInterval}`);

    // 像散残影
    tl.to(span, {
      textShadow: `2px 0 ${chromaticPair[0]}, -2px 0 ${chromaticPair[1]}`,
      duration: 0.01
    }, '<');
    tl.to(span, {
      textShadow: '0 0 0 transparent',
      duration: chromaticDuration
    }, '<');
  });

  // 光标闪烁
  const totalFlashes = Math.ceil(chars.length * charInterval / 0.5);
  for (let f = 0; f < totalFlashes; f++) {
    if (blinkPattern[f % blinkPattern.length]) {
      tl.to(cursorEl, { opacity: 1, duration: 0.01 }, '>');
    } else {
      tl.to(cursorEl, { opacity: 0, duration: 0.01 }, '>');
    }
  }

  // 打完字后：光标消失 + shimmer sweep
  if (shimmerAtEnd) {
    tl.to(cursorEl, { opacity: 0, duration: 0.3 }, '>');
    // shimmer: 白色 overlay 从左到右扫一次
    const shimmer = document.createElement('div');
    shimmer.style.cssText = [
      'position:absolute;top:0;left:0;width:100%;height:100%',
      'background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.15) 50%,transparent 100%)',
      'pointer-events:none'
    ].join(';');
    container.appendChild(shimmer);
    tl.fromTo(shimmer, { x: '-100%' }, { x: '100%', duration: 0.5, ease: 'power2.inOut' }, '>');
  }

  return { tl, textEl, cursorEl };
}
```

## HyperFrames 注意

- ✅ 逐字揭示用 `steps(1)`，每个字符在特定时间戳瞬时出现——完全确定
- ✅ 光标闪烁用预设 pattern 数组，不用 `Math.random()` 或 `setInterval`
- ⚠️ `text-shadow` 逐字动画在 Chromium 中流畅，大量字符（>100）可能帧率下降
- ⚠️ cssText inline style 是确定性的——不依赖外部 CSS 文件动态加载
