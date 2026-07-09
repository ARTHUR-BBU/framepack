from pathlib import Path

from core.taste_audit import audit_project


def write_project(tmp_path: Path, frame: str = "", expanded: str = "", html: str = "") -> Path:
    project = tmp_path / "project"
    project.mkdir()
    if frame:
        (project / "frame.md").write_text(frame, encoding="utf-8")
    if expanded:
        hyper = project / ".hyperframes"
        hyper.mkdir()
        (hyper / "expanded-prompt.md").write_text(expanded, encoding="utf-8")
    if html:
        (project / "index.html").write_text(html, encoding="utf-8")
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


def test_audit_project_includes_html_implementation_slop(tmp_path):
    html = """
    <main class="product-dashboard mockup">
      <div class="browser-bar"></div><div class="sidebar"></div>
      <div class="chart-card"></div><div class="metric-card"></div>
    </main>
    <style>.card { animation: float 2s infinite; }</style>
    <script>window.addEventListener('scroll', () => hero.style.transform = `translateY(${window.scrollY}px)`);</script>
    """
    project = write_project(tmp_path, html=html)

    report = audit_project(project)
    by_code = {issue.code: issue for issue in report.issues}

    assert by_code["fake_product_ui_divs"].path.endswith("index.html")
    assert by_code["raw_scroll_listener"].path.endswith("index.html")
    assert by_code["missing_reduced_motion"].path.endswith("index.html")


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
    issue = next(issue for issue in report.issues if issue.code == "product_absence")
    assert issue.severity == "risk"


def test_register_aware_severity_downgrades_product_absence_for_brand_film(tmp_path):
    frame = """
taste_read:
  register: brand_film
  audience: culture audience
  visual_family: atmospheric brand film
  anti_references: [literal product demo]
"""
    expanded = """
# Brand video
## Scene 1
Hero typography and gradient waves introduce the company spirit.
## Scene 2
CTA copy appears over abstract particles.
"""
    project = write_project(tmp_path, frame=frame, expanded=expanded)

    report = audit_project(project)

    issue = next(issue for issue in report.issues if issue.code == "product_absence")
    assert issue.severity == "suggestion"


def test_high_motion_dial_escalates_unproven_motion_to_blocker(tmp_path):
    frame = """
taste_read:
  register: product_launch
  audience: buyers
  visual_family: product-led commercial
taste_dials:
  design_variance: 6
  motion_intensity: 9
  visual_density: 6
"""
    expanded = """
# Product launch video
Motion: high-energy kinetic choreography with morphing dashboard cards.
Scene 1: Product UI explodes into metric trails, parallax layers, and a snap CTA transition.
"""
    project = write_project(tmp_path, frame=frame, expanded=expanded, html="<script>anime({ targets: '.card' })</script>")

    report = audit_project(project)

    issue = next(issue for issue in report.issues if issue.code == "motion_claim_unproven")
    assert issue.severity == "blocker"


def test_low_design_variance_downgrades_missing_surprise_to_note(tmp_path):
    frame = """
taste_read:
  register: brand_film
  audience: culture audience
  visual_family: restrained editorial
taste_dials:
  design_variance: 2
  motion_intensity: 3
  visual_density: 3
taste:
  visual_physics:
    gravity: low
  taste_moves: [object_worship]
"""
    project = write_project(tmp_path, frame=frame)

    report = audit_project(project)

    issue = next(issue for issue in report.issues if issue.code == "no_controlled_surprise")
    assert issue.severity == "note"


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


def test_motion_claim_unproven_when_high_motion_plan_has_no_proof_frames(tmp_path):
    expanded = """
# Product launch video
Motion: high-energy kinetic choreography with morphing dashboard cards.
Scene 1: Product UI explodes into metric trails, parallax layers, and a snap CTA transition.
"""
    project = write_project(tmp_path, expanded=expanded, html="<html><script>gsap.to('.card',{x:100})</script></html>")

    report = audit_project(project)

    issue = next(issue for issue in report.issues if issue.code == "motion_claim_unproven")
    assert issue.severity == "risk"
    assert Path(issue.path).name == "proof-frames"
    assert Path(issue.path).parent.name == ".framepack"


def test_motion_claim_has_proof_frames_when_png_exists(tmp_path):
    expanded = """
# Product launch video
Motion: high-energy kinetic choreography with morphing dashboard cards.
Scene 1: Product UI explodes into metric trails, parallax layers, and a snap CTA transition.
"""
    project = write_project(tmp_path, expanded=expanded, html="<html><script>gsap.to('.card',{x:100})</script></html>")
    proof_dir = project / ".framepack" / "proof-frames"
    proof_dir.mkdir(parents=True)
    (proof_dir / "001.png").write_bytes(b"not-real-png-but-proof-artifact-exists")

    report = audit_project(project)

    assert not any(issue.code == "motion_claim_unproven" for issue in report.issues)


def test_motion_claim_requires_canonical_proof_frames_not_legacy_snapshots(tmp_path):
    expanded = """
# Product launch video
Motion: high-energy kinetic choreography with morphing dashboard cards.
Scene 1: Product UI explodes into metric trails, parallax layers, and a snap CTA transition.
"""
    project = write_project(tmp_path, expanded=expanded, html="<html><script>gsap.to('.card',{x:100})</script></html>")
    snapshots = project / "snapshots"
    snapshots.mkdir()
    (snapshots / "001.png").write_bytes(b"legacy snapshot should not satisfy motion proof contract")

    report = audit_project(project)

    assert any(issue.code == "motion_claim_unproven" for issue in report.issues)


def test_motion_claim_requires_canonical_proof_frames_not_legacy_framepack_proofs(tmp_path):
    expanded = """
# Product launch video
Motion: high-energy kinetic choreography with morphing dashboard cards.
Scene 1: Product UI explodes into metric trails, parallax layers, and a snap CTA transition.
"""
    project = write_project(tmp_path, expanded=expanded, html="<html><script>anime({ targets: '.card' })</script></html>")
    legacy_proofs = project / ".framepack" / "proofs"
    legacy_proofs.mkdir(parents=True)
    (legacy_proofs / "001.png").write_bytes(b"legacy proof should not satisfy motion proof contract")

    report = audit_project(project)

    assert any(issue.code == "motion_claim_unproven" for issue in report.issues)


def test_motion_claim_detects_html_only_keyframes_without_proof(tmp_path):
    project = write_project(
        tmp_path,
        expanded="# Product launch video\nProduct: dashboard hero.\n",
        html="<style>@keyframes float { from { opacity: 0 } to { opacity: 1 } }</style>",
    )

    report = audit_project(project)

    assert any(issue.code == "motion_claim_unproven" for issue in report.issues)


def test_motion_claim_detects_html_only_anime_call_without_proof(tmp_path):
    project = write_project(
        tmp_path,
        expanded="# Product launch video\nProduct: dashboard hero.\n",
        html="<script>anime({ targets: '.card', translateX: 120, duration: 800 })</script>",
    )

    report = audit_project(project)

    assert any(issue.code == "motion_claim_unproven" for issue in report.issues)


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


def test_director_bible_detects_repeated_scene_layout_grammar(tmp_path):
    frame = """
taste_read:
  register: product_launch
  audience: buyers
  visual_family: product-led commercial
"""
    expanded = """
## Scene 1 — Hook
Layout: centered headline over animated gradient background.
Headline: Work faster.
CTA: Start now.

## Scene 2 — Feature
Layout: centered headline over animated gradient background.
Headline: Automate every workflow.
CTA: See how.

## Scene 3 — Proof
Layout: centered headline over animated gradient background.
Headline: Trusted by teams.
CTA: Join today.
"""
    project = write_project(tmp_path, frame=frame, expanded=expanded)

    report = audit_project(project)

    issue = next(issue for issue in report.issues if issue.code == "scene_layout_repetition")
    assert issue.severity == "suggestion"
    assert issue.path.endswith("expanded-prompt.md")
    assert issue.details["repeated_layout"] == "centered_text_over_background"


def test_director_bible_detects_weak_product_presence_for_product_launch(tmp_path):
    frame = """
taste_read:
  register: product_launch
  audience: buyers
  visual_family: product-led commercial
"""
    expanded = """
## Scene 1 — Hook
Visual: abstract gradient waves and particles.
Headline: Transform your workflow.

## Scene 2 — Feature
Visual: glowing cards and background ribbons.
Copy: Fast, clear, intelligent.

## Scene 3 — CTA
Visual: luminous aura and animated dots.
CTA: Start now.
"""
    project = write_project(tmp_path, frame=frame, expanded=expanded)

    report = audit_project(project)

    issue = next(issue for issue in report.issues if issue.code == "product_presence_weak")
    assert issue.severity == "risk"
    assert issue.details["product_scene_count"] == 0


def test_director_bible_product_presence_weak_downgrades_for_brand_film(tmp_path):
    frame = """
taste_read:
  register: brand_film
  audience: culture audience
  visual_family: atmospheric brand film
"""
    expanded = """
## Scene 1 — Hook
Visual: abstract gradient waves and particles.
Headline: A calmer way to work.

## Scene 2 — Mood
Visual: glowing ribbons and ambient background.
Copy: Tools can feel humane.

## Scene 3 — Close
Visual: luminous aura and animated dots.
CTA: Learn more.
"""
    project = write_project(tmp_path, frame=frame, expanded=expanded)

    report = audit_project(project)

    issue = next(issue for issue in report.issues if issue.code == "product_presence_weak")
    assert issue.severity == "suggestion"


def test_director_bible_negated_product_mentions_do_not_count_as_product_presence(tmp_path):
    frame = """
taste_read:
  register: product_launch
  audience: buyers
  visual_family: product-led commercial
"""
    expanded = """
## Scene 1 — Hook
Visual: abstract gradient waves and particles.
Product: none. No product, UI, logo, device, or app screen appears.
Headline: Transform your workflow.

## Scene 2 — Feature
Visual: glowing cards and background ribbons, without UI screenshots.
Logo: absent. UI screenshots are missing.
Copy: Fast, clear, intelligent.

## Scene 3 — CTA
Visual: luminous aura and animated dots, no dashboard screenshot.
Product shot is not shown. Device: none. Screenshot: absent.
CTA: Start now.
"""
    project = write_project(tmp_path, frame=frame, expanded=expanded)

    report = audit_project(project)

    issue = next(issue for issue in report.issues if issue.code == "product_presence_weak")
    assert issue.severity == "risk"
    assert issue.details["product_scene_count"] == 0


def test_director_bible_negated_product_mentions_do_not_suppress_copy_overcrowding(tmp_path):
    frame = """
taste_read:
  register: product_launch
  audience: buyers
  visual_family: product-led commercial
"""
    expanded = """
## Scene 1 — Hook
Product: none. No product, UI, logo, device, or app screen appears.
Text: Transform your workflow with intelligent automation.
Headline: More clarity for every team.
Copy: Launch faster with less chaos.

## Scene 2 — Feature
Visual: glowing cards and background ribbons, without UI screenshots.
Logo: absent. UI screenshots are missing.
Text: One place for every operation.
Headline: See everything instantly.
Copy: Better decisions, better delivery, better growth.

## Scene 3 — CTA
Visual: luminous aura and animated dots, no dashboard screenshot.
Product shot is not shown. Device: none. Screenshot: absent.
Text: Start today.
Headline: Join modern teams.
CTA: Book a demo now.
"""
    project = write_project(tmp_path, frame=frame, expanded=expanded)

    report = audit_project(project)

    issue = next(issue for issue in report.issues if issue.code == "copy_overcrowding")
    assert issue.severity == "risk"
    assert issue.details["product_scene_count"] == 0


def test_director_bible_detects_copy_overcrowding_across_scenes(tmp_path):
    frame = """
taste_read:
  register: product_launch
  audience: buyers
  visual_family: product-led commercial
"""
    expanded = """
## Scene 1 — Hook
Text: Transform your workflow with intelligent automation.
Headline: More clarity for every team.
Copy: Launch faster with less chaos.

## Scene 2 — Feature
Text: One place for every operation.
Headline: See everything instantly.
Copy: Better decisions, better delivery, better growth.

## Scene 3 — CTA
Text: Start today.
Headline: Join modern teams.
CTA: Book a demo now.
"""
    project = write_project(tmp_path, frame=frame, expanded=expanded)

    report = audit_project(project)

    issue = next(issue for issue in report.issues if issue.code == "copy_overcrowding")
    assert issue.severity == "risk"
    assert issue.details["copy_line_count"] >= 8


def test_director_bible_copy_overcrowding_is_risk_for_product_ui_register(tmp_path):
    frame = """
taste_read:
  register: product_ui
  audience: buyers
  visual_family: product-led commercial
"""
    expanded = """
## Scene 1 — Hook
Text: Transform your workflow with intelligent automation.
Headline: More clarity for every team.
Copy: Launch faster with less chaos.

## Scene 2 — Feature
Text: One place for every operation.
Headline: See everything instantly.
Copy: Better decisions, better delivery, better growth.

## Scene 3 — CTA
Text: Start today.
Headline: Join modern teams.
CTA: Book a demo now.
"""
    project = write_project(tmp_path, frame=frame, expanded=expanded)

    report = audit_project(project)

    issue = next(issue for issue in report.issues if issue.code == "copy_overcrowding")
    assert issue.severity == "risk"


def test_director_bible_allows_varied_layout_and_concrete_product_scenes(tmp_path):
    frame = """
taste_read:
  register: product_launch
  audience: buyers
  visual_family: product-led commercial
"""
    expanded = """
## Scene 1 — Product reveal
Product: real dashboard screenshot enters as the hero.
Layout: device mockup left, proof metric right.
Headline: Automate every workflow.

## Scene 2 — Interface ballet
Visual: UI cards orbit around the dashboard screenshot.
Layout: card grid stack with product shadow.
Copy: Clear work, fewer handoffs.

## Scene 3 — Brand lockup
Logo: product logo resolves from interface tiles.
Layout: brand mark centered with restrained CTA.
CTA: Book a demo.
"""
    project = write_project(tmp_path, frame=frame, expanded=expanded)

    report = audit_project(project)
    codes = {issue.code for issue in report.issues}

    assert "scene_layout_repetition" not in codes
    assert "product_presence_weak" not in codes
    assert "copy_overcrowding" not in codes