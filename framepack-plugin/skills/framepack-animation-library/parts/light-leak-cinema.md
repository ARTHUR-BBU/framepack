---
name: light-leak-cinema
title: "胶片漏光 · Cinematic Light Leak"
type: part
category: environment
gsap_version: "3.x"
used_by: ["[[blocks/logo-reveal-cinematic]]", "[[blocks/hero-3d-device-spin]]"]
source: "nexu-io/html-anything frame-light-leak-cinema — 改写为 GSAP 确定性版本"
---

# Cinematic Light Leak

> **一句话**：暖橙漏光 + 35mm 颗粒 + letterbox 黑边。纪录片/品牌片开场质感。
>
> **跟 flash-white 的区别**：flash-white 是 0.4s 的快速白闪转场。light-leak 是持续 5-15s 的慢氛围——暖光在画面上缓缓漂移，胶片颗粒静态覆盖。

## 参数

```yaml
parameters:
  base_color:
    type: css_color
    default: "#1a0d08"
    note: "深色背景。暖棕/墨绿/蓝紫"

  leak_colors:
    type: array
    default: ["#ffb547", "#d97757", "#fca5a5"]
    note: "漏光色——必须是暖色系（橙/桃/玫红），不要冷蓝"

  leak_count:
    type: int
    default: 3
    range: [2, 5]

  grain_opacity:
    type: float
    default: 0.14
    range: [0.08, 0.25]

  letterbox:
    type: bool
    default: true
    note: "是否加 2.39:1 letterbox 黑边"

  drift_duration:
    type: float
    default: 12
    note: "漏光漂移一个周期的时间"

  intro_underexpose:
    type: bool
    default: true
    note: "开场从欠曝（暗）→ 正常曝光"
```

## 代码

```js
function lightLeakCinema(tl, container, opts = {}) {
  const { baseColor = '#1a0d08', leakColors = ['#ffb547', '#d97757', '#fca5a5'],
          leakCount = 3, grainOpacity = 0.14, letterbox = true,
          driftDuration = 12, introUnderexpose = true } = opts;

  container.style.cssText = `background:${baseColor};overflow:hidden;position:relative;`;

  // ── Letterbox ──
  if (letterbox) {
    ['top', 'bottom'].forEach(pos => {
      const bar = document.createElement('div');
      bar.style.cssText = `position:absolute;${pos}:0;left:0;width:100%;height:140px;background:#000;z-index:10;`;
      container.appendChild(bar);
    });
  }

  // ── 35mm Grain (SVG turbulence) ──
  const grain = document.createElement('div');
  grain.style.cssText = [
    'position:absolute;inset:0;z-index:5;pointer-events:none',
    `opacity:${grainOpacity};mix-blend-mode:overlay`,
    `background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
  ].join(';');
  container.appendChild(grain);

  // ── Light Leaks ──
  const leaks = [];
  for (let i = 0; i < leakCount; i++) {
    const leak = document.createElement('div');
    const color = leakColors[i % leakColors.length];
    // 确定性的位置——预设坐标，不用 Math.random()
    const positions = [
      { top: '-10%', left: '60%', size: '50%' },
      { top: '40%', left: '80%', size: '45%' },
      { top: '60%', left: '10%', size: '40%' },
      { top: '20%', left: '30%', size: '35%' },
      { top: '70%', left: '50%', size: '55%' },
    ];
    const pos = positions[i % positions.length];

    leak.style.cssText = [
      'position:absolute;z-index:3;pointer-events:none',
      `top:${pos.top};left:${pos.left}`,
      `width:${pos.size};height:${pos.size}`,
      `background:radial-gradient(ellipse at center, ${color} 0%, transparent 70%)`,
      'opacity:0.35;mix-blend-mode:screen'
    ].join(';');
    container.appendChild(leak);
    leaks.push(leak);
  }

  // ── GSAP 动画 ──
  if (introUnderexpose) {
    tl.fromTo(container, { filter: 'brightness(0.3)' }, { filter: 'brightness(1)', duration: 0.8, ease: 'power2.out' }, '>');
  }

  // 漏光漂移（确定性 x/y 微动）
  const driftPaths = [
    { x: [0, 30, -20, 0], y: [0, -15, 10, 0] },
    { x: [0, -25, 15, 0], y: [0, 20, -10, 0] },
    { x: [0, 10, -30, 0], y: [0, -25, 15, 0] },
  ];

  leaks.forEach((leak, i) => {
    const path = driftPaths[i % driftPaths.length];
    tl.to(leak, { x: path.x[1], y: path.y[1], duration: driftDuration / 3, ease: 'sine.inOut' }, '<');
    tl.to(leak, { x: path.x[2], y: path.y[2], duration: driftDuration / 3, ease: 'sine.inOut' });
    tl.to(leak, { x: path.x[3], y: path.y[3], duration: driftDuration / 3, ease: 'sine.inOut' });
  });

  return tl;
}
```

## HyperFrames 注意

- ✅ 漏光漂移用预设路径数组——确定性
- ✅ SVG turbulence noise 是静态 + 单次嵌入 data URI——渲染时不变
- ✅ `filter: brightness()` 动画在 Chromium 中流畅
- ⚠️ `mix-blend-mode: screen` + `overlay` 在 headless Chromium 中表现与 GUI 一致
