# Official Prompt + Pipeline Alignment — 模板/非模板双入口校准

> 设计校准 · 2026-07-01
> 状态：研究结论 + 后续设计方向；不含实现
> 来源：HeyGen AIE X 文章、HyperFrames 0.7.21 官方 Prompt Guide / Pipeline / 4K / HDR / HTML-in-Canvas / Keyframes 文档

## 一句话

Framepack 不能只像“模板店员”。模板是套餐，非模板是私厨。真正的导演价值，恰恰在用户没有模板、只有一团模糊想法或一堆真实资料时，把它导演成有审美、有节奏、有资产依据的视频。

## 核心校准

之前 Pipeline Visibility 的实现主要从 `miara-style-template` 验收反馈出发，容易让脑子被“模板流程”填满。官方材料提醒我们：HyperFrames 的主路径不是“模板优先”，而是“输入上下文 → 产出 artifact → 逐步导演/构建/验证”。

所以 Framepack 必须明确支持两条一等入口：

| 入口 | 类比 | 用户典型输入 | Framepack 责任 |
|---|---|---|---|
| 非模板流程 | 私厨点菜 | “帮我做个产品发布视频”、URL、PDF、CSV、transcript、品牌资料、参考片 | 分诊、收素材、定风格、写脚本/分镜、选择是否调用 HyperFrames 高级能力 |
| 模板流程 | 套餐改配料 | “用这个模板做”、已选 template、已有参数 | 安装/选择模板、收必填参数、替换资产、验证参数与模板契约 |

**原则：模板流程不能成为主流程的假设。** 所有 progress、prompt completeness、gate、能力建议，都必须先为非模板成立，再给模板加专属分支。

## 官方材料带来的四个产品规则

### 1. 冷启动：先补齐创作四件套

官方 Prompt Guide 说冷启动最需要：

- duration
- aspect ratio
- mood / style
- key elements

Framepack 非模板入口要把它变成用户友好的“创作小票”：

```text
还缺：时长 / 画幅 / 风格 / 关键元素 / 音频 / CTA
```

不要上来问一堆技术参数。像服务员确认“几个人、忌口、辣度、主菜”，不是让客人填厨房 BOM。

### 2. 暖启动：真实上下文优先于想象

HeyGen AIE 文章的关键不是炫技，而是：

- 从真实设计稿和 Frame doc 开始
- 从网站抓真实 sponsor logo / speaker photo / AIE logo
- 不手搓品牌资产
- 故事从人群、公司、能量爬坡到 release
- 视觉 hit 和音效 hit 对齐

Framepack 非模板入口必须优先识别“用户有没有给可用上下文”：

- URL / 网站
- 文档 / PDF / deck
- CSV / repo / transcript
- 品牌素材 / logo / 截图
- 参考视频

有上下文时，先 Capture / Asset Intake；不要直接脑补视觉风格。

### 3. Pipeline Visibility 要映射官方 7 步，而不是模板 6 步

官方 Pipeline：Capture → Design → Script → Storyboard → VO+Timing → Build → Validate。

Framepack 前台可以继续用中文简化，但后台语义要对齐官方：

| 用户状态牌 | 官方 artifact | 非模板判定 | 模板判定 |
|---|---|---|---|
| 素材准备 | Capture | `.framepack/asset-intake.md` / capture artifacts | template installed + template-selection |
| 视觉身份 | Design | `frame.md` / DESIGN-like brand sheet | template design base + overrides |
| 文案脚本 | Script | narration/script/CTA decisions | template copy params |
| 分镜导演稿 | Storyboard | `.hyperframes/expanded-prompt.md` | template slots + expanded-prompt adaptation |
| 配音/节奏 | VO + Timing | BGM/TTS/transcript/timing cues | template audio slots / timing overrides |
| 制作中 | Build | `index.html` / compositions | template materialized HTML |
| 验片交付 | Validate | lint/validate/snapshot/render evidence | same |

这比原先“已选模板 → 已填参数 → 已出视觉稿...”更全面。模板状态只是其中一种证据，不是 pipeline 的骨架。

### 4. 0.7.21 新能力按“导演用途”启用，不默认全开

| 能力 | 什么时候推荐 | 什么时候不推荐 |
|---|---|---|
| 4K Rendering | 官网 Hero、发布会大屏、品牌大片、文字/SVG/DOM 为主 | 普通预览、低清素材为主、快速迭代 |
| HDR Rendering | 有 HDR 视频 / 16-bit HDR PNG，目标平台支持 HDR | 没 HDR 源、WebM/MOV/GIF 输出、只是想“更高级” |
| HTML-in-Canvas | 产品 UI、dashboard、网页、app 截图要做 3D/Shader/电影感 hero beat | 每个场景都套，或只是普通文字卡片 |
| Keyframes & Arc Motion | Studio 二次微调、抛物线/吸附/飞入/logo 聚合等物理感动作 | 代替基础结构规划，或让 Agent 先写一团不可读 GSAP |

## 对现有 Pipeline Visibility 的修正方向

### 保留

- 伴随式 gate：继续保留。官方 Validate 证明验证不能只在最后。
- `.framepack/progress.md`：继续保留。官方 artifact pipeline 证明单文件状态牌方向正确。
- 模板参数卡：继续保留，但它只是模板分支的一张卡。

### 调整心智

原本：

```text
template-selection → params → frame.md → expanded-prompt → HTML → render
```

校准后：

```text
入口分诊
  ├─ 非模板：cold/warm start completeness → asset/design/script/storyboard/audio/build/validate
  └─ 模板：template selection + required params → same official pipeline mapping
```

### 后续实现不应做成复杂系统

仍然遵守 simplify：

- 不造新 state machine
- 不造大型 schema 引擎
- 不创建 `state.json`
- 不推翻现有 gates
- progress 检测仍基于文件/产物/gate 结果

但 `pipeline_progress.py` 的阶段名和判定要从“模板验收导向”升级为“官方 pipeline 导向”，模板只是附加 evidence。

## 非模板流程的 Prompt Completeness Card 草案

当用户没有选模板时，Framepack 应该生成/提示类似：

```markdown
## Framepack 创作小票

当前入口：非模板 / cold start 或 warm start

已具备：
- 主题：...
- 可用上下文：URL / 文档 / 截图 / 无

还缺：
- 时长：建议 20–30s
- 画幅：建议 16:9 / 9:16
- 风格：建议 Kinetic Type / Data Drift / Velvet Standard
- 关键元素：logo / 产品图 / CTA
- 音频：BGM / TTS / 无旁白

下一步：先补素材与风格，再写 frame.md。
```

模板流程的参数卡则是：

```markdown
## Framepack 模板参数卡

当前入口：模板
模板：miara-style-template
必填：brand_name / tagline / cta / logo / key assets
下一步：填参后进入同一套 Design → Storyboard → Build → Validate。
```

## 为什么这次校准重要

如果只围绕模板继续修，Framepack 会变成“模板安装器 + 参数提醒器”。这有用，但不够。

Framepack 的真正价值是：

1. 用户模糊想法进来，不知道该怎么拍；
2. Framepack 帮他判断是冷启动、暖启动、模板、参考复刻、网站转视频；
3. 用真实素材和官方 pipeline 把创意落成 artifact；
4. 再让 HyperFrames 0.7.21 的 Studio、render、4K/HDR/HTML-in-Canvas 等能力在正确时机发力。

一句话：**模板是菜单，非模板是厨艺。Framepack 不能只会推套餐。**

## 后续建议

下一步不是马上改代码，而是先审视 `core/pipeline_progress.py` 和 `on_post_tool_call.py`：

1. progress 阶段命名是否模板偏置；
2. 非模板项目没有 `template-selection.md` 时，状态牌是否仍然清晰；
3. asset-intake / frame.md / expanded-prompt / audio cues / index.html 是否能支撑官方 7 步映射；
4. 模板参数卡是否应并列新增“非模板 Prompt Completeness Card”。

只有这四点想清楚，再进入 TDD 实现。

---

## 代码体检结论（2026-07-01）

已读：

- `framepack-plugin/core/pipeline_progress.py`
- `framepack-plugin/hooks/on_post_tool_call.py`
- `framepack-plugin/tests/test_pipeline_progress.py`
- `framepack-plugin/tests/test_post_tool_gate_routing.py`

结论：**当前实现确实偏模板，是 miara-style-template 验收现场的合理产物，但不能作为 Framepack 主流程长期骨架。**

### 发现 1：空项目被标成“已选模板”

现状：

```python
class PipelineStage(IntEnum):
    TEMPLATE_SELECTED = 0
    PARAMS_FILLED = 1
    FRAME_MD = 2
    ...

else:
    stage = PipelineStage.TEMPLATE_SELECTED  # empty project = start
```

对应测试：

```python
def test_empty_project_starts_at_template_stage():
    assert result.current_stage == PipelineStage.TEMPLATE_SELECTED
```

问题：非模板冷启动项目一打开，状态牌会暗示“已选模板/模板阶段”，这会误导 Agent 和用户。

通俗说：客人还没点菜，服务员小票已经写“已选套餐”。这就是错位。

### 发现 2：状态轴从模板参数开始，而不是官方 pipeline 开始

现状阶段：

```text
已选模板 → 已填参数 → 已出视觉稿 → 已出分镜 → 可预览 → 可渲染
```

这对模板验收很直给，但对非模板流程缺了：

- 素材准备 / Capture
- 文案脚本 / Script
- 配音节奏 / VO + Timing
- 验片交付 / Validate

结果：非模板项目即使有 `asset-intake.md`，progress 也不会把它作为起点。

### 发现 3：asset-intake hook 没接入 progress

`on_post_tool_call.py` 已有：

```python
elif _is_asset_intake(file_path):
    _handle_asset_intake(ctx, file_path)
```

但 `_handle_asset_intake()` 只 inject 素材检查，不调用 `_run_pipeline_gates_and_update()`，也不写 `.framepack/progress.md`。

这说明非模板暖启动最重要的一步——真实素材/上下文进入项目——没有被 Pipeline Visibility 看见。

### 发现 4：模板参数卡是独立分支，合理但不应代表主入口

`_handle_template_param_card()` 只在 `template-selection.md` 写入时触发：

```python
elif _is_template_selection(file_path):
    _handle_template_param_card(ctx, file_path)
```

这是对的。问题不是它存在，而是 progress 的全局阶段被它牵着走。

## 后续 TDD 改造方向（仍保持 simplify）

### Task A：把阶段轴改成官方 pipeline 友好

建议替换为：

```python
class PipelineStage(IntEnum):
    INTAKE = 0        # 素材准备 / Capture
    DESIGN = 1        # 视觉身份 / Design
    SCRIPT = 2        # 文案脚本 / Script
    STORYBOARD = 3    # 分镜导演稿 / Storyboard
    TIMING = 4        # 配音节奏 / VO + Timing
    BUILD = 5         # 制作中 / Build
    VALIDATE = 6      # 验片交付 / Validate
```

注意：不一定所有项目都需要完整文件集；仍然以存在的 artifact 判定当前阶段，不造状态机。

### Task B：模板作为 evidence，不作为 stage spine

progress 可以显示：

```text
- ✅ 素材准备（template-selection.md / asset-intake.md）
- 🔄 视觉身份 ← 当前（frame.md）
```

如果是模板项目，`template-selection.md` 是素材/入口 evidence。
如果是非模板项目，`.framepack/asset-intake.md` / capture artifacts 是 evidence。

### Task C：asset-intake 写入后更新 progress

`_handle_asset_intake()` 后应该更新 `.framepack/progress.md`，并可选择跑已有 `asset_intake` gate。

最小实现：

```python
project_dir = _project_dir_for_framepack_file(file_path)
_run_pipeline_gates_and_update(
    ctx,
    project_dir,
    ["core.gates.asset_intake.check_asset_depth"],
)
```

已确认真实函数名：`core.gates.asset_intake.check_asset_depth`。

### Task D：新增非模板 Prompt Completeness Card

模板参数卡保留；非模板入口新增“创作小票”。触发点可以非常克制：

- 写入 `.framepack/asset-intake.md` 后，如果没有 `template-selection.md`；或
- skill/router 判断为 general/product-launch/website-to-video 非模板意图时。

第一版建议只做文件触发，不改 router：

```text
asset-intake.md 写入 + 无 template-selection.md → inject 非模板创作小票
```

小票内容不要搞复杂 schema，先检查：

- 时长
- 画幅
- 风格/情绪
- 关键元素
- 音频/TTS/BGM
- CTA / 输出目标

### Task E：测试先行

新测试至少覆盖：

1. 空项目不再显示“已选模板”。
2. 非模板项目只有 `.framepack/asset-intake.md` 时，progress 显示“素材准备”。
3. 有 `frame.md` 时，progress 显示“视觉身份”。
4. 有 `.hyperframes/expanded-prompt.md` 时，progress 显示“分镜导演稿”。
5. 模板项目仍显示 template-selection evidence，但不把模板作为全局第一阶段。
6. 写 asset-intake 后会写 `.framepack/progress.md`。
7. 模板参数卡原有测试保持通过。

## 决策

后续如果开工，优先改 **progress spine**，不是先扩模板卡。

原因：progress spine 是所有入口共用的地基；模板卡只是一个房间的门牌。地基歪了，门牌再漂亮也没用。
