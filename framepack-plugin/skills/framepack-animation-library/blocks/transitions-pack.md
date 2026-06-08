---
name: transitions-pack
title: "转场效果包 · Transition Effects Pack"
type: block
category: transition
duration: "0.5-1.5s per effect"
gsap_version: "3.x"
depends_on: []
pairs_well_with: "任何场景切换"
used_by: "所有 Template"
---

# Transition Effects Pack

> **一句话**：6 种 HyperFrames-safe 场景转场效果，纯 GSAP + CSS，无 shader 依赖。
>
> **跟 HyperFrames Catalog 的区别**：官方 Catalog 的转场用 WebGL shader，需要 `npx hyperframes add`。我们这个用 GSAP + CSS filter/transform/clip-path，零外部依赖，HyperFrames 直接渲染。

## 包含的转场

```yaml
transitions:
  whip-pan:
    description: "快速横向甩镜——当前场景飞出左边，下一场景从右边飞入"
    duration: "0.5s"
    visual: "像摄像机快速左右甩"

  cinematic-zoom:
    description: "电影级缩放模糊——旧场景放大+模糊消失，新场景从模糊中清晰"
    duration: "0.8s"
    visual: "像镜头快速推拉"

  flash-white:
    description: "白闪过渡——瞬间全白，然后下一场景出现"
    duration: "0.4s"
    visual: "相机闪光灯效果"

  glitch:
    description: "数字故障——画面错位+色散+噪点，适合科技/游戏视频"
    duration: "0.6s"
    visual: "黑客帝国风格的数据故障"

  slide-up:
    description: "上滑推入——新场景从下方滑入覆盖旧场景"
    duration: "0.6s"
    visual: "像卡片从底部推上来"

  circle-reveal:
    description: "圆形揭示——从中心点放大的圆形裁剪揭示新场景"
    duration: "0.7s"
    visual: "像光圈打开"
```

## 参数（共用）

```yaml
parameters:
  type:
    type: enum
    options: [whip-pan, cinematic-zoom, flash-white, glitch, slide-up, circle-reveal]
    default: whip-pan

  direction:
    type: enum
    options: [left, right, up, down]
    default: left
    note: "仅 whip-pan 和 slide-up 使用"

  intensity:
    type: enum
    options: [subtle, medium, heavy]
    default: medium
    note: "控制效果强度。cinematic-zoom 影响模糊量，glitch 影响错位幅度"

  duration:
    type: float
    range: [0.3, 1.5]
    default: 0.5
```

## 用法

```js
// 在你的场景切换处调用
applyTransition(timeline, sceneOut, sceneIn, {
  type: 'whip-pan',
  direction: 'left',
  intensity: 'medium',
  duration: 0.5
});
```

## 代码

> ⚠️ 完整实现: `references/transitions-pack.js`

```js
function applyTransition(tl, sceneOut, sceneIn, opts) {
  const { type, direction, intensity, duration } = opts;

  switch (type) {
    case 'whip-pan':
      const dir = direction === 'left' ? -1 : 1;
      const dist = { subtle: 300, medium: 500, heavy: 800 }[intensity];
      tl.to(sceneOut, {
        x: dir * -dist, filter: 'blur(12px)', opacity: 0,
        duration, ease: 'power3.in'
      }, '<');
      tl.fromTo(sceneIn,
        { x: dir * dist, filter: 'blur(12px)', opacity: 0 },
        { x: 0, filter: 'blur(0px)', opacity: 1,
          duration, ease: 'power3.out' },
        '<'
      );
      break;

    case 'cinematic-zoom':
      const blurAmt = { subtle: 8, medium: 16, heavy: 24 }[intensity];
      tl.to(sceneOut, {
        scale: 1.3, filter: `blur(${blurAmt}px)`, opacity: 0,
        duration, ease: 'power2.in'
      }, '<');
      tl.fromTo(sceneIn,
        { scale: 0.8, filter: `blur(${blurAmt}px)`, opacity: 0 },
        { scale: 1, filter: 'blur(0px)', opacity: 1,
          duration: duration * 0.7, ease: 'power2.out' },
        `+=${duration * 0.3}`
      );
      break;

    case 'flash-white':
      // 用白色 overlay 遮罩，瞬间全白后消失
      // → 见 references/transitions-pack.js
      break;

    case 'glitch':
      // 随机 clip 偏移 + RGB 通道分离
      // → 见 references/transitions-pack.js
      break;

    case 'slide-up':
      // translateY 推入
      break;

    case 'circle-reveal':
      // clip-path: circle() 放大
      break;
  }
  return tl;
}
```

## HyperFrames 注意事项

- ✅ 所有效果纯 GSAP/CSS，无 WebGL/shader 依赖
- ✅ 无 `Math.random()`，无 `repeat: -1`
- ⚠️ `filter: blur()` 在部分旧 Chrome 可能性能差——HyperFrames 渲染用最新 Chromium，无问题
- ⚠️ `clip-path: circle()` 动画在 Safari 可能有兼容问题——HyperFrames 用 Chromium，无问题
