"""Tests for P1.2 Tone/Rhythm Presets."""

from __future__ import annotations

from core.tone_presets import (
    TONE_PRESETS,
    get_preset,
    list_presets,
    validate_scene_count,
    suggest_preset_for_intent,
)


class TestTonePresets:
    def test_preset_keys_exist(self):
        assert "cinematic" in TONE_PRESETS
        assert "chaotic" in TONE_PRESETS
        assert "deadpan" in TONE_PRESETS

    def test_each_preset_has_required_fields(self):
        required = {"scene_count", "cut_density", "hold_style",
                    "music_strategy", "text_density", "motion_density"}
        for name, preset in TONE_PRESETS.items():
            missing = required - set(preset.keys())
            assert not missing, f"{name} missing fields: {missing}"

    def test_scene_count_is_tuple_of_two(self):
        for name, preset in TONE_PRESETS.items():
            sc = preset["scene_count"]
            assert isinstance(sc, (list, tuple))
            assert len(sc) == 2
            assert sc[0] <= sc[1]

    def test_get_preset(self):
        p = get_preset("cinematic")
        assert p is not None
        assert p["music_strategy"] == "beat-locked-cues"

    def test_get_preset_unknown(self):
        p = get_preset("nonexistent")
        assert p is None

    def test_list_presets(self):
        names = list_presets()
        assert "cinematic" in names
        assert len(names) >= 3

    def test_validate_scene_count_in_range(self):
        p = get_preset("cinematic")
        assert validate_scene_count(5, p) is True

    def test_validate_scene_count_out_of_range(self):
        p = get_preset("cinematic")
        assert validate_scene_count(20, p) is False

    def test_validate_scene_count_at_boundary(self):
        p = get_preset("cinematic")
        lo, hi = p["scene_count"]
        assert validate_scene_count(lo, p) is True
        assert validate_scene_count(hi, p) is True


class TestSuggestPresetForIntent:
    def test_brand_launch_suggests_cinematic(self):
        result = suggest_preset_for_intent("做个珍珠品牌新品发布视频")
        assert result in TONE_PRESETS

    def test_sports_energy_suggests_high_energy(self):
        result = suggest_preset_for_intent("做个球员转会宣传片，要有冲击力")
        assert result in TONE_PRESETS

    def test_educational_suggests_calm(self):
        result = suggest_preset_for_intent("解释一下什么是 RAG")
        assert result in TONE_PRESETS

    def test_unknown_intent_returns_default(self):
        result = suggest_preset_for_intent("做个东西")
        assert result in TONE_PRESETS
