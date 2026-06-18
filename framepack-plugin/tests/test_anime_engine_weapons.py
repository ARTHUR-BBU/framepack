"""Direction 2: anime.js / sprite engine weapons — registration + audit chain tests.

Tests that the three v0.12 engine-diverse weapons (anime-text-split, svg-morph-transition,
sprite-animation) flow correctly through:
  1. builtin_weapons catalog → engine + function fields
  2. arsenal_registry reconcile → engine field persists to arsenal.json
  3. quality_audit → canonical function detection + inline_hint works per-engine

These tests expose three real wiring bugs found during code review:
  Bug A: svg-morph-transition function name mismatch (registered vs .js code)
  Bug B: sprite-animation engine label is wrong (GSAP-driven, not CSS-only)
  Bug C: inline_hint only detects gsap.* calls, blind to anime.js inline rewrites
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.builtin_weapons import resolve_builtin_weapon, list_builtin_weapon_ids
from core.arsenal_registry import reconcile_manifest, load_arsenal
from core.execution_manifest import ManifestWeapon, parse_execution_manifest
from core.quality_audit import _canonical_function_name, _inline_gsap_hint


# ── Bug A: svg-morph-transition function name must match .js code ──

def test_svg_morph_transition_function_name_matches_js_implementation():
    """The registered function name must match the actual function in the .js file.

    svg-morph-transition.js defines `svgMorph`, NOT `svgMorphTransition`.
    If the catalog says svgMorphTransition, quality_audit will search HTML for a
    function that doesn't exist — guaranteed false-positive manifest_weapon_not_called.
    """
    weapon = resolve_builtin_weapon("svg-morph-transition")
    assert weapon is not None
    # The .js file defines: function svgMorph(el, ...)
    assert weapon["function"] == "svgMorph", (
        f"Expected 'svgMorph' (matches .js code), got '{weapon['function']}'"
    )


# ── Bug B: sprite-animation engine must reflect actual runtime dependency ──

def test_sprite_animation_engine_reflects_gsap_dependency():
    """sprite-animation.js uses GSAP tl.to(animObj, ...) to drive frames.

    The engine field must indicate GSAP dependency, not claim "CSS sprite sheet"
    (which implies zero JS dependency). Wrong engine label misleads the Agent
    into thinking it doesn't need GSAP loaded.
    """
    weapon = resolve_builtin_weapon("sprite-animation")
    assert weapon is not None
    engine = weapon["engine"]
    assert "GSAP" in engine, (
        f"sprite-animation is GSAP-driven (tl.to in .js), engine must contain 'GSAP', got '{engine}'"
    )


# ── Engine field persists through arsenal_registry reconcile ──

def test_anime_engine_field_persists_to_arsenal_json(tmp_path):
    """When an anime.js weapon is reconciled into arsenal.json, the engine field
    must survive the trip — Agent reads arsenal.json to know which engine to load.
    """
    manifest_weapons = [
        ManifestWeapon(id="anime-text-split", source=None, used_by=["scene_1"]),
    ]
    data = {"weapons": {}, "schema_version": "1.0.0"}
    data, warnings = reconcile_manifest(data, manifest_weapons)

    entry = data["weapons"].get("anime-text-split")
    assert entry is not None, "anime-text-split was not registered"
    assert entry["engine"] == "anime.js", (
        f"engine field lost during reconcile, got '{entry.get('engine')}'"
    )


def test_sprite_engine_field_persists_to_arsenal_json(tmp_path):
    """Same persistence check for sprite-animation (multi-engine weapon)."""
    manifest_weapons = [
        ManifestWeapon(id="sprite-animation", source=None, used_by=["scene_1"]),
    ]
    data = {"weapons": {}, "schema_version": "1.0.0"}
    data, warnings = reconcile_manifest(data, manifest_weapons)

    entry = data["weapons"].get("sprite-animation")
    assert entry is not None
    assert "GSAP" in entry["engine"], (
        f"engine field wrong after reconcile: '{entry.get('engine')}'"
    )


# ── Bug C: inline_hint must detect anime.js inline rewrites ──

def test_inline_hint_detects_anime_js_inline_rewrite():
    """When Agent writes inline anime() instead of calling animeTextSplit(),
    inline_hint must flag suspected=True — same as it does for GSAP rewrites.

    Currently _inline_gsap_hint only checks gsap.(to|from|...) patterns.
    anime.js inline rewrites use anime()/animate() — completely invisible.
    """
    html_with_anime_inline = """
    <script>
    anime({ targets: chars, translateY: [24, 0], opacity: [0, 1], delay: anime.stagger(40) });
    </script>
    """
    hint = _inline_gsap_hint(html_with_anime_inline, "anime-text-split", {"staggerAmount": 40})
    assert hint["suspected"] is True, (
        f"anime.js inline rewrite not detected — hint signals: {hint['signals']}"
    )


def test_inline_hint_detects_animate_call_inline_rewrite():
    """anime.js v4 uses animate() instead of anime(). Must catch both."""
    html_with_animate = """
    <script>
    animate(chars, { translateY: [24, 0], opacity: [0, 1], delay: stagger(40) });
    </script>
    """
    hint = _inline_gsap_hint(html_with_animate, "anime-text-split", {"staggerAmount": 40})
    assert hint["suspected"] is True, (
        f"animate() inline rewrite not detected — hint signals: {hint['signals']}"
    )


# ── Canonical function resolution for all three engines ──

def test_canonical_function_name_resolves_anime_weapons():
    """_canonical_function_name must resolve anime.js weapons so quality_audit
    can search for their function calls in HTML."""
    assert _canonical_function_name("anime-text-split") == "animeTextSplit"
    assert _canonical_function_name("svg-morph-transition") == "svgMorph"
    assert _canonical_function_name("sprite-animation") == "spriteAnimation"


def test_anime_weapons_in_builtin_catalog():
    """All three v0.12 weapons must be in the builtin catalog."""
    ids = list_builtin_weapon_ids()
    assert "anime-text-split" in ids
    assert "svg-morph-transition" in ids
    assert "sprite-animation" in ids
