---
name: hero-3d-device-spin
title: "3D 设备旋转展示 · Hero 3D Device Spin"
type: block
category: showcase
duration: "8-12s"
gsap_version: "3.x"
threejs_version: "r160+"
depends_on: ["[[parts/bg-blur-mask]]", "[[parts/spin-3d-flip]]"]
pairs_well_with: ["[[blocks/kinetic-caption-burst]]", "[[blocks/card-cascade-reveal]]"]
used_by: ["[[templates/saas-product-launch]]", "[[templates/app-store-preview]]"]
external_dep: "HyperFrames Catalog: `npx hyperframes add vfx-iphone-device`（提供 GLTF 模型 + HTML-in-Canvas 基础设施）"
---

# Hero 3D Device Spin

> **一句话**：3D 设备模型（iPhone/MacBook）旋转展示，截图投影到屏幕上，摄像机绕飞。
>
> **这是 Motionfly 观感作弊器的基石**——内容没变，加了 3D 空间感，肉眼觉得"贵"。
>
> **实现路径**：HyperFrames Catalog 已经有 `vfx-iphone-device` Block（GLTF 模型 + HTML-in-Canvas），我们的武器是在此基础上封装参数化接口。

## 两种使用模式

```yaml
modes:
  external_catalog:
    description: "直接使用 HyperFrames 官方 vfx-iphone-device Block"
    how: "npx hyperframes add vfx-iphone-device → 引入 composition → 参数化截图和摄像机路径"
    pros: "真实 GLTF 模型、photorealistic 渲染、360° 转盘"
    cons: "需 HyperFrames CLI、需 Chrome flag、模型文件大(~5MB)"

  lightweight_css3d:
    description: "纯 CSS 3D transforms 模拟设备旋转（无 GLTF 依赖）"
    how: "CSS perspective + rotateY + 截图 overlay"
    pros: "零外部依赖、轻量(~2KB)、任意设备形状"
    cons: "无 photorealism、无反射/材质"
```

## 参数

```yaml
parameters:
  device:
    type: enum
    options: [iphone, macbook, ipad, watch, generic-card]
    default: macbook

  screenshot:
    type: url
    description: "要投影到设备屏幕上的截图 URL"

  camera_path:
    type: enum
    options: [orbit-left, orbit-right, zoom-in, turntable-360, tilt-reveal]
    default: orbit-left

  background:
    type: enum
    options: [gradient-brand, dark-studio, light-studio, transparent]
    default: gradient-brand

  duration:
    type: float
    range: [6, 15]
    default: 10

  show_glow:
    type: bool
    default: true
    description: "是否显示屏幕发光效果"
```

## 代码（lightweight CSS 3D 模式）

> ⚠️ 外部模式文档: `references/hero-3d-device-spin--catalog.md`
> ⚠️ CSS 3D 完整实现: `references/hero-3d-device-spin.js`

```js
// 轻量版：纯 CSS 3D + GSAP 摄像机模拟
function buildDeviceSpin(container, params) {
  const { device, screenshot, cameraPath, duration } = params;
  const tl = gsap.timeline({ paused: true });

  // 1. 创建设备外壳 + 屏幕容器
  const deviceShell = createDeviceFrame(container, device);
  const screen = createScreen(deviceShell, screenshot);

  // 2. 摄像机路径
  const paths = {
    'orbit-left':  { rotateY: [-15, 25], x: [0, -60], duration },
    'orbit-right': { rotateY: [25, -15], x: [0, 60], duration },
    'zoom-in':     { scale: [0.7, 1.15], duration },
    'turntable-360': { rotateY: [0, 360], duration },
    'tilt-reveal': { rotateX: [-30, 0], rotateY: [10, -5], duration }
  };

  const path = paths[cameraPath];
  tl.fromTo(deviceShell, path, { ease: 'power2.inOut' });

  // 3. 屏幕发光（可选）
  if (params.showGlow) {
    tl.fromTo(screen, { boxShadow: '0 0 0px rgba(100,150,255,0)' },
              { boxShadow: '0 0 40px rgba(100,150,255,0.4)', duration: 0.6 }, '<');
  }

  return tl;
}
```

## CSS 3D 设备外壳模板

```css
.device-macbook {
  width: 600px; height: 380px;
  background: #1a1a1a;
  border-radius: 12px 12px 2px 2px;
  padding: 12px;
  position: relative;
  transform-style: preserve-3d;
  perspective: 1200px;
}
.device-macbook::after { /* 底座 */
  content: ''; position: absolute; bottom: -8px;
  left: 50%; transform: translateX(-50%);
  width: 200px; height: 6px;
  background: #222; border-radius: 0 0 4px 4px;
}
.device-screen {
  width: 100%; height: 100%;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}
.device-screen img {
  width: 100%; height: 100%;
  object-fit: cover; /* 截图覆盖整个屏幕区域 */
}
```

## 外部模式使用指南

如果要用 HyperFrames Catalog 的 GLTF 真 3D：

```bash
npx hyperframes add vfx-iphone-device
```

然后在 host composition 中引用：

```html
<div data-composition-id="vfx-iphone-device"
     data-composition-src="compositions/vfx-iphone-device.html"
     data-start="0" data-duration="15"
     data-track-index="1"
     data-width="1920" data-height="1080">
</div>
```

修改 `compositions/vfx-iphone-device.html` 中的截图路径。

## 注意事项

- CSS 3D 模式用 `transform-style: preserve-3d` + `perspective`，HyperFrames 完全支持
- GLTF 模式需 `chrome://flags/#canvas-draw-element`（渲染时 CLI 自动开启）
- 两种模式都注册到 `window.__timelines`
