# VIDEO DNA — 参考视频精细结构提取

**源文件**: BRfa-7TK9XikwBZk.mp4
**时长**: 63s | **分辨率**: 1920×1012 | **帧率**: 23.976fps | **大小**: 12MB
**类型**: AI/科技服务发布视频

---

## 逐秒分镜 + 技术复现方案

### SEGMENT 1: DARK OPEN（0-4s）

| 秒 | 画面 | 动画技法 | GSAP / CSS HOW-TO |
|----|------|---------|-------------------|
| 0s | 纯黑 #000000，中心有一个极暗的圆形光晕开始扩大 | 径向渐变放大 | `background: radial-gradient(circle at center, #0a1a2e 0%, #000 60%)` + `gsap.from(".glow", {scale:0.3, opacity:0, duration:1.5, ease:"power2.out"})` |
| 1s | 光晕扩大，中心出现微弱的网格线（细线，约 60px 间距） | 网格线淡入 | CSS `background-size: 60px 60px; background-image: linear-gradient(rgba(0,212,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.06) 1px, transparent 1px)` + `tl.fromTo(".grid", {opacity:0}, {opacity:1, duration:1})` |
| 2s | 网格变亮，远处有细小的光点（4-6个）随机闪烁 | 粒子闪烁 | 每个点 `tl.fromTo(dot, {opacity:0, scale:0.5}, {opacity:0.8, scale:1, duration:0.3, stagger:0.15, ease:"power2.out"})` |
| 3s | 光点向中心聚拢，形成品牌Logo轮廓 | 聚拢动画 | `tl.to(dots, {x:0, y:0, duration:0.8, ease:"power3.in"})` |

**素材清单**:
- 🔴 品牌 Logo（SVG 矢量图，用于粒子和最终形态）
- 🔴 BGM 开场音效（低频嗡鸣，渐强）
- 🟡 网格背景纹理（CSS 可实现，无需图片）

---

### SEGMENT 2: BRAND REVEAL（4-8s）

| 秒 | 画面 | 动画技法 | GSAP / CSS HOW-TO |
|----|------|---------|-------------------|
| 4s | Logo 以缩放+发光方式出现（scale 从 1.5 缩到 1.0，带蓝色辉光） | Impact Pop + 发光 | `tl.fromTo(".logo", {scale:1.5, opacity:0, filter:"blur(20px) brightness(3)"}, {scale:1, opacity:1, filter:"blur(0px) brightness(1)", duration:0.6, ease:"power3.out"})` |
| 5s | Logo 稳定显示，底部出现一条水平扫描线从左到右划过 | Sweep Line | `tl.fromTo(".sweep", {scaleX:0, transformOrigin:"left center"}, {scaleX:1, duration:0.4, ease:"power2.inOut"})` |
| 6s | 扫描线消失，Logo下方出现产品名称（白色大字，约120px） | 文字上滑入场 | `tl.fromTo(".product-name", {y:40, opacity:0}, {y:0, opacity:1, duration:0.5, ease:"power3.out"})` |
| 7s | 产品名稳定，副标题从下方滑入（灰色，约36px） | Slide Up | `tl.fromTo(".subtitle", {y:30, opacity:0}, {y:0, opacity:1, duration:0.4, ease:"power3.out"}, "-=0.2")` |

**素材清单**:
- 🔴 Logo SVG（已复用 SEGMENT 1）
- 🔴 产品名称文案
- 🔴 副标题 / slogan 文案
- 🟢 扫描线音效

---

### SEGMENT 3: FEATURE CAROUSEL（8-18s）

**结构**: 3 个功能点，每个约 3.3s，用硬切（white flash）连接

| 秒 | 画面 | 动画技法 | GSAP / CSS HOW-TO |
|----|------|---------|-------------------|
| 8s | 白闪（0.05s）→ 功能1标题砸入 + 右侧产品截图滑入 | Flash + Split Entry | `tl.to(".flash", {opacity:0.9, duration:0.03}); tl.to(".flash", {opacity:0, duration:0.04}); tl.fromTo(".feat1-title", {y:100, opacity:0, scale:0.8}, {y:0, opacity:1, scale:1, duration:0.4, ease:"back.out(1.5)"}); tl.fromTo(".feat1-screenshot", {x:200, opacity:0}, {x:0, opacity:1, duration:0.5, ease:"power3.out"}, "-=0.2")` |
| 9s | 截图上出现2-3个标注点（小圆点 + 连线 + 文字说明），依次弹出 | Stagger Pop | 标注点用 `stagger:0.25, duration:0.3, ease:"back.out(2)"` |
| 10s | 标注点稳定显示 1s | Hold | 无动画 |
| 11s | 白闪 → 功能2，布局镜像（标题在右，截图在左） | 镜像布局 | 切换 `.feat2` 的 `flex-direction: row-reverse` |
| 12-14s | 同上模式，标注点不同 | 同上 | 同上 |
| 15s | 白闪 → 功能3，可能用全宽展示或居中大图 | 全宽变体 | `tl.fromTo(".feat3-img", {scale:1.2, opacity:0}, {scale:1, opacity:1, duration:0.5})` |
| 16-17s | 功能3的标注展示 | 同上 | 同上 |
| 18s | 整个功能段落淡出 | Dissolve Out | `tl.to(".feature-section", {opacity:0, duration:0.3})` |

**每个功能点的布局**:
```
┌─────────────────────────────────────────┐
│                                         │
│  [功能标题]          ┌──────────────┐    │
│  [一句话描述]        │              │    │
│                     │  产品截图     │    │
│  ● 标注1            │              │    │
│  ● 标注2            │              │    │
│  ● 标注3            └──────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**素材清单**:
- 🔴 3 张产品功能截图（高分辨率，1920px 宽）
- 🔴 3 个功能标题 + 描述文案
- 🔴 每个 screenshot 上的 2-3 个标注点文案
- 🟡 截图标注点设计（红点 / 蓝点 + 连线样式）

---

### SEGMENT 4: USE CASE / SCENE（18-28s）

| 秒 | 画面 | 动画技法 | GSAP / CSS HOW-TO |
|----|------|---------|-------------------|
| 18s | 背景切换为实拍场景视频（办公室/用户使用场景），视频自动播放 | Video Element | `<video data-start="18" data-duration="10" data-media-start="0" muted>` |
| 19s | 视频上叠加半透明信息卡片（毛玻璃效果），从右滑入 | Glass Card Slide | `backdrop-filter: blur(20px); background: rgba(10,22,40,0.7); border: 1px solid rgba(255,255,255,0.1)` + `tl.fromTo(".info-card", {x:300, opacity:0}, {x:0, opacity:1, duration:0.5, ease:"power3.out"})` |
| 20-22s | 信息卡片内文字逐行显示，每行间隔 0.6s | Line-by-line | `tl.fromTo(lines, {opacity:0, x:20}, {opacity:1, x:0, stagger:0.6, duration:0.4, ease:"power2.out"})` |
| 22-23s | 第一段场景视频淡出，第二段淡入（dissolve 0.5s） | Cross Dissolve | `tl.to("#scene1-video", {opacity:0, duration:0.5}); tl.fromTo("#scene2-video", {opacity:0}, {opacity:1, duration:0.5}, "-=0.3")` |
| 23-25s | 第二段场景 + 不同的信息卡片 | 同上 | 同上 |
| 25-27s | 第三段场景（可选，或切回图形展示） | 同上 | 同上 |
| 28s | 场景段落结束，整体淡出 | Fade Out | `tl.to(".scene-section", {opacity:0, duration:0.3})` |

**布局**:
```
┌─────────────────────────────────────────┐
│ [实拍视频全屏背景，opacity:0.6]          │
│                                         │
│                    ┌─────────────────┐  │
│                    │ ░░毛玻璃卡片░░  │  │
│                    │ 用户故事描述     │  │
│                    │ · 要点1          │  │
│                    │ · 要点2          │  │
│                    │ · 要点3          │  │
│                    └─────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**素材清单**:
- 🔴 2-3 段实拍视频（各 5-10s，16:9，无水印）
- 🔴 用户故事文案（每段 3-4 行）
- 🟡 毛玻璃卡片设计稿（或直接 CSS 实现）

---

### SEGMENT 5: DATA / METRICS（28-42s）

**这是全片信息密度最高的段落**

| 秒 | 画面 | 动画技法 | GSAP / CSS HOW-TO |
|----|------|---------|-------------------|
| 28s | 背景回归深色，3 个大数字依次从 0 滚动到目标值 | Number Counter | `const c={v:0}; tl.to(c,{v:12500, duration:1.5, ease:"power2.out", onUpdate:()=>{el.textContent=Math.round(c.v).toLocaleString()}})` |
| 29.5s | 第二个数字开始滚动（与第一个重叠 0.5s） | Staggered Counter | `stagger:0.8` |
| 31s | 第三个数字完成，数字下方出现百分比进度条动画 | Progress Bar | `tl.fromTo(bar, {scaleX:0, transformOrigin:"left"}, {scaleX:0.94, duration:1, ease:"power2.inOut"})` |
| 32s | 数字区域整体上移缩小，腾出下方空间给图表 | Scale Down + Move Up | `tl.to(".metrics", {y:-80, scale:0.75, duration:0.5, ease:"power3.inOut"})` |
| 33-38s | 折线图/柱状图动画绘制（从左到右逐步展现） | SVG Path Draw | `tl.fromTo(chartLine, {drawSVG:"0%"}, {drawSVG:"100%", duration:3, ease:"none"})` 或用 `stroke-dashoffset` 动画 |
| 38s | 图表上出现 2-3 个标注气泡（最高点/最低点/转折点） | Pop In | `tl.fromTo(bubbles, {scale:0, opacity:0}, {scale:1, opacity:1, stagger:0.3, duration:0.3, ease:"back.out(2)"})` |
| 39-41s | 标注稳定展示 | Hold | 无动画 |
| 42s | 数据段落淡出 | Fade Out | `tl.to(".data-section", {opacity:0, duration:0.4})` |

**布局**:
```
┌─────────────────────────────────────────┐
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │12,500│  │ 94%  │  │ 3.2x │  ← 大数字 │
│  │ 用户数│  │满意率│  │ 性能 │  ← 标签   │
│  └──────┘  └──────┘  └──────┘          │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     📈 折线图/增长曲线          │    │
│  │        ╱╲    ╱╲                 │    │
│  │    ╱╲ ╱  ╲  ╱  ╲  ← SVG 路径  │    │
│  │   ╱  ╱    ╲╱    ╲               │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**素材清单**:
- 🔴 3 个核心数据指标（数字 + 单位 + 标签）
- 🔴 增长/趋势数据（用于图表绘制）
- 🔴 图表标注点文案
- 🟡 图表配色方案（与品牌色一致）
- 🟢 SVG 图表模板（或 D3.js 渲染）

---

### SEGMENT 6: TESTIMONIAL / SOCIAL PROOF（42-50s）

| 秒 | 画面 | 动画技法 | GSAP / CSS HOW-TO |
|----|------|---------|-------------------|
| 42s | 白闪 → 客户 Logo 墙出现（2×3 或 3×4 网格），Logo 依次弹出 | Stagger Scale | `tl.fromTo(logos, {scale:0, opacity:0}, {scale:1, opacity:1, stagger:0.1, duration:0.3, ease:"back.out(1.5)"})` |
| 44s | Logo 墙上方出现标题 "Trusted by..." | Fade In | `tl.to(".trust-title", {opacity:1, duration:0.4})` |
| 45-47s | Logo 墙稳定展示 | Hold | 无动画 |
| 47s | Logo 墙缩小移到左侧，右侧滑入一条客户引言（引用样式，大引号） | Split Screen | `tl.to(".logo-wall", {x:-200, scale:0.8, duration:0.5, ease:"power3.inOut"}); tl.fromTo(".quote", {x:300, opacity:0}, {x:0, opacity:1, duration:0.5, ease:"power3.out"}, "-=0.3")` |
| 48-49s | 引言稳定展示 | Hold | 无动画 |
| 50s | 整体淡出 | Fade Out | `tl.to(".proof-section", {opacity:0, duration:0.3})` |

**布局**:
```
┌─────────────────────────────────────────┐
│  Trusted by industry leaders            │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐           │
│  │Lg1 │ │Lg2 │ │Lg3 │ │Lg4 │           │
│  └────┘ └────┘ └────┘ └────┘           │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐           │
│  │Lg5 │ │Lg6 │ │Lg7 │ │Lg8 │           │
│  └────┘ └────┘ └────┘ └────┘           │
└─────────────────────────────────────────┘

或分割布局：
┌──────────────────┬──────────────────────┐
│  Logo 墙（缩小）  │  "引言内容..."       │
│  Lg1 Lg2 Lg3     │  — 客户名, 公司      │
│  Lg4 Lg5 Lg6     │                      │
└──────────────────┴──────────────────────┘
```

**素材清单**:
- 🔴 6-8 个客户/合作伙伴 Logo（PNG 透明底，白色版）
- 🔴 1 条客户引言文案 + 来源人名和公司
- 🟡 引言样式设计（大引号、字体、间距）

---

### SEGMENT 7: VALUE SUMMARY + CTA（50-57s）

| 秒 | 画面 | 动画技法 | GSAP / CSS HOW-TO |
|----|------|---------|-------------------|
| 50s | 背景微微变亮（深蓝 → 稍亮的蓝），中心出现大标题 | Background Shift + Title | `tl.to(".bg", {background:"#0d2847", duration:0.5}); tl.fromTo(".value-title", {y:60, opacity:0}, {y:0, opacity:1, duration:0.5, ease:"power3.out"})` |
| 51s | 标题下方 3-5 个价值关键词依次弹出（每个 0.4s） | Stagger Pop | `tl.fromTo(keywords, {scale:0, opacity:0}, {scale:1, opacity:1, stagger:0.4, duration:0.3, ease:"back.out(2)"})` |
| 53s | 所有关键词就位后，整体轻微放大后回弹（呼吸感） | Scale Bounce | `tl.to(keywords, {scale:1.05, duration:0.15, ease:"power2.out"}); tl.to(keywords, {scale:1, duration:0.2, ease:"power2.in"})` |
| 54s | CTA 按钮出现（带边框发光效果），从下方弹入 | Button Reveal | `border: 2px solid #00d4ff; box-shadow: 0 0 20px rgba(0,212,255,0.3)` + `tl.fromTo(".cta", {y:40, opacity:0}, {y:0, opacity:1, duration:0.4, ease:"back.out(1.5)"})` |
| 55s | CTA 按钮持续发光脉冲（循环直到段落结束） | Glow Pulse | `tl.to(".cta", {boxShadow:"0 0 30px rgba(0,212,255,0.5)", duration:0.5, yoyo:true, repeat:2})` |

**布局**:
```
┌─────────────────────────────────────────┐
│                                         │
│        [价值主张大标题]                   │
│                                         │
│     快速  ·  安全  ·  智能  ·  可靠      │
│                                         │
│         ┌───────────────────┐           │
│         │   立即体验 →       │  ← CTA   │
│         └───────────────────┘           │
│                                         │
└─────────────────────────────────────────┘
```

**素材清单**:
- 🔴 价值主张标题文案
- 🔴 3-5 个关键词
- 🔴 CTA 按钮文案 + 链接
- 🟡 CTA 按钮样式（边框色、发光色、圆角）

---

### SEGMENT 8: BRAND OUTRO（57-63s）

| 秒 | 画面 | 动画技法 | GSAP / CSS HOW-TO |
|----|------|---------|-------------------|
| 57s | 快速白闪 → 纯深色背景，Logo 以更简洁的方式出现（无粒子，直接淡入） | Simple Fade | `tl.to(".flash", {opacity:0.8, duration:0.03}); tl.to(".flash", {opacity:0, duration:0.04}); tl.to(".outro-logo", {opacity:1, duration:0.6})` |
| 58s | Logo 下方出现品牌 slogan | Fade In | `tl.to(".slogan", {opacity:0.8, duration:0.5})` |
| 59s | 底部依次出现：官网 URL、社交媒体图标 | Stagger In | `tl.fromTo(links, {y:20, opacity:0}, {y:0, opacity:1, stagger:0.2, duration:0.3})` |
| 60-62s | 全部元素稳定展示 | Hold | 无动画 |
| 63s | 画面渐黑结束 | Fade to Black | `tl.to("#stage", {opacity:0, duration:0.8, ease:"power2.in"})` |

**布局**:
```
┌─────────────────────────────────────────┐
│                                         │
│              [品牌 Logo]                │
│           品牌Slogan标语                 │
│                                         │
│        www.example.com                  │
│     🌐  🐦  💼  📧   ← 社交图标        │
│                                         │
└─────────────────────────────────────────┘
```

**素材清单**:
- 🔴 品牌 Logo（SVG/PNG，已复用）
- 🔴 品牌 Slogan
- 🔴 官网 URL
- 🔴 社交媒体链接 + 图标（GitHub/X/LinkedIn 等）
- 🟡 社交图标集（Simple Icons 开源可用）

---

## 全局设计令牌（Design Tokens）

### 色彩
```css
:root {
  --bg-primary: #0a1628;        /* 主背景深蓝 */
  --bg-secondary: #0d2847;      /* 浅一点的蓝（CTA段） */
  --accent-blue: #00d4ff;       /* 高亮/CTA/数据色 */
  --accent-purple: #7c3aed;     /* 渐变辅助色 */
  --accent-green: #10b981;      /* 正向指标色 */
  --text-primary: #ffffff;      /* 主文字 */
  --text-secondary: #94a3b8;    /* 次文字 */
  --text-dim: #475569;          /* 最弱文字 */
  --glass-bg: rgba(10,22,40,0.7); /* 毛玻璃卡片背景 */
  --glass-border: rgba(255,255,255,0.1); /* 毛玻璃边框 */
  --flash-white: #ffffff;       /* 白闪 */
}
```

### 排版
```css
.product-name { font-size: 120px; font-weight: 900; letter-spacing: -0.02em; color: #fff; }
.feature-title { font-size: 72px; font-weight: 800; color: #fff; }
.feature-desc { font-size: 32px; font-weight: 400; color: #94a3b8; }
.metric-number { font-size: 96px; font-weight: 900; color: #00d4ff; }
.metric-label { font-size: 24px; font-weight: 400; color: #94a3b8; }
.quote-text { font-size: 36px; font-weight: 300; font-style: italic; color: #fff; }
.keyword { font-size: 48px; font-weight: 700; color: #fff; }
.cta-button { font-size: 28px; font-weight: 600; color: #00d4ff; }
.outro-slogan { font-size: 32px; font-weight: 400; color: #94a3b8; }
```

### 转场库
| 转场名 | 时长 | 用在 | 代码 |
|--------|------|------|------|
| White Flash | 0.05s | 段落切换 | `tl.to(flash,{opacity:0.9,duration:0.03}); tl.to(flash,{opacity:0,duration:0.04})` |
| Cross Dissolve | 0.5s | 视频场景切换 | `tl.to(out,{opacity:0,duration:0.5}); tl.fromTo(in,{opacity:0},{opacity:1,duration:0.5},"-=0.3")` |
| Fade Out | 0.3-0.8s | 段落结束/全片结束 | `tl.to(el,{opacity:0,duration:0.4})` |

### 节奏参数
| 段落 | 时长 | 切换频率 | 信息密度 |
|------|------|---------|---------|
| SEG 1 Dark Open | 4s | 慢（渐变为主） | ★☆☆☆☆ |
| SEG 2 Brand Reveal | 4s | 中（每秒一个元素） | ★★☆☆☆ |
| SEG 3 Features | 10s | 快（每3.3s切换） | ★★★★☆ |
| SEG 4 Use Cases | 10s | 中（每5s换场景） | ★★★☆☆ |
| SEG 5 Data | 14s | 快（密集动画） | ★★★★★ |
| SEG 6 Social Proof | 8s | 中 | ★★★☆☆ |
| SEG 7 Value + CTA | 7s | 中 | ★★☆☆☆ |
| SEG 8 Outro | 6s | 慢 | ★☆☆☆☆ |

---

## 完整素材需求清单（按优先级）

### 🔴 BLOCKING（必须，缺一不可）

| # | 资产 | 格式要求 | 数量 |
|---|------|---------|------|
| 1 | 品牌 Logo | SVG + PNG（白底透明 + 暗底透明） | 2版 |
| 2 | 产品截图/界面 | PNG，1920px宽，干净无数据 | ≥3张 |
| 3 | 核心文案 | 文本 | 产品名 + slogan + 3个功能描述 + CTA + slogan |
| 4 | 关键数据指标 | 数字+单位+标签 | 3组 |
| 5 | BGM | MP3/WAV，60-90s，科技电子感 | 1首 |
| 6 | CTA 链接 | URL | 1个 |

### 🟡 RECOMMENDED（强烈推荐）

| # | 资产 | 格式要求 | 数量 |
|---|------|---------|------|
| 7 | 实拍场景视频 | MP4，1920×1080，5-10s/段 | 2-3段 |
| 8 | 客户 Logo | PNG 白底透明 | 6-8个 |
| 9 | 客户引言 | 文本 + 人名 + 公司名 | 1条 |
| 10 | 图表数据 | 增长趋势数据点 | 1组 |
| 11 | 品牌字体 | WOFF2 / TTF | 标题+正文各1 |
| 12 | 社交媒体图标 | SVG | 3-4个 |

### 🟢 OPTIONAL（锦上添花）

| # | 资产 | 格式要求 | 来源建议 |
|---|------|---------|---------|
| 13 | 动态 Logo 片头 | MP4 或 AE | After Effects / HyperFrames |
| 14 | 粒子背景素材 | MP4 / CSS | tsParticles / 预渲染 |
| 15 | 3D 产品模型 | GLB / MP4 | Spline / Blender |
| 16 | 代言人出镜 | MP4 | 用户拍摄 |
| 17 | 转场音效 | WAV | Epidemic Sound |

---

## HyperFrames 可行性评估

| 段落 | 可程式化程度 | 需要外部素材 | 技术难点 |
|------|------------|-----------|---------|
| SEG 1 Dark Open | 80% | Logo SVG | 粒子聚拢效果需要 CSS 技巧 |
| SEG 2 Brand Reveal | 95% | Logo + 文案 | 几乎纯 GSAP |
| SEG 3 Features | 90% | 截图 + 文案 | 标注点动画需要精确坐标 |
| SEG 4 Use Cases | 40% | **实拍视频** | `<video>` 嵌入，毛玻璃需 backdrop-filter |
| SEG 5 Data | 85% | 数据 | SVG 图表绘制动画 |
| SEG 6 Social Proof | 90% | Logo + 引言 | Logo 网格 + 分割布局 |
| SEG 7 Value + CTA | 95% | 文案 | 纯 GSAP 文字动画 |
| SEG 8 Outro | 95% | Logo + 链接 | 纯 GSAP |

**总程式化比例**: ~82%，约 18% 需要外部预制素材（实拍视频、粒子背景）
