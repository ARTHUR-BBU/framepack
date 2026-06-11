---
name: framepack-animation-library
title: "Framepack 武器库 · 完整速查手册"
description: "一站式武器参考 — Agent 一次加载获取全部 24 件武器的参数签名+代码骨架。写 HTML 前必读。"
version: 0.9.0
linked_files:
  parts/references/text-split-enter.js: "文字分裂进场"
  parts/references/elastic-scale-enter.js: "弹性缩放"
  parts/references/bg-blur-mask.js: "背景模糊"
  parts/references/stagger-grid-reveal.js: "网格交错"
  parts/references/typewriter-cursor.js: "打字机"
  parts/references/number-count-up.js: "数字跳动"
  parts/references/glitch-flicker.js: "故障闪烁"
  parts/references/gradient-shift.js: "渐变流动"
  parts/references/particle-blob-bg.js: "粒子blob"
  parts/references/light-leak-cinema.js: "胶片漏光"
  parts/references/float-3d-card.js: "3D悬浮"
  parts/references/splittext-stagger-chars.js: "逐字交错"
  parts/references/caption-clip-wipe.js: "文字擦除"
  parts/references/anime-text-split.js: "anime文字"
  parts/references/macos-notification.js: "通知卡片"
  parts/references/sprite-animation.js: "精灵帧"
  parts/references/svg-morph-transition.js: "SVG变形"
  blocks/references/card-cascade-reveal.js: "卡片翻出"
  blocks/references/hero-3d-device-spin.js: "3D设备"
  blocks/references/sticky-flowchart.js: "便利贴流程图"
  blocks/references/data-chart-editorial.js: "数据图表"
  blocks/references/transitions-pack.js: "转场效果包"
  MOC.md: "武器目录地图"
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [framepack, animation, arsenal, weapons, reference]
    category: creative
---

# Framepack 武器库 · 完整速查手册

> **加载即到手**：Agent 读这个文件一次，拿到全部 24 件武器的参数签名、代码骨架、触发条件。
> 写 HTML 时回到这里查对应武器，复制代码骨架改参数——不是"灵感参考"，是**执行契约**。
>
> **完整 JS 实现**：每件武器的生产代码在 `references/*.js`，可通过 `skill_view(file_path=...)` 按需加载。
>
> **MOC 目录**：`skill_view(file_path='MOC.md')` — 按场景导航（"我要做完整视频" / "我要加炫酷段落" / "我要微调动画"）

---

## 武器类型速览

| 类型 | 数量 | 粒度 | 用法 |
|------|------|------|------|
| **Part** | 17 件 | 0.3-1s 原子效果 | 被 Block 引用或直接调用 |
| **Block** | 5 件 | 4-12s 完整段落 | 独立使用或组装成 Template |
| **Template** | 1 件 | 45-75s 完整视频 | 整桌菜谱 |
| **Library** | 1 件 | 引擎适配 | anime.js 引擎层 |

## 快速匹配表（Agent 查这个决定用什么武器）

| 需要什么效果 | 武器 | 类型 | 引擎 |
|------------|------|------|------|
| 大字炸开 | text-split-enter | part | GSAP |
| 逐字打字 | typewriter-cursor | part | GSAP |
| 逐字飞入 | splittext-stagger-chars | part | GSAP+SplitText |
| 文字擦除 | caption-clip-wipe | part | GSAP |
| 弹性弹入 | elastic-scale-enter | part | GSAP |
| 网格依次揭示 | stagger-grid-reveal | part | GSAP |
| 数字跳动 | number-count-up | part | GSAP |
| 故障闪烁 | glitch-flicker | part | GSAP |
| 背景渐变流动 | gradient-shift | part | GSAP |
| 背景模糊遮罩 | bg-blur-mask | part | GSAP |
| 粒子 blob 背景 | particle-blob-bg | part | anime.js |
| 胶片漏光 | light-leak-cinema | part | GSAP |
| 3D 卡片悬浮 | float-3d-card | part | GSAP |
| macOS 通知卡片 | macos-notification | part | GSAP |
| 精灵帧动画 | sprite-animation | part | GSAP |
| SVG 形态变形 | svg-morph-transition | part | anime.js |
| anime.js 文字拆分 | anime-text-split | part | anime.js |
| 卡片依次翻出 | card-cascade-reveal | block | GSAP |
| 3D 设备旋转 | hero-3d-device-spin | block | GSAP+Three |
| 便利贴流程图 | sticky-flowchart | block | GSAP+SVG |
| 编辑级数据图表 | data-chart-editorial | block | GSAP+SVG |
| 场景转场包 | transitions-pack | block | GSAP |
| SaaS 产品发布 | saas-product-launch | template | GSAP |
| anime.js 引擎适配 | library-anime | library | anime.js |

---

## PARTS — 原子武器（17 件）

### text-split-enter | 文字分裂进场

type: part | cat: text | engine: GSAP 3.x | ref: `parts/references/text-split-enter.js`

一句话：文字劈成两半（或逐字）飞入拼合。视觉：文字有重量和速度感。

```yaml
params:
  split_mode:        { type: enum, options: [horizontal, vertical, char], default: horizontal }
  direction:         { type: enum, options: [inward, outward], default: inward }  # inward=外往内拼合
  travel_distance:   { type: css, default: "40px" }
  stagger_per_char:  { type: float, range: [0.01,0.06], default: 0.03 }
  duration:          { type: float, default: 0.5 }
  clip_path:         { type: bool, default: true }  # true=clip-path裁剪(精确), false=translate(快)
```

代码骨架：
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
  return tl;
}
```

HTML 预处理（setup 阶段）：
```html
<div class="text-split" data-split="horizontal">
  <span class="split-left" style="clip-path:inset(0 50% 0 0)">Framepack</span>
  <span class="split-right" style="clip-path:inset(0 0 0 50%)">Framepack</span>
</div>
```

⚠️ 中文按字符拆分，不是单词。char mode 见完整实现。

---

### elastic-scale-enter | 弹性缩放入场

type: part | cat: entrance | engine: GSAP 3.x | ref: `parts/references/elastic-scale-enter.js`

一句话：元素从缩小弹跳放大到 100%，Apple Keynote 图标弹出感。活泼有生命力。不适合严肃风格。

```yaml
params:
  from_scale:     { type: float, range: [0,1], default: 0.6 }
  bounce_amount:  { type: float, range: [1.0,1.5], default: 1.15 }
  duration:       { type: float, range: [0.3,0.8], default: 0.55 }
  ease:           { type: string, default: "back.out(1.4)" }  # back.out(1.2)轻度/1.4标准/1.7明显/elastic.out(1,0.5)弹簧
  apply_to:       { type: enum, options: [scale_only, scale_and_opacity], default: scale_and_opacity }
```

代码骨架：
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

⚠️ 容器需明确 width/height。配合 stagger 串联见 card-cascade-reveal。

---

### stagger-grid-reveal | 网格交错揭示

type: part | cat: entrance | engine: GSAP 3.x (3.12+ stagger.grid) | ref: `parts/references/stagger-grid-reveal.js`

一句话：二维网格元素按行/列/中心向外依次揭示。GSAP 原生 stagger.grid。

```yaml
params:
  rows:          { type: int, default: 3 }
  cols:          { type: int, default: 3 }
  from:          { type: enum, options: [start, center, end, edges], default: center }  # random 不可用
  axis:          { type: enum, options: [rows, cols, both], default: both }
  stagger_each:  { type: float, default: 0.05 }
  animation:     { type: enum, options: [fade-up, scale-in, flip-in, slide-left], default: fade-up }
```

代码骨架：
```js
function staggerGridReveal(tl, container, opts = {}, position = '>') {
  const { rows = 3, cols = 3, from = 'center',
          axis = 'both', staggerEach = 0.05, animation = 'fade-up' } = opts;
  const items = container.children;
  const animMap = {
    'fade-up': { y: 40, opacity: 0 }, 'scale-in': { scale: 0.5, opacity: 0 },
    'flip-in': { rotationX: -90, opacity: 0 }, 'slide-left': { x: -60, opacity: 0 }
  };
  tl.fromTo(items, animMap[animation],
    { y: 0, x: 0, scale: 1, rotationX: 0, opacity: 1,
      duration: 0.5, stagger: { each: staggerEach, grid: [rows, cols], from, axis },
      ease: 'back.out(1.2)' }, position);
  return tl;
}
```

---

### typewriter-cursor | 打字机光标

type: part | cat: text | engine: GSAP 3.x | ref: `parts/references/typewriter-cursor.js`

一句话：文字逐字"打出来"，光标闪烁 + 彩色像散残影。视频开场揭示金句神器。

```yaml
params:
  text:              { type: string, required: true }
  char_interval:     { type: float, default: 0.08, range: [0.04,0.15] }
  cursor_char:       { type: string, default: "▍" }
  cursor_color:      { type: css_color, default: "#ff3b6f" }  # 推荐 #ff3b6f / #00d4ff / #ffb547
  chromatic_pair:    { type: array, default: ["#ff3b6f","#00d4ff"] }  # 像散双色，不超过2色
  chromatic_duration:{ type: float, default: 0.2 }
  reveal_ease:       { type: string, default: "steps(1)" }
  shimmer_at_end:    { type: bool, default: true }  # 打完字后光带横扫
```

代码骨架：
```js
function typewriterCursor(tl, container, opts = {}) {
  const { text = '', charInterval = 0.08, cursorChar = '▍',
          cursorColor = '#ff3b6f', chromaticPair = ['#ff3b6f', '#00d4ff'],
          chromaticDuration = 0.2, shimmerAtEnd = true } = opts;
  // 创建 textEl + cursorEl → 逐字 span → tl.to span {opacity:1, ease:'steps(1)'} + chromatic textShadow
  // 光标 blinkPattern = [1,1,1,0,1,1,0,0,1,0,1,1,1,0] 确定性闪烁
  // 末尾 shimmer: white overlay fromTo x'-100%'→'100%'
  return { tl, textEl, cursorEl };
}
```

⚠️ 逐字用 steps(1) 瞬时出现。光标闪烁用预设 pattern 代替 setInterval。text-shadow 逐字 >100 字符可能帧率下降。

---

### number-count-up | 数字跳动

type: part | cat: text | engine: GSAP 3.x | ref: `parts/references/number-count-up.js`

一句话：数字从 0 跳动到目标值。数据视频标配。用 GSAP snap 确保确定性。

```yaml
params:
  target_value: { type: number, required: true }
  prefix:       { type: string, default: "" }     # "$"/"€"/"↑"
  suffix:       { type: string, default: "" }     # "+"/"%"/"★"
  decimals:     { type: int, default: 0 }
  duration:     { type: float, default: 1.5 }
  ease:         { type: string, default: "power2.out" }
  snap:         { type: string, default: null }   # '0.1'=1位小数, '1'=整数
```

代码骨架：
```js
function numberCountUp(tl, el, opts = {}, position = '>') {
  const { targetValue = 100, prefix = '', suffix = '',
          decimals = 0, duration = 1.5, ease = 'power2.out' } = opts;
  const obj = { val: 0 };
  const snapVal = decimals > 0 ? (1 / Math.pow(10, decimals)).toString() : '1';
  tl.to(obj, { val: targetValue, duration, ease, snap: { val: parseFloat(snapVal) },
    onUpdate: () => { el.textContent = `${prefix}${obj.val.toFixed(decimals)}${suffix}`; }
  }, position);
  return tl;
}
```

⚠️ onUpdate 中只改 textContent 不改 DOM 结构。

---

### glitch-flicker | 故障闪烁

type: part | cat: text | engine: GSAP 3.x | ref: `parts/references/glitch-flicker.js`

一句话：文字间歇"故障"——短促变色+偏移，CRT 屏幕干扰感。科技/游戏视频必备。

```yaml
params:
  flicker_count: { type: int, default: 3, range: [1,8] }
  intensity:     { type: enum, options: [subtle, medium, heavy], default: medium }
  colors:        { type: array, default: ["#0ff","#f0f","#fff"] }
```

代码骨架：
```js
function glitchFlicker(tl, el, opts = {}, position = '>') {
  const { flickerCount = 3, intensity = 'medium' } = opts;
  const colors = opts.colors || ['#0ff', '#f0f', '#fff'];
  const dur = { subtle: 0.08, medium: 0.06, heavy: 0.04 }[intensity];
  const gap = { subtle: 0.25, medium: 0.18, heavy: 0.10 }[intensity];
  const shift = { subtle: 2, medium: 5, heavy: 10 }[intensity];
  // 预设 flicker pattern 替代 Math.random()
  const patterns = [[[1,0],[-2,1],[3,2]], [[-2,1],[0,2],[2,0]], [[1,2],[-1,0],[0,1]]];
  patterns[flickerCount-1].forEach(([xShift, colorIdx], i) => {
    tl.to(el, { x: xShift*shift, color: colors[colorIdx],
      textShadow: `${-xShift*2}px 0 ${colors[colorIdx]}`,
      duration: dur, ease: 'steps(1)' }, position + (i>0?`+=${gap}`:''));
  });
  tl.to(el, { x: 0, color: '', textShadow: '', duration: 0.1, ease: 'power2.out' });
  return tl;
}
```

---

### gradient-shift | 渐变流动

type: part | cat: background | engine: GSAP 3.x | ref: `parts/references/gradient-shift.js`

一句话：背景渐变色彩平滑流动——给静态页面加"呼吸感"。科技风底层氛围武器。

```yaml
params:
  from_colors: { type: array, default: ["#667eea","#764ba2"] }  # 起始色 2-4个
  to_colors:   { type: array, default: ["#f093fb","#f5576c"] }  # 目标色
  angle:       { type: float, default: 135, range: [0,360] }
  duration:    { type: float, default: 8 }  # 6-12s 为佳
```

代码骨架：
```js
function gradientShift(tl, el, opts = {}, position = '>') {
  const { fromColors = ['#667eea','#764ba2'], toColors = ['#f093fb','#f5576c'],
          angle = 135, duration = 8 } = opts;
  gsap.set(el, { '--grad-from': fromColors.join(', '),
    backgroundImage: `linear-gradient(${angle}deg, var(--grad-from))` });
  tl.to(el, { '--grad-to': toColors.join(','), duration, ease: 'sine.inOut', repeat: 0,
    onUpdate: function() { el.style.backgroundImage =
      `linear-gradient(${angle}deg, ${this.targets()[0].style.getPropertyValue('--grad-from')})`; }
  }, position);
  return tl;
}
```

---

### particle-blob-bg | 粒子有机体背景

type: part | cat: background | engine: anime.js 4.x | ref: `parts/references/particle-blob-bg.js`

一句话：数百粒子组成有机体缓缓蠕动变形——Motionfly 式氛围。anime.js 原生强项。

```yaml
params:
  particle_count:  { type: int, default: 120, range: [60,500] }
  colors:          { type: array, default: ["#667eea","#764ba2","#f093fb"] }
  blob_size:       { type: float, default: 300, range: [200,600] }
  morph_amplitude: { type: float, default: 60 }
  duration:        { type: float, default: 6 }
  speed:           { type: enum, options: [slow, medium, fast], default: medium }
```

代码骨架：
```js
import { animate, stagger } from 'animejs';
function createParticleBlob(container, opts = {}) {
  const { particleCount = 120, blobSize = 300, morphAmplitude = 60, duration = 6 } = opts;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 800 800');
  const circles = [], baseAngles = [];
  for (let i = 0; i < particleCount; i++) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('r', '3'); svg.appendChild(c); circles.push(c);
    baseAngles.push((i / particleCount) * Math.PI * 2);  // ← 确定性分布
  }
  container.appendChild(svg);
  const anim = animate(circles, {
    cx: stagger((el,i) => 400 + Math.cos(baseAngles[i]) * (blobSize + ((i%11)-5)*morphAmplitude/5), {start:'center'}),
    cy: stagger((el,i) => 400 + Math.sin(baseAngles[i]) * (blobSize + ((i%7)-3)*morphAmplitude/5), {start:'center'}),
    duration, ease: 'inOutSine', alternate: true, loop: 0, autoplay: false
  });
  return { svg, anim };
}
```

⚠️ 均匀分布 i/count*2π 替 Math.random()。autoplay:false + loop:0。

---

### light-leak-cinema | 胶片漏光

type: part | cat: environment | engine: GSAP 3.x | ref: `parts/references/light-leak-cinema.js`

一句话：暖橙漏光 + 35mm 颗粒 + letterbox 黑边。纪录片/品牌片开场质感。跟 flash-white 的区别：flash-white 是 0.4s 快闪转场，light-leak 是 5-15s 慢氛围。

```yaml
params:
  base_color:       { type: css_color, default: "#1a0d08" }  # 暖棕/墨绿/蓝紫
  leak_colors:      { type: array, default: ["#ffb547","#d97757","#fca5a5"] }  # 必须暖色
  leak_count:       { type: int, default: 3, range: [2,5] }
  grain_opacity:    { type: float, default: 0.14, range: [0.08,0.25] }
  letterbox:        { type: bool, default: true }  # 2.39:1 黑边
  drift_duration:   { type: float, default: 12 }
  intro_underexpose:{ type: bool, default: true }  # 开场欠曝→正常
```

代码骨架：
```js
function lightLeakCinema(tl, container, opts = {}) {
  const { baseColor = '#1a0d08', leakColors = ['#ffb547','#d97757','#fca5a5'],
          leakCount = 3, grainOpacity = 0.14, letterbox = true,
          driftDuration = 12, introUnderexpose = true } = opts;
  // letterbox 黑边 → SVG turbulence grain (data URI) → 漏光 div (预设位置+radial-gradient)
  // GSAP: intro 欠曝 brightness(0.3)→1, 漏光漂移用预设 driftPaths [[x,y,z],[...]] 确定性
  // mix-blend-mode: screen + overlay
  return tl;
}
```

⚠️ 预设漏光位置+漂移路径——全确定。SVG turbulence 是静态 data URI。

---

### float-3d-card | 3D 卡片悬浮

type: part | cat: environment | engine: GSAP 3.x | ref: `parts/references/float-3d-card.js`

一句话：卡片在 3D 空间中微微悬浮（Y 轴上下+小幅旋转），"高端感"制造器。源自经典卡片 parallax 模式。

```yaml
params:
  float_distance:  { type: float, default: 15, range: [5,40] }  # Y轴浮动 px
  rotation_range:  { type: float, default: 3, range: [1,10] }   # X轴旋转度
  duration:        { type: float, default: 4 }
  shadow_depth:    { type: float, default: 40 }
```

代码骨架：
```js
function float3DCard(tl, card, opts = {}, position = '>') {
  const { floatDistance = 15, rotationRange = 3, duration = 4, shadowDepth = 40 } = opts;
  tl.to(card, {
    y: floatDistance, rotationX: rotationRange,
    boxShadow: `0 ${shadowDepth}px ${shadowDepth*1.5}px rgba(0,0,0,0.2)`,
    duration: duration/2, ease: 'sine.inOut', yoyo: true, repeat: 1  // ← 确定性：1次不是-1
  }, position);
  return tl;
}
```

---

### splittext-stagger-chars | 逐字交错进场

type: part | cat: text | engine: GSAP 3.13+ (需 SplitText) | ref: `parts/references/splittext-stagger-chars.js`

一句话：文字逐字交错飞入，每个字独立动画。SplitText 在 setup 阶段拆分 DOM，渲染时不改结构。

```yaml
params:
  split_type:       { type: enum, options: [chars, words, lines, chars_words], default: chars }
  direction:        { type: enum, options: [up, down, left, right], default: up }  # random 不可用
  stagger_amount:   { type: float, range: [0.01,0.08], default: 0.03 }
  travel_distance:  { type: float, default: 30 }
  rotation:         { type: float, range: [-45,45], default: 0 }
  duration:         { type: float, default: 0.5 }
```

代码骨架：
```js
function splitTextStagger(tl, textEl, opts = {}, position = '>') {
  const { splitType = 'chars', direction = 'up', staggerAmount = 0.03,
          travelDistance = 30, rotation = 0, duration = 0.5 } = opts;
  const split = SplitText.create(textEl, { type: splitType });  // setup阶段执行
  const elements = split[splitType];
  const dirMap = { up:{y:travelDistance,x:0}, down:{y:-travelDistance,x:0},
    left:{x:travelDistance,y:0}, right:{x:-travelDistance,y:0} };
  const from = { ...dirMap[direction], opacity: 0 };
  if (rotation) from.rotation = rotation;
  tl.fromTo(elements, from, { y:0, x:0, opacity:1, rotation:0,
    duration, stagger: staggerAmount, ease: 'back.out(1.2)' }, position);
  return { tl, split };
}
```

⚠️ SplitText 拆分后场景卸载需 `split.revert()`。中文字符拆分正常。>200 字性能下降。

---

### caption-clip-wipe | 文字擦除进场

type: part | cat: text | engine: GSAP 3.x | ref: `parts/references/caption-clip-wipe.js`

一句话：文字从左到右被"擦出来"。源自 HyperFrames Catalog caption-clip-wipe。

```yaml
params:
  direction:         { type: enum, options: [left-to-right, right-to-left, top-to-bottom, center-out], default: left-to-right }
  stagger_per_word:  { type: float, range: [0.05,0.25], default: 0.1 }
  duration_per_word: { type: float, default: 0.4 }
  reveal_color:      { type: css_color, default: "currentColor" }
```

代码骨架：
```js
function captionClipWipe(tl, textEl, opts = {}, position = '>') {
  const { direction = 'left-to-right', staggerPerWord = 0.1, durationPerWord = 0.4 } = opts;
  const words = textEl.querySelectorAll('.word');
  const clipMap = {
    'left-to-right': 'inset(0 100% 0 0)', 'right-to-left': 'inset(0 0 0 100%)',
    'top-to-bottom': 'inset(100% 0 0 0)', 'center-out': 'inset(0 50% 0 50%)'
  };
  words.forEach((word, i) => {
    tl.fromTo(word, { clipPath: clipMap[direction], opacity: 0 },
      { clipPath: 'inset(0 0 0 0)', opacity: 1, duration: durationPerWord, ease: 'power2.out' },
      position + (i > 0 ? `+=${staggerPerWord}` : ''));
  });
  return tl;
}
```

HTML：文字需预先按单词拆成 `<span class="word" style="clip-path:inset(0 100% 0 0)">word</span>`。

---

### anime-text-split | anime.js 文字拆分

type: part | cat: text | engine: anime.js 4.x | ref: `parts/references/anime-text-split.js`

一句话：anime.js 原生逐字动画——比 SplitText 轻（~3KB vs ~60KB），不依赖 GSAP。项目已用 anime.js 做其他动画时选用。

```yaml
params:
  split_by:        { type: enum, options: [letter, word], default: letter }
  direction:       { type: enum, options: [up, down, scale, rotate], default: up }
  stagger_amount:  { type: float, default: 40 }   # anime.js stagger 用毫秒
  duration:        { type: float, default: 800 }   # anime.js duration 用毫秒
```

代码骨架：
```js
import { animate, stagger } from 'animejs';
function animeTextSplit(tl, textEl, opts = {}) {
  const { splitBy = 'letter', direction = 'up', staggerAmount = 40, duration = 800 } = opts;
  const text = textEl.textContent.trim();
  const unit = splitBy === 'letter' ? text.split('') : text.split(' ');
  textEl.innerHTML = '';
  const spans = unit.map(ch => {
    const span = document.createElement('span');
    span.textContent = ch === ' ' ? '\u00A0' : ch;
    span.style.display = 'inline-block'; textEl.appendChild(span); return span;
  });
  const dirMap = { up:{translateY:[24,0],opacity:[0,1]}, down:{translateY:[-24,0],opacity:[0,1]},
    scale:{scale:[0,1],opacity:[0,1]}, rotate:{rotate:['0.25turn',0],opacity:[0,1]} };
  return animate(spans, { ...dirMap[direction], duration, delay: stagger(staggerAmount),
    ease: 'out(3)', autoplay: false });
}
```

---

### macos-notification | macOS 通知卡片

type: part | cat: overlay | engine: GSAP 3.x | ref: `parts/references/macos-notification.js`

一句话：macOS 风格通知横幅——"有人刚注册"、"新评论"。社交证明类视频标配。

```yaml
params:
  title:           { type: string, default: "New Signup" }
  body:            { type: string, default: "Someone from San Francisco just joined" }
  app_icon:        { type: emoji_or_url, default: "🔔" }
  app_name:        { type: string, default: "Product" }
  timestamp:       { type: string, default: "now" }
  position:        { type: enum, options: [top-right, top-left, bottom-right], default: top-right }
  slide_direction: { type: enum, options: [from-right, from-left, from-bottom], default: from-right }
  auto_dismiss:    { type: bool, default: true }
  display_duration:{ type: float, default: 3 }
  stagger_delay:   { type: float, default: 0 }
```

代码骨架：
```js
function showMacOSNotification(tl, container, opts = {}, position = '>') {
  const { title='New Signup', body='Someone just joined', appIcon='🔔',
          appName='Product', timestamp='now', slideDirection='from-right',
          autoDismiss=true, displayDuration=3 } = opts;
  // 创建毛玻璃卡片 (backdrop-filter:blur + rgba背景 + box-shadow)
  // 滑入: fromTo {x:400,opacity:0,scale:0.9} → {x:0,opacity:1,scale:1, ease:'back.out(1.4)'}
  // 自动消失: >+displayDuration → {opacity:0, scale:0.95, x:200}
  return tl;
}
```

⚠️ backdrop-filter:blur 在 HyperFrames Chromium 正常。多通知错峰用 stagger_delay。

---

### sprite-animation | 精灵帧动画

type: part | cat: visual-fx | engine: GSAP 3.x | ref: `parts/references/sprite-animation.js`

一句话：精灵图按帧逐格播放——翻页动画。游戏/插画风灵魂武器。

```yaml
params:
  sprite_url:   { type: url, required: true }
  frame_count:  { type: int, default: 12 }
  frame_width:  { type: int, required: true }
  frame_height: { type: int, required: true }
  fps:          { type: float, default: 12, range: [6,30] }
  direction:    { type: enum, options: [horizontal, vertical], default: horizontal }
  loop_count:   { type: int, default: 1 }  # 固定数字，不是-1
  ping_pong:    { type: bool, default: false }
```

代码骨架：
```js
function spriteAnimation(tl, el, opts = {}, position = '>') {
  const { frameCount=12, frameWidth=200, frameHeight=200, fps=12,
          direction='horizontal', loopCount=1, pingPong=false, spriteUrl='' } = opts;
  if (spriteUrl) el.style.backgroundImage = `url(${spriteUrl})`;
  el.style.backgroundSize = direction==='horizontal'
    ? `${frameWidth*frameCount}px ${frameHeight}px` : `${frameWidth}px ${frameHeight*frameCount}px`;
  // 构建确定性帧序列 keyframes[] → 单个 tween + stepped ease 逐帧跳
  const animObj = { frame: 0 };
  tl.to(animObj, { frame: keyframes.length-1, duration: keyframes.length*(1/fps), ease: 'none',
    onUpdate: () => { el.style.backgroundPosition = keyframes[Math.round(animObj.frame)]; }
  }, position);
  return tl;
}
```

⚠️ 精灵图需 setup 阶段预加载 (new Image() onload)。大图 >2048px 可能触发纹理限制。

---

### bg-blur-mask | 背景模糊遮罩

type: part | cat: background | engine: GSAP 3.x | ref: `parts/references/bg-blur-mask.js`

一句话：背景逐渐模糊+变暗，聚光灯效果。保留空间感但把注意力拉回前景。

```yaml
params:
  blur_amount:    { type: css, default: "8px" }
  darken_opacity: { type: float, range: [0,0.6], default: 0.3 }
  duration:       { type: float, default: 0.4 }
  curve:          { type: string, default: "power2.inOut" }
```

代码骨架：
```js
function bgBlurMask(tl, container, opts = {}, position = '<') {
  const { blurAmount='8px', darkenOpacity=0.3, duration=0.4, curve='power2.inOut' } = opts;
  let mask = container.querySelector('.bg-blur-mask');
  if (!mask) { /* 创建 .bg-blur-mask 遮罩层 */ }
  return tl.to(mask, {
    backdropFilter: `blur(${blurAmount})`,
    backgroundColor: `rgba(0,0,0,${darkenOpacity})`,
    duration, ease: curve
  }, position);
}
```

---

### svg-morph-transition | SVG 形态过渡

type: part | cat: transition | engine: anime.js 4.x | ref: `parts/references/svg-morph-transition.js`

一句话：SVG 形状平滑变形。anime.js 原生强项。GSAP 需 MorphSVGPlugin。

```yaml
params:
  from_path: { type: svg_path_d_string, required: true }
  to_path:   { type: svg_path_d_string, required: true }
  duration:  { type: float, default: 1.5 }
  easing:    { type: string, default: "inOut(4)" }  # anime.js easing 语法
  stagger:   { type: float, default: 0 }
```

代码骨架：
```js
import { animate } from 'animejs';
function svgMorph(el, fromPath, toPath, opts = {}) {
  const { duration = 1.5, easing = 'inOut(4)' } = opts;
  return animate(el, { d: [fromPath, toPath], duration, ease: easing, autoplay: false });
}
```

---

### light-leak-cinema 已在上方。 

---

## BLOCKS — 段落武器（5 件）

### card-cascade-reveal | 多卡片旋转翻出

type: block | cat: showcase | duration: 4-6s | engine: GSAP 3.x | ref: `blocks/references/card-cascade-reveal.js`

一句话：3-5 张卡片从画面中心依次旋转+缩放飞出，定格成扇形/网格。信息密度感+视觉愉悦感。视频 15%-40% 位置（hook 之后秀肌肉）。

```yaml
params:
  card_count:         { type: int, range: [3,6], default: 4 }
  layout:             { type: enum, options: [fan, grid, stacked-left], default: fan }
  card_width:         { type: css, default: "280px" }
  gap:                { type: css, default: "24px" }
  stagger:            { type: float, range: [0.08,0.3], default: 0.12 }
  rotation_intensity: { type: enum, options: [subtle, medium, dramatic], default: medium }  # ±3°/±8°/±15°
  depth_3d:           { type: bool, default: true }
  color_theme:        { type: string, default: "inherit", options: [inherit, gradient-cool, gradient-warm, glass] }
  entrance_direction: { type: enum, options: [center-spread, left-to-right, bottom-up], default: center-spread }
```

代码骨架：
```js
function buildCardCascade(container, params) {
  const { cardCount, layout, stagger, rotationIntensity, depth3d } = params;
  const tl = gsap.timeline({ paused: true });
  const cards = createCards(container, cardCount, params);
  bgBlurMask(tl, container, { duration: 0.4 });  // 背景模糊
  const rot = { subtle: 3, medium: 8, dramatic: 15 }[rotationIntensity];
  cards.forEach((card, i) => {
    const angle = layout === 'fan' ? (i - (cardCount-1)/2) * rot : 0;
    tl.fromTo(card,
      { opacity: 0, scale: 0.6, rotation: angle*1.5, y: 60 },
      { opacity: 1, scale: 1, rotation: angle, y: 0,
        duration: 0.55, ease: 'back.out(1.4)' },
      i * stagger);
  });
  return tl;
}
```

⚠️ 3D 透视设在场景容器上，别设在卡片上。有变体: with-text, vertical, photo。

---

### hero-3d-device-spin | 3D 设备旋转展示

type: block | cat: showcase | duration: 8-12s | engine: GSAP 3.x + Three.js r160+ | ref: `blocks/references/hero-3d-device-spin.js`

一句话：3D 设备模型旋转展示，截图投影到屏幕上。Motionfly 观感作弊器。两种模式：external_catalog（GLTF 真 3D）和 lightweight_css3d（纯 CSS 3D）。

```yaml
params:
  device:       { type: enum, options: [iphone, macbook, ipad, watch, generic-card], default: macbook }
  screenshot:   { type: url, required: true }
  camera_path:  { type: enum, options: [orbit-left, orbit-right, zoom-in, turntable-360, tilt-reveal], default: orbit-left }
  background:   { type: enum, options: [gradient-brand, dark-studio, light-studio, transparent], default: gradient-brand }
  duration:     { type: float, range: [6,15], default: 10 }
  show_glow:    { type: bool, default: true }
```

代码骨架 (lightweight CSS 3D)：
```js
function buildDeviceSpin(container, params) {
  const { device, screenshot, cameraPath, duration } = params;
  const tl = gsap.timeline({ paused: true });
  const deviceShell = createDeviceFrame(container, device);  // CSS 设备外壳
  const screen = createScreen(deviceShell, screenshot);
  const paths = {
    'orbit-left': { rotateY: [-15, 25], x: [0, -60], duration },
    'orbit-right': { rotateY: [25, -15], x: [0, 60], duration },
    'zoom-in': { scale: [0.7, 1.15], duration },
    'turntable-360': { rotateY: [0, 360], duration },
    'tilt-reveal': { rotateX: [-30, 0], rotateY: [10, -5], duration }
  };
  tl.fromTo(deviceShell, paths[cameraPath], { ease: 'power2.inOut' });
  if (params.showGlow) tl.fromTo(screen,
    { boxShadow: '0 0 0px rgba(100,150,255,0)' },
    { boxShadow: '0 0 40px rgba(100,150,255,0.4)', duration: 0.6 }, '<');
  return tl;
}
```

⚠️ GLTF 模式需 HyperFrames Catalog `npx hyperframes add vfx-iphone-device`。CSS 3D 模式用 transform-style:preserve-3d。

---

### sticky-flowchart | 便利贴流程图

type: block | cat: scene | duration: 5-10s | engine: GSAP 3.x + SVG | ref: `blocks/references/sticky-flowchart.js`

一句话：白板+便利贴风格流程图——节点交错弹出，贝塞尔曲线逐一绘制。教学/流程说明视频王牌。

```yaml
params:
  nodes:         { type: array, required: true }  # [{emoji, title, desc, x, y, color}]
  edges:         { type: array, required: true }  # [{from: nodeIndex, to: nodeIndex, dashed: bool}]
  board_style:   { type: enum, options: [warm-paper, cool-whiteboard], default: warm-paper }
  node_stagger:  { type: float, default: 0.3 }
  line_duration: { type: float, default: 0.5 }
  show_cursor:   { type: bool, default: false }
```

代码骨架 (核心逻辑)：
```js
function buildStickyFlowchart(container, opts = {}) {
  const { nodes=[], edges=[], boardStyle='warm-paper', nodeStagger=0.3, lineDuration=0.5 } = opts;
  const tl = gsap.timeline({ paused: true });
  // 背景网格 (warm-paper/cool-whiteboard) → SVG layer (贝塞尔曲线 stroke-dashoffset)
  // 便利贴 note div（确定性旋转 -3°/-1.5°/0/1.5°/3°）→ tl.to scale:1 ease:'back.out(1.7)'
  // 连接线在 from node 出现后绘制：tl.to path 'stroke-dashoffset':0
  return tl;
}
```

⚠️ 节点坐标+旋转全预设——等价声明式布局。手写字体需 CDN 引入。

---

### data-chart-editorial | 编辑级数据图表

type: block | cat: showcase | duration: 4-8s | engine: GSAP 3.x + SVG | ref: `blocks/references/data-chart-editorial.js`

一句话：《纽约时报》专栏级动态数据图表——手写 SVG 折线/柱状图，不依赖 chart.js/d3。逐元素错峰揭示。

```yaml
params:
  chart_type:     { type: enum, options: [line, bar, range-band], default: line }
  theme:          { type: enum, options: [light-nyt, dark-nyt], default: light-nyt }
  accent_color:   { type: enum, options: [red-nyt, mint-editorial, warm-orange], default: red-nyt }
  data:           { type: array, required: true }  # [{label, values:[y1, y2?]}]
  headline:       { type: string, required: true }  # 新闻点结论句
  kicker:         { type: string, default: "" }     # 顶部分类字幕
  source:         { type: string, default: "" }     # 底部数据来源
  reveal_stagger: { type: float, default: 0.12 }
```

代码骨架 (line chart)：
```js
function buildDataChart(container, opts = {}) {
  const { chartType='line', accentColor='red-nyt', data=[], headline='', kicker='', revealStagger=0.12 } = opts;
  const tl = gsap.timeline({ paused: true });
  // Kicker → Headline (fade-in) → SVG polyline (stroke-dashoffset 绘制)
  // → Data points (circle fade-in) → Source
  const polyline = /* SVG polyline from data points */;
  tl.to(polyline, { 'stroke-dashoffset': 0, duration: 1.2, ease: 'power2.out' });
  return tl;
}
```

⚠️ 手写 SVG 坐标——确定性绘制。polyline.getTotalLength() 在 headless Chromium 正常。

---

### transitions-pack | 转场效果包 (DEPRECATED)

type: block | cat: transition | duration: 0.5-1.5s | engine: GSAP 3.x | ref: `blocks/references/transitions-pack.js`

⚠️ **DEPRECATED — 场景切换请用 HyperFrames 原生转场系统。** 本 block 的 DIY 手动退场方式违反 HyperFrames 铁律。保留动画技术代码（GSAP + CSS transform/filter/clip-path）作为参考，场景切换逻辑不应使用。正确做法：加载 `hyperframes` skill。

内含效果：whip-pan(快速甩镜), cinematic-zoom(缩放模糊), flash-white(白闪), glitch(数字故障), slide-up(上滑推入), circle-reveal(圆形揭示)。

```yaml
params:
  type:      { type: enum, options: [whip-pan, cinematic-zoom, flash-white, glitch, slide-up, circle-reveal], default: whip-pan }
  direction: { type: enum, options: [left, right, up, down], default: left }
  intensity: { type: enum, options: [subtle, medium, heavy], default: medium }
  duration:  { type: float, range: [0.3,1.5], default: 0.5 }
```

---

## TEMPLATE — 全桌菜谱（1 件）

### saas-product-launch | SaaS 产品发布模板

type: template | duration: 45-75s | format: 16:9, 9:16, 1:1

叙事策略：Hook → 秀产品 → 展示功能 → 信任/社交证明 → 强力 CTA。节奏：快-中-快-中-爆炸。

场景序列：
1. hook-3d-reveal (0-8s): hero-3d-device-spin — 产品 3D 旋转抓眼球
2. problem-statement (8-12s): kinetic-caption-burst — 痛点共鸣大字
3. feature-showcase (12-26s): card-cascade-reveal — 4 个核心功能卡片扇形飞出
4. social-proof (26-34s): bento-stagger-reveal — Bento 布局展示数据+Logo+好评
5. cta-finale (34-42s): cta-impact-card — 强力 CTA 收尾

可选替换：没截图？hero-3d→logo-reveal-cinematic。3个功能？card_count=3。竖屏？entrance_direction=bottom-up。

---

## LIBRARY — 引擎适配（1 件）

### library-anime | anime.js HyperFrames 适配层

type: library | engine: anime.js 4.x

anime.js v4.0+ 原生支持 timeline.seek(time)，与 GSAP 等效。

引擎选择决策：
- SVG morphing → anime.js ✅
- 粒子/物理效果 → anime.js ✅ (stagger + 函数值)
- 轻量需求(<20KB) → anime.js ✅
- 复杂序列+插件 → GSAP ✅
- ScrollTrigger → GSAP ✅

HyperFrames 适配模式：
```js
import { createTimeline } from 'animejs';
const tl = createTimeline({ autoplay: false });  // ← 关键！
const compId = "my-scene";  // 必须匹配 data-composition-id
window.__timelines[compId] = { seek: (t) => tl.seek(t) };
```

❌ 禁止：autoplay:true, loop:true, Math.random()

---

## Execution Manifest 规范

Director 产出 expanded-prompt.md 时，每个场景必须写 YAML Execution Manifest：

```yaml
scene_1:
  weapon: text-split-enter
  code: "parts/references/text-split-enter.js"   # 可通过 skill_view(file_path=...) 加载
  params: { target: "#s1-title", split_mode: "horizontal", direction: "inward", travel_distance: "40px" }
  handwrite: false   # true 只在 MOC 无匹配武器时
  handwrite_reason: ""  # handwrite=true 时必须写原因
```

Agent 写 HTML 时：
1. 读 Manifest → `handwrite: false` 的场景 → **必须加载对应 weapon JS**
2. **复制代码骨架，只改参数**——不改逻辑
3. 只在 `handwrite: true` 场景允许裸 GSAP

## Pitfall: 武器加载了 ≠ 武器用上了

最隐蔽失败模式：Agent 正确加载武器 → 理解参数 → 写 HTML 时全部裸 GSAP 手写。
Manifest 是**执行契约**不是灵感参考。说用 text-split-enter 就必须出现 `.split-left/.split-right` HTML 结构和两个 `tl.from()` 从两侧合拢，不能是 `tl.from("#title", {opacity:0})`。
