"""Tests for arsenal registry drift repair — orphan weapons + card-cascade-reveal path fix.

These tests verify that:
1. Four orphan parts/ weapons (stagger-grid-reveal, particle-blob-bg,
   macos-notification, number-count-up) are registered with correct
   function names and engines matching their .js implementations.
2. card-cascade-reveal registration points to the blocks/ directory
   (where the actual files live) with the correct function name
   (buildCardCascade, not cardCascadeReveal).
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.builtin_weapons import list_builtin_weapon_ids, resolve_builtin_weapon


# ── Orphan parts/ weapons: should be registered with correct metadata ──


def test_stagger_grid_reveal_registered():
    w = resolve_builtin_weapon("stagger-grid-reveal")
    assert w is not None
    assert w["function"] == "staggerGridReveal"
    assert w["engine"] == "GSAP"
    assert w["file"] == "parts/stagger-grid-reveal.md"


def test_particle_blob_bg_registered():
    w = resolve_builtin_weapon("particle-blob-bg")
    assert w is not None
    assert w["function"] == "createParticleBlob"
    assert w["engine"] == "anime.js"
    assert w["file"] == "parts/particle-blob-bg.md"


def test_macos_notification_registered():
    w = resolve_builtin_weapon("macos-notification")
    assert w is not None
    assert w["function"] == "showMacOSNotification"
    assert w["engine"] == "GSAP"
    assert w["file"] == "parts/macos-notification.md"


def test_number_count_up_registered():
    w = resolve_builtin_weapon("number-count-up")
    assert w is not None
    assert w["function"] == "numberCountUp"
    assert w["engine"] == "GSAP"
    assert w["file"] == "parts/number-count-up.md"


# ── card-cascade-reveal: path fix — points to blocks/ not parts/ ──


def test_card_cascade_reveal_points_to_blocks_directory():
    """card-cascade-reveal lives in blocks/, not parts/.
    The _part() helper generates parts/ paths by default.
    It must be overridden to point to the correct location.
    """
    w = resolve_builtin_weapon("card-cascade-reveal")
    assert w is not None
    # File spec is in blocks/, not parts/
    assert "blocks/" in w["file"], f"Expected blocks/ in path, got {w['file']}"
    assert w["file"] == "blocks/card-cascade-reveal.md"
    # Code is in blocks/references/, not parts/references/
    assert "blocks/" in w["code"], f"Expected blocks/ in code path, got {w['code']}"
    assert w["code"] == "blocks/references/card-cascade-reveal.js"


def test_card_cascade_reveal_function_name_matches_js():
    """The .js file defines buildCardCascade(), not cardCascadeReveal().
    Registration must match the actual function name so quality_audit
    can find canonical calls.
    """
    w = resolve_builtin_weapon("card-cascade-reveal")
    assert w is not None
    assert w["function"] == "buildCardCascade", (
        f"Expected 'buildCardCascade' (matches .js), got '{w['function']}'"
    )


# ── All orphan weapons appear in the full catalog listing ──


def test_all_orphan_weapons_in_catalog_listing():
    ids = list_builtin_weapon_ids()
    for orphan in (
        "stagger-grid-reveal",
        "particle-blob-bg",
        "macos-notification",
        "number-count-up",
    ):
        assert orphan in ids, f"{orphan} missing from catalog listing"
