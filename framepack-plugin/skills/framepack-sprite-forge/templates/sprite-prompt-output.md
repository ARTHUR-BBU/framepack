# Sprite Sheet 生图图纸

> 这是 framepack-sprite-forge **Step A 的输出**。Agent 推断完参数、拼好 prompt 后，
> 按本模板填好展示给用户。用户拿这份图纸去外部生图工具，拿回 `raw-sheet.png`
> 后回来跑 Step C（裁切装订）。
>
> 带 `<...>` 的占位符由 Agent 填实；`[ ]` 里是给 Agent 的填写提示。

---

## 1. 创意摘要

- **用户创意**：<把用户的那句话原样贴进来>
- **推断结果**：
  - 素材类型 asset_type：`<character|creature|projectile|impact|spell|effect|ui_icon>`
  - 动作 action：`<idle|walk|run|attack|cast|explode|death|effect|ui_loop>`
  - 帧数 frame_count：`<N>`  →  网格 `<rows>×<cols>`
  - 风格 style：`<pixel_art|flat_illustration|cel_shaded|clean_hd|retro_pixel>`
  - 视角 viewpoint：`<side|topdown|isometric|front|back>`
  - cell_size：`<384>`
- **推断依据**：`<一句话说明为什么这么推，例如"frame.md 标注 pixel_art，故风格取 pixel_art">`
- **可调项**：`<列出用户可能想改的参数，如"如想要更流畅可把帧数从 6 提到 8（网格改 2×4）">`

---

## 2. 生图 Prompt（复制粘贴到生图工具）

> 英文整段提交，兼容性最好。

```
<style_keywords> of <subject_description>, <viewpoint> view.

A single <action> action family shown as exactly <frame_count> sequential
phase frames, arranged in a strict <rows>x<cols> grid. Each cell is identical
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

填写示例（Agent 参考用，不写入最终输出）：
- `<style_keywords>` = `pixel art, 16-bit retro game sprite, crisp pixels, limited palette, no anti-aliasing`
- `<subject_description>` = `a small adventurer character with a red cap`
- `<viewpoint>` = `side`
- `<action>` = `walk`
- `<frame_count>` = `6`，`<rows>x<cols>` = `2x3`

---

## 3. 布局参考图

生图时建议把这张参考图一起喂给模型当构图锚点（虚线格子 + 中央 60% 安全区框）：

- **参考图路径**：`<assets/sprites/<name>/layout-guide.png>` [由 make_layout_guide.py 生成]
- **生成命令**：
  ```bash
  python skills/framepack-sprite-forge/scripts/make_layout_guide.py \
    --rows <rows> --cols <cols> --cell-size <cell_size> \
    --output <assets/sprites/<name>/layout-guide.png>
  ```

---

## 4. 裁切参数（拿回原图后跑 Step C 用）

用户拿回 `raw-sheet.png` 后，**原样**用下面参数跑后处理：

```bash
python skills/framepack-sprite-forge/scripts/process_sprite.py process \
  --input raw-sheet.png \
  --rows <rows> \
  --cols <cols> \
  --output-dir assets/sprites/<name>/ \
  --cell-size <cell_size> \
  --fps <fps>
```

- rows：`<rows>`
- cols：`<cols>`
- cell_size：`<cell_size>`
- fps：`<fps>`  [可选调整，默认 8]
- threshold：`30`  [可选调整，背景不干净时调小，角色含品红成分时调大]

---

## 5. 武器播放参数（Step C 产出后填入 Execution Manifest）

后处理产出 `assets/sprites/<name>/sheet-transparent.png` 后，
在 `expanded-prompt.md` 的 Execution Manifest 里这样引用：

```yaml
scene_<N>:
  weapon: sprite-animation
  params:
    spriteUrl: "assets/sprites/<name>/sheet-transparent.png"
    frameCount: <frame_count>        # = rows × cols
    frameWidth: <cell_size>          # = cell_size
    frameHeight: <cell_size>         # = cell_size
    fps: <fps>
    loopCount: <loopCount>           # 循环动作填大数(如 99)，一次性动作填 1
    direction: horizontal            # horizontal | vertical
    pingPong: false                  # 来回播放(如待机摇摆)
```

**网格接法说明**（多行多列 sheet 必读）：
- `sprite-animation` 按 `direction` 沿单行/单列步进。
- **1×N 单行网格 / 2×2**：可直接用 `sheet-transparent.png`。
- **多行多列（2×3、3×4 等）**：推荐把单帧 PNG 拼成 **1×N 单行 strip** 再喂武器
  （`frameCount = rows×cols`，`direction: horizontal`）。不要把 2D grid 当单行直读。
- 本图纸的接法选择：`<直接用 sheet | 拼 1×N strip | 只用第一行>` [Agent 填]

---

## 6. 下一步

1. 用户：拿第 2 节的 prompt + 第 3 节的参考图去外部工具生图 → 得到 `raw-sheet.png`。
2. 回来：用第 4 节的命令跑 Step C → 得到 `sheet-transparent.png` + 单帧 + GIF。
3. Agent：把第 5 节的参数填进 Execution Manifest，交给 `sprite-animation` 武器播放。
