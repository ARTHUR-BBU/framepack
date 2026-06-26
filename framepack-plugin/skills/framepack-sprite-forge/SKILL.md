---
name: framepack-sprite-forge
title: "Framepack 精灵锻造车间"
description: >-
  Sprite sheet 素材管线：把用户的一句创意变成一份精确的生图图纸（品红背景+网格+风格），
  用户拿图纸去外部工具生图，拿回来后跑确定性后处理（色键去背景、切帧、对齐、质检），
  产出透明 sprite sheet，交给 sprite-animation 武器播放。
  做"出图纸"和"裁切装订"，不做"替用户生图"（创意主权留给用户）。
version: 0.16.0
linked_files:
  references/prompt-rules.md: "生图 prompt 工程规则（核心知识资产）"
  references/sheet-modes.md: "素材类型/动作/网格/视角推断指南"
  scripts/process_sprite.py: "后处理脚本（色键去背景+切帧+对齐+GIF+QC）"
  scripts/make_layout_guide.py: "布局参考图生成（虚线格子+安全区框）"
  templates/sprite-prompt-output.md: "Step A 输出模板（填给用户）"
platforms: [linux, macos, windows]
---

# Framepack 精灵锻造车间（sprite-forge）

## 一句话定位

用户创意 → **出图纸**（生图 prompt + 布局参考图）→ 用户外出生图 →
**裁切装订**（后处理：去背景/切帧/对齐/质检）→ 透明 sprite sheet →
交给 `sprite-animation` 武器播放。

本车间只干**出图纸（Step A）**和**裁切装订（Step C）**两件事；
**生图（Step B）留给用户**——用户保留创意主权，去任何生图工具
（Midjourney / SD / FAL / DALL·E / 手绘都行）。

> 设计来源：`framepack/.hermes/designs/2026-06-19--sprite-forge-integration.md`
> 移植自 [agent-sprite-forge](https://github.com/0x0funky/agent-sprite-forge) (MIT)，
> 砍掉了生图集成、地图生成、游戏引擎导出。

---

## 三步流程

### Step A — 出图纸（Framepack 干）

读到用户创意涉及帧动画效果时：

1. **推断参数**（见下文"参数推断指南"）：素材类型 / 动作 / 网格 / 风格 / 视角 / cell_size。
2. **生成布局参考图**：跑 `make_layout_guide.py`，得到一张虚线格子+安全区框的 PNG，
   作为生图的构图锚点。
3. **手写生图 prompt**：按 `references/prompt-rules.md` 的规则和通用模板拼出完整英文 prompt
   （品红背景硬约束 + 精确网格 + 帧间一致 + 单动作族 + 风格关键词 + 负面提示）。
4. **填模板**：把 prompt、参考图路径、裁切参数、武器播放参数填进
   `templates/sprite-prompt-output.md`，展示给用户。
5. **暂停等待**：明确告诉用户"拿这份 prompt 去外部工具生图，拿回 raw-sheet.png 后回来"。

> 不要跑脚本自动生成 prompt——生图 prompt 是创意决策，Agent 手写。
> 脚本只做确定性像素处理。

### Step B — 用户外出生图（Framepack 暂停）

用户拿 Step A 的 prompt + 布局参考图，去任意生图工具产出一张原始大图
（`raw-sheet.png`）。这一步 Framepack 不参与，等用户把图拿回来。

如果用户拿回的图不符合规则（背景不是纯品红、网格歪了、帧间不一致），
后处理 QC 会报警，Agent 据此提示用户哪条规则被破坏、要不要重新生图。

### Step C — 裁切装订（Framepack 干）

用户拿回 `raw-sheet.png` 后，跑后处理脚本：

```bash
python skills/framepack-sprite-forge/scripts/process_sprite.py process \
  --input raw-sheet.png \
  --rows 3 --cols 4 \
  --output-dir assets/sprites/<sprite-name>/ \
  --cell-size 384 \
  --fps 8
```

产出（写入 `--output-dir`）：

| 文件 | 用途 |
|------|------|
| `sheet-transparent.png` | 透明 sprite sheet，喂给 `sprite-animation` 武器 |
| `frame_01.png ... frame_NN.png` | 单帧 PNG（备用/调试/单帧引用） |
| `animation.gif` | 透明背景动画 GIF（给用户预览用） |

然后把产物存入项目 `assets/sprites/<name>/`，写入 `asset-intake.md`，
Execution Manifest 里用 `sprite-animation` 武器引用 `sheet-transparent.png`。

---

## 参数推断指南

读到用户创意后，推断五类参数。完整逻辑和默认值见 `references/sheet-modes.md`，
这里是要点：

| 参数 | 推断依据 | 默认值 |
|------|----------|--------|
| **素材类型** asset_type | 画的是什么（角色/特效/图标/抛射体） | `character` |
| **动作** action | 在干什么（idle/walk/run/attack/cast/explode/effect） | `walk` |
| **网格** rows×cols | 由动作推荐帧数推（walk→6→2×3，idle→4→2×2） | `2×2` |
| **风格** style | frame.md 视觉身份（pixel_art/flat/cel/clean_hd） | `pixel_art` |
| **视角** viewpoint | 从哪个角度（side/topdown/isometric/front） | `side` |
| **cell_size** | 输出单帧画布像素 | `384` |
| **fps** | 动作节奏（idle 慢/effect 快） | `8` |
| **erode_pixels** | alpha 边缘收缩（effect/spell 清理辉光） | `0` |

推断原则：
- **帧数必须 = rows×cols**。用户要的帧数没有完美网格时，优先把帧数调到最近的网格积数，
  并在输出里注明调整（不要留空 cell）。
- **拿不准就走默认**，并在输出里写明"按默认 X 推断，如需 Y 请告知"，让用户一键改主意。
- **风格优先对齐 frame.md**，保证 sprite 和整支视频画风一致。

---

## CLI 接口

### `process_sprite.py process` — 后处理（Step C）

```bash
python scripts/process_sprite.py process \
  --input <raw-sheet.png>          # 必填：用户拿回的原始大图
  --rows <N>                       # 必填：网格行数
  --cols <M>                       # 必填：网格列数
  --output-dir <dir>               # 必填：产物输出目录
  --cell-size <px>                 # 必填：输出单帧画布像素（正方形）
  --threshold <0-255>              # 可选：品红色键阈值，默认 30
  --fps <N>                        # 可选：GIF 导出帧率，默认 8
  --erode-pixels <N>               # 可选：alpha 边缘收缩（effect/spell 清理辉光），默认 0
```

处理流水线：自适应背景检测 → 色键去背景 → 边缘清理 → [alpha erode] → 按网格切帧 →
单帧居中对齐 → 重组透明 sheet → 导出单帧 PNG + 透明 GIF。

> **alpha erode（辉光清理）**：发光体素材（火焰/能量球/魔法光效）天然有辉光，
> 辉光外缘与品红背景的过渡区卡在色键阈值的灰色地带，形成品红边缘。
> `--erode-pixels` 收缩 alpha 通道吃掉这圈残留。character/projectile/ui_icon
> 硬边缘无辉光，erode=0；effect/spell/impact 推荐 4-8。详见 prompt-rules.md 规则 8。

> **自适应背景检测**：后处理不再依赖纯品红 #FF00FF 硬编码。脚本从图像边缘采样
> 实际背景色（生图工具对 hex 服从度有限，画出的"magenta"常是偏暗洋红如
> 230,45,183），用它做色键。纯品红背景时行为不变（向后兼容），非纯品红背景
> 也能正确键控。但 prompt 仍应要求纯品红——那是理想情况，自适应是安全网。

### `make_layout_guide.py` — 布局参考图（Step A）

```bash
python scripts/make_layout_guide.py \
  --rows <N>                       # 必填：网格行数
  --cols <M>                       # 必填：网格列数
  --cell-size <px>                 # 必填：单格像素
  --output <guide.png>             # 必填：输出 PNG 路径
```

产出一张白底图：每个 cell 画虚线边框 + 中央 60% 安全区实线框，
作为生图 prompt 的构图锚点喂给生图模型。

---

## 与 `sprite-animation` 武器的衔接

后处理产出的 `sheet-transparent.png` 直接喂给 `sprite-animation` 武器。
武器参数（见 `core/builtin_weapons.py` 里 sprite-animation 的 params 说明）：

```yaml
scene_N:
  weapon: sprite-animation
  params:
    spriteUrl: "assets/sprites/<name>/sheet-transparent.png"
    frameCount: 12              # = rows × cols
    frameWidth: 384             # = cell_size
    frameHeight: 384            # = cell_size
    fps: 8                      # 节奏，idle 慢 / effect 快
    loopCount: 3                # 循环动作填大数，一次性动作填 1
    direction: horizontal       # horizontal 或 vertical
    pingPong: false             # 来回播放（如待机摇摆）
```

**网格 → 单行/单列注意**：`sprite-animation` 武器按 `direction` 沿单行
（horizontal）或单列（vertical）步进 `backgroundPosition`。对于 **多行多列**
（如 2×3、3×4）的 sheet，有两种正确接法：

1. **推荐**：让后处理产物只用作存档，另外把单帧 PNG 拼成 **1×N 单行 strip**
   喂给武器（`direction: horizontal`，`frameCount = rows×cols`）。这是最稳的。
2. 或者只引用 sheet 的**第一行**（`frameCount = cols`），适合每行就是一个独立动作。
3. **不要**把 2D grid 直接当单行读——会读到第二行像素，画面错位。

> 简单场景（1×N 单行网格、或 2×2 第一行即全帧）可以直接用 `sheet-transparent.png`。
> 复杂多行网格走接法 1。在输出模板里务必写清楚用的是哪种接法。

---

## 何时触发本 skill

在 **Phase 0 Asset Intake** 阶段，如果用户创意涉及：
- 帧动画角色（走路/跑步/攻击/待机）
- 序列特效（爆炸/法术/粒子）
- 动态 UI 图标（转动/呼吸/闪烁）

→ 触发 sprite-forge，走 Step A 出图纸。已有的静态素材（单张 PNG/SVG）走原来的
asset-intake 流程，不进本 skill。

---

## 输出契约

Step A 完成后，必须按 `templates/sprite-prompt-output.md` 模板输出，
包含四块：生图 prompt、布局参考图路径、裁切参数、武器播放参数。
用户据此去生图，回来后直接用裁切参数跑 Step C。
