# Sprite Forge 设计方案

> 日期: 2026-06-19
> 状态: 设计草案，待用户确认
> 来源: 基于 [agent-sprite-forge](https://github.com/0x0funky/agent-sprite-forge) (MIT, 0x0funky) 移植适配

---

## 一句话定位

Framepack 新增一个**精灵锻造车间**：根据用户创意出"生图规格图纸"，用户拿图纸去外部工具生成原始素材，拿回来后车间做裁切/去背景/质检，产出一本可以直接交给 `sprite-animation` 武器播放的翻页本子（sprite sheet）。

## 类比：翻页本子工厂

精灵帧动画 = 翻页本子动画。做一本翻页本子有四道工序：

| 工序 | 干什么 | 谁干 |
|------|--------|------|
| ① 设计规格 | 每页画什么、多大、什么风格、背景什么颜色 | **Framepack（新建）** |
| ② 画图 | 按规格画出排列在一张大图上的所有帧 | **用户去外部工具** |
| ③ 裁切装订 | 大图→去背景色→裁成单帧→对齐→质检→透明成品 | **Framepack（新建）** |
| ④ 翻页播放 | 快速逐帧翻给你看 | **已有 `sprite-animation` 武器** |

agent-sprite-forge 原版是全包工厂（①②③④全干）。我们只搬 ① 和 ③，② 留给用户，④ 已经有了。

## 产品边界

### 做（① + ③）

1. **出图纸** — 根据用户创意（"我要一个像素小人跑步"），推断出：素材类型、动作、网格形状（2×2/3×4/4×4）、帧数、风格、尺寸约束，输出一份完整的生图 prompt + 规格说明。用户拿这份 prompt 去任何生图工具（Midjourney、FAL、SD、DALL-E、甚至手画都行）。

2. **裁切装订** — 用户拿回原始大图后，车间跑确定性后处理脚本：
   - 品红色键控去背景（#FF00FF → 透明）
   - 边缘清理（去毛刺/抗锯齿残留）
   - 按网格切帧
   - 单帧对齐/等比缩放
   - 边缘触碰检测 QC（角色有没有顶到格子边缘）
   - 导出：透明 sprite sheet PNG + 单帧 PNG + 动画 GIF + QC 元数据

3. **衔接武器** — 成品 sprite sheet 存入项目 `assets/`，写入 asset-intake.md，Execution Manifest 可以引用 `sprite-animation` 武器指向它。

### 不做（② 留给用户，其余砍掉）

1. **不集成生图工具** — Framepack 不调 image_gen / FAL / 任何生图 API。

   为什么：生图是用户的创意主权。用户可能想用 Midjourney 的风格、可能想手绘扫描、可能想从素材库买。Framepack 的活是"给你一张精确的图纸"，不是"替你画"。类比：我们是裁缝铺的量体师，量完尺寸给你图纸，你去哪个布料市场买布是你的事。

2. **不做地图生成** — agent-sprite-forge 有 `$generate2dmap`（RPG 地图管线），我们不搬。

   为什么：Framepack 是视频制作工具，不是游戏开发工具。地图生成涉及瓦片集、碰撞体、触发区域、Godot/Unity 导出——这些跟"做个 30 秒品牌视频"毫无关系。搬进来是给厨房装了一台车床。

3. **不做游戏引擎导出** — 不导出 Godot `.tscn`、Unity `.unity`、TileMap 数据。

   为什么：同上。视频渲染靠 HyperFrames 的 HTML+GSAP 管线，不需要游戏引擎格式。

4. **不自动生成生图 prompt** — Agent 参考规则文档手写 prompt，不跑脚本自动生成。

   为什么：agent-sprite-forge 自己的铁律就是"Agent 手写 prompt，脚本只做确定性像素处理"。生图 prompt 是创意决策（什么风格、什么姿态、什么表情），不是机械模板。自动生成等于让脚本做创意决策——这违反 Framepack 的设计哲学。

## 架构

### Skill 归属

作为 Framepack 插件的新 skill：`framepack-sprite-forge`

```
skills/framepack-sprite-forge/
├── SKILL.md                        # 主入口：工作流 + 参数推断指南
├── references/
│   ├── prompt-rules.md             # 生图 prompt 工程规则（核心知识资产）
│   ├── sheet-modes.md              # 素材类型/动作/网格选择指南
│   └── postprocess-reference.md    # 后处理脚本参数说明
├── scripts/
│   ├── process_sprite.py           # 后处理脚本（确定性像素处理）
│   └── make_layout_guide.py        # 布局参考图生成（辅助生图定位）
└── templates/
    └── sprite-prompt-output.md     # prompt 输出模板（Agent 填给用户）
```

### 为什么放在 Framepack 插件内部（而不是独立 skill）

1. 它深度依赖 Framepack 的创意上下文 —— frame.md 的视觉身份（配色/风格）、expanded-prompt 的场景规划，直接影响 sprite 的风格和动作设计
2. 它的产物直接喂给同一个插件内的 `sprite-animation` 武器
3. 它的工作流是 Framepack 素材管线（Phase 0 Asset Intake）的延伸

类比：animation-library（武器目录）也是 Framepack 插件的 skill。sprite-forge 是它的"上游供应商"——animation-library 管"怎么播放"，sprite-forge 管"素材从哪来"。

### 与 Framepack 工作流的衔接

```
Phase 0: Asset Intake（素材入库）
    └── 用户创意涉及帧动画效果 → 触发 sprite-forge
        ├── Step A: Agent 读创意 → 推断参数 → 手写生图 prompt → 展示给用户
        │           （prompt 含：网格规格 + 品红背景 + 尺寸约束 + 风格描述）
        ├── Step B: [用户拿 prompt 去外部工具生图 —— Framepack 暂停等待]
        └── Step C: 用户拿回原始大图 → Agent 跑后处理脚本
                    → 透明 sprite sheet + 单帧 PNG + GIF + QC 报告
                    → 存入 assets/，写入 asset-intake.md
    ↓
Phase 1: frame.md（已有，不动）
    └── 视觉身份可能注明 sprite 风格（pixel_art / clean_hd）
    ↓
Phase 2: expanded-prompt.md
    └── Execution Manifest 引用 sprite-animation 武器
        └── 武器参数 spriteUrl 指向后处理产出的 sprite sheet
    ↓
HyperFrames 接管：写 HTML → lint → render
```

## 组件设计

### 组件 1: Prompt 规则知识库（`references/prompt-rules.md`）

这是整个功能最有价值的知识资产——"怎么写一份生图模型能听话的 sprite sheet prompt"。

从 agent-sprite-forge 的 SKILL.md + prompt-rules.md 提炼，核心规则：

1. **纯品红背景 #FF00FF** — 生图模型必须产出纯色品红背景，后处理才能用色键精准去除
2. **精确网格** — 明确要求 N×M 格子，每格等大，无边框无分割线
3. **角色居中 + 安全区** — 角色占格子中央 60-70%，四周留品红边距
4. **帧间一致** — 所有帧的尺寸/比例/锚点必须一致（不能忽大忽小）
5. **单动作族** — 一张原始 sheet 只画一个动作族（不要把 idle/run/attack 塞进一张图）
6. **风格关键词** — pixel_art / clean_hd / retro_pixel 各有对应的 prompt 措辞

这些规则不是"建议"，是"不遵守就后处理会失败"的硬约束。后处理脚本依赖品红背景和精确网格才能正常工作。

### 组件 2: 参数推断指南（`SKILL.md` 核心内容）

Agent 读到用户创意后，需要推断出以下参数：

| 参数 | 选项 | 推断逻辑 |
|------|------|----------|
| 素材类型 | player/npc/creature/spell/projectile/impact/fx | 从用户描述的角色/物体推断 |
| 动作 | idle/walk/run/attack/cast/explode/death | 从用户描述的行为推断 |
| 网格 | 2×2/2×3/2×4/3×3/3×4/4×4 | 从帧数推断：4帧→2×2, 6帧→2×3, 9帧→3×3, 12帧→3×4 |
| 风格 | pixel_art/clean_hd/retro_pixel | 从 frame.md 的视觉身份推断 |
| 视角 | topdown/side/3-4 | 从用户描述推断 |

推断完成后，Agent 手写完整 prompt，填入 `templates/sprite-prompt-output.md` 模板，展示给用户。

### 组件 3: 后处理脚本（`scripts/process_sprite.py`）

从 agent-sprite-forge 的 `generate2dsprite.py` 移植核心后处理函数，适配 Framepack 工作目录结构。

保留的功能：
- `remove_bg_magenta()` — 品红色键控去背景（阈值可调）
- `clean_edges()` — 边缘清理（去抗锯齿残留）
- `split_grid()` — 按网格切帧
- `center_single_sprite()` — 单帧对齐/等比缩放
- `compose_sheet()` — 重新组合透明 sprite sheet
- `save_transparent_gif()` — 导出动画 GIF（给用户预览用）
- QC 元数据：边缘触碰检测、帧间尺寸一致性检查

砍掉的功能：
- `build_prompt()` — prompt 生成器（Agent 手写，不用脚本）
- 所有 Codex 专属逻辑（`$CODEX_HOME` 路径、`image_gen` 调用）
- NPC 角色模板（游戏开发专属，视频用不上）
- 进化线/方向表（游戏开发专属）

命令行接口：
```bash
python scripts/process_sprite.py process \
  --input raw-sheet.png \
  --rows 3 --cols 4 \
  --output-dir assets/sprites/hero-run/ \
  --cell-size 384 \
  --fit-scale 1.0 \
  --align center \
  --component-mode largest \
  --shared-scale
```

### 组件 4: 布局参考图生成器（`scripts/make_layout_guide.py`）

原版直接移植——生成一张网格参考图（虚线格子 + 安全区框），作为生图 prompt 的视觉辅助。用户可以把参考图喂给生图模型当构图引导。

这个脚本是纯 Pillow 绘图，无外部依赖，移植成本为零。

## 数据流

```
用户创意: "给品牌视频加一个像素小人举牌的动画"
         │
         ▼
┌─ Step A: Framepack 出图纸 ──────────────────────────────┐
│  Agent 推断:                                            │
│    类型=character, 动作= idle, 网格= 2×2 (4帧),        │
│    风格= pixel_art, 视角= side                          │
│  Agent 手写 prompt:                                     │
│    "Pixel art character holding a sign, side view,     │
│     4 frames in a 2×2 grid, centered in each cell,     │
│     solid #FF00FF background, consistent scale..."     │
│  输出: sprite-prompt.md (用户拿走)                      │
└─────────────────────────────────────────────────────────┘
         │
         ▼ [用户拿 prompt 去 Midjourney/FAL/SD 生图]
         │ [用户拿回 raw-sheet.png]
         ▼
┌─ Step C: Framepack 裁切装订 ────────────────────────────┐
│  python process_sprite.py process \                     │
│    --input raw-sheet.png --rows 2 --cols 2              │
│  产出:                                                   │
│    assets/sprites/sign-holder/sheet-transparent.png     │
│    assets/sprites/sign-holder/frame_01.png ~ 04.png     │
│    assets/sprites/sign-holder/animation.gif             │
│    assets/sprites/sign-holder/qc-report.json            │
│  写入 asset-intake.md                                    │
└─────────────────────────────────────────────────────────┘
         │
         ▼
Phase 2 expanded-prompt.md Execution Manifest:
  scene_3:
    weapon: sprite-animation
    params:
      spriteUrl: "assets/sprites/sign-holder/sheet-transparent.png"
      frameCount: 4
      frameWidth: 384
      frameHeight: 384
      fps: 8
      loopCount: 3
```

## 测试策略

### 后处理脚本测试（TDD）

后处理脚本是纯确定性的像素处理，适合 TDD：
- 给定一张合成品红背景测试图 → 验证去背景结果
- 给定一张 2×2 测试网格 → 验证切帧数量和尺寸
- 给定角色偏移的测试帧 → 验证对齐结果
- 边缘触碰检测 → 构造触边/不触边测试用例

测试图可以用 Pillow 程序化生成（画品红背景 + 几何图形），不需要真实生图。

### Skill 知识测试

- 参数推断逻辑：给定创意描述 → 验证推断的网格/帧数/类型
- prompt 规则完整性：验证规则文档覆盖所有必要约束

## 依赖

- numpy >= 1.26（已安装: 2.4.2）
- Pillow >= 10.0（已安装: 12.1.0）
- 无新增依赖

## 移植清单（从 agent-sprite-forge MIT 源）

| 源文件 | 目标 | 动作 |
|--------|------|------|
| `generate2dsprite/SKILL.md` (prompt 规则部分) | `references/prompt-rules.md` | 提炼适配，砍掉 Codex 专属内容 |
| `generate2dsprite/references/prompt-rules.md` | `references/prompt-rules.md` | 合并 |
| `generate2dsprite/references/modes.md` | `references/sheet-modes.md` | 移植适配 |
| `generate2dsprite/scripts/generate2dsprite.py` (后处理函数) | `scripts/process_sprite.py` | 提取后处理函数，砍 prompt 生成 |
| `generate2dsprite/scripts/make_layout_guide.py` | `scripts/make_layout_guide.py` | 原样移植 |
| `generate2dmap/*` | — | 不移植 |
| `agents/openai.yaml` | — | 不移植（Codex 专属） |

## 版本归属

v0.14.0 新功能（v0.13.0 武器重构 + 品味接线发版后启动）。

## 风险

1. **生图模型不听话** — 用户拿 prompt 去外部工具，模型可能不按品红背景/精确网格要求出图。后处理会失败或产出质量差。**缓解**：prompt 规则文档会强调"这是硬约束"，QC 报告会检测并提示哪些帧有问题。

2. **依赖外部往返** — Step A 到 Step C 之间用户要离开 Framepack 去生图，体验不是全自动。**这是设计选择**，不是缺陷——用户保留创意主权，Framepack 不绑死任何生图工具。

3. **后处理脚本复杂度** — 39KB 的 Python 脚本移植后需要维护。**缓解**：只移植核心函数，砍掉游戏开发专属逻辑，净减约 40% 代码量。
