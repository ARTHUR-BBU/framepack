---
name: data-chart-editorial
title: "编辑级数据图表 · Editorial Data Chart"
type: block
category: showcase
duration: "4-8s"
gsap_version: "3.x"
used_by: ["[[templates/data-shock-explain]]"]
source: "nexu-io/html-anything frame-data-chart-nyt — 改写为 GSAP + SVG 确定性版本"
---

# Editorial Data Chart

> **一句话**：《纽约时报》专栏级的动态数据图表——手写 SVG 折线/柱状图，逐元素错峰揭示。
>
> **不依赖 chart.js / d3。纯 SVG + GSAP。**

## 参数

```yaml
parameters:
  chart_type:
    type: enum
    options: [line, bar, range-band]
    default: line

  theme:
    type: enum
    options: [light-nyt, dark-nyt]
    default: light-nyt

  accent_color:
    type: enum
    options: [red-nyt, mint-editorial, warm-orange]
    default: red-nyt

  data:
    type: array
    description: "[{label, values: [y1, y2?]}, ...]  单线=一个 y 值，范围=两个"

  headline:
    type: string
    description: "大字结论句——不是描述图表，是提炼出新闻点"

  kicker:
    type: string
    description: "顶部分类字幕"

  source:
    type: string
    description: "底部数据来源"

  reveal_stagger:
    type: float
    default: 0.12
    note: "各元素揭示的错峰间隔"
```

## 代码

> ⚠️ 完整: `references/data-chart-editorial.js`

```js
function buildDataChart(container, opts = {}) {
  const { chartType = 'line', theme = 'light-nyt',
          accentColor = 'red-nyt', data = [],
          headline = '', kicker = '', source = '',
          revealStagger = 0.12 } = opts;

  const colors = {
    'red-nyt':        { accent: '#a91d1d', bg: '#f7f5ee', text: '#0e0e0e', ink: '#1a1a1a' },
    'mint-editorial': { accent: '#5fb38a', bg: '#f7f5ee', text: '#0e0e0e', ink: '#1a1a1a' },
    'warm-orange':    { accent: '#d97757', bg: '#f7f5ee', text: '#0e0e0e', ink: '#1a1a1a' },
  };
  const c = colors[accentColor];

  const tl = gsap.timeline({ paused: true });

  // ── Layout ──
  container.style.cssText = `background:${c.bg};color:${c.text};font-family:Source Serif Pro,serif;position:relative;overflow:hidden;`;

  // Kicker
  const kickerEl = document.createElement('div');
  kickerEl.textContent = kicker.toUpperCase();
  kickerEl.style.cssText = `font-size:11px;letter-spacing:0.14em;color:${c.accent};text-transform:uppercase;opacity:0;`;
  container.appendChild(kickerEl);
  tl.to(kickerEl, { opacity: 1, duration: 0.3 }, '>');

  // Headline
  const headlineEl = document.createElement('h2');
  headlineEl.textContent = headline;
  headlineEl.style.cssText = 'font-size:5.6vw;font-weight:400;line-height:1.1;margin:12px 0 24px;opacity:0;';
  container.appendChild(headlineEl);
  tl.to(headlineEl, { opacity: 1, y: 0, duration: 0.5 }, `>+${revealStagger}`);

  // SVG Chart
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 800 350');
  svg.style.cssText = 'width:100%;opacity:0;';

  if (chartType === 'line') {
    // Build polyline from data
    const points = data.map((d, i) => {
      const x = 60 + (i / (data.length - 1)) * 680;
      const maxY = Math.max(...data.map(dd => dd.values[0]));
      const y = 300 - (d.values[0] / maxY) * 260;
      return `${x},${y}`;
    });

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', points.join(' '));
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', c.ink);
    polyline.setAttribute('stroke-width', '2.5');
    polyline.setAttribute('stroke-linejoin', 'round');

    const length = polyline.getTotalLength ? polyline.getTotalLength() : 1000;
    polyline.setAttribute('stroke-dasharray', length);
    polyline.setAttribute('stroke-dashoffset', length);
    svg.appendChild(polyline);

    tl.to(svg, { opacity: 1, duration: 0.2 }, `>+${revealStagger}`);
    tl.to(polyline, { 'stroke-dashoffset': 0, duration: 1.2, ease: 'power2.out' }, '>');

    // Data points + labels
    data.forEach((d, i) => {
      const maxY = Math.max(...data.map(dd => dd.values[0]));
      const x = 60 + (i / (data.length - 1)) * 680;
      const y = 300 - (d.values[0] / maxY) * 260;
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x); circle.setAttribute('cy', y); circle.setAttribute('r', '4');
      circle.setAttribute('fill', c.accent); circle.style.opacity = '0';
      svg.appendChild(circle);
      tl.to(circle, { opacity: 1, duration: 0.15 }, `>+${revealStagger * 0.8}`);
    });
  }

  container.appendChild(svg);

  // Source
  const sourceEl = document.createElement('div');
  sourceEl.textContent = source;
  sourceEl.style.cssText = 'font-size:10px;font-family:IBM Plex Mono,monospace;opacity:0.6;margin-top:8px;';
  container.appendChild(sourceEl);
  tl.to(sourceEl, { opacity: 0.6, duration: 0.2 }, '>-0.1');

  return tl;
}
```

## HyperFrames 注意

- ✅ 手写 SVG 坐标——确定性绘制，无外部库依赖
- ✅ `stroke-dashoffset` 动画在 Chromium 中 GPU 加速，流畅
- ⚠️ `polyline.getTotalLength()` 在 HyperFrames headless Chromium 中正常工作
- ⚠️ 数据点的 Y 坐标基于 `maxY` 动态计算——数据变则坐标变，但同一数据多次渲染结果相同
