# 命题 D：Sprite Forge 完整管线测试报告

- 被测代码：`F:/hyperframes/framepack-plugin/skills/framepack-sprite-forge/scripts/`
  - `process_sprite.py`（`remove_bg_magenta` / `split_grid` / `center_single_sprite` / `clean_edges` / `compose_sheet` / `save_transparent_gif` / `generate_qc_report` / `run_pipeline`）
  - `make_layout_guide.py`
- 环境：Python 3.14.2 / numpy 2.4.2 / Pillow 12.1.0
- 方式：**只测不改**。用 Pillow 程序化生成品红底/异常底精灵图，通过 `subprocess` 调用真实 CLI（覆盖真实命令路径），同时 `import process_sprite` 直接调用 `run_pipeline` 取回完整 QC dict（CLI 只打印摘要、不落盘）。
- 全部原始数据：`F:/hyperframes/framepack-e2e-test/testD_results.json`
- 测试驱动脚本：`F:/hyperframes/framepack-e2e-test/run_testD_sprite_forge.py`
- 产物目录：`F:/hyperframes/framepack-e2e-test/sprite-D-work/{inputs,round1,round2_t10,round2_t30,round2_t60,round3_blue,round3_allmagenta,guides}`

> 管线执行顺序（`run_pipeline`）：`remove_bg_magenta` → `clean_edges` → `split_grid` → `center_single_sprite` → `compose_sheet` → 落盘 + GIF → `generate_qc_report`。

---

## 轮 1：标准精灵图管线

### 输入参数
| 项 | 值 |
|---|---|
| 生成图 | `round1_standard.png`，800×400，品红底 `#FF00FF` |
| 布局 | 2 行 × 4 列，cell = 200×200（正方形） |
| 内容 | 8 格各放一个 60% 内缩的不同纯色块（红/绿/蓝/黄/青/橙/紫/白） |
| CLI | `process_sprite.py process --input … --rows 2 --cols 4 --output-dir round1 --cell-size 200 --threshold 30` |
| 布局参考 | `make_layout_guide.py --rows 2 --cols 4 --cell-size 200 --output guide_round1.png` |

### 输出结果
- 退出码 `0`，无 stderr。
- CLI stdout：
  ```
  Wrote ...\round1\sheet-transparent.png
  QC: 8/8 non-empty frames, 64.0% transparent
       OK — no issues detected
  ```
- 落盘产物（全部存在）：
  - `sheet-transparent.png` —— 800×400，**RGBA**（有 alpha）
  - `frame_01.png` … `frame_08.png` —— 各 200×200 RGBA（共 **8 帧**，与 rows×cols 一致）
  - `animation.gif` —— 200×200，mode `P`，动画 GIF（disposal=2）
- 透明度核验：sheet 透明像素 204832 / 320000 = **64.01%**，确实存在全透明像素（alpha=0）。
- 布局参考图：`guide_round1.png` = **800×400**（= cols×cell × rows×cell = 4×200 × 2×200）。
- 完整 QC dict：
  ```json
  {"transparent_ratio": 0.6401, "non_empty_frames": 8, "total_frames": 8,
   "magenta_residue_ratio": 0.0, "warnings": []}
  ```

### 验证结论
| 验证点 | 结果 |
|---|---|
| 透明 PNG（RGBA + 真实透明像素） | ✅ 通过 |
| 帧裁切（8 帧 = 2×4，尺寸 200×200） | ✅ 通过 |
| GIF 输出（动画、palette、存在） | ✅ 通过 |
| QC 指标 `transparent_ratio` / `non_empty_frames` / `warnings` / `magenta_residue_ratio` 齐全 | ✅ 通过 |
| `make_layout_guide.py` 输出尺寸正确（800×400） | ✅ 通过 |

### 发现的问题
1. **【中等】QC 报告不落盘**：`run_pipeline` 返回了完整 QC dict，但 CLI 只把它格式化为文本打印到 stdout，**没有写入任何 JSON/文件**。代码注释自述“瑕疵 1 修复: 显式 QC 报告输出”，但实际仍未持久化，下游/自动化无法直接读取结构化报告（只能解析 stdout 文本）。建议增加 `--qc-report` 落盘为 JSON。
2. **【低】GIF 尺寸为单帧 200×200**而非整图尺寸，符合“逐帧动画”设计，但易被误读为整图——文档可注明。

---

## 轮 2：不规则布局 + 极端参数

### 输入参数
| 项 | 值 |
|---|---|
| 生成图 | `round2_gradient.png`，600×600，品红底 |
| 布局 | 3 行 × 2 列，**cell = 300×200（非正方形）** |
| 内容 | 每格为「纯品红→目标色」水平渐变；6 格目标色跨越与品红的不同距离（绿/黄/红/粉/近品红/极近品红） |
| `--cell-size` | 200（API 仅接受单个 int → 强制正方形 200×200 输出画布） |
| `--threshold` | 分别取 **10 / 30 / 60** 三轮 |

### 输出结果（threshold 扫描）

| threshold | 原始色键透明率(raw)¹ | QC `transparent_ratio` | `non_empty` | `magenta_residue_ratio` | 触发警告 |
|---|---|---|---|---|---|
| 10 | 0.1383 | **0.0417** | 6/6 | **0.1892** | ⚠ Magenta residue detected (18.9%) |
| 30 | 0.3289 | **0.2008** | 5/6 | 0.0 | ⚠ 1/6 frames appear empty |
| 60 | 0.4900 | **0.3517** | 5/6 | 0.0 | ⚠ 1/6 frames appear empty |

¹ raw = 直接对整图调用 `remove_bg_magenta` 后的透明率（纯色键效果，未经裁切/居中）。

逐轮 CLI 摘要：
- t=10：`QC: 6/6 non-empty frames, 4.2% transparent / magenta residue: 18.9% / WARNING: Magenta residue detected …`
- t=30：`QC: 5/6 non-empty frames, 20.1% transparent / WARNING: 1/6 frames appear empty …`
- t=60：`QC: 5/6 non-empty frames, 35.2% transparent / WARNING: 1/6 frames appear empty …`

输出 sheet 尺寸：三轮均为 **400×600**（= 2×200 × 3×200），与输入 600×600 不同（见问题 1）。

### 验证结论
| 验证点 | 结果 |
|---|---|
| threshold 越大 → 透明像素越多 | ✅ raw 透明率严格单调上升 0.1383 < 0.3289 < 0.49 |
| QC `transparent_ratio` 正确反映 threshold 变化 | ✅ 单调上升 0.0417 < 0.2008 < 0.3517 |
| 低 threshold 产生品红残留并告警 | ✅ t=10 残留 18.92% 并正确告警；t=30/60 残留归零 |
| 高 threshold 误删内容（帧变空）并告警 | ✅ t=30/60 出现 1/6 帧空告警 |
| `magenta_residue_ratio` 指标有效 | ✅ 随 threshold 由 0.1892 → 0.0 |

**关键洞察**：threshold 对色键是“双向刀”——
- **过低（10）**：近品红 fringe 像素未被删除 → `magenta_residue_ratio` 飙升并告警；
- **过高（60）**：把本应保留的渐变内容也判为背景 → 帧变空并告警。
QC 的两个告警分支（残留 / 帧空）分别正确捕获了这两种失效，指标随参数变化趋势完全正确。

### 发现的问题
1. **【高】非正方形 cell 被强制压成正方形，内容被裁切丢失**。
   - `center_single_sprite(img, cell_size)` 只接受单个 int，输出画布恒为 `cell_size × cell_size`。本例输入 cell 为 300×200，`--cell-size 200` 后：宽度方向 300 > 200 的内容被裁。
   - 实测：左上「绿渐变」格色键后不透明 bbox = **280×200**，居中进 200×200 后整张画布 40000/40000 全不透明——**280px 宽的内容被硬裁进 200**，左右像素丢失，且未做缩放（只 paste、负偏移）。
   - 连带：重组后 sheet 由输入 600×600 变成 400×600，**整图宽高比改变**。
   - 根因：API 缺少 `(cell_w, cell_h)` 二维参数；`compose_sheet` 也用 `frames[0].size` 默认所有帧同尺寸。
2. **【中】`make_layout_guide.py` 同样只支持单一正方形 `--cell-size`**，无法表达 300×200 这类非方格布局参考（与上游 `process_sprite.py` 限制一致）。
3. **【低】QC `transparent_ratio` 与 raw 色键透明率数值不一致**（如 t=10：raw 0.1383 vs QC 0.0417）。原因是 QC 在 `center_single_sprite` 之后测量——bbox 裁掉了边缘空透明区，使比例被“稀释”。属合理副作用，但文档应说明 QC 比例是“居中后画布”比例，不等于原始色键透明率。

---

## 轮 3：色键失败场景 + QC 警告

### 场景 A：非品红底（纯蓝底）
- 输入：`round3_blue.png`，800×400，2×4，**纯蓝底 `(0,0,255)`** + 8 个非品红色块。
- CLI：`… --cell-size 200 --threshold 30`。
- 结果（退出码 0）：
  ```
  QC: 8/8 non-empty frames, 0.0% transparent
       OK — no issues detected
  ```
  - `transparent_ratio = 0.0`（透明像素 0/320000，**背景完全没被去掉**）
  - `non_empty_frames = 8/8`，`magenta_residue_ratio = 0.0`，**`warnings = []`**

### 场景 B：全品红（无内容）
- 输入：`round3_allmagenta.png`，800×400，2×4，**整图纯品红、无任何内容**。
- CLI：`… --cell-size 200 --threshold 30`。
- 结果（退出码 0）：
  ```
  QC: 0/8 non-empty frames, 100.0% transparent
       WARNING: ALL frames empty — check input image background color (must be pure magenta #FF00FF)
  ```
  - `transparent_ratio = 1.0`（320000/320000 全透明），`non_empty_frames = 0/8`，正确告警。

### 验证结论
| 验证点 | 结果 |
|---|---|
| 全品红输入 → “ALL frames empty” 告警 | ✅ 正确触发，文案准确，`non_empty=0` |
| 全品红 → sheet 全透明 | ✅ transparent_ratio=1.0 |
| `magenta_residue_ratio` 指标存在且有效 | ✅ 各场景均输出；轮2 t=10 实测 0.1892 |
| **非品红底（蓝）→ 失效告警** | ❌ **未触发任何告警**（见下） |

### 发现的问题
1. **【高/严重】非品红底“色键完全失效”是静默失败——QC 检测不到**。
   - 蓝底距品红欧氏距离≈255，`remove_bg_magenta` 一个像素都没删 → `transparent_ratio=0.0`，8 帧全“非空”（蓝底被当成内容），`magenta_residue=0`（确实没有品红像素）。
   - 三条告警条件全部不满足（`non_empty≠0`、`non_empty≮ total`、`residue≯0.01`）→ **`warnings=[]`，报告“OK — no issues detected”**。
   - 这是精灵图后处理**最常见、最致命**的真实错误（底色不对/没抠掉），却零告警通过。QC 缺少“预期应有透明却 0 透明”的启发式（如 `transparent_ratio < ε` 时告警“背景未被去除，请检查底色是否为品红”）。
   - 建议：新增规则 `if transparent_ratio < 0.02: warn("No transparency produced — background may not be magenta #FF00FF")`。
2. **【中】QC 仅检测“品红残留”，检测不到“其它底色残留”**。`magenta_residue_ratio` 只统计品红色像素；蓝底、绿底等非品红背景残留均不可见。对“底色错误”类失效覆盖面窄。
3. **【低】全品红场景仍照常产出空帧/空 GIF**（8 个全透明 200×200 PNG + 空 GIF），未做“全空即终止”短路；不影响正确性，但产生无意义产物。

---

## 总体结论

### 通过项
- 标准管线（去背/切帧/居中/清洗/重组/GIF/QC）端到端可用，RGBA 透明 PNG、逐帧 PNG、动画 GIF、QC 指标均正确产出。
- QC 核心指标（`transparent_ratio` / `non_empty_frames` / `magenta_residue_ratio` / `warnings`）齐备且数值自洽。
- threshold 参数对色键效果的影响**方向正确、单调**，QC 能同时捕获“残留过多（threshold 过低）”与“帧变空（threshold 过高）”两类失效。
- 全品红（无内容）→ “ALL frames empty” 告警准确。
- `make_layout_guide.py` 对正方形布局输出尺寸精确。

### 待修复问题（按严重度）
| # | 严重度 | 问题 | 建议 |
|---|---|---|---|
| 1 | 高 | 非品红底色键失效**静默通过**（0 透明却报 OK） | 新增 `transparent_ratio < ε` → “背景未被去除”告警 |
| 2 | 高 | 非正方形 cell 被强制压方、**内容裁切丢失**、整图比例改变 | `cell_size` 支持 `(w,h)`；`center_single_sprite` 对超尺寸做缩放而非裁切 |
| 3 | 中 | QC 报告**不落盘**（仅 stdout 文本） | CLI 增加 `--qc-report out.json` |
| 4 | 中 | `magenta_residue_ratio` 仅识别品红残留，不识别其它底色残留 | 扩展残留检测或结合问题 1 的透明率启发式 |
| 5 | 中 | `make_layout_guide.py` 同样仅支持单一正方形 cell | 支持非方格布局参考 |
| 6 | 低 | QC `transparent_ratio` 是“居中后画布”比例，≠ 原始色键透明率 | 文档注明 |
| 7 | 低 | 全空场景仍产出空帧/空 GIF | 全空时短路/告警跳过产物 |

### 复现
```
cd F:/hyperframes/framepack-e2e-test
python run_testD_sprite_forge.py     # 生成输入 + 跑 3 轮 + 写 testD_results.json
# 产物见 sprite-D-work/
```
