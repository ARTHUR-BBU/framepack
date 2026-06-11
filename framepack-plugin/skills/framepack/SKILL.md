---
name: framepack
description: "Framepack v0.8 — HyperFrames Prompt Factory. Turns fuzzy video ideas into frame.md (visual identity) and expanded-prompt.md (creative breakdown), then HyperFrames takes over. The agent is the director; Framepack is the creative translator."
version: 0.8.1
author: 老田 + Hermes
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [framepack, hyperframes, video, plugin, skills]
    related_skills: [hyperframes, hyperframes-cli, gsap]
---

# Framepack v0.8.1 — HyperFrames Prompt Factory

Framepack is a Hermes Agent Plugin that translates fuzzy video intent into
precise creative briefs HyperFrames can render. It does two things and hands off.

**导演不碰摄影机。摄影棚不缺导演。**

## Product Spine

```
用户模糊意图 ("帮我做个珍珠品牌 30 秒视频")
    ↓
Framepack 创意引擎
    ├── Phase 1: 意图翻译 → frame.md（视觉身份）
    └── Phase 2: 创意细化 → expanded-prompt.md（场景级分解）
    ↓
HyperFrames 工具链接管
    ├── 读 frame.md（视觉参数）
    ├── 读 expanded-prompt.md（场景规划）
    ├── hyperframes init → 写 HTML + GSAP timeline
    ├── hyperframes lint → 验证
    └── hyperframes render → 出片
```

**Framepack 的边界：到 expanded-prompt.md 为止。**
之后的 HTML 编写、结构验证、渲染，全部交给 HyperFrames。

## Skill 加载策略

Framepack 不替代 HyperFrames 的技能，只做补充：

| 你需要什么 | 加载哪个 skill |
|-----------|---------------|
| 写 HTML composition | `hyperframes`（主公的完整制作规范） |
| CLI 命令：init/lint/render/preview | `hyperframes-cli` |
| GSAP API 参考 | `gsap`（主公的 GSAP 标准参考） |
| 武器食谱（具体动画模式） | `framepack:framepack-gsap`（插件技能，用冒号全名） |
| 意图 → frame.md + expanded-prompt | `framepack:framepack-director`（插件技能，用冒号全名） |
| 动画武器库翻字典 | `framepack-animation-library`（独立+插件均可） |
| 参考视频 DNA 提取 | `framepack-reference-miner`（独立+插件均可） |

**核心原则：Framepack 的 skill 教你"想什么"，HyperFrames 的 skill 教你"怎么写"。两者不重复。**

## HyperFrames 能力感知

HyperFrames 不只是渲染引擎。Framepack 在创意阶段就应该考虑这些能力：

| HyperFrames 能力 | CLI 命令 | 创意阶段怎么用 |
|-----------------|---------|--------------|
| TTS 旁白生成 | `npx hyperframes tts` | "这个视频需要 AI 旁白吗？什么音色？" |
| 音频转录（词级时间戳） | `npx hyperframes transcribe` | "如果有旁白音频，需要词级字幕同步吗？" |
| 音频驱动动画 | audio-reactive reference | "BGM 节拍驱动视觉脉冲？波形跟随？" |
| 字幕/歌词系统 | captions reference | "卡拉 OK 字幕？逐词高亮？弹入弹出？" |
| 背景移除 | `npx hyperframes remove-background` | "需要绿幕抠像？透明背景素材？" |
| 参数化 Composition | `--variables` | "同一套 HTML，不同文案/颜色渲染多版本？" |

## Phase 1: Intent → frame.md

### Step 1: 理解意图

- **什么视频** — 产品发布？活动推广？品牌故事？数据解读？
- **给谁看** — 开发者？高管？普通消费者？
- **什么感觉** — 高端？活泼？紧迫？沉静？电影感？
- **什么平台** — 社交媒体 15s？网站 Hero？Keynote？

### Step 2: 匹配 Visual Style

从 8 种预设中匹配（参考 `framepack:framepack-director` skill 的 `references/visual-styles.md`）：

| Style | Feeling | Best for |
|-------|---------|----------|
| Swiss Pulse | 精准、编辑感 | SaaS、数据、DevTools |
| Velvet Standard | 高端、永恒 | 奢侈品、企业、Keynote |
| Data Drift | 未来、沉浸 | AI、ML、前沿科技 |
| Soft Signal | 亲密、温暖 | 健康、生活方式 |
| Neon Grid | 赛博、高能 | 游戏、加密、夜生活 |
| Monochrome Luxe | 黑白优雅 | 时尚、艺术、高端编辑 |
| Botanical Warm | 自然、手工 | 食品、健康、可持续 |
| Kinetic Type | 字体驱动、动感 | 活动推广、峰会、发布 |

**如果用户意图模糊，提供 2-3 个风格选项让用户选——不是帮用户决定，是帮用户发现。**

如果用户想要更直观的方式，**主动 offer Design Picker**：
> "我可以用 HyperFrames 的 Design Picker 给你一个可视化的设计面板。
> 你在浏览器里调色、选字体、设置动效节奏，然后一键产出 frame.md。
> 要试试吗？"

Design Picker 是 HyperFrames 内置功能（加载 `hyperframes` skill →
`references/design-picker.md`），Framepack 不重复实现，但负责引导用户去用。

### Step 3: 生成 frame.md

```yaml
---
colors:
  primary: "#hex"
  accent: "#hex"
  background: "#hex"
  surface: "#hex"
typography:
  heading: "Font Name"
  body: "Font Name"
motion:
  energy: calm | medium | high
  easing: power2.out
  duration_range: [0.8, 1.5]
  transition_default: crossfade
atmosphere: "One-line mood direction"
---
```

### Step 4: 用户确认

**展示感觉，不是规格。** "深海珍珠的光影流动感"，不是 `#1a1a2e`。
用户说"换一个"或"金色再暖一点"，当场改。

## Phase 2: frame.md → expanded-prompt.md

### 创意结构

1. **故事弧线** — hook → build → climax → CTA？
2. **场景数** — 15-60 秒视频通常 4-8 个场景
3. **节奏声明** — 命名节奏模式：
   - `hook-PUNCH-breathe-CTA`（活动推广）
   - `slow-build-BUILD-PEAK-breathe-CTA`（品牌故事）
   - `STAT-shock-context-STAT-CTA`（数据解读）
4. **每场景 beat** — concept / mood / depth layers / animation verbs / transition out
5. **跨场景视觉线索** — recurring motifs

### 用户确认

**展示节奏骨架 + 每个场景一句话亮点。** 用户不需要看 expanded-prompt.md 全文（可能几百行）。

### 音视频考量（v0.8.1 新增）

在创意阶段就问：
- 需要 TTS 旁白吗？什么风格？（沉稳男声？温暖女声？）
- BGM 节奏快慢？需要音频驱动视觉脉冲吗？
- 需要词级字幕同步吗？什么动画风格？

## 交给 HyperFrames

Framepack 产出完成后，HyperFrames 的 `hyperframes` skill 自动接管后续流程：
- Step 1: 读 frame.md → 视觉参数注入
- Step 2: enrich expanded-prompt.md → 加制作细节（atmosphere layers, micro-details, transition choreography）
- Step 3: Plan → 写 HTML → lint → render

**Framepack 提供创意灵魂，HyperFrames 补充制作肌肉。是 enrich 关系，不是 replace。**

## 武器库：字典，不是自动注入

GSAP/anime.js 武器（`framepack-animation-library`）在 HyperFrames 写 HTML 动画阶段被 Agent 主动查阅。
不是自动注入创意管线——Agent 需要实现某个动画效果时才翻字典。

推荐武器可以在 expanded-prompt.md 的 animation choreography 里提及，但具体代码由 Agent 在写 HTML 时按需加载 `framepack:framepack-gsap` 和 `gsap` skill。

## 与用户共创

- 展示感觉，不是规格
- 提供选项，不是命令
- 可以随时中断（用户说"算了"→ Framepack 安静退场，不催促）
- 用户回来时重新启动即可

## Plugin 层（自动触发，不手动调用）

- `post_tool_call` — frame.md 和 expanded-prompt.md 写入后自动 LLM 质量检查
- `pre_tool_call` — hyperframes 命令执行前检查 frame.md 是否存在

## 关键文件

```
项目根/
├── frame.md                    ← Framepack Phase 1 产出
├── .hyperframes/
│   └── expanded-prompt.md     ← Framepack Phase 2 产出
├── index.html                  ← HyperFrames 产出（Framepack 不管）
└── assets/                     ← 本地 GSAP/anime.js（Framepack 不管）
```

## Communication Style

老田喜欢通俗化、类比化、比喻化的表达。用比喻解释架构（"器官移植 vs 外卖电话"、"安检门"、"寄生外挂"）。务实 + 幽默，逻辑严密但不端着。先想透再动手。
