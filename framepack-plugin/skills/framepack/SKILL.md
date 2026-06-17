---
name: framepack
description: "Framepack v0.11.1 — HyperFrames Prompt Factory. Turns fuzzy video ideas into frame.md (visual identity) and expanded-prompt.md (creative breakdown with Time Windows + Execution Manifest + Structure Checklist), then HyperFrames takes over. Includes Kinetic Taste Engine (taste audit, surprise operators, kinetic grammar, taste specimens), Guardrail Hydrator, Arsenal Registry Runtime, HyperFrames Compatibility Adapter, Environment & Upgrade Manager, Production Quality Layer, Replica Mode render-integrity rules, and test-team hardening."
version: 0.11.1
author: 老田 + Hermes
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [framepack, hyperframes, video, plugin, skills]
    related_skills: [hyperframes, hyperframes-cli, gsap]
---

# Framepack v0.11.1 — HyperFrames Prompt Factory

Framepack is a Hermes Agent Plugin that translates fuzzy video intent into
precise creative briefs HyperFrames can render. It does two things and hands off.

**导演不碰摄影机。摄影棚不缺导演。**

## Product Spine

```
用户模糊意图 ("帮我做个珍珠品牌 30 秒视频")
    ↓
Framepack 创意引擎
    ├── Phase 0: 素材收集 → asset-intake.md（NEW v0.12）
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

**⚠️ HyperFrames 是司机，Framepack 是副驾驶。** HyperFrames 自带完整的 Step 1→2→3
流程，了解自己的铁律和 GSAP 合约。Framepack 不创建平行管线 —— 它在 HyperFrames
的流程中注入创意方向和建议。Agent 必须先加载 HyperFrames 的 3 个 skills
(hyperframes, hyperframes-cli, gsap)，再加载 Framepack 的 skills 做参谋。

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
| DNA 手动管线（脚本未部署时） | `references/video-dna-pipeline.md` |
| Reference Miner 双模式契约 | `references/reference-miner-dual-mode.md` — 五件套是标准量具，不是模型拐杖；缺脚本走 Adaptive Mode 但必须记录可复现细节 |
| Replica Mode 复刻硬化 | `references/replica-mode-hardening.md` — 反向复刻必须先产出 VIDEO_DNA/content_decomposition/TEMPLATE_BLUEPRINT，root data-duration 锁总时长，禁止模糊实现语句 |

**核心原则：Framepack 的 skill 教你"想什么"，HyperFrames 的 skill 教你"怎么写"。两者不重复。**

> ⚠️ **技能名格式：** `framepack-director`、`framepack-gsap`、`framepack-arsenal` 仅作为插件技能存在，
> 注册名为 `framepack:framepack-director` 等。本文件及 AGENTS.md 中所有对它们的引用必须使用冒号全名格式，
> 否则 Agent 调用 `skill_view("framepack-director")` 只搜独立技能注册表，会报 "not found"。
> `framepack-animation-library` 和 `framepack-reference-miner` 在独立+插件双注册，短名安全。

## HyperFrames 能力感知

HyperFrames 不只是渲染引擎。Framepack 在创意阶段就应该考虑这些能力。

### v0.10.2 Environment & Upgrade Manager

Framepack 现在不只会“发现环境不对”，还会把安装/升级拆成可审计的 report-first 生命周期：

- `core/environment_doctor.py` + `scripts/framepack_doctor.py` — 体检 Node/npm/npx、installed/project-local HyperFrames CLI、local skills、support window；只报告，不安装。
- `core/skill_install_manager.py` — 接收已批准的 official skill source，先做 missing-source 原子预检，再安装/备份/写 manifest。
- `core/skill_overlay_planner.py` + `scripts/apply_skill_overlays.py` — dry-run 默认，把 Framepack hardening overlays 贴到本地 HyperFrames skills，保留 user-local blocks。
- `core/skill_upgrade_manager.py` — 三方决策：official_old / official_new / local_current → replace / auto_merge / manual_review。
- `core/framepack_upgrade_report.py` + `scripts/framepack_upgrade_report.py` — 汇总 doctor/install/upgrade/smoke JSON 证据，生成升级报告。

铁律：doctor/report/dry-run 路径不允许下载、安装、升级、降级或调用 `npx --yes package@latest` 粉饰太平；安装器必须先预检全部 required sources，缺一个就一个都不写。

### v0.12 Asset Intake (NEW)

- **Phase 0: Asset Intake** — structured asset collection before creative work. `skills/framepack-director/references/asset-intake-checklist.md` provides conditional-depth rules by video type (brand_product_launch → all 6 categories, educational → 3, etc.).
- **Transparent channel detection** — `core/asset_detector.py` analyzes PNG alpha channels, SVG format, and JPG opacity without external dependencies (stdlib-only PNG parsing). Marks `needs_processing` for images that would benefit from `npx hyperframes remove-background`.
- **asset-intake.md manifest** — `.framepack/asset-intake.md` with YAML-structured inventory of user-provided brand identity, product images, footage, text content, audio, and references plus a `missing` list.
- **Director Phase 0** — `skills/framepack-director/SKILL.md` now opens with Phase 0 (judge video type → collect by category → detect transparency → write manifest → confirm) before proceeding to Phase 1.

### v0.11.0 Kinetic Taste Engine

- `core/taste_audit.py` — semantic taste audit: checks fade-stack monotony, surprise operator count, kinetic grammar coherence, and manifest surprise semantics. Ignores empty `surprise: none` markers in Execution Manifests.
- `core/taste_specimens.py` — curated taste reference specimens for luxury/emerging/editorial styles.
- `skills/framepack-director/references/kinetic-taste-engine.md` — Director guide for taste-driven scene design.
- HyperFrames 0.6.104 compatibility validated (blank smoke + golden case render).
- Environment doctor now probes project-local HyperFrames in `project_dir` cwd, not script cwd.

### v0.10.6 Production Hardening + Quality Audit

Framepack 现在多了一张“安检小票”，不是新的 HTML 审判官：

- `core/quality_audit.py` — 纯 Python 语义审计，检查 stale `.framepack/arsenal.json`、Execution Manifest 武器缺登记、手动 `data-hf-id`、Manifest 参数与 HTML 函数实参漂移、card-cascade 未声明、外部 Google Fonts 运行时依赖、缺失本地字体资产、暗底低可见性风险等问题。
- v0.10.6 hardening：国内用户常开本地 VPN/代理，外部资源获取（catalog/registry/fonts）要先检测代理并带代理访问；但最终生产 HTML 应尽量 vendor 到项目本地（如 `assets/fonts/`），不要让 render/playback 依赖 live Google Fonts。
- `scripts/framepack_quality_audit.py <project> --format json|markdown` — 机器/人工可读报告。
- pre_tool_call 在 handoff-consuming HyperFrames 命令前，如果项目已有 `index.html`，会注入非阻断 Quality Audit summary。

边界铁律：Quality Audit 只报告 lint 看不见的语义风险；不写、不修、不渲染 HTML，不替代 `npx hyperframes lint/validate/snapshot/render`。

### v0.10.1 HyperFrames Compatibility Adapter

HyperFrames 是快速滚动的摄影棚，Framepack 不能把某一版 CLI 当石碑刻死。
所有 HyperFrames 命令判断必须走 `core.hyperframes_adapter`，不要在 hook/skill 里散落 ad-hoc regex。

Adapter 负责：

- command classification：`requires_handoff` / `discovery` / `project_scaffold` / `registry` / `media_preprocess` / `cloud_side_effect`
- capability snapshot：当前 `hyperframes@latest` version、commands、flags、registry 状态
- registry fallback：官方 catalog/add 是机会供应源；失败/空返回时先探测本地代理/VPN 配置并带代理重试，再降级到 `blank` + Framepack arsenal
- skill diff report：官方 npm 包内 skills 与本地 patched skills 做 diff，只报告，不盲目覆盖；本地 hardening 不会自动写回官方仓库

基础设施文件：

- `core/hyperframes_adapter.py` — 适配层主模块
- `core/hyperframes_support.py` — HyperFrames 支持窗口分类：supported / too_old / hard_too_old / newer_same_band / unknown_newer
- `core/skill_overlay_manager.py` — Framepack-shipped hardening overlay 管理；用 provenance marker 加固用户本地 HyperFrames skill，保留 user-local blocks
- `compat/hyperframes-support.json` — 机器可读支持矩阵；声明 supported_min / supported_max_tested / soft_max / hard_block_below / downgrade target
- `.framepack/hyperframes-capabilities.json` — 项目级能力缓存
- `.framepack/hyperframes-upstream-report.json` — 上游兼容报告
- `scripts/hyperframes_upstream_report.py` — 一键生成报告
- `references/hyperframes-upstream-adapter.md` — 上游适配、VPN/代理重试、官方 skill diff 与本地 hardening 权属细则

铁律：

1. `npm view hyperframes ...` 不是 HyperFrames 制作命令，不触发 handoff warning。
2. `info/doctor/upgrade/browser/docs/compositions/benchmark/help/version/init/catalog/add/capture/tts/transcribe/remove-background` 不要求 `frame.md`。
3. `lint/inspect/preview/render/snapshot` 才要求 Framepack handoff 文件。
4. 未知 HyperFrames 新命令默认 conservative：按 `requires_handoff` 处理，直到 adapter 分类表更新。
5. 官方 skills 可吸收，不可盲盖；本地 hardening 是血汗坑位，不是漂移垃圾。
6. 本地 hardening 的流向：先进入本地 HyperFrames/Framepack skill 或 guardrails；是否进入官方 skill 取决于上游维护者/PR，不由 Framepack 自动写回。
7. Registry 失败不等于没有资源：先查本地代理/VPN（env/npm/git/Windows proxy），带代理重试；重试仍失败才降级。
8. Framepack 必须声明 HyperFrames 支持窗口；用户单独升级到 newer-than-tested 时，先 probe + isolated blank smoke，再 guarded 放行或阻断。
9. Framepack-shipped hardening 必须用 managed overlay 写入用户本地 HyperFrames skill；升级时 replace / auto-merge / preserve / manual-review，不允许整文件盲盖。
> **Capability Alignment 设计草案：** `references/capability-alignment-design.md`
> — 在 Phase 2 注入 HyperFrames 能力地图，用 ctx.llm 做可行性军师。
> 解决 Framepack 创意真空 vs HyperFrames 执行能力之间的盲区。待实现。

| HyperFrames 能力 | CLI 命令 | 创意阶段怎么用 |
|-----------------|---------|--------------|
| TTS 旁白生成 | `npx hyperframes tts` | "这个视频需要 AI 旁白吗？什么音色？" |
| 音频转录（词级时间戳） | `npx hyperframes transcribe` | "如果有旁白音频，需要词级字幕同步吗？" |
| 音频驱动动画 | audio-reactive reference | "BGM 节拍驱动视觉脉冲？波形跟随？" |
| 字幕/歌词系统 | captions reference | "卡拉 OK 字幕？逐词高亮？弹入弹出？" |
| 背景移除 | `npx hyperframes remove-background` | "需要绿幕抠像？透明背景素材？" |
| 参数化 Composition | `--variables` | "同一套 HTML，不同文案/颜色渲染多版本？" |

## Phase 0: Design Picker — 可视化设计面板（模糊意图的第一步）

**用户说"帮我做个视频"但没给具体视觉方向时，不要匹配 Visual Style，不要生成 frame.md。
第一步永远是：offer Design Picker。**

Design Picker 是 HyperFrames 内置的可视化设计面板：
- 用户在浏览器里调色、选字体、设定动效节奏
- 一键产出 frame.md
- 比 Agent 用文字描述 8 种 Visual Style 直观 100 倍

**Agent 的标准开场白（模糊意图时）：**
> "先看看 Design Picker —— HyperFrames 的可视化设计面板。
> 在浏览器里调色调字体定节奏，一分钟预览效果。要试试吗？"

如果用户说 yes → 运行 Design Picker 流程（加载 `hyperframes` skill → `references/design-picker.md`）
如果用户说 no → 回退到 Phase 1 的 Visual Style 文字匹配

**Design Picker 是默认路径。Visual Style 文字匹配是备选路径。两者顺序不能反。**

## Phase 1: Intent → frame.md

### Step 0: 音频决策（BEFORE frame.md 生成）

**音频不是在 Phase 2 末尾才问的"附加项"。音频决策塑造整个创意方向。**
**BGM 不是 nice-to-have — 它是视频质量的倍率器。没有 BGM 的视频自动掉一档。**

在生成 frame.md 之前就问：

- 需要 AI 旁白吗？（TTS: `npx hyperframes tts`）什么音色？
- BGM 节奏？（快/中/慢）需要视觉脉冲跟节拍同步吗？（音频驱动动画）
- 需要字幕吗？词级同步还是段落级？（`npx hyperframes transcribe`）

这些答案影响 scene pacing、animation energy、text reveal timing。
问完音频再进入 Visual Style。

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

**动画质量标准：见 `references/animation-quality-thresholds.md` — 打字速度、卡片尺寸、背景层次、线条手感、过渡效果、音频配合的最低门禁。每个场景描述必须满足这些标准。**

**丝绸线条技术：见 `references/silk-ribbon-thread.md` — 3层SVG叠绘实现丝带质感、边缘到边缘路径设计、z-index层级规则。**

1. **故事弧线** — hook → build → climax → CTA？
2. **场景数** — 15-60 秒视频通常 4-8 个场景
3. **节奏声明** — 命名节奏模式：
   - `hook-PUNCH-breathe-CTA`（活动推广）
   - `slow-build-BUILD-PEAK-breathe-CTA`（品牌故事）
   - `STAT-shock-context-STAT-CTA`（数据解读）
4. **每场景 beat** — concept / mood / depth layers / animation verbs / transition out
5. **跨场景视觉线索** — recurring motifs
6. **武器解析（强制执行）** — 读 MOC → 匹配武器 → 读 SKILL.md 拿路径和参数 → 生成 Execution Manifest 写入 expanded-prompt.md 末尾。每场景一个武器条目或显式 HANDWRITE 标注。参考上节「武器库：从字典到执行清单」。

### 用户确认

**展示节奏骨架 + 每个场景一句话亮点。** 用户不需要看 expanded-prompt.md 全文（可能几百行）。

（音频已在 Phase 1 Step 0 决定，这里只需要细化：旁白文案、BGM 名称、字幕动画风格。）

## 交给 HyperFrames

Framepack 产出完成后，HyperFrames 的 `hyperframes` skill 自动接管后续流程：
- Step 1: 读 frame.md → 视觉参数注入
- Step 2: enrich expanded-prompt.md → 加制作细节（atmosphere layers, micro-details, transition choreography）
- Step 3: Plan → 写 HTML → lint → render

**Framepack 提供创意灵魂，HyperFrames 补充制作肌肉。是 enrich 关系，不是 replace。**

## 武器库：从"字典"到"执行清单"（v0.8.1 核心教训）

**旧范式（已废弃）：** Agent 在 HTML 阶段"主动查阅"武器库，"建议"用某个武器。
→ 现实：Agent 不认识武器路径，跳过"建议"，从零手写 GSAP（714 行泥巴）。

**新范式：Execution Manifest。** Framepack director 在 Phase 2 产出 expanded-prompt.md
时，不写"建议用 card-cascade-reveal"——而是写精确的武器文件路径 + 参数值：

```yaml
## Execution Manifest
scene_1:
  needs: "big text SLAM entrance"
  weapon: text-split-enter
  code: "weapons/parts/references/text-split-enter.js"
  params: { target: "#s1-title", split: true, stagger: 0.06 }
  handwrite: false
```

**武器解析步骤（director Phase 2 强制执行）：**
1. `skill_view('framepack:framepack-animation-library', file_path='MOC.md')` → 读武器目录
2. 逐场景匹配：需要什么动画 → MOC 里哪个武器 → 读武器 SKILL.md 拿参数和代码路径
3. 生成 Execution Manifest YAML → 写入 expanded-prompt.md 末尾
4. 只有 MOC 里没有的才标记 `handwrite: true` + 原因

**HTML Agent 铁律（通过 AGENTS.md 强制）：**
写 HTML 前先读 Execution Manifest → 按 `code:` 路径加载武器文件 → 用现成代码只改参数。
裸写 GSAP 只允许标注了 `handwrite: true` 的场景。

## 与用户共创

- 展示感觉，不是规格
- 提供选项，不是命令
- 可以随时中断（用户说"算了"→ Framepack 安静退场，不催促）
- 用户回来时重新启动即可

## Plugin 层（自动触发，不手动调用）

- `post_tool_call` — frame.md 和 expanded-prompt.md 写入后自动 LLM 质量检查
- `pre_tool_call` — hyperframes 命令执行前检查 frame.md 是否存在

## v0.10.1 Arsenal Registry Runtime

Framepack 现在不只“提醒 Agent 要用武器”，还会维护项目级武器账本：`.framepack/arsenal.json`。

核心规则：

1. **Execution Manifest 是登记源。** expanded-prompt.md 写入后，插件会解析 Manifest 并自动 reconcile Arsenal Registry。
2. **builtin weapon 自动注册。** 例如 `text-split-enter`、`caption-clip-wipe`、`bg-blur-mask` 等 canonical weapons 会进入 `.framepack/arsenal.json`。
3. **HANDWRITE 不入 registry。** 它只代表允许手写的例外场景，作为 warning/审计信号，不是武器资产。
4. **unknown weapon 非阻断告警。** 未知武器不能静默吞掉，也不能直接崩流程；先 warning，等 Agent/用户决定注册、替换或改成 HANDWRITE。
5. **unused weapon 要标记。** registry 里存在但 Manifest 不再引用的 active weapon 会被标成 `unused`，方便后续清理/归档。
6. **`state.json` 仍未启用。** 当前项目元数据只落 `.framepack/arsenal.json` + `.framepack/weapons/`，不要创建空壳 `state.json`。
7. **HyperFrames 命令前会做 Arsenal preflight。** `npx hyperframes lint/preview/render` 前插件会非阻断审计 registry/manifest 状态。

比喻：Guardrail Hydrator 管人，Arsenal Registry 管物。前者像把规章贴到墙上，后者像仓库账本，记录道具从哪来、谁在用、哪些闲置。

## v0.9.4 Replica Mode Render Integrity

反向复刻测试暴露的可复用坑位见 `references/replica-mode-hardening.md`。核心规则：

1. **Replica Mode 不是灵感提取，是视频反编译。** 写 HTML 前必须先产出三件套：`VIDEO_DNA.md`、`.hermes/content_decomposition.md`、`TEMPLATE_BLUEPRINT.md`。
2. **`TEMPLATE_BLUEPRINT.md` 是施工图。** HTML 实现必须从 blueprint 落地，不能从 Agent 自由想象重编一支片。
3. **root composition 必须显式 `data-duration="TOTAL_SECONDS"`。** 不要依赖 GSAP timeline inference；final hold / 片尾黑场 / outro 会被合法剪掉，render 仍可能 exit 0。
4. **Replica handoff 禁止模糊实现语句。** `if strict`、`maybe`、`optionally`、`merge if needed`、`no outgoing transition` 必须改成 locked decision 或 `approved exception`。
5. **视觉验收要闭环。** snapshot contact sheet → 标硬伤 → CSS/布局修复 → 第二轮 snapshot → render；snapshot 后清理 `data-hf-id` 污染。
6. **警告分级。** `timeline_track_too_dense`、`overlapping_gsap_tweens`、`gsap_studio_edit_blocked` 可作为 P1/P2 工程整洁度，不等同于当前交付阻断；但必须记录后续 refactor 计划。

## v0.9.3 Test-Team Hardening

Ederson 实战测试暴露的可复用坑位见 `references/ederson-test-team-hardening.md`。核心规则：

1. `class="clip"` 是 HyperFrames 时间调度壳，不是视觉层。
2. 每个 clip 必须包 `.scene-inner` 或 `#sN-inner`。
3. blur/fade/scale/crossfade 只能动画 inner wrapper，禁止对 clip 根元素做 `opacity/filter/transform`。
4. `text-split-enter` 的左右 span 必须是完全相同文字，`.split-right` 绝对定位叠放，再用互补 `clip-path` 裁切。
5. `.framepack/state.json` 当前仍是 future-only metadata，不要创建空壳。
6. 实战回灌必须先写回归测试，再改 guardrails/director/weapon 文档，再部署同步和二次 hydrator no-op 验证。

## v0.9.1 Changes (HyperFrames Structure Bridge)

五项改动，修复 Framepack → HyperFrames 交接断层（Agent 写 HTML 时走"网页思维"而非"HyperFrames 视频思维"）：

1. **Step 2.5 时间窗口分配** — Director 在 Phase 2 分配精确的 data-start/duration，Agent 写 HTML 时直接抄，不用猜
2. **Structure Checklist** — expanded-prompt.md 模板内嵌 8 条 HyperFrames 结构硬检查（class="clip"、无手动 data-hf-id、字面字体名等）
3. **AGENTS.md 第二条铁律** — "HyperFrames 结构优先"：先搭骨架再填动画，骨架不对动画全废
4. **resolveElement 兼容** — 武器函数内部调用 `.querySelector()` 的，入口自动将字符串参数转为 DOM 元素，防止 `el.querySelector is not a function` 错误
5. **版本号升级 0.9.0 → 0.9.1** — 13 处文件全面同步

## 关键文件

下载的武器需要管理——不能下了不用、重复下、下完找不着。

**`.framepack/arsenal.json`** 是项目武器注册表：
```json
{
  "weapons": {
    "typewriter-cursor": { "source": "builtin", "code": "parts/references/typewriter-cursor.js" },
    "nexu-marble": { "source": "web", "url": "...", "local_path": ".framepack/weapons/nexu-marble.js", "hash": "sha256:..." }
  }
}
```

**六条生命周期规则**：找（arsenal.json → MOC → 下载）→ 注册（下载后立即写）→ 去重（hash）→ 使用（Manifest 引用）→ 审计（闲置告警）→ 归档（沉淀回主库）。

**核心分工：Guardrail Hydrator 管人，Arsenal Registry 管物。** Guardrail Hydrator 分发/注入 Agent 行为纪律；Arsenal Registry 管项目武器来源、hash、used_by、status、复用和清理。不要把 arsenal 当模板字典，它是项目级资产供应链台账。

运行时治理设计与坑位见：`references/arsenal-registry-runtime-governance.md`。

模板文件：`framepack:framepack-arsenal` skill → `references/arsenal-template.json`

## 关键文件

```
项目根/
├── frame.md                    ← Framepack Phase 1 产出
├── .hyperframes/
│   └── expanded-prompt.md     ← Framepack Phase 2 产出（含 Execution Manifest）
├── .framepack/
│   ├── arsenal.json           ← 武器注册表（下载/注册/去重/审计）
│   └── weapons/               ← 下载的武器代码
├── index.html                  ← HyperFrames 产出（Framepack 不管）
└── assets/                     ← 本地 GSAP/anime.js（Framepack 不管）
```

## AGENTS.md 双角色管理

Framepack 服务两种场景，AGENTS.md 不能一份通吃。详见 `references/agents-md-split.md`：
- **开发项目**（插件开发）：完整 Framepack + Superpowers 开发铁律 + pytest + 部署路径
- **测试项目**（视频制作）：仅 Framepack 用户侧内容，去掉 pytest/开发铁律/Editing Rules
- **Managed Block** 两份相同（用户工作流摘要），**版本号**两份同步，**铁律**两份同步

## Pitfalls

### 8-digit hex alpha in frame.md colors
HyperFrames renderer may not support 8-digit hex with alpha channel (`#RRGGBBAA`).
Always use `rgba()` for colors with transparency. Example:
- WRONG: `thread_glow: "#e6a06c44"`
- RIGHT: `thread_glow: "rgba(230,160,108,0.27)"`

This applies to frame.md color tokens, expanded-prompt.md style blocks, and any
inline CSS color references during the creative phase.

### Hook quality-check truncation on long expanded-prompts
The post-write LLM quality hook has a limited read window (~4KB). expanded-prompt.md
files over ~150 lines may be reported as truncated with missing scenes, incomplete
beats, or absent closing sections. **Verify the file yourself** (read_file with
offset) before re-writing — the hook is reading a truncated view of your file,
not the actual file. If your write_file reported success and the line count looks
right, the file is almost certainly complete.

### Scene element density below threshold
When the hook flags scenes with < 8-10 elements, use the rapid expansion formula
in `references/scene-density-expansion.md`: add 5 universal infra layers (dot-grid,
registration marks, hairline rules, corner brackets, scene label) to every scene,
then fill remaining slots with scene-specific layers. This turns a 3-element scene
into a 10-element scene in one pass — no creative rethinking needed.

### pre_tool_call hook kills terminal commands with exit_code 130

The `on_pre_tool_call` hook calls `_safe_inject(ctx, message, role="user")` to warn
when `frame.md` is missing. But `ctx.inject_message()` during `pre_tool_call` sends
SIGINT to the terminal process — the command gets killed even though the hook only
intended to warn. Exit code 130 = "Command interrupted."

This means ANY terminal command whose string contains "hyperframes" as a path
component (e.g. `cd /f/hyperframes && git commit`) gets killed. The comment says
"Warn — but don't block" but Hermes internals block it anyway.

**Workaround:** write a shell script to `/tmp/` and execute it — the script path
doesn't trigger the keyword match. Fix is in `on_pre_tool_call.py` (regex match +
the hook needs a restart to take effect).

### pre_tool_call substring match catches path components

The old check `if "hyperframes" not in command: return` matches ANY occurrence,
including paths like `/f/hyperframes/project/`. Fix: use regex:
`re.search(r'(?:^|\s)(?:npx\s+)?hyperframes(?:\s|$)', command)`.
This matches `hyperframes lint` or `npx hyperframes init` but NOT path components.
Also needs `import re` at the top of the hook file.

### pre_tool_call must resolve shell `cd project && npx hyperframes ...`

Test-team agents often run terminal commands as `cd F:/Framepack-01-test && npx hyperframes lint`
without passing the terminal tool's `workdir` argument. Hooks run before the shell executes,
so `args["workdir"]` still points at the Hermes/session cwd. If the hook hydrates that cwd,
`AGENTS.md`, `.framepack/arsenal.json`, and timeline ledger appear in the wrong project or not
in the test project at all.

Fix: before hydration/audit, parse a leading shell `cd <project> &&` / `cd <project>;` prefix
that appears before the HyperFrames command and resolve it against the base workdir. Regression:
`tests/test_storyboard_hook.py::TestPreToolCallHandoff::test_hydrates_project_from_cd_prefix_before_hyperframes_command`.

When bumping the Framepack version, **all release surfaces** must align:

- `plugin.yaml` → `version: "X.Y.Z"` + changelog description line
- `__init__.py` → `logger.info("Framepack vX.Y.Z Plugin registering")`
- `hooks/on_post_tool_call.py` → docstring + logger string
- `hooks/on_pre_tool_call.py` → docstring + logger string
- `AGENTS.md` → `<!-- version: X.Y.Z -->` comment + hook/skill headings
- `README.md` + `docs/README.zh-CN.md` → install verification version
- `compat/hyperframes-support.json`, `core/arsenal_registry.py`, `scripts/apply_skill_overlays.py`
- every plugin skill frontmatter in `framepack-plugin/skills/*/SKILL.md`

A partial bump (e.g. updating plugin.yaml but forgetting __init__.py or a plugin skill) creates
confusion when the logger reports a different version than the plugin spec.
Always run `tests/test_deploy_manifest.py` and grep for the old version string after bumping.

### Don't dump the entire weapon library into context (v0.9.1)

`framepack-animation-library` SKILL.md is a **design spec** for weapon developers.
It is NOT a weapon lookup table for directors. Loading it with `skill_view()` dumps
thousands of lines of format specs, workflow rules, and pitfalls into context —
the user sees a massive skill dump and rightfully says "stop."

**Correct weapon resolution flow:**
1. Use the built-in matching table in `framepack:framepack-director` (15 common paths)
2. Only load individual weapon SKILL.md + `references/*.js` for matched weapons
3. If the built-in table is insufficient, load only the index file (`prototype-index.md`)
4. Never `skill_view('framepack-animation-library')` without a `file_path`

### Fast path: skip confirmation loop when user gives complete specs

When ALL of these are true, skip Phase 1 Step 5 (user confirmation of frame.md)
and Phase 2 Step 7 (user confirmation of scenes):
- User specified aspect ratio (9:16, 16:9, 1:1)
- User provided BGM or explicitly said no audio
- User stated narration preference (yes/no)
- User specified style direction or provided assets

Fast path behavior: write frame.md → write expanded-prompt.md → show rhythm
skeleton once → ask ONE confirmation question. Target 6-8 tool calls total.

### BGM beat analysis: ffprobe RMS method

When librosa/essentia aren't available, use ffprobe `astats` filter for frame-level
RMS energy. Full technique in `references/bgm-beat-analysis.md`.
Key outputs: BPM, beat timestamps, per-second energy profile (to locate DROP sections).

### Reference-miner scripts may not be on disk

The `framepack:framepack-reference-miner` skill describes a script-driven pipeline
(`scene-detect.py`, `motion-analyze.py`, etc.) but these scripts may not be exposed
as callable linked files in the deployed plugin.

**Do not treat this as a hard blocker.** Strong models can still build an inline
`ffmpeg + Python` analysis pipeline, but that path must be auditable.

Use the dual-mode contract in `references/reference-miner-dual-mode.md`:
- **Scripted Mode** when the five-script pack is available: use reproducible scripts and JSON outputs.
- **Adaptive Mode** when scripts are missing: continue with inline ffmpeg/Python, but write commands, thresholds, sampling rate, audio method, assumptions, and weak spots into `reference-analysis.md`.

Full manual technique remains in `references/video-dna-pipeline.md`.

Key steps: ffmpeg `select='gt(scene,0.3)'` for scene boundaries → raw RGB pixel
analysis for colors/zones/motion → WAV energy analysis for BPM → synthesize into
VIDEO_DNA.md.

**Phase 1 (vision analysis) requires a vision-capable model.** If the active model
doesn't support images (e.g. GLM series), produce the quantitative DNA from Phase 0,
note missing content info in the report, and ask the user to describe scene contents.

### Stale plugin copies in test projects and source trees
Framepack plugin files can accumulate in unexpected locations:
- Test project forks (e.g. `F:\Framepack-01-test\framepack\`) with old plugin.yaml
- Hermes source tree (`hermes-agent/plugins/framepack/`) with old architecture
- npm package.json (`package.json`) with unrelated version lineage

These create "multi-version" confusion when an agent scans the project directory.
Hermes loads from `$HERMES_HOME/plugins/framepack/` — all other copies are stale.
Clean them with `rm -rf`. The only copies that should exist are:
- `F:\hyperframes\framepack-plugin\` (dev source)
- `F:\Hermes_windows\plugins\framepack\` (deployment, what Hermes actually loads)

## Communication Style

老田喜欢通俗化、类比化、比喻化的表达。用比喻解释架构（"器官移植 vs 外卖电话"、"安检门"、"寄生外挂"）。务实 + 幽默，逻辑严密但不端着。先想透再动手。
