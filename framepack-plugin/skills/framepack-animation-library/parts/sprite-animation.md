---
name: sprite-animation
title: "精灵帧动画 · Sprite Sheet Animation"
type: part
category: visual-fx
gsap_version: "3.x"
used_by: ["[[blocks/hero-3d-device-spin]]", "[[blocks/cta-impact-card]]"]
---

# Sprite Sheet Animation

> **一句话**：把一长条精灵图按帧逐格播放——像翻页动画。游戏/插画风视频的灵魂武器。

## 参数

```yaml
parameters:
  sprite_url:
    type: url
    description: "精灵图 URL（水平排列所有帧的长条图）"

  frame_count:
    type: int
    default: 12

  frame_width:
    type: int
    note: "单帧宽度 px"

  frame_height:
    type: int
    note: "单帧高度 px"

  fps:
    type: float
    default: 12
    range: [6, 30]

  direction:
    type: enum
    options: [horizontal, vertical]
    default: horizontal

  loop_count:
    type: int
    default: 1
    note: "播放次数。HyperFrames 用固定数字，不是 -1"

  ping_pong:
    type: bool
    default: false
    note: "是否正反交替播放"
```

## 代码

```js
function spriteAnimation(tl, el, opts = {}, position = '>') {
  const { frameCount = 12, frameWidth = 200, frameHeight = 200,
          fps = 12, direction = 'horizontal', loopCount = 1,
          pingPong = false, spriteUrl = '' } = opts;

  if (spriteUrl) {
    el.style.backgroundImage = `url(${spriteUrl})`;
  }
  el.style.backgroundSize = direction === 'horizontal'
    ? `${frameWidth * frameCount}px ${frameHeight}px`
    : `${frameWidth}px ${frameHeight * frameCount}px`;
  el.style.width = `${frameWidth}px`;
  el.style.height = `${frameHeight}px`;
  el.style.backgroundRepeat = 'no-repeat';

  const frameDuration = 1 / fps;
  const totalFrames = pingPong ? frameCount * 2 - 2 : frameCount;
  const totalLoops = loopCount;

  // 生成确定性的帧序列——不用 setInterval，用 GSAP stepped keyframes
  const keyframes = [];
  for (let loop = 0; loop < totalLoops; loop++) {
    for (let f = 0; f < frameCount; f++) {
      const offset = direction === 'horizontal'
        ? `${-(f * frameWidth)}px 0px`
        : `0px ${-(f * frameHeight)}px`;
      keyframes.push(offset);
    }
    // Ping-pong: reverse
    if (pingPong && loop < totalLoops - 1) {
      for (let f = frameCount - 2; f > 0; f--) {
        const offset = direction === 'horizontal'
          ? `${-(f * frameWidth)}px 0px`
          : `0px ${-(f * frameHeight)}px`;
        keyframes.push(offset);
      }
    }
  }

  // 用单个 tween + stepped ease 逐帧跳
  const animObj = { frame: 0 };
  tl.to(animObj, {
    frame: keyframes.length - 1,
    duration: keyframes.length * frameDuration,
    ease: 'none',
    onUpdate: () => {
      const idx = Math.round(animObj.frame);
      el.style.backgroundPosition = keyframes[idx];
    }
  }, position);

  return tl;
}
```

## 使用示例

```html
<!-- 精灵图: 12 帧水平排列，每帧 200×200 -->
<div class="sprite-character"
     style="background-image:url(assets/run-cycle.png);
            width:200px;height:200px;">
</div>
```

```js
spriteAnimation(tl, document.querySelector('.sprite-character'), {
  frameCount: 12, frameWidth: 200, frameHeight: 200,
  fps: 12, loopCount: 3, pingPong: true
});
```

## HyperFrames 注意

- ✅ 所有帧序列是预设的——GSAP 的 `onUpdate` 用 `Math.round` 取帧索引，确定
- ✅ `loopCount` 是固定数字，不是 `-1`
- ⚠️ 精灵图需在 setup 阶段预加载（`new Image()` onload），渲染时确保已就绪
- ⚠️ `backgroundPosition` 动画在 Chromium 中性能好，但大图（>2048px 宽）可能触发纹理限制
