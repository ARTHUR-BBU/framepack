# Sprite Sheet 生图 Prompt 工程规则

> 这是 framepack-sprite-forge 的核心知识资产：怎么写一份生图模型能听话、
> 后处理脚本能吃下去的 sprite sheet prompt。
>
> **每一条规则都不是"建议"，是"不遵守后处理就会失败"的硬约束。**
> 后处理脚本（`scripts/process_sprite.py`）依赖品红背景 + 精确网格 + 帧间一致
> 才能做色键去背景、按格切帧、单帧对齐。模型只要破坏其中一条，QC 就会报警、
> 甚至产出废片。

---

## 规则 1：纯品红背景 `#FF00FF`（最高优先级）

整张大图的背景必须是**纯品红 `#FF00FF`**（RGB 255,0,255），不能是别的纯色，
更不能是渐变、噪点、阴影。

为什么：
- 后处理用色键（chroma key）按颜色距离去背景，阈值默认 30。
- 品红在自然图像里几乎不出现，是最安全的键控色。
- 任何"接近品红"的杂色（深紫/粉紫/品红渐变阴影）都会被误删，导致角色身上出洞。

prompt 写法（必须出现）：
- `solid pure magenta background #FF00FF`（英文模型最稳）
- `no gradient, no shadow, no vignette on the background`
- 反面禁止：`no sky, no room, no scenery, flat solid color background only`

> 注意：是"背景"纯品红，不是把整个角色也染成品红。角色本身可以任意配色，
> 只要它和品红背景有清晰的边界。

> **后处理容错**：即使生图工具画出的"magenta"不精确（偏暗洋红如 230,45,183，
> 非 SD 系模型的通病），后处理脚本会从图像边缘自适应检测实际背景色再做色键，
> 不会因此断流。但 prompt 仍应严格要求纯品红——生图工具越服从 hex 越好，
> 自适应只是安全网，不是放宽要求的理由。

---

## 规则 2：精确网格（rows×cols，等大无分割线）

要求模型把所有帧画在一张大图里，排成严格的 `rows × cols` 网格：

- 每个 cell 等大、对齐。
- **没有边框、没有分割线、没有格子标号、没有留白间隙**——cell 之间是连续的品红。
- cell 数 = 帧数 = rows × cols（一个 cell 一帧，不要塞两帧也不要空 cell）。

prompt 写法：
- `arrange exactly {N} frames in a {rows}x{cols} grid, each cell identical size`
- `no borders, no dividing lines, no gaps between cells, no frame numbers`
- `reading order: left-to-right, top-to-bottom`（明确帧序，方便切帧后排序）

配图引导：把 `make_layout_guide.py` 生成的布局参考图一起喂给模型当构图锚点
（虚线格子 + 中央安全区框），命中率会显著提高。

---

## 规则 3：角色居中 + 安全区

每个 cell 里，角色/物体居中，占据 cell 中央约 **60–70%** 的区域，
四周留一圈品红边距。

为什么：
- 后处理会按 cell 的几何中心切帧；角色偏左/偏右会导致相邻帧的"锚点"飘移，
  动画播放时会抖。
- 留边距 = 给色键留缓冲，角色不会顶到 cell 边缘被切掉一角。

prompt 写法：
- `the subject is centered in each cell, occupying the central ~60% area`
- `even magenta margin around the subject on all four sides`
- `subject never touches the cell border`

> `make_layout_guide.py` 画的实线方框就是 60% 安全区，可以让模型照着框画。

---

## 规则 4：帧间一致性（同一角色的同一副身体）

所有帧必须是**同一个角色**的**同一副身体**——

- **风格一致**：所有帧笔触/上色/线宽一致，不能第 3 帧突然换画风。
- **比例一致**：角色在每帧里的尺寸/比例一致，不能忽大忽小。
- **视角一致**：所有帧同一视角（都是侧视 / 都是正视），不能某一帧突然转 45°。
- **锚点一致**：角色在每帧里的脚底/中心位置一致，否则播放时会"跳"。

为什么：
- sprite 动画的本质是翻页本子。帧之间不一致 = 翻起来一卡一卡、角色乱抖。
- 后处理的 `center_single_sprite()` 只能把单帧重新居中，修不了"角色本身大小变了"。

prompt 写法：
- `identical character across all frames — same proportions, same art style, same viewpoint`
- `consistent scale and anchor point (feet aligned to the same baseline)`
- `the only thing that changes between frames is the pose`

---

## 规则 5：单动作族（一张图只画一个动作）

**一张原始 sheet 只画一个动作族**——例如只画 walk-cycle，不要把 idle + walk + attack
塞进同一张大图。

为什么：
- 不同动作帧数不同、播放速度不同，混在一张图里无法用统一的 fps / loopCount 播放。
- 如果用户要多个动作，**出多张图纸、生成多张 sheet、各自跑后处理**，
  最后在 sprite-animation 武器里分别引用。

每张图里的若干帧必须是**同一动作的不同阶段**（时序上连续）：
- walk-cycle：抬左脚 → 迈左脚 → 抬右脚 → 迈右脚 → …
- attack：起手 → 蓄力 → 挥击 → 收招
- 爆炸：起爆 → 扩散 → 峰值 → 消散

prompt 写法：
- `a single action family: {action} cycle, shown as {N} sequential phases`
- `frames are consecutive moments of the same motion, in playback order`

---

## 规则 6：风格关键词（让模型知道画什么画种）

显式写明画种，否则模型会自由发挥导致帧间画风漂移。常见映射：

| 风格 token | 推荐措辞 | 适用 |
|------------|----------|------|
| `pixel_art` | `pixel art, 16-bit retro game sprite, crisp pixels, limited palette, no anti-aliasing` | 复古游戏风、低保真 |
| `flat_illustration` | `flat vector illustration, clean shapes, bold outlines, limited flat colors` | 品牌动画、UI |
| `cel_shaded` | `cel-shaded anime style, clean lineart, flat shadow regions` | 二次元、角色 |
| `clean_hd` | `clean high-resolution digital painting, soft shading, semi-realistic` | 高品质角色、特效 |
| `retro_pixel` | `8-bit NES-era pixel art, 4-color palette per sprite, hard edges` | 极复古、极简 |

风格 token 应从 **frame.md 的视觉身份**推断——保持和整支视频的画风一致。

---

## 规则 7：负面提示（明确禁止的失败模式）

在 prompt 末尾加一段负面约束，挡掉最常见的翻车模式：

```
Negative / do NOT:
- no overlapping characters between cells
- no subject extending outside its cell
- no text, no labels, no numbers, no watermark, no signature
- no background scenery (no sky, no ground, no props behind the subject)
- no gradients, no shadows, no ambient occlusion on the background
- no motion blur, no duplicate frames, no asymmetric mirroring of the subject
- no anti-aliasing fringe on the subject edges (keep hard clean edges)
```

这些每一项都对应一种会让后处理失败或动画翻车的具体失败模式，不是凑数。

---

## 规则 8：发光体素材的辉光最小化（effect/spell 专属）

**仅适用于 `effect` / `spell` / `impact` 类素材**（火焰、能量球、爆炸、魔法光效）。
character / projectile / ui_icon 不受此规则约束。

### 问题

发光体素材天然有辉光（glow/aura）——这是它们的视觉特征。但生图工具在品红
背景上画辉光时，辉光的外缘会自然融入品红色，产生一段从品红到火焰色的颜色渐变。

这段渐变是**色键的天敌**：

- 色键按颜色距离清除，阈值 30 只能吃掉最接近品红的外缘
- 渐变中段（距离品红 30-200 的粉品红/粉红像素）被色键保留
- 这些像素在 sprite 边缘形成一圈品红色光环
- 后处理 `erode_alpha` 可以收缩 alpha 吃掉残余，但辉光太宽（>8px）时 erode 也会吃掉火焰本体

### prompt 写法

effect/spell 类素材的 prompt 必须额外包含以下约束：

```
Minimal soft glow around the flame — keep the color transition from core to
background edge as tight as possible (2-3 pixels max). Do NOT paint a wide
diffuse aura or atmospheric haze blending into the magenta background.
The outer flame boundary should have a hard, clean color stop, not a slow
gradient fading into magenta.
```

并在负面提示中额外加入：

```
- no wide diffuse glow, no atmospheric aura blending into background
- no slow color gradient from subject edge to magenta background
```

### 后处理配合

即使 prompt 要求了最小辉光，生图工具仍可能画出 4-8px 的过渡区。后处理
`erode_alpha` 作为第二层防线清理残余：

```bash
# effect/spell 类素材推荐 erode 4-8 像素
python process_sprite.py process ... --erode-pixels 6
```

erode 推荐值（见 `sheet-modes.md` 推断速查表）：
- 辉光窄（prompt 服从度高）→ erode 2-4
- 辉光中等（默认情况）→ erode 4-6
- 辉光宽（生图工具不听话）→ erode 6-8

### 两层防线原则

prompt 减辉光 + 后处理 erode 是**互补关系**，不是替代关系：
- 只有 prompt 不够：生图工具不一定服从"最小辉光"指令
- 只有 erode 不够：辉光太宽时 erode 会吃掉火焰本体
- 两者配合：prompt 让过渡区尽可能窄（2-3px），erode 清理残余

---

## 通用 Prompt 模板

把下面模板里的 `{...}` 替换成推断出的参数（推断逻辑见 `sheet-modes.md`
和 SKILL.md 的"参数推断指南"）：

```
{style_keywords} of {subject_description}, {viewpoint} view.

A single {action} action family shown as exactly {frame_count} sequential
phase frames, arranged in a strict {rows}x{cols} grid. Each cell is identical
size, no borders, no dividing lines, no gaps, no frame numbers. Reading order
is left-to-right, top-to-bottom.

Identical character across all frames — same proportions, same art style,
same viewpoint, same scale, feet/anchor aligned to the same baseline. Only
the pose changes between frames, in consecutive playback order.

In every cell the subject is centered, occupying the central ~60% area, with
an even margin on all four sides. The subject never touches the cell border.

The entire background is solid pure magenta (#FF00FF, RGB 255,0,255) — flat,
no gradient, no shadow, no scenery, no props behind the subject.

Negative / do NOT: no overlapping characters between cells, no subject
extending outside its cell, no text/labels/numbers/watermark/signature,
no background scenery, no gradients/shadows on the background, no motion
blur, no duplicate frames, no anti-aliasing fringe on subject edges.
```

> 英文 prompt 对主流生图模型（Midjourney / SD / FAL / DALL·E）兼容性最好，
> 建议模板填好后整段用英文提交。给用户的展示文案可以中英对照。

---

## 输出要求（填入 `templates/sprite-prompt-output.md`）

Agent 推断完参数、按上面模板拼好 prompt 后，必须同时给出：

1. **完整生图 prompt**（英文，可直接复制粘贴到生图工具）。
2. **布局参考图路径**——用 `make_layout_guide.py` 现场生成，路径写进输出。
3. **裁切参数**——`rows` / `cols` / `cell_size`，用户拿回原图后 Step C 直接用。
4. **武器播放参数**——`frameCount` / `frameWidth` / `frameHeight` / `fps` / `loopCount`，
   对应最终喂给 `sprite-animation` 武器的 params。
5. **风格 + 视角**——写明推断依据，方便用户改主意时知道改哪里。

用户拿这份输出去外部生图，拿回 `raw-sheet.png` 后回到 Step C。
