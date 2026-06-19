"""测试 5: Sprite Forge 脚本运行.

先用 Pillow 生成测试 sprite sheet (品红背景 #FF00FF + 几个色块),
然后跑 process_sprite.py process 和 make_layout_guide.py,
验证裁切 / 透明 PNG / 布局参考图生成.
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

PLUGIN = Path("F:/hyperframes/framepack-plugin").resolve()
SPRITE_DIR = PLUGIN / "skills" / "framepack-sprite-forge" / "scripts"
WORK = Path("F:/hyperframes/framepack-e2e-test/sprite-work").resolve()
WORK.mkdir(parents=True, exist_ok=True)

ROWS, COLS = 2, 4  # 8 帧
CELL = 200         # 每个 cell 200x200

# 1) 生成测试 sprite sheet: 品红底色 + 每个 cell 中央放一个不同色块 (留边距)
sheet_w = COLS * CELL
sheet_h = ROWS * CELL
sheet = Image.new("RGB", (sheet_w, sheet_h), (255, 0, 255))  # #FF00FF
draw = ImageDraw.Draw(sheet)

colors = [
    (255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0),
    (0, 255, 255), (255, 128, 0), (128, 0, 255), (255, 192, 203),
]
margin = int(CELL * 0.2)  # 留 20% 边距, 主体占中央 60%
inner = CELL - 2 * margin
for idx, color in enumerate(colors):
    r = idx // COLS
    c = idx % COLS
    x0 = c * CELL + margin
    y0 = r * CELL + margin
    draw.rectangle((x0, y0, x0 + inner, y0 + inner), fill=color)

raw_path = WORK / "raw-sheet.png"
sheet.save(raw_path)
print(f"[OK] 生成测试 sprite sheet: {raw_path}  ({sheet_w}x{sheet_h})")

# 2) 跑 process_sprite.py process
print()
print("=" * 78)
print("运行: process_sprite.py process")
print("=" * 78)
out_dir = WORK / "processed"
cmd = [
    sys.executable, str(SPRITE_DIR / "process_sprite.py"), "process",
    "--input", str(raw_path),
    "--rows", str(ROWS),
    "--cols", str(COLS),
    "--output-dir", str(out_dir),
    "--cell-size", str(CELL),
    "--fps", "8",
]
print("命令:", " ".join(cmd))
res = subprocess.run(cmd, capture_output=True, text=True)
print(f"exit code: {res.returncode}")
print(f"stdout:\n{res.stdout}")
if res.stderr:
    print(f"stderr:\n{res.stderr}")

# 3) 检查产出文件
print()
print("=" * 78)
print("产出文件清单")
print("=" * 78)
expected_files = ["sheet-transparent.png"] + [f"frame_{i:02d}.png" for i in range(1, ROWS*COLS+1)] + ["animation.gif"]
file_status = []
for name in expected_files:
    p = out_dir / name
    exists = p.is_file()
    size = p.stat().st_size if exists else 0
    file_status.append((name, exists, size))
    mark = "OK" if exists else "MISSING"
    print(f"  [{mark}] {name:30s}  size={size:>8d} B")

# 4) 用 numpy 验证透明 PNG 真的透明 (背景 alpha=0), 且 sprite 区域 alpha=255
print()
print("=" * 78)
print("透明性验证 (sheet-transparent.png)")
print("=" * 78)
sheet_t = Image.open(out_dir / "sheet-transparent.png").convert("RGBA")
arr = np.asarray(sheet_t)
alpha = arr[..., 3]
total = alpha.size
transparent = int((alpha == 0).sum())
opaque = int((alpha == 255).sum())
print(f"  尺寸        : {sheet_t.size}")
print(f"  总像素      : {total}")
print(f"  透明 (a=0)  : {transparent}  ({100*transparent/total:.1f}%)")
print(f"  不透明 (a=255): {opaque}  ({100*opaque/total:.1f}%)")

# 抽查第一帧: 应该有透明 (背景) + 不透明 (sprite)
frame1 = Image.open(out_dir / "frame_01.png").convert("RGBA")
farr = np.asarray(frame1)
falpha = farr[..., 3]
has_transparent = bool((falpha == 0).any())
has_opaque = bool((falpha == 255).any())
print(f"\n  frame_01.png alpha: has_transparent={has_transparent}  has_opaque={has_opaque}")

# 5) 跑 make_layout_guide.py
print()
print("=" * 78)
print("运行: make_layout_guide.py")
print("=" * 78)
guide_path = WORK / "layout-guide.png"
cmd2 = [
    sys.executable, str(SPRITE_DIR / "make_layout_guide.py"),
    "--rows", str(ROWS),
    "--cols", str(COLS),
    "--cell-size", str(CELL),
    "--output", str(guide_path),
]
print("命令:", " ".join(cmd2))
res2 = subprocess.run(cmd2, capture_output=True, text=True)
print(f"exit code: {res2.returncode}")
print(f"stdout: {res2.stdout.strip()}")
if res2.stderr:
    print(f"stderr: {res2.stderr}")

guide = Image.open(guide_path)
print(f"  layout-guide.png 尺寸: {guide.size}  (期望 {(COLS*CELL, ROWS*CELL)})")

# 自动评估
checks = []
checks.append(("process_sprite.py exit=0", res.returncode == 0))
checks.append(("stdout 输出 Wrote", "Wrote" in res.stdout))
checks.append(("sheet-transparent.png 存在", (out_dir / "sheet-transparent.png").is_file()))
checks.append((f"裁切出 {ROWS*COLS} 帧",
               all((out_dir / f"frame_{i:02d}.png").is_file() for i in range(1, ROWS*COLS+1))))
checks.append(("animation.gif 存在", (out_dir / "animation.gif").is_file()))
checks.append(("透明像素 > 0 (色键生效)", transparent > 0))
checks.append(("不透明像素 > 0 (sprite 保留)", opaque > 0))
checks.append(("make_layout_guide.py exit=0", res2.returncode == 0))
checks.append(("layout-guide.png 尺寸正确", guide.size == (COLS*CELL, ROWS*CELL)))

print()
print("=" * 78)
print("测试 5 自动检查结果")
print("=" * 78)
all_pass = True
for name, cond in checks:
    status = "PASS" if cond else "FAIL"
    if not cond:
        all_pass = False
    print(f"  [{status}] {name}")
print(f"\n测试 5 总体: {'PASS' if all_pass else 'FAIL'}")

# 记录发现
print()
print("=" * 78)
print("测试 5 发现/备注")
print("=" * 78)
print("- process_sprite.py 标准输出只有 'Wrote <path>' 一行, 无显式 QC 报告文件或文本.")
print("  SKILL.md 描述后处理流程包含 'QC', 但脚本本身不输出 QC 报告内容.")
print("  色键/裁切/透明 PNG 均正常生成, 但 'QC 报告正常' 这一项在脚本层未独立存在.")

sys.exit(0 if all_pass else 1)
