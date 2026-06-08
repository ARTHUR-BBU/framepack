---
name: macos-notification
title: "macOS 通知卡片 · Notification Card"
type: part
category: overlay
gsap_version: "3.x"
used_by: ["[[blocks/cta-impact-card]]", "[[blocks/hero-3d-device-spin]]"]
---

# macOS Notification Card

> **一句话**：macOS 风格的通知横幅从右上角滑入——"有人刚注册"、"新评论"、"系统提醒"。社交证明类视频的标配武器。

## 参数

```yaml
parameters:
  title:
    type: string
    default: "New Signup"

  body:
    type: string
    default: "Someone from San Francisco just joined"

  app_icon:
    type: emoji_or_url
    default: "🔔"

  app_name:
    type: string
    default: "Product"

  timestamp:
    type: string
    default: "now"
    note: "显示的时间"

  position:
    type: enum
    options: [top-right, top-left, bottom-right]
    default: top-right

  slide_direction:
    type: enum
    options: [from-right, from-left, from-bottom]
    default: from-right

  auto_dismiss:
    type: bool
    default: true
    note: "是否展示几秒后自动滑出"

  display_duration:
    type: float
    default: 3
    note: "展示多久后消失"

  stagger_delay:
    type: float
    default: 0
    note: "多个通知时的错峰延迟"
```

## 代码

```js
function showMacOSNotification(tl, container, opts = {}, position = '>') {
  const { title = 'New Signup', body = 'Someone just joined',
          appIcon = '🔔', appName = 'Product', timestamp = 'now',
          slideDirection = 'from-right', autoDismiss = true,
          displayDuration = 3 } = opts;

  // ── 创建通知卡片 ──
  const card = document.createElement('div');
  card.style.cssText = [
    'position:absolute;top:24px;right:24px',
    'background:rgba(30,30,32,0.92)',
    'backdrop-filter:blur(20px)',
    '-webkit-backdrop-filter:blur(20px)',
    'border-radius:14px;padding:16px 20px',
    'min-width:320px;max-width:380px',
    'color:#f5f5f7;font-family:-apple-system,Inter,sans-serif',
    'box-shadow:0 8px 32px rgba(0,0,0,0.4),0 0 0 0.5px rgba(255,255,255,0.1)',
    'z-index:50;opacity:0'
  ].join(';');

  card.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px">
      <div style="font-size:28px;flex-shrink:0;width:40px;height:40px;
                  display:flex;align-items:center;justify-content:center;
                  background:rgba(255,255,255,0.08);border-radius:10px">
        ${appIcon}
      </div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:13px;font-weight:600;letter-spacing:-0.01em">${appName}</span>
          <span style="font-size:11px;opacity:0.5">${timestamp}</span>
        </div>
        <div style="font-size:14px;font-weight:500;line-height:1.3;margin-bottom:2px">${title}</div>
        <div style="font-size:12px;opacity:0.7;line-height:1.4">${body}</div>
      </div>
    </div>
  `;

  container.appendChild(card);

  // ── 动画 ──
  const dirMap = {
    'from-right':  { fromX: 400, fromY: 0 },
    'from-left':   { fromX: -400, fromY: 0 },
    'from-bottom': { fromX: 0, fromY: 400 },
  };
  const dir = dirMap[slideDirection];

  // 滑入
  tl.fromTo(card,
    { x: dir.fromX, y: dir.fromY, opacity: 0, scale: 0.9 },
    { x: 0, y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)' },
    position
  );

  // 自动消失
  if (autoDismiss && displayDuration > 0) {
    tl.to(card, { opacity: 0, scale: 0.95, x: dir.fromX * 0.5, duration: 0.3, ease: 'power2.in' },
      `>+${displayDuration}`);
  }

  return tl;
}
```

## 多个通知堆叠

```js
// 3 条通知依次滑入，错峰 1 秒
const notifications = [
  { title:'New Signup',      body:'Sarah from NYC just joined',   appIcon:'👤' },
  { title:'New Comment',     body:'"This is incredible!" – Alex', appIcon:'💬' },
  { title:'Payment Received',body:'$299/yr · Pro Plan',           appIcon:'💳' },
];

notifications.forEach((n, i) => {
  showMacOSNotification(tl, container, {
    ...n, appName:'LaunchPad', timestamp:'just now',
    staggerDelay: i, displayDuration: 2.5
  });
});
```

## HyperFrames 注意

- ✅ 所有动画完全确定性——无 Math.random()、无 setInterval
- ✅ `backdrop-filter: blur()` 在 HyperFrames Chromium 中正常渲染（GPU 加速）
- ⚠️ 多个通知叠加时注意 z-index 层级（后来的在上层）
- ⚠️ `-webkit-backdrop-filter` 是 Chromium 兼容前缀
