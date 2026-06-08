---
name: card-cascade-reveal
title: "多卡片旋转翻出 · Card Cascade Reveal"
type: block
category: showcase
duration: "4-6s"
gsap_version: "3.x"
depends_on: ["[[parts/elastic-scale-enter#代码]]", "[[parts/card-shadow-lift#代码]]", "[[parts/bg-blur-mask#代码]]"]
pairs_well_with: ["[[blocks/hero-3d-device-spin]]", "[[blocks/cta-impact-card]]", "[[blocks/kinetic-caption-burst]]"]
used_by: ["[[templates/saas-product-launch]]", "[[templates/event-summit-promo]]", "[[templates/data-shock-explain]]"]
---

# Card Cascade Reveal

> **一句话**：3-5 张卡片从画面中心依次旋转+缩放飞出，最后定格成扇形或网格排布。
>
> **什么时候用**：你要并列展示多个功能/产品/数据点/嘉宾/卖点，且需要视觉冲击力。不适合单个内容或连续叙事。

## 视觉效果（给人类看的描述）

想象一副扑克牌从手里扇形甩开——但每张牌都带着 3D 旋转，飞出去的过程中从半透明变成实色，落定时微微弹跳一下。背景模糊变暗，聚光灯打在这些卡片上。

观众感受：**"哇，好多好东西"**——信息密度感 + 视觉愉悦感。

## 参数

> Agent 装配时从这儿读取可调参数。详细说明见 [[blocks/card-cascade-reveal#参数说明]]

```yaml
parameters:
  card_count:        { type: int,    range: [3,6],   default: 4 }
  layout:            { type: enum,   options: [fan, grid, stacked-left], default: fan }
  card_width:        { type: css,    default: "280px" }
  gap:               { type: css,    default: "24px" }
  stagger:           { type: float,  range: [0.08,0.3], default: 0.12 }
  rotation_intensity:{ type: enum,   options: [subtle, medium, dramatic], default: medium }
  depth_3d:          { type: bool,   default: true }
  color_theme:       { type: string, default: "inherit", options: [inherit, gradient-cool, gradient-warm, glass] }
  entrance_direction:{ type: enum,   options: [center-spread, left-to-right, bottom-up], default: center-spread }
```

## 参数说明

- **card_count**: 超过6张会挤，除非超宽屏
- **layout**: `fan`=扇形散开，`grid`=网格，`stacked-left`=左侧堆叠+右侧留白放文字
- **stagger**: 每张卡片之间的延迟（秒）。0.08=密集爆发，0.3=从容展开
- **rotation_intensity**: `subtle`=±3°轻微倾斜，`medium`=±8°明显旋转，`dramatic`=±15°大幅旋转
- **depth_3d**: 是否启用 CSS 3D 透视。关闭则变纯 2D 缩放
- **color_theme**: `inherit`=跟随品牌色变量，`gradient-cool`=冷色渐变，`gradient-warm`=暖色，`glass`=毛玻璃
- **entrance_direction**: 卡片起始位置和扩散方向

## 叙事位置

```
[Hook 开场] → [← 你在这儿] → [价值阐述/文字] → [CTA 收尾]
```

通常出现在视频的 **15%-40% 位置**——hook 抓住了注意力，现在是秀肌肉的时候。

## 依赖的 Part

| Part | 在这个 Block 里的作用 |
|------|---------------------|
| [[parts/elastic-scale-enter]] | 每张卡片出现时的弹跳效果 |
| [[parts/card-shadow-lift]] | 卡片飞到位后阴影逐渐加深，制造"浮起来"感 |
| [[parts/bg-blur-mask]] | 卡片飞出时背景高斯模糊，聚光灯效果 |

## 代码

> ⚠️ 完整实现: `references/card-cascade-reveal.js`
>
> 下面是核心结构——让 Agent 快速理解逻辑，不要从这里复制粘贴。

```js
// 核心：GSAP timeline 骨架
function buildCardCascade(container, params) {
  const { cardCount, layout, stagger, rotationIntensity, depth3d } = params;
  const tl = gsap.timeline({ paused: true });
  const cards = createCards(container, cardCount, params);

  // 1. 背景模糊遮罩 → 见 references/card-cascade-reveal.js:12
  bgBlurMask(tl, container, { duration: 0.4 });

  // 2. 卡片依次飞出，弹性入场
  const rot = { subtle: 3, medium: 8, dramatic: 15 }[rotationIntensity];
  cards.forEach((card, i) => {
    const angle = layout === 'fan'
      ? (i - (cardCount - 1) / 2) * rot
      : 0;
    tl.fromTo(card,
      { opacity: 0, scale: 0.6, rotation: angle * 1.5, y: 60 },
      { opacity: 1, scale: 1, rotation: angle, y: 0,
        duration: 0.55, ease: 'back.out(1.4)' },
      i * stagger
    );
    // 阴影抬起 → 见 references/card-cascade-reveal.js:28
  });
  return tl;
}
```

## HyperFrames 注意事项

- ✅ `paused: true` 创建 timeline
- ✅ 推入 `window.__timelines`
- ✅ 无 `Math.random()`，无 `repeat: -1`
- ⚠️ 3D 透视（`perspective`）在场景容器上设，别设在卡片上

## 变体

- **with-text**: 卡片飞出同时显示对应文字标签 → `references/card-cascade-reveal--with-text.js`
- **vertical**: 竖屏版（9:16），从下往上飞出 → `references/card-cascade-reveal--vertical.js`
- **photo**: 用照片/截图代替纯色卡片 → `references/card-cascade-reveal--photo.js`
