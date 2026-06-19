"""Quality Audit 权重一致性接线测试.

验证 restraint_audit 的 ConsistencyIssue 通过 quality_audit 的 audit_project()
映射为 QualityIssue，severity 保持 P2/P3。
"""
import os
import sys
import tempfile
from pathlib import Path

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.quality_audit import audit_project, QualityIssue


def _make_project(frame_md: str, expanded: str = "") -> Path:
    """Create a minimal synthetic project for audit testing."""
    d = Path(tempfile.mkdtemp())
    d.joinpath("frame.md").write_text(frame_md, encoding="utf-8")
    if expanded:
        exp_dir = d / ".hyperframes"
        exp_dir.mkdir()
        exp_dir.joinpath("expanded-prompt.md").write_text(expanded, encoding="utf-8")
    return d


class TestWeightConsistencyInAuditProject:
    def test_atmosphere_density_mismatch_surfaces_in_audit(self):
        """frame.md atmosphere_density=0.1 + expanded 6 层氛围 → audit 报 P2"""
        frame_md = (
            "---\n"
            "control_profile:\n"
            "  weights:\n"
            "    atmosphere_density: 0.1\n"
            "---\n"
            "# Frame\n"
        )
        expanded = (
            "BG: particle grid-lines gradient glow light-leak haze bokeh\n"
            "## Execution Manifest\nscene1: kinetic-type"
        )
        d = _make_project(frame_md, expanded)
        try:
            report = audit_project(d)
            codes = [i.code for i in report.issues]
            assert "atmosphere_density_mismatch" in codes
            # 应该是 P2
            mismatch = [i for i in report.issues
                        if i.code == "atmosphere_density_mismatch"]
            assert any(i.severity == "P2" for i in mismatch)
        finally:
            import shutil
            shutil.rmtree(d)

    def test_no_control_profile_no_weight_issues(self):
        """旧项目没有 control_profile → 不产生 weight consistency issues"""
        frame_md = "---\ncolors:\n  primary: \"#fff\"\n---\n# Frame\n"
        expanded = "scene1: whatever"
        d = _make_project(frame_md, expanded)
        try:
            report = audit_project(d)
            weight_codes = [i.code for i in report.issues
                            if "mismatch" in i.code]
            assert len(weight_codes) == 0
        finally:
            import shutil
            shutil.rmtree(d)

    def test_weapon_reliance_mismatch_surfaces_in_audit(self):
        """weapon_reliance=0.9 但全 HANDWRITE → audit 报 P2"""
        frame_md = (
            "---\n"
            "control_profile:\n"
            "  weights:\n"
            "    weapon_reliance: 0.9\n"
            "---\n"
            "# Frame\n"
        )
        expanded = (
            "## Execution Manifest\n"
            "scene1: HANDWRITE\n"
            "scene2: HANDWRITE\n"
            "scene3: HANDWRITE"
        )
        d = _make_project(frame_md, expanded)
        try:
            report = audit_project(d)
            codes = [i.code for i in report.issues]
            assert "weapon_reliance_mismatch" in codes
        finally:
            import shutil
            shutil.rmtree(d)

    def test_consistent_weights_no_issues(self):
        """权重与产出一致 → 不产生 weight consistency issues"""
        frame_md = (
            "---\n"
            "control_profile:\n"
            "  weights:\n"
            "    atmosphere_density: 0.8\n"
            "    weapon_reliance: 0.3\n"
            "    restraint_force: 0.5\n"
            "---\n"
            "# Frame\n"
        )
        expanded = (
            "BG: grid-lines gradient glow\n"
            "## Execution Manifest\n"
            "scene1: HANDWRITE"
        )
        d = _make_project(frame_md, expanded)
        try:
            report = audit_project(d)
            weight_codes = [i.code for i in report.issues
                            if "mismatch" in i.code]
            assert len(weight_codes) == 0
        finally:
            import shutil
            shutil.rmtree(d)
