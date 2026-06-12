# Framepack Agent Guide

<!-- version: 0.9.3 — sync with plugin.yaml and README -->

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

## ⚔️ 铁律：武器优先，禁止裸写 GSAP

**这条不是建议，是铁律。违反此条 = lint 不通过。**

### HTML 写动画前必须做的事

```
1. 读 expanded-prompt.md 末尾的 Execution Manifest
2. 逐武器加载：skill_view(name, file_path=<file>)  → 读 SKILL.md → 读 references/*.js
3. 武器有现成代码 → 复制代码 → 改参数（不改逻辑）
4. 标注 HANDWRITE 的场景 → 可裸写 GSAP，但必须遵守 HyperFrames 铁律
5. 裸写 GSAP 遇到标注了武器的场景 → 铁律违反 → 停止，回去加载武器
```

### 为什么这是铁律

Agent 面对"写动画"任务时走最舒适路径——"我懂 GSAP，直接写"。这条路径的结果是：
714 行手写 GSAP，零模板/零组件/零武器库，效果像后院的篝火而不是厨房的盛宴。

武器库不是字典——它是**命令**。Execution Manifest 里的每个 weapon 条目不是"建议"，
是"你必须加载这个文件"。

### 武器收发室

项目下的 `.framepack/` 目录管理所有武器：

```text
.framepack/
├── arsenal.json    ← 当前必需：武器注册表（builtin + 下载 + 自建）
└── weapons/        ← 当前可选：下载/自建的武器代码（.js / .css / .html）
```

`state.json` 是未来项目元数据设计，v0.9.x 尚未启用；不要为了“看起来完整”创建空壳文件。

**arsenal.json 生命周期规则**：

| 操作 | 规则 |
|------|------|
| 找武器 | 先查 arsenal.json → 命中直接用 → 未命中查 MOC → 仍未命中→下载 |
| 下载武器 | 白名单源 → 存 .framepack/weapons/ → 立即写 arsenal.json + hash |
| 使用武器 | Execution Manifest 引用 → Agent 读 arsenal.json 拿路径 → 加载代码 |
| 闲置武器 | manifest 里没引用但 arsenal.json 里有 → 标记 `unused` → 告警 |
| 重复下载 | hash 去重 → 相同 hash 不重下 |
| 项目结束 | arsenal.json 是完整清单 → 有价值武器沉淀回主库 |

**白名单下载源**：`nexu.io` · `codepen.io/@gsap` · `github.com/hyperframes`

**禁止下载的**：任意 GitHub repo · 非 HyperFrames 生态的 npm 包 · 未知 CDN

## ⚔️ 铁律：HyperFrames 结构优先

**先搭骨架，再填动画。骨架不对，动画全废。**

武器铁律管的是"用什么动画"，这条铁律管的是"HTML 骨架能不能被 HyperFrames 编译器识别"。两个铁律缺一不可。

### 写 HTML 前必须做的事

```
1. 读 expanded-prompt.md 的 HyperFrames Time Windows → 复制精确的时间窗口值
2. 每个场景 div = class="clip" + data-start + data-duration + data-track-index
   （时间窗口已给出，直接抄，不要自己算）
3. 禁止手动添加 data-hf-id（只有 video/audio 的由编译器处理）
4. 每个 clip 内必须有视觉内层 wrapper：`.scene-inner` 或 `#sN-inner`
5. 禁止对 clip 根元素 / clip root 做 opacity/filter/transform 动画
   （clip 是 HyperFrames 时间调度壳；blur crossfade/scale/fade 只能动 inner wrapper）
6. font-family 用字面字体名（"Anton 900"），禁止 CSS 变量（var(--font-heading)）
7. <video> 和 <audio> 放在根级别，不嵌套在 timed div 里
8. window.__timelines["main"] = tl（时间线注册，没有这个 = 全黑屏）
9. npx hyperframes lint → 0 errors 才能 preview / render
```

### 为什么这是铁律

武器铁律防止"714 行裸写 GSAP"。这条铁律防止"骨架对了但编译器不认识"。

HyperFrames 编译器做静态解析：
- 缺 `class="clip"` → 编译器不管理该元素 → 元素永远隐藏
- 多了 `data-hf-id` → 编译器当独立 clip → 没 time → 默认隐藏
- `var(--font-heading)` → 编译器不认识 → 字体回退到默认

**lint 拦不住这些错误**。lint 检查的是语法和属性冲突，不是运行时行为。
这些是"语法合法但语义错误"——就像写了没 bug 的代码，但逻辑全是错的。

## Plugin Hooks

v0.9.3 hooks do three things:

```text
post_tool_call:
  ├── Framepack skill_view → Guardrail Hydrator sync + current-session injection
  ├── frame.md 写入 → Guardrail Hydrator + LLM 质量检查（配色/字体/动效参数是否完整）
  └── expanded-prompt.md 写入 → Guardrail Hydrator + LLM 质量检查（场景 beat 是否完整）

pre_tool_call:
  └── hyperframes 命令执行 → Guardrail Hydrator + 检查 frame.md 是否存在（交接准备）
```

### Guardrail Hydrator

Framepack 的产品铁律不再依赖用户手动复制 AGENTS.md。插件目录的 `guardrails.md` 是规则源头。
当 Framepack 在任意项目中被召唤时，Hydrator 会：

1. 读取插件目录 `guardrails.md` + `plugin.yaml` version
2. 计算 guardrails hash
3. 在当前项目 `AGENTS.md` 中创建/更新 `FRAMEPACK MANAGED BLOCK`
4. 只替换托管块，不改用户自己的规则
5. 同时把 guardrails 注入当前会话，避免“文件更新了但本轮 Agent 还不知道”

这条链路解决的是产品规则分发问题：

```text
插件 guardrails.md = 规则源头
项目 AGENTS.md managed block = 持久落地
ctx.inject_message = 当前会话即时生效
version/hash = 防漂移
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

Framepack v0.9.3 skills:

| Skill | 作用 | 介入时机 |
|---|---|---|
| framepack | 主入口 — Prompt Factory 总纲 + 能力感知 + Design Picker 引导 | 全程 |
| framepack:framepack-director | 意图翻译 + Visual Style + frame.md + expanded-prompt + 音频规划 | Phase 1 + Phase 2 |
| framepack:framepack-gsap | 武器食谱（HyperFrames-safe GSAP 模式），不是 GSAP API 参考 | HyperFrames 写 HTML 时 |
| framepack-animation-library | 27 件 GSAP/anime.js 武器目录 | HyperFrames 写 HTML 时翻字典 |
| framepack:framepack-arsenal | 武器目录管理 | 创意阶段推荐 |
| framepack-reference-miner | 参考视频 DNA 提取 v0.9 — 自动化场景检测+运动分析+色彩提取+音频节拍+内容解构（5个脚本管道） | 需要参考时 |

> 注：`framepack:xxx` 格式的是插件内技能，需用冒号全名；不加前缀的是独立技能，直接用短名。|

HyperFrames skills（已安装到 $HERMES_HOME/skills/software-development/）：
| Skill | 作用 |
|---|---|
| hyperframes | 主公全制作规范（数据属性、composition 结构、GSAP 合约、场景切换铁律） |
| hyperframes-cli | CLI 命令：init, lint, inspect, preview, render, doctor |
| gsap | GSAP API 标准参考（to/from/timeline/easing/stagger） |

**核心原则：Framepack 的 skill 教"想什么"，HyperFrames 的 skill 教"怎么写"。两者不重复。**

**已合并/删除的 skills：**
- framepack-design-picker → 合并进 framepack:framepack-director
- framepack-template-fuser → 合并进 framepack:framepack-director
- framepack-hyperframes-builder → 不再需要（Framepack 不管 HTML）

## Development Verification

```bash
# Run plugin tests
cd framepack-plugin && python -m pytest tests/ -q -o "addopts="

# After modifying ANY plugin file (SKILL.md, plugin.yaml, hooks/, __init__.py, guardrails.md):
# Sync to Hermes deployment directory:
# F:\Hermes_windows\plugins\framepack\
```

## 🛠 开发铁律（Superpowers — 仅开发项目）

你在开发 Framepack 插件本身。以下规则修改任何代码前强制执行：

### 写新功能/大改动前
→ 加载 `brainstorming` skill — 设计先行，不直接写代码
→ 流程：探索上下文 → 提方案 → 写设计文档到 `.hermes/designs/` → 用户确认 → 再动手

### 声称完成前
→ 加载 `verification-before-completion` skill
→ 铁律：没有验证证据 ≠ 完成。运行 pytest，贴输出，再说话。
→ 禁止 "should work now" / "应该没问题" / "看起来对了"

### 修 bug 前
→ 加载 `systematic-debugging` skill — 四阶段根因分析
→ 先理解 bug，再修代码

### 写/改 Python 代码前
→ 加载 `test-driven-development` skill — 红→绿→重构
→ 先写失败的测试 → 看它失败 → 写最小代码让它通过 → 重构

### 改完 PLUGIN 文件后
→ 必须同步到部署目录：`copy → F:\Hermes_windows\plugins\framepack\`
→ plugin.yaml, SKILL.md, hooks/, __init__.py, guardrails.md — 这五类必须双位置一致

### 提交前
→ 加载 `requesting-code-review` skill — 安全扫描 + 质量检查

## Editing Rules

- Keep README, AGENTS.md, plugin.yaml 版本号三处同步
- Framepack 不管 HTML——所有 HTML/结构/渲染问题归 HyperFrames
- 武器库是字典，不是自动注入
- 创意阶段与用户共创，不需要用户看 expanded-prompt.md 全文
- **开发项目专属**：改 PLUGIN 文件必须同步部署，改 AGENTS.md 必须确认测试目录不需要同样改动

<!-- FRAMEPACK MANAGED BLOCK START -->
## Framepack Agent Workflow

Framepack is installed as an agent-native video creative workbench for this project.

- Trigger Framepack for vague video requests, creative direction, or style matching.
- Framepack produces frame.md + expanded-prompt.md (with Execution Manifest), then HyperFrames takes over.
- **铁律：写 HTML 前先读 Execution Manifest。武器有就用，裸写 GSAP 只允许 HANDWRITE 场景。**
- `.framepack/arsenal.json` 是武器收发室——下载、注册、去重、生命周期全在这里。
- Start every HyperFrames project by reading an official example: `npx hyperframes init --example product-promo`.
- Framepack does NOT audit HTML. Use `npx hyperframes lint` for that.
<!-- FRAMEPACK MANAGED BLOCK END -->
