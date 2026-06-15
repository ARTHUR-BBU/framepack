"""Quality-beyond-lint audit tests."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.quality_audit import audit_project
import core.quality_audit as quality_audit


def _write_project(tmp_path: Path) -> None:
    (tmp_path / ".hyperframes").mkdir()
    (tmp_path / ".framepack").mkdir()
    (tmp_path / "frame.md").write_text("# frame\n", encoding="utf-8")
    (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text(
        """
# Demo

## HyperFrames Time Windows

TOTAL DURATION: 55 seconds

## Per-Scene Beats

### S2 · THE CALL · 7-14s
**Animation Choreography**:
- textSplitEnter() — travelDistance 60px

### S3 · THE RUSH · 14-26s
**Animation Choreography**:
- Multi-line text cascade.

### S5 · THE JOY · 35-46s
**Animation Choreography**:
- elasticScaleEnter() — scale from 0.85→1, duration 0.8s, ease elastic.out(1, 0.3)

## Execution Manifest

```yaml
scene_2:
  weapon: text-split-enter
  code: "parts/references/text-split-enter.js"
  params:
    travelDistance: "60px"
    duration: 0.7

scene_5_extra:
  weapon: elastic-scale-enter
  code: "parts/references/elastic-scale-enter.js"
  params:
    fromScale: 0.85
    ease: "elastic.out(1, 0.3)"
    duration: 0.8
```
""",
        encoding="utf-8",
    )
    (tmp_path / ".framepack" / "arsenal.json").write_text(
        json.dumps(
            {
                "schema_version": "1.0.0",
                "project": "old-project",
                "hyperframes_config": {"duration": 30},
                "weapons": {"library.gsap": {"id": "library.gsap", "source": "library", "status": "active"}},
            }
        ),
        encoding="utf-8",
    )
    (tmp_path / "index.html").write_text(
        """
<div data-hf-id="hf-root" id="root" data-duration="55">
  <div data-hf-id="hf-card" id="s3-card1" class="text-card"></div>
</div>
<script>
textSplitEnter(tl,document.getElementById('s2-coalesce'),{travelDistance:'120px',duration:0.7},8.0);
elasticScaleEnter(tl,document.getElementById('s5-real'),{fromScale:0.5,duration:0.8,ease:'back.out(1.7)'},37.0);
</script>
""",
        encoding="utf-8",
    )


def _write_minimal_registry(tmp_path: Path) -> None:
    (tmp_path / ".hyperframes").mkdir()
    (tmp_path / ".framepack").mkdir()
    (tmp_path / ".framepack" / "arsenal.json").write_text(
        json.dumps({"schema_version": "1.0.0", "project": tmp_path.name, "weapons": {}}),
        encoding="utf-8",
    )


def test_audit_project_reports_arsenal_integrity_and_parameter_drift(tmp_path):
    _write_project(tmp_path)

    report = audit_project(tmp_path)
    codes = {issue.code for issue in report.issues}

    assert "arsenal_project_mismatch" in codes
    assert "arsenal_duration_mismatch" in codes
    assert "manifest_weapon_missing_from_arsenal" in codes
    assert "manual_data_hf_id" in codes
    assert "weapon_parameter_drift" in codes
    assert "undeclared_card_cascade" in codes
    assert report.summary["P0"] >= 1
    assert report.summary["P1"] >= 1


def test_audit_project_can_serialize_report_to_plain_dict(tmp_path):
    _write_project(tmp_path)

    payload = audit_project(tmp_path).to_dict()

    assert payload["project_dir"] == str(tmp_path)
    assert payload["issues"]
    assert any(issue["code"] == "weapon_parameter_drift" for issue in payload["issues"])


def test_parameter_drift_matches_repeated_weapon_calls_by_text_param(tmp_path):
    _write_minimal_registry(tmp_path)
    (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text(
        """
## HyperFrames Time Windows
TOTAL DURATION: 10 seconds
## Execution Manifest
scene_1:
  weapon: typewriter-cursor
  params:
    text: "First"
    charInterval: 0.10
scene_2:
  weapon: typewriter-cursor
  params:
    text: "Second"
    charInterval: 0.15
""",
        encoding="utf-8",
    )
    (tmp_path / "index.html").write_text(
        """
<script>
typewriterCursor(tl,el,{text:'First',charInterval:0.10});
typewriterCursor(tl,el,{text:'Second',charInterval:0.15});
</script>
""",
        encoding="utf-8",
    )

    report = audit_project(tmp_path)

    assert not [i for i in report.issues if i.code == "weapon_parameter_drift"]


def test_parameter_drift_understands_manifest_aliases(tmp_path):
    _write_minimal_registry(tmp_path)
    (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text(
        """
## HyperFrames Time Windows
TOTAL DURATION: 10 seconds
## Execution Manifest
scene_5_extra:
  weapon: elastic-scale-enter
  params:
    scale_from: 0.85
    ease_elastic: "elastic.out(1, 0.3)"
    duration: 0.8
""",
        encoding="utf-8",
    )
    (tmp_path / "index.html").write_text(
        """
<script>
elasticScaleEnter(tl,el,{fromScale:0.5,duration:0.8,ease:'back.out(1.7)'},37.0);
</script>
""",
        encoding="utf-8",
    )

    report = audit_project(tmp_path)
    drift = [i for i in report.issues if i.code == "weapon_parameter_drift"]

    assert len(drift) == 1
    assert drift[0].details["drift"]["fromScale"] == {"expected": "0.85", "actual": "0.5"}
    assert drift[0].details["drift"]["ease"] == {"expected": "elastic.out(1, 0.3)", "actual": "back.out(1.7)"}


def test_parameter_drift_reports_not_called_when_no_manifest_params_match_call(tmp_path):
    _write_minimal_registry(tmp_path)
    (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text(
        """
## Execution Manifest
scene_1:
  weapon: text-split-enter
  params:
    travelDistance: "60px"
""",
        encoding="utf-8",
    )
    (tmp_path / "index.html").write_text(
        """
<script>
textSplitEnter(tl, el, {distance: '60px'});
</script>
""",
        encoding="utf-8",
    )

    report = audit_project(tmp_path)

    assert any(i.code == "manifest_weapon_not_called" for i in report.issues)


def test_not_called_issue_hints_when_inline_gsap_pattern_is_present(tmp_path):
    _write_minimal_registry(tmp_path)
    (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text(
        """
## Execution Manifest
scene_1:
  weapon: text-split-enter
  params:
    travelDistance: "60px"
""",
        encoding="utf-8",
    )
    (tmp_path / "index.html").write_text(
        """
<script>
gsap.from(chars, { y: 60, opacity: 0, stagger: 0.03, duration: 0.7 });
</script>
""",
        encoding="utf-8",
    )

    report = audit_project(tmp_path)
    not_called = [i for i in report.issues if i.code == "manifest_weapon_not_called"]

    assert len(not_called) == 1
    assert not_called[0].severity == "P1"
    assert not_called[0].details["function"] == "textSplitEnter"
    assert not_called[0].details["inline_hint"]["suspected"] is True
    assert "canonical function" in not_called[0].details["inline_hint"]["recommendation"]


def test_parameter_drift_uses_builtin_catalog_function_mapping(tmp_path, monkeypatch):
    _write_minimal_registry(tmp_path)
    (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text(
        """
## Execution Manifest
scene_1:
  weapon: catalog-only-fx
  params:
    travelDistance: "60px"
""",
        encoding="utf-8",
    )
    (tmp_path / "index.html").write_text(
        """
<script>
catalogOnlyFx(tl, el, {travelDistance: '120px'});
</script>
""",
        encoding="utf-8",
    )

    def fake_resolve(weapon_id):
        if weapon_id == "catalog-only-fx":
            return {"id": weapon_id, "function": "catalogOnlyFx"}
        return None

    monkeypatch.setattr(quality_audit, "resolve_builtin_weapon", fake_resolve)

    report = audit_project(tmp_path)
    drift = [i for i in report.issues if i.code == "weapon_parameter_drift"]

    assert len(drift) == 1
    assert drift[0].details["function"] == "catalogOnlyFx"
    assert drift[0].details["drift"]["travelDistance"] == {"expected": "60px", "actual": "120px"}


def test_parameter_drift_accepts_quoted_values_that_contain_commas(tmp_path):
    _write_minimal_registry(tmp_path)
    (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text(
        """
## Execution Manifest
scene_1:
  weapon: elastic-scale-enter
  params:
    fromScale: 0.85
    ease: "elastic.out(1, 0.3)"
""",
        encoding="utf-8",
    )
    (tmp_path / "index.html").write_text(
        """
<script>
elasticScaleEnter(tl, el, {fromScale: 0.85, ease: 'elastic.out(1, 0.3)'});
</script>
""",
        encoding="utf-8",
    )

    report = audit_project(tmp_path)

    assert not [i for i in report.issues if i.code == "weapon_parameter_drift"]
    assert not [i for i in report.issues if i.code == "manifest_weapon_not_called"]


def test_quality_audit_reports_external_google_font_dependency(tmp_path):
    _write_minimal_registry(tmp_path)
    (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text("", encoding="utf-8")
    (tmp_path / "index.html").write_text(
        """
<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet">
<style>body { font-family: 'Noto Sans SC', sans-serif; }</style>
""",
        encoding="utf-8",
    )

    report = audit_project(tmp_path)
    issue = next(issue for issue in report.issues if issue.code == "external_font_dependency")

    assert issue.severity == "P1"
    assert "local font asset" in issue.message
    assert issue.details["proxy_note"] == "Proxy/VPN may be used for acquisition, but production HTML should not depend on live Google Fonts."


def test_quality_audit_allows_existing_local_font_face_asset(tmp_path):
    _write_minimal_registry(tmp_path)
    (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text("", encoding="utf-8")
    fonts_dir = tmp_path / "assets" / "fonts"
    fonts_dir.mkdir(parents=True)
    (fonts_dir / "NotoSansSC-VF.ttf").write_bytes(b"fake-font")
    (tmp_path / "index.html").write_text(
        """
<style>
@font-face { font-family: 'Noto Sans SC'; src: url('assets/fonts/NotoSansSC-VF.ttf') format('truetype'); }
body { font-family: 'Noto Sans SC', sans-serif; }
</style>
""",
        encoding="utf-8",
    )

    report = audit_project(tmp_path)

    assert not [issue for issue in report.issues if issue.code in {"external_font_dependency", "font_face_missing_local_asset"}]


def test_quality_audit_reports_missing_local_font_face_asset(tmp_path):
    _write_minimal_registry(tmp_path)
    (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text("", encoding="utf-8")
    (tmp_path / "index.html").write_text(
        """
<style>
@font-face { font-family: 'Noto Sans SC'; src: url('assets/fonts/Missing.ttf') format('truetype'); }
body { font-family: 'Noto Sans SC', sans-serif; }
</style>
""",
        encoding="utf-8",
    )

    report = audit_project(tmp_path)
    issue = next(issue for issue in report.issues if issue.code == "font_face_missing_local_asset")

    assert issue.severity == "P2"
    assert issue.details["asset"] == "assets/fonts/Missing.ttf"


def test_quality_audit_reports_low_visibility_risk_from_dark_background_and_brightness_filter(tmp_path):
    _write_minimal_registry(tmp_path)
    (tmp_path / ".hyperframes" / "expanded-prompt.md").write_text("", encoding="utf-8")
    (tmp_path / "frame.md").write_text(
        """
colors:
  background: "#0a0a0c"
  primary: "#101014"
  accent: "#17171a"
""",
        encoding="utf-8",
    )
    (tmp_path / "index.html").write_text(
        """
<style>
.scene-inner { background: #0a0a0c; color: #101014; filter: brightness(0.3); }
.veil { background: rgba(0, 0, 0, 0.82); }
</style>
""",
        encoding="utf-8",
    )

    report = audit_project(tmp_path)
    issue = next(issue for issue in report.issues if issue.code == "low_visibility_risk")

    assert issue.severity == "P2"
    assert "brightness" in issue.details["signals"]
