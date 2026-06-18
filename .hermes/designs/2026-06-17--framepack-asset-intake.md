# Framepack Asset Intake — 素材收集流程设计

> 日期: 2026-06-17
> 状态: 已验证 ✅
> 关联版本: v0.12.0 (预计)
> 关联 skill: framepack:framepack-director

## 问题陈述

Framepack 当前的创意流程有一个结构性缺口：

```
用户模糊意图 → Design Picker → Phase 1 → frame.md → Phase 2 → expanded-prompt.md
```

从"用户说了个想法"直接跳到"创意引擎翻译"，中间缺了最关键一步：**问用户要料**。

厨师不问食客带了什么食材就直接开炒——做出来的东西也许能吃，但八成不是食客想要的。

对于品牌视频、产品发布、活动推广这类实际业务场景，用户手头的素材（logo、产品图、实拍视频、slogan）直接决定：
- 能做什么类型的视频（纯动效 vs 实拍合成 vs 混合）
- 视觉方向（品牌色、品牌字体已在 VI 里定了，不需要 Agent 猜）
- 场景结构（有产品图就要有产品展示场景，有实拍就要有合成场景）
- 文案内容（slogan 不是 Agent 编的，是品牌长期延用的）

### 当前流程的实际问题

1. Agent 靠"通用能力"临时想起问两句，没有结构化流程
2. 即使用户给了 logo，frame.md 里的颜色还是 Agent 猜的（品牌色被忽略）
3. 产品图、实拍素材没有进入 expanded-prompt.md 的场景规划
4. BGM 决策已经在 Phase 1 Step 0 了，但 logo/图片/文案比 BGM 更基础，反而没问

## 设计目标

1. **结构化收集**——不是随机问几句，而是按品类系统性地过一遍
2. **条件深度**——纯文字视频不需要问产品图，品牌视频必须问 logo
3. **生命周期管理**——素材是资源，走"查找→获取→注册→使用"的完整链路
4. **优雅降级**——用户什么都没有也能做，但有料就用料
5. **不阻塞**——问了但用户不想给，不卡流程

## 架构决策

### 方案选择：扩展 Director，加 Phase 0

```
用户模糊意图
    ↓
Phase 0: Asset Intake (NEW)
    ├── 判定视频类型
    ├── 按品类收集素材
    ├── 透明通道检测 + 处理建议
    └── 产出 asset-intake.md
    ↓
Design Picker / Phase 1
    ├── 品牌色 → 直接注入 frame.md（跳过调色）
    ├── 品牌字体 → 直接注入 frame.md
    └── 无品牌资料 → 正常走 Design Picker
    ↓
Phase 2
    ├── 产品图 → 场景 beat 里安排展示镜头
    ├── 实拍素材 → 场景 beat 里安排合成镜头
    ├── slogan → 文字 reveal 编排
    └── 参考视频 → 节奏/风格校准
```

**Director 变成完整入口**：收料 → 视觉身份 → 场景分解。导演的第一件事是清点道具和演员。

### 不选的方案

- **独立新 skill**——碎片化，Director 和 Asset Intake 之间要传上下文
- **塞进 Phase 1 Step 0**——概念上不对，素材收集不是"意图翻译"的一部分

## 素材品类

六类素材，按优先级排列：

### 1. 品牌身份（Brand Identity）

| 素材 | 说明 | 影响 |
|------|------|------|
| Logo | SVG 优先，PNG（透明底）可接受，JPG 最后手段 | 片头/片尾展示、水印 |
| 品牌色 | hex 值或 VI 手册 | 直接注入 frame.md color tokens，跳过 Design Picker 调色 |
| 品牌字体 | 字体名或字体文件 | 直接注入 frame.md typography |
| VI 规范 | 如果有品牌视觉规范文档 | 整体视觉方向参考 |

### 2. 产品素材（Product Assets）

| 素材 | 说明 | 处理 |
|------|------|------|
| 产品图（扣过图） | 透明底 PNG/WebP | 直接用，存 assets/ |
| 产品图（没扣图） | 有背景的照片 | 检测透明通道 → 无透明 → 建议用 `remove-background` 处理 |
| 3D 渲染图 | 产品渲染 | 直接用 |
| 生活方式照 | 产品使用场景照 | 直接用，作为场景背景或合成素材 |

### 3. 视频素材（Video Footage）

| 素材 | 说明 | 注意 |
|------|------|------|
| 实拍片段 | 用户自己拍的或专业拍摄 | 记录分辨率、比例、时长、格式 |
| 现成视频素材 | 用户已经做好的片段 | 记录内容描述（这段拍了什么） |
| 屏幕录制 | 软件操作演示 | 适合 SaaS/工具类视频 |

### 4. 文案内容（Text Content）

| 素材 | 说明 | 影响 |
|------|------|------|
| Slogan / Tagline | 品牌口号 | 文字 reveal 场景的核心文案 |
| 卖点列表 | 产品核心卖点 3-5 条 | 内容场景的信息结构 |
| 产品描述 | 官方文案 | expanded-prompt.md 的场景文案素材 |
| CTA | 行动号召 | 片尾场景 |
| 品牌故事 | 如有品牌叙事 | 影响故事弧线 |

### 5. 音频（Audio）

> 注意：当前 Phase 1 Step 0 已有音频决策。Asset Intake 的音频部分是**收集已有素材**，Phase 1 Step 0 是**决定创意方向**。两者互补。

| 素材 | 说明 |
|------|------|
| 已授权 BGM | 用户提供的有版权的音乐文件 |
| 旁白音频 | 用户已录好的旁白 |
| 旁白文案 | 要用 TTS 生成的旁白文字稿 |
| 音乐偏好 | "要类似 XXX 的感觉" |

### 6. 参考（References）

| 素材 | 说明 |
|------|------|
| 参考视频链接 | "我想要这种感觉" |
| 竞品视频 | 看竞品怎么做的 |
| 情绪板 | Pinterest/图片合集 |

## 条件深度

不是所有视频都需要全六类收集。按视频类型自动调整深度：

### 品牌产品视频（brand_product_launch / promo / ad）

全部六类。必须问：
- Logo 有吗？什么格式？
- 产品图有吗？扣过图吗？
- 品牌色 / 字体有吗？
- Slogan / 卖点是什么？
- 有实拍素材吗？
- BGM 有授权的吗？

### 概念/教育视频（concept / educational / explainer）

只问三类：
- 文案内容（要表达什么信息）
- 音频（需要旁白吗）
- 参考（有参考视频吗）

### 社交媒体速递（social_teaser / story）

问四类：
- 品牌身份（logo + 品牌色）
- 文案内容（slogan + CTA）
- 产品素材（一张关键图就够）
- 音频

### 纯文字/动效视频（kinetic_type / text_only）

最小化：
- 文案内容（文字稿）
- 音频（BGM 偏好）
- 参考（可选）

### 自动判定逻辑

Agent 根据用户第一句话判定视频类型：

```
"做个珍珠品牌新品发布视频"     → brand_product_launch
"解释一下什么是 RAG"          → educational
"做个 15 秒 Instagram 推广"   → social_teaser
"做个动感文字动画"             → kinetic_type
```

如果无法判定，直接问："这个视频是品牌推广？知识科普？还是社交媒体内容？"

## 透明通道检测与素材处理

### 检测流程

```
用户提供图片
    ↓
检查文件格式
    ├── SVG → 矢量，天然透明 ✅
    ├── PNG/WebP → 检测 alpha 通道
    │   ├── 有透明通道 → 直接用 ✅
    │   └── 无透明通道 → 标记 needs_processing
    └── JPG → 无透明通道 → 标记 needs_processing
    ↓
needs_processing?
    ├── Yes → 建议运行 npx hyperframes remove-background
    │         处理后存到 assets/ 并更新 manifest
    └── No → 直接存到 assets/
```

### 不自动处理，只建议

Framepack 不自动跑 `remove-background`（那是 HyperFrames 的功能，且可能有质量差异）。
Framepack 的职责是：
1. 检测到需要处理
2. 告诉 Agent "这张图需要抠图，建议用 `npx hyperframes remove-background`"
3. Agent 决定何时处理（可能是写 HTML 之前）

## 产出文件

### `.framepack/asset-intake.md`

```markdown
---
# Asset Intake Manifest
intake_date: "2026-06-17"
video_type: brand_product_launch
intake_depth: full

brand:
  name: "Aurora Pearls"
  logo:
    path: assets/aurora-logo.svg
    format: svg
    transparent: true
    status: ready
  colors:
    primary: "#1a1a2e"
    accent: "#c9a96e"
    source: brand_vi
  fonts:
    heading: "Playfair Display"
    body: "DM Sans"
    source: brand_vi
  slogan: "Timeless Elegance, Woven by Light"

products:
  - name: "Celestial Memory Necklace"
    images:
      - path: assets/celestial-necklace.png
        format: png
        transparent: true
        status: ready
        note: "扣过图，正面展示"
      - path: assets/celestial-lifestyle.jpg
        format: jpg
        transparent: false
        status: needs_processing
        note: "生活方式照，有背景，建议 remove-background"

footage: []

text:
  selling_points:
    - "18K金镶嵌天然 Akoya 珍珠"
    - "手工编织丝线，每条独一无二"
    - "限量发售 99 件"
  cta: "探索Celestial Memory系列"
  brand_story: "三十年珍珠养殖世家，每颗珍珠经过 120 天手工筛选"

audio:
  bgm: null
  bgm_preference: "优雅、轻柔的钢琴+弦乐"
  voiceover: null
  voiceover_script: null

references:
  - url: "https://vimeo.com/xxx"
    note: "喜欢这个光影质感"

missing:
  - licensed_bgm
  - voiceover_script
---
```

### 文件存储

所有素材文件统一存到项目根的 `assets/` 目录：

```
项目根/
├── assets/
│   ├── aurora-logo.svg
│   ├── celestial-necklace.png
│   ├── celestial-lifestyle.jpg
│   └── bgm/                    ← 音频素材子目录
├── .framepack/
│   ├── asset-intake.md         ← 素材清单（NEW）
│   ├── arsenal.json            ← 武器注册表
│   └── weapons/
├── .hyperframes/
│   └── expanded-prompt.md
├── frame.md
└── index.html
```

## 与现有流程的集成

### 与 Design Picker 的关系

```
Phase 0: Asset Intake
    ├── 用户提供了品牌色？
    │   ├── Yes → 跳过 Design Picker 调色，直接注入 frame.md
    │   └── No → 正常走 Design Picker
    ├── 用户提供了品牌字体？
    │   ├── Yes → 跳过 Design Picker 字体选择
    │   └── No → 正常走 Design Picker
    └── 用户提供了参考视频？
        ├── Yes → 参考 video DNA 校准风格
        └── No → 正常走 Visual Style 匹配
```

### 与 Phase 1 的关系

frame.md 生成时：
- 品牌色（如有）覆盖 Agent 猜的色值
- 品牌字体（如有）覆盖 Agent 猜的字体
- 品牌 slogan 直接成为文案素材
- 产品图数量决定需要几个产品展示场景

### 与 Phase 2 的关系

expanded-prompt.md 场景规划时：
- 每个产品图对应至少一个展示场景
- 实拍素材对应合成场景
- slogan / 卖点对应文字 reveal 场景
- 参考视频的 DNA 校准节奏和风格

### 与 Arsenal 的关系

素材不是武器——但素材和武器一样，都是项目资源：

| 维度 | Arsenal（武器） | Asset Intake（素材） |
|------|----------------|---------------------|
| 管理 | .framepack/arsenal.json | .framepack/asset-intake.md |
| 生命周期 | 查找→注册→去重→审计 | 收集→检测→处理→使用 |
| 使用 | Execution Manifest 引用 | expanded-prompt.md 场景引用 |
| 审计 | 闲置武器告警 | 缺失素材标注 |

### 与 HyperFrames 能力的关系

Asset Intake 发现的素材处理需求，直接对接 HyperFrames 的工具链：

| 素材处理需求 | HyperFrames 工具 |
|-------------|-----------------|
| 抠图（去背景） | `npx hyperframes remove-background` |
| 视频转码 | ffmpeg (通过 HyperFrames) |
| 音频转录 | `npx hyperframes transcribe` |
| TTS 旁白 | `npx hyperframes tts` |

Framepack 只做检测和建议，不替代这些工具。

## 优雅降级

### 用户什么都没有

```
Agent: "你有品牌 logo 或产品图吗？"
用户: "没有，就做个纯文字的"
Agent: "没问题。那你给我一句话核心文案就行。"
→ 降级到 kinetic_type，最小化 intake
```

### 用户只有部分

```
Agent: "你有 logo 吗？"
用户: "有 logo，但没产品图"
Agent: "行，logo 够了。产品图可以用动效模拟展示。你有品牌色吗？"
→ partial intake，missing 标注
```

### 用户给的是链接不是文件

```
用户: "logo 在我们官网上"
Agent: "好，我来下载。" → 下载到 assets/ → 检测格式 → 注册到 manifest
```

## 对 Director Skill 的影响

### framepack:framepack-director 新增 Phase 0

```
Phase 0: Asset Intake (NEW)
  ├── Step 0.1: 判定视频类型
  ├── Step 0.2: 按品类收集（条件深度）
  ├── Step 0.3: 透明通道检测
  ├── Step 0.4: 产出 asset-intake.md
  └── Step 0.5: 用户确认（"这些料够吗？还缺什么？"）

Phase 1: Intent → frame.md (existing)
  ├── Step 0: 音频决策 (existing, 消化 Asset Intake 的音频部分)
  ├── Step 1-4: (existing)

Phase 2: frame.md → expanded-prompt.md (existing)
  ├── 场景规划时引用 asset-intake.md
  └── (existing)
```

### Director references 新增

- `references/asset-intake-checklist.md`——按视频类型的素材清单模板
- `references/asset-processing-guide.md`——透明通道检测和 remove-background 引导

## 对 Plugin 的影响

### post_tool_call hook

asset-intake.md 写入后，触发轻量验证：
- 品牌 logo 已提供但没注册到 manifest？
- needs_processing 的图片有没有被处理？
- missing 列表里的关键素材有没有提醒用户？

### AGENTS.md 更新

Product Spine 图更新：

```
用户模糊意图
    ↓
Framepack 创意引擎
    ├── Phase 0: 素材收集 → asset-intake.md (NEW)
    ├── Phase 1: 意图翻译 → frame.md（视觉身份）
    └── Phase 2: 创意细化 → expanded-prompt.md（场景级分解）
    ↓
HyperFrames 工具链接管
```

## 测试策略

### 核心测试场景

1. **全量品牌视频**——用户提供完整品牌资料，验证所有品类都收集到
2. **部分素材**——用户只给 logo，验证 graceful degradation
3. **空手用户**——什么都没有，验证降级到 kinetic_type
4. **透明通道检测**——SVG/PNG透明/PNG不透明/JPG 四种情况
5. **视频类型判定**——不同意图自动匹配不同 intake depth
6. **音频消化**——Asset Intake 的音频收集与 Phase 1 Step 0 的音频决策不冲突

### 测试方式

- Director skill 的 Phase 0 逻辑用 Python 模拟（如果有 core 模块的话）
- 透明通道检测可以用 Python PIL/Pillow 检测
- 素材 manifest 格式用 YAML schema 验证

## 范围边界

### 本期做

- Director skill 新增 Phase 0 流程文档
- asset-intake.md 的格式规范和模板
- 透明通道检测逻辑
- 条件深度的判定逻辑
- AGENTS.md 和 SKILL.md 的流程更新

### 本期不做

- 自动跑 remove-background（只建议，不执行）
- 素材版权验证
- 云存储链接自动下载（Agent 手动处理）
- 素材质量评分（分辨率太低之类的检测）

## 开放问题

1. **视频素材的格式和编码检测**——是否需要用 ffprobe 自动检测用户提供的视频的分辨率/编码/时长？还是手动记录？
   - 建议：Phase 0 只手动记录，Phase 2 场景规划时如果需要再 ffprobe。

2. **素材版本管理**——用户中途换了一张产品图，asset-intake.md 怎么更新？
   - 建议：直接覆盖文件 + 更新 manifest，不做版本历史。视频项目是一次性的，不是长期文档。

3. **多语言文案**——用户同时提供中英文 slogan？
   - 建议：manifest 支持 `slogan_zh` / `slogan_en` 字段。

## 版本规划

- **v0.12.0** — Asset Intake (本设计) + 武器库扩充（anime.js / sprite sheet forge）
- 如果 Asset Intake 和 Arsenal Expansion 一起做太大，拆成 v0.12.0 + v0.12.1
