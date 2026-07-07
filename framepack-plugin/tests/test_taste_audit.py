from pathlib import Path

from core.taste_audit import audit_project


def write_project(tmp_path: Path, frame: str = "", expanded: str = "") -> Path:
    project = tmp_path / "project"
    project.mkdir()
    if frame:
        (project / "frame.md").write_text(frame, encoding="utf-8")
    if expanded:
        hyper = project / ".hyperframes"
        hyper.mkdir()
        (hyper / "expanded-prompt.md").write_text(expanded, encoding="utf-8")
    return project


def test_audit_project_returns_report_shape(tmp_path):
    project = write_project(tmp_path)
    report = audit_project(project)
    data = report.to_dict()
    assert data["kind"] == "framepack_taste_audit"
    assert data["project_dir"] == str(project)
    assert "summary" in data
    assert "issues" in data


def test_missing_taste_block_is_suggestion_not_failure(tmp_path):
    project = write_project(tmp_path, frame="---\ncolors: {}\n---\n")
    report = audit_project(project)
    issue = next(issue for issue in report.issues if issue.code == "missing_taste_block")
    assert issue.severity == "suggestion"
    assert "taste" in issue.message


def test_missing_kinetic_continuity_is_suggestion(tmp_path):
    expanded = """
# Video

## Scene 1 — Hook
Concept: object reveal.

## Execution Manifest
scene_1:
  weapon: text-split-enter
"""
    project = write_project(tmp_path, expanded=expanded)
    report = audit_project(project)
    issue = next(issue for issue in report.issues if issue.code == "missing_kinetic_continuity")
    assert issue.severity == "suggestion"


def test_complete_taste_sections_avoid_missing_section_issues(tmp_path):
    frame = """
---
taste:
  reference_dna:
    - luxury_object_emergence
  visual_physics:
    gravity: low
    materials: [pearl, silk]
    motion_law: [slow drift]
    transformation_rule: [circles become halos]
    forbidden_motion: [generic slide-in]
  energy_arc: slow_burn_to_punch
  motif: pearl_as_moon
  taste_moves: [object_worship]
  surprise_operator:
    type: scale_violation
    intent: Make the pearl celestial.
---
"""
    expanded = """
## Scene 1 — Hook

#### Kinetic Continuity
- Incoming energy: silence.
- Action relay: pearl orbit reveals title.
- Outgoing transition seed: halo expands.
- Motif state: pearl → halo.

## Execution Manifest
scene_1:
  motion_role: hook_mystery
  grammar: tension_release
  taste_move: object_worship
  surprise: scale_violation
  weapon: text-split-enter
"""
    project = write_project(tmp_path, frame=frame, expanded=expanded)
    report = audit_project(project)
    codes = {issue.code for issue in report.issues}
    assert "missing_taste_block" not in codes
    assert "missing_kinetic_continuity" not in codes


def test_detects_generic_fade_stack(tmp_path):
    expanded = """
## Scene 1
Transition out: crossfade.
## Scene 2
Transition out: fade.
## Scene 3
Transition out: blur crossfade.
"""
    project = write_project(tmp_path, expanded=expanded)
    report = audit_project(project)
    assert any(issue.code == "generic_fade_stack" for issue in report.issues)


def test_detects_static_mockup_language(tmp_path):
    expanded = "Scene 2: show static mockup centered on screen."
    project = write_project(tmp_path, expanded=expanded)
    report = audit_project(project)
    issue = next(issue for issue in report.issues if issue.code == "static_mockup_risk")
    assert issue.severity == "risk"


def test_detects_missing_controlled_surprise_when_taste_exists(tmp_path):
    frame = """
---
taste:
  visual_physics:
    gravity: low
  taste_moves: [object_worship]
---
"""
    project = write_project(tmp_path, frame=frame)
    report = audit_project(project)
    assert any(issue.code == "no_controlled_surprise" for issue in report.issues)


def test_detects_too_many_surprises(tmp_path):
    expanded = """
surprise: scale_violation
surprise: tempo_break
surprise: material_shift
"""
    project = write_project(tmp_path, expanded=expanded)
    report = audit_project(project)
    issue = next(issue for issue in report.issues if issue.code == "too_many_surprises")
    assert issue.severity == "risk"


def test_ignores_manifest_surprise_none_when_counting_surprises(tmp_path):
    frame = """
---
taste:
  visual_physics:
    gravity: low
  surprise_operator:
    type: scale_violation
    intent: Make the pearl celestial.
---
"""
    expanded = """
## Execution Manifest
scene_1:
  surprise: none
scene_2:
  surprise: none
scene_3:
  surprise: scale_violation
scene_4:
  surprise: none
scene_5:
  surprise: none
"""
    project = write_project(tmp_path, frame=frame, expanded=expanded)
    report = audit_project(project)
    codes = {issue.code for issue in report.issues}
    assert "too_many_surprises" not in codes
    assert "no_controlled_surprise" not in codes


def test_detects_surprise_operator_without_intent_in_frame_md(tmp_path):
    frame = """
---
taste:
  surprise_operator:
    type: scale_violation
---
"""
    project = write_project(tmp_path, frame=frame)
    report = audit_project(project)
    assert any(issue.code == "surprise_without_intent" for issue in report.issues)


def test_allows_multiline_surprise_operator_with_intent_in_frame_md(tmp_path):
    frame = """
---
taste:
  visual_physics:
    gravity: low
  surprise_operator:
    type: scale_violation
    intent: Make the pearl feel celestial, not random.
---
"""
    project = write_project(tmp_path, frame=frame)
    report = audit_project(project)
    codes = {issue.code for issue in report.issues}
    assert "surprise_without_intent" not in codes
    assert "no_controlled_surprise" not in codes


def test_detects_later_surprise_operator_without_intent(tmp_path):
    frame = """
---
taste:
  surprise_operator:
    type: scale_violation
    intent: Make the pearl feel celestial.
  surprise_operator:
    type: tempo_break
---
"""
    project = write_project(tmp_path, frame=frame)
    report = audit_project(project)
    assert any(issue.code == "surprise_without_intent" for issue in report.issues)


def test_surprise_operator_intent_must_be_inside_operator_block(tmp_path):
    frame = """
---
taste:
  intent: Keep the story premium.
  surprise_operator:
    type: scale_violation
---
"""
    project = write_project(tmp_path, frame=frame)
    report = audit_project(project)
    assert any(issue.code == "surprise_without_intent" for issue in report.issues)


def test_manifest_surprise_semantics_do_not_require_scene_intent(tmp_path):
    frame = """
---
taste:
  visual_physics:
    gravity: low
  taste_moves: [object_worship]
---
"""
    expanded = """
## Execution Manifest
scene_1:
  surprise: scale_violation
  weapon: text-split-enter
"""
    project = write_project(tmp_path, frame=frame, expanded=expanded)
    report = audit_project(project)
    codes = {issue.code for issue in report.issues}
    assert "no_controlled_surprise" not in codes
    assert "surprise_without_intent" not in codes


def test_detects_motif_not_transformed(tmp_path):
    frame = """
---
taste:
  motif: pearl_as_moon
---
"""
    expanded = "pearl appears as decoration in every scene."
    project = write_project(tmp_path, frame=frame, expanded=expanded)
    report = audit_project(project)
    assert any(issue.code == "motif_not_transformed" for issue in report.issues)


def test_commercial_taste_detects_ppt_like_text_dominance(tmp_path):
    expanded = """
## Scene 1
Text: Transform your workflow with next generation intelligent automation for every team.
Text: More productivity, more clarity, more growth, more speed.
Text: Join thousands of teams today.
Product: none.
"""
    project = write_project(tmp_path, expanded=expanded)
    report = audit_project(project)
    issue = next(issue for issue in report.issues if issue.code == "text_dominance")
    assert issue.severity == "risk"
    assert "PPT" in issue.message


def test_commercial_taste_detects_product_absence_when_product_launch(tmp_path):
    expanded = """
# Product launch video
## Scene 1
Hero typography and gradient waves introduce the app.
## Scene 2
CTA copy appears over abstract particles.
"""
    project = write_project(tmp_path, expanded=expanded)
    report = audit_project(project)
    assert any(issue.code == "product_absence" for issue in report.issues)


def test_commercial_taste_detects_flat_background(tmp_path):
    expanded = """
## Scene 1
Background: solid blue background.
Depth layers: none.
Transition out: fade.
"""
    project = write_project(tmp_path, expanded=expanded)
    report = audit_project(project)
    assert any(issue.code == "flat_background" for issue in report.issues)


def test_commercial_taste_detects_weapon_preset_missing(tmp_path):
    project = write_project(tmp_path, expanded="# Scene 1\nCaption callout enters.\n")
    fp = project / ".framepack"
    fp.mkdir()
    (fp / "weapon-load-plan.json").write_text(
        """{
  "version": "0.1",
  "source_prompt": ".hyperframes/expanded-prompt.md",
  "scenes": [{
    "scene": "scene_1",
    "need": "caption callout",
    "matches": [{"source": "builtin", "id": "caption-clip-wipe", "confidence": "high", "reuse_mode": "full", "preset_id": null}]
  }]
}""",
        encoding="utf-8",
    )
    report = audit_project(project)
    assert any(issue.code == "weapon_preset_missing" for issue in report.issues)


def test_commercial_taste_detects_bgm_unplanned_when_video_mentions_audio(tmp_path):
    expanded = """
# Product launch video
Rhythm: punch-breathe-CTA.
Audio: TBD.
No BGM plan yet.
"""
    project = write_project(tmp_path, expanded=expanded)
    report = audit_project(project)
    assert any(issue.code == "bgm_unplanned" for issue in report.issues)


def test_commercial_taste_detects_missing_proof_frames_after_html_exists(tmp_path):
    project = write_project(tmp_path, expanded="# Scene 1\nProduct-led launch.\n")
    (project / "index.html").write_text("<html></html>", encoding="utf-8")

    report = audit_project(project)
    assert any(issue.code == "no_proof_frames" for issue in report.issues)


def test_integrated_prompt_detector_detects_opening_visual_absence(tmp_path):
    frame = """
taste_read:
  register: product_launch
  audience: buyers
  visual_family: product-led commercial
  anti_references: [animated PPT]
"""
    expanded = """
## Scene 1 — Hook
Text: Transform your workflow.
Headline: Intelligent operations for every team.
"""
    project = write_project(tmp_path, frame=frame, expanded=expanded)

    report = audit_project(project)

    assert any(issue.code == "opening_visual_absence" for issue in report.issues)


def test_integrated_prompt_detector_detects_visible_copy_dash(tmp_path):
    frame = """
taste_read:
  register: product_launch
  audience: buyers
  visual_family: product-led commercial
  anti_references: [animated PPT]
"""
    expanded = """
## Scene 1 — Hook
Product: dashboard screenshot enters.
Headline: Deploy faster — without chaos.
"""
    project = write_project(tmp_path, frame=frame, expanded=expanded)

    report = audit_project(project)

    assert any(issue.code == "copy_punctuation_slop" for issue in report.issues)