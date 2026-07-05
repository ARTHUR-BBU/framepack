from pathlib import Path

import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def test_caption_clip_wipe_presets_load_from_registry():
    from core.weapon_presets import load_weapon_presets, load_preset_registry

    registry = load_preset_registry()
    pack = load_weapon_presets("caption-clip-wipe")

    assert "caption-clip-wipe" in registry
    assert pack.weapon_id == "caption-clip-wipe"
    assert "editorial_lower_third" in pack.presets
    preset = pack.presets["editorial_lower_third"]
    assert preset.motion_role == "premium-callout"
    assert preset.duration == 0.8
    assert preset.ease == "power3.out"
    assert preset.max_lines == 2
    assert "product-callout" in preset.safe_for
    assert "paragraph" in preset.avoid


def test_missing_weapon_presets_return_empty_pack():
    from core.weapon_presets import load_weapon_presets

    pack = load_weapon_presets("unknown-weapon")

    assert pack.weapon_id == "unknown-weapon"
    assert pack.presets == {}


def test_choose_recommended_preset_prefers_safe_for_signal():
    from core.weapon_presets import choose_recommended_preset

    preset = choose_recommended_preset(
        "caption-clip-wipe",
        "Premium product callout label for quote and metric-label.",
    )

    assert preset is not None
    assert preset.preset_id == "editorial_lower_third"
