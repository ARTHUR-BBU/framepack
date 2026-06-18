"""Concrete builtin weapon catalog tests."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.builtin_weapons import list_builtin_weapon_ids, resolve_builtin_weapon


def test_builtin_catalog_contains_text_split_enter():
    weapon = resolve_builtin_weapon("text-split-enter")

    assert weapon is not None
    assert weapon["source"] == "builtin"
    assert weapon["kind"] == "part"
    assert weapon["skill"] == "framepack:framepack-animation-library"
    assert weapon["file"] == "parts/text-split-enter.md"


def test_builtin_catalog_contains_hyperframes_safe_rule():
    weapon = resolve_builtin_weapon("rules.hyperframes-render-safe")

    assert weapon is not None
    assert weapon["kind"] == "hyperframes-rule"
    assert weapon["source"] == "builtin"


def test_resolve_unknown_builtin_returns_none():
    assert resolve_builtin_weapon("missing-weapon") is None


def test_builtin_weapon_catalog_has_expected_core_entries():
    ids = list_builtin_weapon_ids()

    assert "text-split-enter" in ids
    assert "caption-clip-wipe" in ids
    assert "bg-blur-mask" in ids


def test_builtin_weapon_catalog_covers_v0102_digital_soliloquy_weapons():
    expected = {
        "typewriter-cursor",
        "text-split-enter",
        "glitch-flicker",
        "bg-blur-mask",
        "light-leak-cinema",
        "elastic-scale-enter",
        "gradient-shift",
        "splittext-stagger-chars",
        "caption-clip-wipe",
        "float-3d-card",
        "card-cascade-reveal",
    }

    ids = list_builtin_weapon_ids()
    missing = expected.difference(ids)

    assert missing == set()
    assert "rules.hyperframes-render-safe" in ids


def test_builtin_catalog_includes_all_block_weapons():
    """Every block weapon (.js in blocks/) must be registered.

    data-chart-editorial, hero-3d-device-spin, sticky-flowchart were
    missing from the catalog — Phase 4 drift repair.
    """
    ids = list_builtin_weapon_ids()
    block_weapons = {"card-cascade-reveal", "data-chart-editorial",
                     "hero-3d-device-spin", "sticky-flowchart"}
    missing = block_weapons.difference(ids)
    assert missing == set(), f"Block weapons missing from catalog: {missing}"


def test_every_registered_weapon_has_matching_js_file():
    """Every weapon whose kind is part/block must point to a real .js file.

    Prevents registry-vs-filesystem drift.
    """
    import core.builtin_weapons as bw
    from pathlib import Path

    skill_root = Path(__file__).resolve().parent.parent / "skills" / "framepack-animation-library"
    for wid, record in bw.BUILTIN_WEAPONS.items():
        if record.get("kind") not in ("part", "block"):
            continue
        code_path = record.get("code")
        assert code_path, f"{wid}: no code path"
        full = skill_root / code_path
        assert full.is_file(), f"{wid}: code file not found at {code_path}"


def test_registered_function_name_matches_js_definition():
    """Every weapon's registered 'function' must be defined in its .js file.

    Prevents function-name drift between registry and weapon source.
    Without this, the P0 weapon_not_called gate would false-positive on
    weapons whose entry point was renamed during refactoring.
    """
    import re
    import core.builtin_weapons as bw
    from pathlib import Path

    skill_root = Path(__file__).resolve().parent.parent / "skills" / "framepack-animation-library"
    mismatches = []
    for wid, record in bw.BUILTIN_WEAPONS.items():
        if record.get("kind") not in ("part", "block"):
            continue
        fn_name = record.get("function")
        if not fn_name:
            continue
        code_path = skill_root / record["code"]
        src = code_path.read_text(encoding="utf-8")
        # Look for: function Name( or function Name (
        pattern = rf"\bfunction\s+{re.escape(fn_name)}\s*\("
        if not re.search(pattern, src):
            defined = re.findall(r"function\s+(\w+)\s*\(", src)
            mismatches.append(f"{wid}: registered '{fn_name}', defined {defined}")
    assert not mismatches, "Function name drift:\n" + "\n".join(mismatches)
