# Miara-Style Template — 参数文档与使用指南

## 概述

这是一个从品牌视频（Miara by Tencent Design, 110s 4K）深度逆向提取的 HyperFrames 视频模板。

**核心 DNA**：
- 永久渐变背景（始终存在，所有内容浮在其上）
- 半透明 glass-panel + backdrop-blur
- 文字 directional wipe / blur-to-focus / scale-up 进场
- 水平 slide-in 级联 + stagger
- 暗角 + soft glow 素质层

**产物**：30 秒 1920×1080 H.264 MP4，经过 HyperFrames lint+validate+inspect 全链路验证。

---

## 文件结构

```
cases/miara-style-template/
├── index.html              # 参数化模板骨架（data-composition-variables 驱动）
├── package.json            # 脚本入口
├── hyperframes.json        # 注册配置
├── TEMPLATE_GUIDE.md       # 本文件
├── assets/
│   ├── fonts/              # anton.woff2 + inter.woff2
│   ├── vendor/             # gsap-3.14.2.min.js
│   └── images/             # 用户放入的素材
├── renders/                # 渲染输出
└── snapshots/              # 快照审片
```

---

## 参数列表

所有参数通过 HyperFrames `data-composition-variables` 机制声明，HTML 内部通过 `window.__hyperframes.getVariables()` 读取并注入 DOM。

### 品牌层

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `brand_name` | string | `MIARA` | 品牌名（大标题） |
| `brand_tagline` | string | `TENCENT DESIGN` | 品牌副标题 |
| `bg_top_color` | color | `#3D0E1A` | 渐变背景顶部色（deep burgundy） |
| `bg_bottom_color` | color | `#E8742C` | 渐变背景底部色（vibrant orange） |
| `accent_color` | color | `#F7C948` | 强调色（进度条、mascot、metric 值） |

### Scene 1 — 品牌名 Push-in (0-5s)

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `s1_headline` | string | `Introducing` | 开场引导词 |
| `s1_subline` | string | `From one brief to full creative delivery` | 开场描述文案 |

### Scene 2 — 功能面板 (5-12s)

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `s2_panel1_title` | string | `Remembers` | 面板 1 标题 |
| `s2_panel1_desc` | string | `Your assets, taste and methodology` | 面板 1 描述 |
| `s2_panel2_title` | string | `Organizes` | 面板 2 标题 |
| `s2_panel2_desc` | string | `One-click asset library` | 面板 2 描述 |
| `s2_panel3_title` | string | `Generates` | 面板 3 标题 |
| `s2_panel3_desc` | string | `Full creative on demand` | 面板 3 描述 |

### Scene 3 — 全屏命题 (12-16s)

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `s3_thesis` | string | `Learns how you create` | 命题主句（前景清晰） |
| `s3_thesis_blur` | string | `not just what you like` | 命题深度层（背景模糊） |

### Scene 4 — System Proof (16-22s)

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `s4_metric1_label` | string | `Performance` | 指标 1 名称 |
| `s4_metric1_value` | string | `94%` | 指标 1 数值 |
| `s4_metric2_label` | string | `Uptime` | 指标 2 名称 |
| `s4_metric2_value` | string | `99.9%` | 指标 2 数值 |
| `s4_metric3_label` | string | `Adoption` | 指标 3 名称 |
| `s4_metric3_value` | string | `12k+` | 指标 3 数值 |

### Scene 5 — Slogan + Seal (22-30s)

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `s5_slogan_line1` | string | `Made for creators.` | 收束口号第一行 |
| `s5_slogan_line2` | string | `Built for the work that matters.` | 收束口号第二行 |

### 其他

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `hero_image` | string | `""` | 可选的全屏冲击图路径 |
| `duration` | number | `30` | 总时长（秒） |

---

## 使用方法

### 方式 1：默认参数直接渲染

```bash
cd cases/miara-style-template
npx --yes hyperframes@0.7.21 render --quality draft --output renders/my-video.mp4
```

### 方式 2：通过参数覆盖渲染

```bash
npx --yes hyperframes@0.7.21 render \
  --variables '{"brand_name":"NEXUS","bg_top_color":"#0A0E27","bg_bottom_color":"#1A4FFF","accent_color":"#00FFB3","s1_headline":"Announcing","s5_slogan_line1":"Build beyond.","s5_slogan_line2":"Ship at the speed of thought."}' \
  --output renders/nexus-brand.mp4
```

### 方式 3：通过 JSON 文件批量渲染

```bash
# vars-nexus.json
{
  "brand_name": "NEXUS",
  "bg_top_color": "#0A0E27",
  "bg_bottom_color": "#1A4FFF",
  "accent_color": "#00FFB3",
  "s1_headline": "Announcing",
  "s2_panel1_title": "Designs",
  "s2_panel2_title": "Deploys",
  "s2_panel3_title": "Scales"
}

npx --yes hyperframes@0.7.21 render --variables-file vars-nexus.json --output renders/nexus.mp4
```

### 方式 4：Dev 预览

```bash
npx --yes hyperframes@0.7.21 preview
```

---

## 固定 DNA（不可通过参数修改）

以下是从参考视频提取的运动语法，已固化在 HTML 中，**不可通过参数修改**：

1. **永久渐变背景**：始终存在，所有内容浮在其上
2. **glass-panel 半透明面板**：rgba(12,12,16,0.82) + backdrop-blur(14px)
3. **文字进场方式**：
   - 品牌名 → scale-up + back.out easing
   - 副标题 → directional wipe + blur-to-focus
   - 面板 → 水平 slide-in + stagger
   - 命题 → blur(20px) → blur(0) focus pull
4. **进度条动画**：scaleX 0→target，缓动 power2.out
5. **mascot 漂浮**：yoyo sine.inOut
6. **全片 push-in**：背景缓慢 scale 1.0→1.08
7. **暗角 + glow**：radial vignette + text-shadow glow

如果需要修改这些运动语法，直接编辑 `index.html` 中的 `<script>` 部分。

---

## 换色系示例

### 科技蓝
```json
{"bg_top_color":"#0A0E27","bg_bottom_color":"#1A4FFF","accent_color":"#00FFB3"}
```

### 森林绿
```json
{"bg_top_color":"#0D1F0D","bg_bottom_color":"#2ECC71","accent_color":"#F1C40F"}
```

### 暗夜紫
```json
{"bg_top_color":"#1A0A2E","bg_bottom_color":"#8E44AD","accent_color":"#00D2FF"}
```

---

## 验证命令

```bash
# 完整检查
npm run check

# 快照审片
npm run snapshot

# 渲染
npm run render -- --quality draft --output renders/output.mp4

# ffprobe 验证输出
ffprobe -v error -show_entries format=duration,size -of json renders/output.mp4
```
