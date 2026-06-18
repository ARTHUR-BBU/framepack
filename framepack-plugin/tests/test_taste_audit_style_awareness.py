"""Taste audit style-awareness tests — direction 3.

Tests that taste audit doesn't overfit to luxury pearl:
  1. kinetic continuity — structure matching, not just English terms
  2. generic fade stack — distinguish blur-crossfade (emerging) from plain fade (lazy)
  3. surprise — exempt intentional restraint (editorial)
  4. motif transformation — structural motifs don't need narrative transformation

Tests call audit_project() with synthetic project dirs to verify end-to-end behavior.
Individual detector functions are tested after being extracted in GREEN phase.
"""

import shutil
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, "F:/hyperframes/framepack-plugin")
from core.taste_audit import audit_project


# ── Helper ────────────────────────────────────────────────────────────


def _make_project(frame_md: str, expanded_prompt: str) -> Path:
    """Create a temp project dir with frame.md and .hyperframes/expanded-prompt.md."""
    d = Path(tempfile.mkdtemp())
    d.joinpath("frame.md").write_text(frame_md)
    exp = d.joinpath(".hyperframes")
    exp.mkdir()
    exp.joinpath("expanded-prompt.md").write_text(expanded_prompt)
    return d


def _codes(report, severity=None) -> list[str]:
    """Extract issue codes from audit report, optionally filtered by severity."""
    return [i.code for i in report.issues if severity is None or i.severity == severity]


def _severities(report, code) -> list[str]:
    """Get severities for a specific issue code."""
    return [i.severity for i in report.issues if i.code == code]


# ── Fixtures: frame.md content for three styles ────────────────────────


LUXURY_FRAME = """---
colors:
  primary: "#EEE3D4"
  accent: "#C7A26A"
  background: "#04070F"
taste:
  reference_dna:
    - luxury_object_emergence
  visual_physics:
    gravity: low
    materials: [pearl, silk, shadow]
    motion_law: [slow drift, orbital reveal]
  energy_arc: slow_burn_to_memory_shock
  motif: pearl_as_moon
  taste_moves:
    - object_worship
    - editorial_punch
    - motif_reincarnation
  surprise_operator:
    type: scale_violation
    intent: "让珍珠从饰品瞬间升级成天体"
---"""

LUXURY_EXPANDED = """# Luxury Expanded
## Scene 1
### Kinetic Continuity
- Incoming: slow drift
- Action relay: orbital reveal → gather
- Outgoing: blur crossfade

## Scene 2
### Kinetic Continuity
- Incoming: gather
- Action relay: eclipse → hush
- Outgoing: blur crossfade

pearl becomes moon, orbit line becomes divider.
"""

EMERGING_FRAME = """---
colors:
  primary: "#00F0FF"
  accent: "#FF2D95"
  background: "#0A0A0F"
taste:
  reference_dna:
    - data_cathedral_explainer
  visual_physics:
    gravity: none
    materials: [neon light, scanlines]
    motion_law: [fast scan, glitch, data cascade]
  energy_arc: ambient_grid_to_crescendo
  motif: neon_grid
  taste_moves:
    - data_cathedral
    - system_awakening
  surprise_operator:
    type: spatial_flip
    intent: "数据空间突然翻转"
---"""

EMERGING_EXPANDED_CHINESE = """# Neon Grid Expanded
## Scene 1: Grid Awakening
### 动能连续性
- Incoming: grid pulse
- 动作接力: scanline cascade → data reveal
- Outgoing: blur crossfade

## Scene 2: Data Cathedral
### 动能连续性
- Incoming: data reveal
- 动作接力: pillar rise → spatial expansion
- Outgoing: blur crossfade

grid becomes data stream, data stream becomes portal.
"""

EMERGING_EXPANDED_NO_KEYWORDS = """# Neon Grid Expanded
## Scene 1: Grid Awakening
Grid lines light up in sequence, scanlines cascade.
transition: blur crossfade into data stream.
incoming energy: pulse
outgoing: blur crossfade

## Scene 2: Data Cathedral
Data pillars rise from the grid, numbers flow upward.
transition: blur crossfade into portal formation.
incoming energy: data reveal
outgoing: blur crossfade

## Scene 3: Portal Reveal
Grid converges into a portal, brand mark emerges.
transition: blur crossfade into final lockup.

## Scene 4: Brand Lockup
Neon brand name locks in.
transition: blur crossfade into final hold.

grid becomes data stream, data stream becomes portal.
"""

EDITORIAL_FRAME = """---
colors:
  primary: "#0A0A0A"
  accent: "#FFFFFF"
  background: "#F5F5F0"
taste:
  reference_dna:
    - luxury_object_emergence
  visual_physics:
    gravity: low
    materials: [paper, ink, shadow]
    motion_law: [slow reveal, mask cut, whitespace breathe]
  energy_arc: restrained_build_to_clarity
  motif: ink_line
  taste_moves:
    - object_worship
    - silence_before_drop
---"""

EDITORIAL_EXPANDED = """# Monochrome Luxe Expanded
## Scene 1: White Page
Ink line draws across white space.
Transition: hard cut to form.

## Scene 2: Structure Emerges
Ink line becomes architectural form.
Transition: hard cut to portrait.

## Scene 3: Brand Mark
Brand mark in negative space.
"""


# ═══════════════════════════════════════════════════════════════════════
# Baseline: golden case (luxury pearl) should still have 0 issues
# ═══════════════════════════════════════════════════════════════════════


def test_luxury_golden_case_zero_issues():
    """Luxury pearl with full taste block + Kinetic Continuity + surprise = 0 issues."""
    d = _make_project(LUXURY_FRAME, LUXURY_EXPANDED)
    try:
        report = audit_project(d)
        assert len(report.issues) == 0, "Golden luxury case should have 0 issues, got: " + str(_codes(report))
    finally:
        shutil.rmtree(d)


# ═══════════════════════════════════════════════════════════════════════
# Fix 1: missing_kinetic_continuity — structure matching, not just terms
# ═══════════════════════════════════════════════════════════════════════


def test_kinetic_continuity_chinese_terms_pass():
    """Chinese '动能连续性' + '动作接力' should pass (not report missing)."""
    d = _make_project(EMERGING_FRAME, EMERGING_EXPANDED_CHINESE)
    try:
        report = audit_project(d)
        assert "missing_kinetic_continuity" not in _codes(report), \
            "Chinese continuity terms should pass"
    finally:
        shutil.rmtree(d)


def test_kinetic_continuity_structure_signals_pass():
    """Structural signals (incoming/outgoing/transition) should pass even without exact terms."""
    d = _make_project(EMERGING_FRAME, EMERGING_EXPANDED_NO_KEYWORDS)
    try:
        report = audit_project(d)
        assert "missing_kinetic_continuity" not in _codes(report), \
            "Structural continuity signals should pass"
    finally:
        shutil.rmtree(d)


def test_kinetic_continuity_really_missing_fails():
    """No terms, no structure → should still report."""
    bare_expanded = "## Scene 1\nGrid lines light up.\nNo continuity info."
    d = _make_project(EMERGING_FRAME, bare_expanded)
    try:
        report = audit_project(d)
        assert "missing_kinetic_continuity" in _codes(report), \
            "Truly missing continuity should report"
    finally:
        shutil.rmtree(d)


# ═══════════════════════════════════════════════════════════════════════
# Fix 2: generic_fade_stack — distinguish blur-crossfade from plain fade
# ═══════════════════════════════════════════════════════════════════════


def test_blur_crossfade_emerging_is_not_risk():
    """Emerging style with 4x blur-crossfade → should NOT be risk."""
    d = _make_project(EMERGING_FRAME, EMERGING_EXPANDED_NO_KEYWORDS)
    try:
        report = audit_project(d)
        risk_fade = [i for i in report.issues if i.code == "generic_fade_stack" and i.severity == "risk"]
        assert len(risk_fade) == 0, \
            "Blur crossfade in emerging style should not be risk"
    finally:
        shutil.rmtree(d)


def test_plain_fade_stack_is_still_risk():
    """Plain fade/crossfade >= 3 → still risk regardless of style."""
    lazy_expanded = """## Scene 1
Transition: crossfade to next scene.
## Scene 2
Transition: fade out to black.
## Scene 3
Transition: crossfade into outro.
"""
    d = _make_project(LUXURY_FRAME, lazy_expanded)
    try:
        report = audit_project(d)
        assert "generic_fade_stack" in _codes(report, severity="risk"), \
            "Plain fade stack should still be risk"
    finally:
        shutil.rmtree(d)


def test_luxury_blur_crossfade_is_risk():
    """Luxury style (calm energy) with blur-crossfade >= 3 → still risk."""
    luxury_lazy = """## Scene 1
Transition: blur crossfade to next scene.
## Scene 2
Transition: blur crossfade to outro.
## Scene 3
Transition: blur crossfade to hold.
"""
    d = _make_project(LUXURY_FRAME, luxury_lazy)
    try:
        report = audit_project(d)
        assert "generic_fade_stack" in _codes(report, severity="risk"), \
            "Luxury blur crossfade stack should be risk"
    finally:
        shutil.rmtree(d)


# ═══════════════════════════════════════════════════════════════════════
# Fix 3: no_controlled_surprise — exempt intentional restraint
# ═══════════════════════════════════════════════════════════════════════


def test_restrained_editorial_no_surprise_not_suggestion():
    """Editorial style with intentional restraint (no surprise) → not suggestion."""
    d = _make_project(EDITORIAL_FRAME, EDITORIAL_EXPANDED)
    try:
        report = audit_project(d)
        surprise_issues = [i for i in report.issues if i.code == "no_controlled_surprise"]
        for issue in surprise_issues:
            assert issue.severity != "suggestion", \
                "Restrained editorial should not get 'suggestion' severity"
    finally:
        shutil.rmtree(d)


def test_high_energy_no_surprise_still_suggestion():
    """High-energy style without surprise → still suggestion."""
    frame_no_surprise = LUXURY_FRAME.replace(
        "surprise_operator:\n    type: scale_violation\n    intent: \"让珍珠从饰品瞬间升级成天体\"",
        ""
    )
    d = _make_project(frame_no_surprise, LUXURY_EXPANDED)
    try:
        report = audit_project(d)
        assert "no_controlled_surprise" in _codes(report, severity="suggestion"), \
            "High-energy without surprise should still get suggestion"
    finally:
        shutil.rmtree(d)


# ═══════════════════════════════════════════════════════════════════════
# Fix 4: motif_not_transformed — structural motifs are more lenient
# ═══════════════════════════════════════════════════════════════════════


def test_structural_motif_no_transformation_not_suggestion():
    """Structural motif (ink_line) without narrative transformation → not suggestion."""
    d = _make_project(EDITORIAL_FRAME, EDITORIAL_EXPANDED)
    try:
        report = audit_project(d)
        motif_issues = [i for i in report.issues if i.code == "motif_not_transformed"]
        for issue in motif_issues:
            assert issue.severity != "suggestion", \
                "Structural motif should not get 'suggestion' severity"
    finally:
        shutil.rmtree(d)


def test_narrative_motif_without_transformation_still_suggestion():
    """Narrative motif (pearl_as_moon) without transformation → still suggestion."""
    narrative_expanded = """# Luxury Expanded
## Scene 1
Pearl emerges from darkness.
## Scene 2
Brand reveal.
"""
    d = _make_project(LUXURY_FRAME, narrative_expanded)
    try:
        report = audit_project(d)
        assert "motif_not_transformed" in _codes(report, severity="suggestion"), \
            "Narrative motif without transformation should still suggest"
    finally:
        shutil.rmtree(d)
