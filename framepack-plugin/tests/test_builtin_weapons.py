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


def test_list_builtin_weapon_ids_includes_canonical_weapons():
    ids = list_builtin_weapon_ids()

    assert "text-split-enter" in ids
    assert "caption-clip-wipe" in ids
    assert "bg-blur-mask" in ids
    assert "rules.hyperframes-render-safe" in ids
