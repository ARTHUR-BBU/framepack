"""Quality-beyond-lint audit tests."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.quality_audit import audit_project


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
