---
name: particle-blob-bg
title: "粒子有机体背景 · Particle Blob Background"
type: part
category: background
anime_version: "4.x"
used_by: ["[[blocks/hero-3d-device-spin]]"]
---

# Particle Blob Background

> **一句话**：数百个粒子组成的有机体在背景缓缓蠕动变形——Motionfly 式氛围担当。
>
> **源自 anime.js 经典 demo "Organic Blob"**。anime.js 用 stagger + 函数值做粒子动画天然强项。

## 参数

```yaml
parameters:
  particle_count:
    type: int
    default: 120
    range: [60, 500]

  colors:
    type: array
    default: ["#667eea", "#764ba2", "#f093fb"]

  blob_size:
    type: float
    default: 300
    range: [200, 600]

  morph_amplitude:
    type: float
    default: 60
    note: "粒子偏离基圆的幅度"

  duration:
    type: float
    default: 6
    note: "一次形变周期"

  speed:
    type: enum
    options: [slow, medium, fast]
    default: medium
```

## 代码

> ⚠️ 完整: `references/particle-blob-bg.js`

```js
import { animate, stagger } from 'animejs';

function createParticleBlob(container, opts = {}) {
  const { particleCount = 120, blobSize = 300,
          morphAmplitude = 60, duration = 6 } = opts;

  // 创建 SVG canvas
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 800 800');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';

  const circles = [];
  const baseAngles = []; // ← 确定性：预设角度数组替代 Math.random()

  for (let i = 0; i < particleCount; i++) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '3');
    svg.appendChild(circle);
    circles.push(circle);

    // 确定性分布：用均匀分布替代 random
    baseAngles.push((i / particleCount) * Math.PI * 2);
  }

  container.appendChild(svg);

  // anime.js 动画
  const anim = animate(circles, {
    cx: stagger((el, i) => {
      const angle = baseAngles[i] + (i * 0.5) % (Math.PI * 2);
      return 400 + Math.cos(angle) * (blobSize + ((i % 11) - 5) * morphAmplitude / 5);
    }, { start: 'center' }),
    cy: stagger((el, i) => {
      const angle = baseAngles[i] + (i * 0.3) % (Math.PI * 2);
      return 400 + Math.sin(angle) * (blobSize + ((i % 7) - 3) * morphAmplitude / 5);
    }, { start: 'center' }),
    duration,
    ease: 'inOutSine',
    alternate: true,
    loop: 0,    // ← HyperFrames: 不循环
    autoplay: false  // ← HyperFrames: 手动 seek
  });

  return { svg, anim };
}
```

## HyperFrames 注意

- ✅ 用均匀分布 `i / count * 2π` 替代 `Math.random()`
- ✅ `autoplay: false` + `loop: 0`
- ✅ 注册到 `window.__timelines`: `{ seek: (t) => anim.seek(t % duration) }`（如需循环感）
