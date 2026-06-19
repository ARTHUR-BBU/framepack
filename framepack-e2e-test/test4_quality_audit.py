"""测试 4: quality_audit 完整管线.

用 tempdir 建最小项目 (frame.md + .hyperframes/expanded-prompt.md),
调用 audit_project(), 验证权重一致性 issue 出现在 report.issues, severity=P2.
"""
import sys
import tempfile
from pathlib import Path

PLUGIN = Path("F:/hyperframes/framepack-plugin").resolve()
sys.path.insert(0, str(PLUGIN))

from core.quality_audit import audit_project

FRAME_MD = """\
---
title: 最小项目
palette:
  primary: "#0A0A0A"
  accent:  "#FF3366"
  background: "#FFFFFF"
---

# Frame

control_profile:
  weights:
    atmosphere_density: 0.2
    weapon_reliance: 0.9
    restraint_force: 0.8
"""

EXPANDED = """\
# Expanded Prompt

scene1: HANDWRITE
scene2: HANDWRITE
scene3: HANDWRITE
scene4: HANDWRITE

Atmosphere:
- particle dust
- glow halo
- gradient wash
- noise grain
- bokeh circles
- vignette frame

surprise one, surprise two, surprise three, surprise four.
"""

with tempfile.TemporaryDirectory() as td:
    proj = Path(td)
    (proj / "frame.md").write_text(FRAME_MD, encoding="utf-8")
    (proj / ".hyperframes").mkdir()
    (proj / ".hyperframes" / "expanded-prompt.md").write_text(
        EXPANDED, encoding="utf-8")

    print(f"项目根目录: {proj}")
    print(f"  - frame.md 存在: {(proj / 'frame.md').is_file()}")
    print(f"  - .hyperframes/expanded-prompt.md 存在: "
          f"{(proj / '.hyperframes' / 'expanded-prompt.md').is_file()}")

    report = audit_project(proj)

    print()
    print("=" * 78)
    print(f"audit_project 返回 {len(report.issues)} 个 issue, summary={report.summary}")
    print("=" * 78)
    weight_issues = [i for i in report.issues if i.code in {
        "atmosphere_density_mismatch",
        "weapon_reliance_mismatch",
        "restraint_force_mismatch",
    }]
    for iss in weight_issues:
        print(f"\n[code={iss.code}]")
        print(f"  severity = {iss.severity}")
        print(f"  path     = {iss.path}")
        print(f"  details  = {iss.details}")
        print(f"  message  = {iss.message}")

    checks = []
    checks.append(("检测到至少 3 个权重 issue", len(weight_issues) >= 3,
                   f"实际 {len(weight_issues)}"))
    for code in ("atmosphere_density_mismatch",
                 "weapon_reliance_mismatch",
                 "restraint_force_mismatch"):
        hit = [i for i in weight_issues if i.code == code]
        checks.append((f"检测到 {code}", len(hit) == 1, f"实际 {len(hit)}"))
    all_p2 = all(i.severity == "P2" for i in weight_issues)
    checks.append(("所有权重 issue 是 P2", all_p2))
    all_explain = all(i.details and i.details.get("requires_explanation") is True
                      for i in weight_issues)
    checks.append(("details.requires_explanation=True 桥接到 quality pipeline",
                   all_explain))
    all_msg = all("解释" in i.message for i in weight_issues)
    checks.append(("所有 message 含\"解释\"", all_msg))

    print()
    print("=" * 78)
    print("测试 4 自动检查结果")
    print("=" * 78)
    all_pass = True
    for name, cond, *rest in checks:
        detail = rest[0] if rest else ""
        status = "PASS" if cond else "FAIL"
        if not cond:
            all_pass = False
        print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))

    print(f"\n测试 4 总体: {'PASS' if all_pass else 'FAIL'}")
    sys.exit(0 if all_pass else 1)
