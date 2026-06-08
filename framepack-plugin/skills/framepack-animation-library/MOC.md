---
name: animation-library-moc
title: "Framepack 动画武器库 · 内容地图（MOC）"
description: >
  三种武器分类：Template（全桌菜谱）、Block（单道硬菜）、Part（一味调料）。
  + Library（引擎适配层）。并列关系，无层级。Agent 按任务选武器。
  从这儿开始——看分类 → 找武器 → 深入细节。
version: 0.2.1
type: moc
weapon_count: 27
---

# 动画武器库 · MOC

> **怎么用**：先看"按任务场景找武器" → 点开对应武器 → 读 frontmatter → 需要时深入代码。
> **渐进式披露**：读到这里就够了。别一口气加载所有文件——只加载你要用的。

## 武器分类（并列，非层级）

```yaml
weapons:
  template:
    label: "全桌菜谱"
    icon: "📜"
    files:
      - "[[templates/saas-product-launch]]"

  block:
    label: "单道硬菜"
    icon: "🧱"
    files:
      # ── 已有 ──
      - "[[blocks/card-cascade-reveal]]"        # 多卡片旋转翻出 · GSAP
      - "[[blocks/hero-3d-device-spin]]"        # 3D 设备旋转展示 · GSAP/Three.js
      # ── v0.2.0 新增 ──
      - "[[blocks/transitions-pack]]"           # 6 种场景转场 · GSAP+CSS
      # ── v0.2.1 新增 (nexu-io) ──
      - "[[blocks/data-chart-editorial]]"       # NYT 风数据图表 · GSAP+SVG
      - "[[blocks/sticky-flowchart]]"           # 便利贴流程图 · GSAP+SVG
      # ── 规划中 ──
      - "[[blocks/bento-stagger-reveal]]"
      - "[[blocks/kinetic-caption-burst]]"
      - "[[blocks/logo-reveal-cinematic]]"
      - "[[blocks/cta-impact-card]]"
      - "[[blocks/timeline-step-progress]]"
      - "[[blocks/data-panel-expand]]"
      - "[[blocks/speaker-lineup-reveal]]"
      - "[[blocks/countdown-timer-pulse]]"

  part:
    label: "一味调料"
    icon: "⚛️"
    files:
      # ── 已有 ──
      - "[[parts/elastic-scale-enter]]"         # 弹性缩放入场 · GSAP
      - "[[parts/text-split-enter]]"            # 文字分裂进场 · GSAP+CSS
      - "[[parts/bg-blur-mask]]"                # 背景模糊遮罩 · GSAP+CSS
      - "[[parts/number-count-up]]"             # 数字跳动 · GSAP snap
      - "[[parts/glitch-flicker]]"              # 故障闪烁 · GSAP
      # ── v0.2.0 新增 ──
      - "[[parts/caption-clip-wipe]]"           # clip-path 文字擦除 · GSAP
      - "[[parts/splittext-stagger-chars]]"     # SplitText 逐字交错 · GSAP
      - "[[parts/stagger-grid-reveal]]"         # 网格交错揭示 · GSAP stagger.grid
      - "[[parts/gradient-shift]]"              # 背景渐变流动 · GSAP CSS vars
      - "[[parts/float-3d-card]]"               # 3D 卡片悬浮 · GSAP
      - "[[parts/svg-morph-transition]]"        # SVG 形态过渡 · anime.js
      - "[[parts/particle-blob-bg]]"            # 粒子有机体背景 · anime.js
      - "[[parts/anime-text-split]]"            # 文字拆分进场 · anime.js
      # ── v0.2.1 新增 (nexu-io) ──
      - "[[parts/typewriter-cursor]]"          # 打字机光标 · GSAP
      - "[[parts/light-leak-cinema]]"          # 胶片漏光 · GSAP+CSS
      - "[[parts/sprite-animation]]"          # 精灵帧动画 · GSAP
      - "[[parts/macos-notification]]"         # macOS 通知卡片 · GSAP
      # ── 规划中 ──
      - "[[parts/glass-wipe]]"
      - "[[parts/card-shadow-lift]]"
      - "[[parts/stroke-draw]]"
      - "[[parts/spin-3d-flip]]"
      - "[[parts/parallax-drift]]"

  library:
    label: "引擎适配层"
    icon: "🔌"
    description: "动画引擎的 HyperFrames 安全包装。不写效果，只写'怎么用这个引擎做 HyperFrames 动画'。"
    files:
      - "[[libraries/anime-hyperframes-adapter]]"  # anime.js → HyperFrames 适配
```

## 按任务场景找武器

```yaml
scenarios:
  "我要做一个完整的视频":
    go_to: "[[#weapons.template]]"
    tip: "看 template，点进去。Template 里会告诉你要用哪些 Block。"

  "我要加一个炫酷的段落":
    go_to: "[[#weapons.block]]"
    tip: "翻 Block 列表。看 frontmatter 的 `pairs_well_with`。"

  "我要微调一个动画的弹性/速度/方向":
    go_to: "[[#weapons.part]]"
    tip: "从正在看的 Block 的 `depends_on` → 点开 Part → 只看 `## 参数`。"

  "我要用 anime.js 做动画":
    go_to: "[[#weapons.library]]"
    tip: "先读 [[libraries/anime-hyperframes-adapter]] 了解 HyperFrames 适配规则，再选 anime.js Part。"

  "两个场景之间怎么过渡":
    go_to: "[[blocks/transitions-pack]]"
    tip: "6 种转场一键调用。纯 GSAP+CSS，零外部依赖。"
```

## 引用关系图

```yaml
references:
  "[[templates/saas-product-launch]]":
    uses_blocks: ["[[blocks/hero-3d-device-spin]]", "[[blocks/card-cascade-reveal]]", "[[blocks/transitions-pack]]", "[[blocks/kinetic-caption-burst]]", "[[blocks/cta-impact-card]]"]

  "[[blocks/card-cascade-reveal]]":
    uses_parts: ["[[parts/elastic-scale-enter]]", "[[parts/bg-blur-mask]]", "[[parts/float-3d-card]]"]
    used_by: ["[[templates/saas-product-launch]]"]
    pairs_with: ["[[blocks/hero-3d-device-spin]]", "[[blocks/transitions-pack]]"]

  "[[blocks/hero-3d-device-spin]]":
    uses_parts: ["[[parts/bg-blur-mask]]", "[[parts/gradient-shift]]", "[[parts/particle-blob-bg]]"]
    used_by: ["[[templates/saas-product-launch]]"]
    pairs_with: ["[[blocks/card-cascade-reveal]]", "[[blocks/transitions-pack]]"]

  "[[blocks/transitions-pack]]":
    notes: "6 种转场，独立使用。不需要 Part 支持。"

  "[[parts/splittext-stagger-chars]]":
    used_by: ["[[blocks/kinetic-caption-burst]]"]
    pairs_with: ["[[parts/anime-text-split]]"]  # GSAP vs anime.js 两个引擎的同功能武器

  "[[parts/stagger-grid-reveal]]":
    used_by: ["[[blocks/bento-stagger-reveal]]", "[[blocks/card-cascade-reveal]]"]

  "[[parts/number-count-up]]":
    used_by: ["[[blocks/data-panel-expand]]", "[[blocks/cta-impact-card]]"]

  "[[parts/glitch-flicker]]":
    used_by: ["[[blocks/cta-impact-card]]", "[[blocks/kinetic-caption-burst]]"]

  "[[parts/caption-clip-wipe]]":
    used_by: ["[[blocks/kinetic-caption-burst]]"]

  "[[parts/gradient-shift]]":
    used_by: ["[[blocks/hero-3d-device-spin]]"]

  "[[parts/float-3d-card]]":
    used_by: ["[[blocks/card-cascade-reveal]]"]

  "[[parts/svg-morph-transition]]":
    engine: "anime.js"
    used_by: ["[[blocks/logo-reveal-cinematic]]"]

  "[[parts/particle-blob-bg]]":
    engine: "anime.js"
    used_by: ["[[blocks/hero-3d-device-spin]]"]

  "[[parts/anime-text-split]]":
    engine: "anime.js"
    used_by: ["[[blocks/kinetic-caption-burst]]"]
    pairs_with: ["[[parts/splittext-stagger-chars]]"]

  # ── v0.2.1 新增 ──
  "[[blocks/data-chart-editorial]]":
    used_by: ["[[templates/data-shock-explain]]"]
    pairs_with: ["[[blocks/transitions-pack]]", "[[parts/number-count-up]]"]

  "[[blocks/sticky-flowchart]]":
    used_by: ["[[templates/data-shock-explain]]"]
    pairs_with: ["[[blocks/transitions-pack]]"]

  "[[parts/typewriter-cursor]]":
    used_by: ["[[blocks/kinetic-caption-burst]]", "[[blocks/hero-3d-device-spin]]"]
    pairs_with: ["[[parts/glitch-flicker]]"]

  "[[parts/light-leak-cinema]]":
    used_by: ["[[blocks/logo-reveal-cinematic]]", "[[blocks/hero-3d-device-spin]]"]
    pairs_with: ["[[blocks/transitions-pack]]"]
```

## 引擎支持矩阵

```yaml
engines:
  gsap:
    weapons: 17
    adapter: "built-in — GSAP 原生 seek() 支持，直接兼容 HyperFrames"
    parts: [elastic-scale-enter, text-split-enter, bg-blur-mask, number-count-up, glitch-flicker, caption-clip-wipe, splittext-stagger-chars, stagger-grid-reveal, gradient-shift, float-3d-card, typewriter-cursor, light-leak-cinema, sprite-animation, macos-notification]
    blocks: [card-cascade-reveal, hero-3d-device-spin, transitions-pack, data-chart-editorial, sticky-flowchart]

  anime:
    weapons: 4
    adapter: "[[libraries/anime-hyperframes-adapter]] — anime.js v4+ 原生 seek()，需 autoplay:false"
    parts: [svg-morph-transition, particle-blob-bg, anime-text-split]
    blocks: []
```

## 给 Agent 的五条铁律

1. **别一口气全加载**——看 MOC → 锁定目标 → 只加载你要用的文件。27 个武器不是让你全读的。
2. **代码在 references/ 里**——说明书展示核心结构和参数。完整实现去 `references/*.js`。
3. **WikiLink 可以精确到章节**——`[[blocks/card-cascade-reveal#parameters]]` 更好。
4. **双引擎，不翻译**——GSAP 和 anime.js 武器各自原生。不要尝试把 anime.js 效果"翻译"成 GSAP。
5. **Renderer 约束**——所有武器遵循 HyperFrames 三禁：no Math.random(), no repeat:-1, autoplay:false + window.__timelines。
