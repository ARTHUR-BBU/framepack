# Framepack Agent Guide

<!-- version: 0.8.0 — sync with plugin.yaml and README -->

> **新对话启动**: 先读 `.hermes/CONTEXT.md` 接上工作状态，再回来看本文。（3 秒交接）

Framepack is a **Hermes Agent Plugin** — a Prompt Factory for HyperFrames.

HyperFrames 是摄影棚（设备齐全）。Framepack 是导演（更懂用户）。

**导演的活是分镜和创意方向，不是操纵摄影机。**

## Product Spine

```text
用户模糊意图
    ↓
Framepack 创意引擎
    ├── Phase 1: 意图翻译 → frame.md（视觉身份）
    └── Phase 2: 创意细化 → expanded-prompt.md（场景级分解）
    ↓
HyperFrames 工具链接管
    ├── 读 frame.md（视觉参数）
    ├── 读 expanded-prompt.md（场景规划）
    ├── Layout Before Animation → 写 HTML
    ├── hyperframes lint → 验证
    └── hyperframes render → 出片
```

Framepack 的边界：到 expanded-prompt.md 为止。之后的 HTML 编写、结构验证、渲染，全部交给 HyperFrames。

## Trigger Framepack When

- 用户说了个模糊的视频想法（"帮我做个品牌视频"、"做个活动推广"）
- 用户需要对视频创意方向的建议（"应该什么风格？"、"什么节奏？"）
- 用户需要把想法细化成 HyperFrames 能理解的结构
- 用户要求改创意方向（"换个风格"、"节奏再快一点"）

**不触发 Framepack：**
- `hyperframes lint` / `hyperframes render` 等 CLI 命令
- 小修改（"改个颜色"、"调个时间"）— 直接改 HTML
- 用户已经明确知道要什么，不需要创意建议

## 创意阶段流程

### Phase 1: 意图翻译 → frame.md

**输入**：用户的模糊意图 + 可用的品牌资料
**输出**：`frame.md`

```
"做个珍珠品牌 30 秒视频"
    ↓ 匹配 Visual Style → Velvet Standard
    ↓ 生成 frame.md
frame.md:
  colors:
    primary: "#1a1a2e"        # 深邃夜空
    accent: "#c9a96e"         # 珍珠金
    background: "#0d0d1a"     # 丝绸黑
    surface: "#16213e"         # 月光蓝
  typography:
    heading: "Playfair Display"
    body: "DM Sans"
  motion:
    energy: calm               # calm | medium | high
    easing: power2.out
    duration_range: [0.8, 1.5]
  atmosphere: "深海珍珠，光影流动，绸缎触感"
```

如果用户意图不明确，可以：
1. 读 `visual-styles.md` 匹配最近的风格
2. 提供 2-3 个风格选项让用户选
3. 走 HyperFrames 的 Design Picker 流程

**与用户共创**：生成 frame.md 后展示给用户，确认视觉方向。用户说"换一个"或"金色再暖一点"，当场改。

### Phase 2: 创意细化 → expanded-prompt.md

**输入**：frame.md + 用户意图 + 用户确认
**输出**：`.hyperframes/expanded-prompt.md`

expanded-prompt.md 包含：
1. **Title + style block** — 引用 frame.md 的精确 hex 值和字体
2. **Rhythm declaration** — "hook-PUNCH-breathe-CTA" 之类的节奏命名
3. **Per-scene beats** — 每个场景的完整创意：
   - Concept（视觉世界？隐喻？感觉？）
   - Mood direction（文化/设计参考）
   - Depth layers — BG（2-5 装饰层 + 环境动效）+ MG（内容层）+ FG（点缀层）
   - Animation choreography — 每个元素的具体动词（SLAM、CASCADE、float、drift）
   - Transition out — 具体类型 + 时长 + easing
4. **Recurring motifs** — 跨场景的视觉线索
5. **Negative prompt** — 避免什么

**与用户共创**：展示场景节奏和关键创意点，让用户确认或调整。不需要展示 expanded-prompt.md 全文（几百行，用户不需要看）。

## 武器库（GSAP / anime.js）

武器库不是 HyperFrames 的输入——它是 **Agent 写 HTML 动画时翻的字典**。

- 位置：`framepack-animation-library` skill + `framepack-gsap` skill
- 介入时机：HyperFrames Step 3（写 HTML + Animation 阶段）
- 用法：Agent 需要实现某个动画效果时，查武器库找代码模式
- 不是自动注入，是主动查阅

推荐武器可以在 expanded-prompt.md 的 animation choreography 里提及，但具体代码由 Agent 在写 HTML 时按需查阅。

## Plugin Hooks

v0.8 hooks 只做两件事：

```text
post_tool_call:
  ├── frame.md 写入 → LLM 质量检查（配色/字体/动效参数是否完整）
  └── expanded-prompt.md 写入 → LLM 质量检查（场景 beat 是否完整）

pre_tool_call:
  └── hyperframes 命令执行 → 检查 frame.md 是否存在（交接准备）
```

**不做的事**：
- ❌ 不审计 HTML（那是 `hyperframes lint` 的事）
- ❌ 不管 13 个中间文件（全部砍掉）
- ❌ 不检查 STORYBOARD.md / COMPOSITION.md / DESIGN.md / DESIGN_TOKENS.md（这些文件不再存在）

## Required Reading In A Workbench

Framepack 工作台只需要关注：

1. `frame.md` — 视觉身份（Framepack 产出，HyperFrames 消费）
2. `.hyperframes/expanded-prompt.md` — 创意细化（Framepack 产出，HyperFrames 消费）
3. `index.html` — HyperFrames 产出（Framepack 不管）

## Handoff to HyperFrames

Framepack 完成 Phase 1 + 2 后，HyperFrames 的 SKILL.md 会被 Hermes 自动激活接管后续流程。
HyperFrames 自带完整的 3 步流程（Design → Expansion → Plan）：

```text
Framepack Phase 1 → frame.md           ← 产出（HyperFrames Step 1 直接消费）
Framepack Phase 2 → expanded-prompt.md  ← 产出（作为 seed，不是最终版）
     ↓ 交接
HyperFrames Step 1 → 读 frame.md       ← 跳过（已有）
HyperFrames Step 2 → enrich expanded-prompt  ← 不是跳过！在 Framepack 基础上加厚
HyperFrames Step 3 → Plan + 写 HTML     ← 从这里进入制作
     ↓
hyperframes lint → preview → render
```

**为什么 Step 2 不能跳过：**

HyperFrames 的 prompt-expansion 文档明确说：
> "The expansion is never pass-through. Every user prompt is a seed.
> Expansion's job is to take what the user wrote and make it richer."

Framepack 的 expanded-prompt 是"导演分镜"——创意方向、场景节奏、动画动词。
HyperFrames 需要在上面加厚——atmosphere layers（2-5 decoratives + ambient motion）、
micro-details（registration marks、tick indicators）、transition choreography at
object level、pacing beats within each scene、exact hex from spec。

**Framepack 提供创意灵魂，HyperFrames 补充制作细节。两者是 enrich 关系，不是 replace。**

HyperFrames 自带 3 个 skills（hyperframes, hyperframes-cli, gsap），在制作阶段自动接管。
Framepack 的武器库（animation-library, gsap skill）作为补充参考。

## Skills

Framepack v0.8 skills:

| Skill | 作用 | 介入时机 |
|---|---|---|
| framepack-director | 意图翻译 + Visual Style + frame.md + expanded-prompt | Phase 1 + Phase 2 |
| framepack-animation-library | 27 件 GSAP/anime.js 武器 | HyperFrames 写 HTML 时 |
| framepack-gsap | GSAP 动画模式参考 | HyperFrames 写 HTML 时 |
| framepack-arsenal | 武器目录管理 | 创意阶段推荐 |
| framepack-reference-miner | 参考视频 → DNA 提取 | 需要参考时 |

**已合并/删除的 skills：**
- framepack-design-picker → 合并进 framepack-director
- framepack-template-fuser → 合并进 framepack-director
- framepack-hyperframes-builder → 不再需要（Framepack 不管 HTML）

## Development Verification

```bash
cd framepack-plugin && python -m pytest tests/ -q -o "addopts="
```

## Editing Rules

- Keep README, AGENTS.md, plugin.yaml 版本号三处同步
- Framepack 不管 HTML——所有 HTML/结构/渲染问题归 HyperFrames
- 武器库是字典，不是自动注入
- 创意阶段与用户共创，不需要用户看 expanded-prompt.md 全文

<!-- FRAMEPACK MANAGED BLOCK START -->
## Framepack Agent Workflow

Framepack is installed as an agent-native video creative workbench for this project.

- Trigger Framepack for vague video requests, creative direction, or style matching.
- Framepack produces frame.md + expanded-prompt.md, then HyperFrames takes over.
- Start every HyperFrames project by reading an official example: `npx hyperframes init --example product-promo`.
- Weapon library (GSAP/anime.js) is a dictionary for the HTML animation phase, not an automatic injector.
- Framepack does NOT audit HTML. Use `npx hyperframes lint` for that.
<!-- FRAMEPACK MANAGED BLOCK END -->
