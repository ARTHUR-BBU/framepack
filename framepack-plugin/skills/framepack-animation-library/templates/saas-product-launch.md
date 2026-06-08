---
name: saas-product-launch
title: "SaaS 产品发布模板 · Product Launch Template"
type: template
category: product-launch
total_duration: "45-75s"
format: ["16:9", "9:16", "1:1"]
blocks:
  - "[[hero-3d-device-spin]]"
  - "[[kinetic-caption-burst]]"
  - "[[card-cascade-reveal]]"
  - "[[bento-stagger-reveal]]"
  - "[[cta-impact-card]]"
used_for:
  - "Product Hunt 发布"
  - "SaaS Landing Page Hero"
  - "功能更新公告"
  - "Investor Pitch Deck"
---

# SaaS 产品发布模板

> **适用场景**：你要发布一个软件产品（SaaS/App/工具），需要一个 45-75 秒的发布视频。
>
> **叙事策略**：Hook 抓眼球 → 秀产品界面 → 展示核心功能 → 制造信任/社交证明 → 强力 CTA。
>
> **节奏**：快-中-快-中-爆炸。不要匀速——好的商业视频像过山车，有起伏。

## 场景序列

```yaml
scenes:
  - id: hook-3d-reveal
    timing: "0s - 8s"
    block: "[[hero-3d-device-spin]]"
    params:
      device: "macbook"
      screenshot: "$USER_UPLOAD_01"  # ← Agent 从 ASSETS.md 获取
      camera_move: "orbit-left-to-right"
      background: "gradient-brand"
    narrative_beat: "Hook — 产品在 3D MacBook 上旋转展示，观众立刻知道这是关于什么的"
    energy: "high"

  - id: problem-statement
    timing: "8s - 12s"
    block: "[[kinetic-caption-burst]]"
    params:
      lines:
        - "Your pipeline is leaking deals"
        - "and you don't even know it"
      style: "split-reveal"
      color: "brand-primary"
    narrative_beat: "痛点共鸣 — 用动态文字砸出用户最痛的那个点"
    energy: "medium → building"

  - id: feature-showcase
    timing: "12s - 26s"
    block: "[[card-cascade-reveal]]"
    params:
      card_count: 4
      layout: "fan"
      stagger: 0.12
      color_theme: "gradient-cool"
      rotation_intensity: "medium"
      card_content:
        - title: "AI Deal Scoring"
        - title: "Auto Follow-ups"
        - title: "Pipeline Analytics"
        - title: "Gmail Integration"
    narrative_beat: "秀肌肉 — 四个核心功能卡片扇形飞出，配合配音解说"
    energy: "high"

  - id: social-proof
    timing: "26s - 34s"
    block: "[[bento-stagger-reveal]]"
    params:
      layout: "3x2"
      tiles:
        - type: "stat"
          content: "10,000+ teams"
        - type: "logo"
          content: "$CUSTOMER_LOGOS"
        - type: "quote"
          content: "\"Cut our sales cycle by 40%\""
        - type: "stat"
          content: "4.9 ★ G2"
        - type: "logo"
          content: "$CUSTOMER_LOGOS"
        - type: "stat"
          content: "$2B in deals tracked"
    narrative_beat: "信任建立 — Bento 布局展示数据+Logo+好评，不喊口号，用证据说话"
    energy: "medium"

  - id: cta-finale
    timing: "34s - 42s"
    block: "[[cta-impact-card]]"
    params:
      headline: "Start free today"
      subtext: "No credit card required"
      url: "$PRODUCT_URL"
      style: "brand-gradient"
    narrative_beat: "收尾 — 强力 CTA，所有能量汇聚到这一个动作"
    energy: "explosive → resolve"
```

## Agent 装配指令

当你用这个 Template 做一个具体的产品视频时，需要做这些事：

1. **从 ASSETS.md 拿到截图/Logo**，映射到 `$USER_UPLOAD_01`、`$CUSTOMER_LOGOS` 等变量
2. **读每个 Block 的说明书**，确认你给的参数在它的合法范围内
3. **播一次 mental 预览**——在脑子里过一遍时间线，确认节奏不拖沓
4. **写完 COMPOSITION.md** 后提交给 Plugin 钩子，让它帮你做自动化检查
5. **写 index.html 时**引对应 Block 的代码文件，别把代码复制粘贴过来（武器库是引用源，不是复制源）

## 可选替换

如果某个 Block 不适合你的产品，可以换：

- 没有截图？把 [[hero-3d-device-spin]] 换成 [[logo-reveal-cinematic]]
- 只有 3 个功能？把 card-cascade-reveal 的 card_count 改成 3
- 不需要社交证明？把 [[bento-stagger-reveal]] 换成 [[timeline-step-progress]]（展示工作流）
- 竖屏版本？所有 Block 的 entrance_direction 改成 bottom-up 系列变体
