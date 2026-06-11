# 设计：Framepack → HyperFrames 结构桥梁

## 问题

测试发现根因：Agent 写 HTML 时走了"网页思维"，不是"HyperFrames 视频思维"。
Framepack 输出了完美的创意 Manifest，但没有翻译成 HyperFrames 能吃的结构约束。

三个致命表现：
1. 场景 div 缺 `class="clip"` + `data-start/duration/track-index`
2. 手动加了 88 个 `data-hf-id`（编译器当独立 clip 处理 → 全部隐藏）
3. CSS 变量 `var(--font-heading)` 不被编译器识别

再加一个 JS 坑：武器函数 `splitTextStagger('#id', ...)` 传字符串，
函数内部 `el.querySelector()` 对字符串报错。

## 根因分析

不是知识缺失——HyperFrames skill 里全写了。是交接点没有"人格切换"，
Agent 继续用"导演"思维写 HTML，HyperFrames 的结构规范被导演人格压过。

类比：Framepack 是菜谱，HyperFrames 是电磁炉。菜谱写"中火炒 3 分钟"，
但没说电磁炉要用 800W 档。厨师按煤气灶经验来，菜没熟。

## 改动方案

### 改动 1：director SKILL.md — expanded-prompt 加结构模板

**位置**：Phase 2 Step 6（Write to file）和 Execution Manifest 之间

**做什么**：在 expanded-prompt.md 末尾、Execution Manifest 之前，
加一段 **HyperFrames Structure Contract**。

内容分两部分：

**A. 时间窗口模板** — 每个场景附带 data-start/data-duration 建议：

```
## HyperFrames Time Windows

Scene 1 (0-3.5s): IGNITION
  → <div id="s1" class="clip" data-start="0" data-duration="3.5" data-track-index="1">
Scene 2 (3.5-7.5s): THE NAME
  → <div id="s2" class="clip" data-start="3.5" data-duration="4" data-track-index="1">
...
```

Agent 不用自己算时间窗口——Framepack 已经算好了 BGM 节拍和场景节奏。

**B. 结构铁律清单** — 写 HTML 前必须逐条检查：

```
## HyperFrames Structure Checklist (MANDATORY — verify before writing HTML)

□ Every scene div: class="clip" + data-start + data-duration + data-track-index
□ NO data-hf-id on non-media elements (only video/audio keep them)
□ font-family: literal strings only ("Anton", not "var(--font-heading)")
□ Videos at root level, not nested in timed divs
□ window.__timelines["main"] = tl (timeline registration)
□ npx hyperframes lint → 0 errors before preview
```

**为什么放在 expanded-prompt.md 里而不是 AGENTS.md**：
AGENTS.md 是项目级规则，但结构清单是每个视频的**具体数据**
（时间窗口、场景 ID、track 编号）。放在 expanded-prompt.md 里，
Agent 读创意的同时就读到结构——不需要额外加载文件。

### 改动 2：AGENTS.md — 第二条铁律

**位置**：在"⚔️ 铁律：武器优先"后面加第二条

**做什么**：

```markdown
## ⚔️ 铁律：HyperFrames 结构优先

**先搭骨架，再填动画。骨架不对，动画全废。**

写 HTML 前必须做的事：

1. 读 expanded-prompt.md 的 HyperFrames Time Windows
2. 每个场景 div = class="clip" + data-start/duration/track-index（时间窗口已给出）
3. 禁止手动添加 data-hf-id（只允许 video/audio 自带的）
4. font-family 用字面字体名，禁止 CSS 变量
5. window.__timelines["main"] = tl 注册时间线
6. npx hyperframes lint → 0 errors 才能继续

违反任何一条 = 黑屏或运行时错误，不是 lint 能拦住的。
```

### 改动 3：武器 JS — string→element 兼容层

**问题**：`splitTextStagger('#s2-name', ...)` 传 CSS 选择器字符串，
函数内部直接 `el.querySelector()` → 对字符串报错。

**方案**：不逐个函数加 if 判断，写一个共享的工具函数，
所有武器函数在开头调用。

**新增文件**：`parts/references/hf-utils.js`

```javascript
// HyperFrames weapon compatibility utilities
// Resolve CSS selector strings to DOM elements —
// GSAP accepts strings natively, but custom weapon functions don't.
function resolveElement(el) {
  if (typeof el === 'string') return document.querySelector(el);
  return el;
}
```

**改动范围**：17 个 parts 武器 + 4 个 blocks 武器 = 21 个函数。
每个函数开头加一行：`textEl = resolveElement(textEl);`

但这里有个判断——不是所有函数都需要。
`elasticScaleEnter` 的 `targets` 参数传给 `tl.fromTo(targets, ...)`，
GSAP 本身接受字符串，不需要 resolve。只有函数**内部**直接调用
`el.querySelector()` / `el.querySelectorAll()` 的才需要。

排查结果：
- `text-split-enter.js` — `textEl.querySelector('.split-left')` ✅ 需要
- `splittext-stagger-chars.js` — `SplitText.create(textEl)` 不需要（SplitText 接受字符串）
- `caption-clip-wipe.js` — `textEl.querySelectorAll('.word')` ✅ 需要
- `bg-blur-mask.js` — `container.querySelector('.bg-blur-mask')` ✅ 需要
- `anime-text-split.js` — 需要看具体代码
- 其他 blocks 函数（card-cascade, hero-spin 等）参数是 container，内部用 container

**实际改动量**：约 5-8 个函数 + 1 个新增 hf-utils.js

### 改动 4：director SKILL.md — Step 3.5 场景时间分配

**位置**：Phase 2 Step 2（Declare rhythm）和 Step 3（Per-scene beats）之间

**做什么**：新增 Step 2.5 — 基于总时长 + BGM 结构 + 场景数量，
算出每个场景的精确时间窗口（start, duration, track-index）。

这一步让后续的 Time Windows 模板有数据来源，而不是让 Agent 猜。

## 不改什么

1. **不改 HyperFrames skill** — 第三方安装，换环境失效
2. **不改 HyperFrames lint** — lint 的职责是语法检查，运行时行为不归它管
3. **不改 AGENTS.md 的 Superpowers 触发条件** — 这个问题已经在上一轮讨论过

## 改动清单

| # | 文件 | 改什么 | 类型 |
|---|------|--------|------|
| 1 | director SKILL.md | Phase 2 加 Time Windows + Structure Checklist 模板 | 结构模板 |
| 2 | director SKILL.md | 新增 Step 2.5 场景时间分配 | 流程增强 |
| 3 | AGENTS.md | 新增"HyperFrames 结构优先"铁律 | 规则铁律 |
| 4 | parts/references/hf-utils.js | 新增 resolveElement() | 兼容工具 |
| 5 | 5-8 个武器 JS | 函数开头加 resolveElement 调用 | JS 兼容修复 |

## 风险

- **Time Windows 硬编码**：BGM 节拍变化时需要重新算。但总比没有强。
- **武器 JS 改动**：影响所有引用这些武器的项目。resolveElement 是幂等操作，
  不改变已有行为（传入 DOM 元素时直接返回）。
