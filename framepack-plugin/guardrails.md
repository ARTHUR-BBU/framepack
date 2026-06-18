# Framepack Guardrails

Framepack is a **Hermes Agent Plugin** — a Prompt Factory for HyperFrames.

HyperFrames 是摄影棚（设备齐全）。Framepack 是导演（更懂用户）。

**导演的活是分镜和创意方向，不是操纵摄影机。**

## Product Spine

```text
用户模糊意图
    ↓
Framepack 创意引擎
    ├── Phase 0: 素材收集 → asset-intake.md（v0.12 NEW）
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

如果用户意图不明确，可以：
1. 读 `visual-styles.md` 匹配最近的风格
2. 提供 2-3 个风格选项让用户选
3. 走 HyperFrames 的 Design Picker 流程

**与用户共创**：生成 frame.md 后展示给用户，确认视觉方向。用户说"换一个"或"金色再暖一点"，当场改。

### Phase 2: 创意细化 → expanded-prompt.md

**输入**：frame.md + 用户意图 + 用户确认
**输出**：`.hyperframes/expanded-prompt.md`

expanded-prompt.md 必须包含：
1. **Title + style block** — 引用 frame.md 的精确 hex 值和字体
2. **Rhythm declaration** — "hook-PUNCH-breathe-CTA" 之类的节奏命名
3. **HyperFrames Time Windows** — 每个场景的 data-start/data-duration/data-track-index
4. **Per-scene beats** — Concept / Mood / Depth layers / Animation choreography / Transition out
5. **Recurring motifs** — 跨场景的视觉线索
6. **Negative prompt** — 避免什么
7. **HyperFrames Structure Checklist** — 写 HTML 前硬检查
8. **Execution Manifest** — 场景到武器文件的强绑定

**与用户共创**：展示场景节奏和关键创意点，让用户确认或调整。不需要展示 expanded-prompt.md 全文。

## ⚔️ 铁律：武器优先，禁止裸写 GSAP

**这条不是建议，是铁律。违反此条 = lint 不通过。**

### HTML 写动画前必须做的事

```text
1. 读 expanded-prompt.md 末尾的 Execution Manifest
2. 逐武器加载：skill_view(name, file_path=<file>) → 读 SKILL.md → 读 references/*.js
3. 武器有现成代码 → 复制代码 → 改参数（不改逻辑）
4. 标注 HANDWRITE 的场景 → 可裸写 GSAP，但必须遵守 HyperFrames 铁律
5. 裸写 GSAP 遇到标注了武器的场景 → 铁律违反 → 停止，回去加载武器
```

### 为什么这是铁律

Agent 面对"写动画"任务时走最舒适路径——"我懂 GSAP，直接写"。这条路径的结果是：714 行手写 GSAP，零模板/零组件/零武器库，效果像后院的篝火而不是厨房的盛宴。

武器库不是字典——它是**命令**。Execution Manifest 里的每个 weapon 条目不是"建议"，是"你必须加载这个文件"。

## 武器收发室

项目下的 `.framepack/` 目录管理所有武器：

```text
.framepack/
├── arsenal.json    ← 当前必需：武器注册表（builtin + 下载 + 自建）
└── weapons/        ← 当前可选：下载/自建的武器代码（.js / .css / .html）
```

`state.json` 是未来项目元数据设计，当前版本仍未启用；不要为了“看起来完整”创建空壳文件。

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

```text
1. 读 expanded-prompt.md 的 HyperFrames Time Windows → 复制精确的时间窗口值
2. root composition 必须显式写 `data-duration="总时长"`
   （不要依赖 GSAP timeline inference/推断；final hold / 片尾黑场 / outro 会被合法剪掉）
3. 每个场景 div = class="clip" + data-start + data-duration + data-track-index
   （时间窗口已给出，直接抄，不要自己算）
4. 禁止手动添加 data-hf-id（只有 video/audio 的由编译器处理）
5. 每个 clip 内必须有视觉内层 wrapper：`.scene-inner` 或 `#sN-inner`
6. 禁止对 clip 根元素 / clip root 做 opacity/filter/transform 动画
   （clip 是 HyperFrames 时间调度壳；blur crossfade/scale/fade 只能动 inner wrapper）
7. font-family 用字面字体名（"Anton 900"），禁止 CSS 变量（var(--font-heading)）
   字体生产口径：可用本地 VPN/代理获取外部字体，但最终 HTML 应 vendor 到 `assets/fonts/` + `@font-face`；不要让 render/playback 依赖 live Google Fonts。
8. <video> 和 <audio> 放在根级别，不嵌套在 timed div 里
9. window.__timelines["main"] = tl（时间线注册，没有这个 = 全黑屏）
10. npx hyperframes lint → 0 errors 才能 preview / render
```

### 为什么这是铁律

武器铁律防止"714 行裸写 GSAP"。这条铁律防止"骨架对了但编译器不认识"。

HyperFrames 编译器做静态解析：
- 缺 `class="clip"` → 编译器不管理该元素 → 元素永远隐藏
- 多了 `data-hf-id` → 编译器当独立 clip → 没 time → 默认隐藏
- `var(--font-heading)` → 编译器不认识 → 字体回退到默认

**lint 拦不住这些错误**。lint 检查的是语法和属性冲突，不是运行时行为。这些是"语法合法但语义错误"——就像写了没 bug 的代码，但逻辑全是错的。

## Required Reading In A Workbench

Framepack 工作台只需要关注：

1. `frame.md` — 视觉身份（Framepack 产出，HyperFrames 消费）
2. `.hyperframes/expanded-prompt.md` — 创意细化（Framepack 产出，HyperFrames 消费）
3. `index.html` — HyperFrames 产出（Framepack 不管）

## Handoff to HyperFrames

Framepack 完成 Phase 1 + 2 后，HyperFrames 接管后续流程。

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

Framepack 的 expanded-prompt 是"导演分镜"——创意方向、场景节奏、动画动词。HyperFrames 需要在上面加厚制作细节。

**Framepack 提供创意灵魂，HyperFrames 补充制作细节。两者是 enrich 关系，不是 replace。**

## Skills

Framepack skills:

| Skill | 作用 | 介入时机 |
|---|---|---|
| framepack | 主入口 — Prompt Factory 总纲 + 能力感知 + Design Picker 引导 | 全程 |
| framepack:framepack-director | 意图翻译 + Visual Style + frame.md + expanded-prompt + 音频规划 | Phase 1 + Phase 2 |
| framepack:framepack-gsap | 武器食谱（HyperFrames-safe GSAP 模式），不是 GSAP API 参考 | HyperFrames 写 HTML 时 |
| framepack-animation-library | 27 件 GSAP/anime.js 武器目录 | HyperFrames 写 HTML 时翻字典 |
| framepack:framepack-arsenal | 武器目录管理 | 创意阶段推荐 |
| framepack-reference-miner | 参考视频 DNA 提取 | 需要参考时 |

> 注：`framepack:xxx` 格式的是插件内技能，需用冒号全名；不加前缀的是独立技能，直接用短名。|

## Known Limitations — HyperFrames 上游限制

某些 HyperFrames lint warning 是 HyperFrames 架构的设计决策，不是 Framepack bug，
也不是可以修复的质量问题。Framepack quality_audit 会自动将它们分类为 `upstream_limit`，
与可修复的质量问题（`quality_issue`）分开展示。

| Warning Code | 描述 | 状态 | 规避方式 |
|---|---|---|---|
| gsap_studio_edit_blocked | GSAP 注册 timeline 的元素 Studio 不可拖拽编辑 | 等上游加 suppress 标记 | 不在 Studio 里拖拽 GSAP 管的元素 |

**Agent 行为**：看到 `upstream_limit` 分类的 warning，不要试图修复——这是 HyperFrames 的
结构性限制，修不了。只在 `quality_issue` 分类上花时间。

**Upstream Warning Bridge 工作流**：

```
1. Agent 跑 npx hyperframes lint --json > .framepack/lint-output.json
2. post_tool_call hook 自动检测 → 分类 → 写 .framepack/hyperframes-findings.json
3. quality_audit 读缓存 → 统一报告（quality_issue + upstream_limit 分开）
```

如果 Agent 跑 `npx hyperframes lint`（没有 `--json`），pre_tool_call hook 会提醒加 `--json`。

## Core Principle

Framepack 的 skill 教"想什么"，HyperFrames 的 skill 教"怎么写"。两者不重复。
