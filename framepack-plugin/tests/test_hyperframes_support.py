from core.hyperframes_support import (
    HyperFramesSupportWindow,
    classify_hyperframes_version,
    parse_version_tuple,
)


def window() -> HyperFramesSupportWindow:
    return HyperFramesSupportWindow(
        supported_min="0.7.3",
        supported_max_tested="0.7.21",
        soft_max="0.7.x",
        hard_block_below="0.7.0",
        latest_supported_for_downgrade="0.7.21",
    )


def test_supported_version_allows_normal_handoff():
    decision = classify_hyperframes_version("0.7.3", window())

    assert decision.status == "supported"
    assert decision.allow_discovery is True
    assert decision.allow_handoff is True
    assert decision.guarded_mode is False
    assert decision.requires_smoke is False


def test_hyperframes_073_is_now_inside_tested_window():
    decision = classify_hyperframes_version("0.7.3", window())

    assert decision.status == "supported"
    assert decision.allow_handoff is True
    assert decision.guarded_mode is False
    assert decision.requires_smoke is False


def test_too_old_version_recommends_upgrade_and_blocks_handoff():
    decision = classify_hyperframes_version("0.7.2", window())

    assert decision.status == "too_old"
    assert decision.allow_discovery is True
    assert decision.allow_handoff is False
    assert decision.recommend_upgrade is True
    assert "below supported_min" in " ".join(decision.notes)


def test_hard_too_old_version_blocks_handoff():
    decision = classify_hyperframes_version("0.6.121", window())

    assert decision.status == "hard_too_old"
    assert decision.allow_discovery is True
    assert decision.allow_handoff is False
    assert decision.block_reason == "hyperframes_too_old"


def test_newer_patch_in_same_soft_band_requires_smoke_before_guarded_handoff():
    before_smoke = classify_hyperframes_version("0.7.22", window())

    assert before_smoke.status == "newer_same_band"
    assert before_smoke.allow_discovery is True
    assert before_smoke.allow_handoff is False
    assert before_smoke.requires_smoke is True
    assert before_smoke.guarded_mode is True

    after_smoke = classify_hyperframes_version("0.7.22", window(), smoke_passed=True)

    assert after_smoke.status == "newer_same_band"
    assert after_smoke.allow_handoff is True
    assert after_smoke.guarded_mode is True
    assert after_smoke.warning_level == "warning"


def test_unknown_newer_minor_or_major_uses_discovery_only_until_smoke_passes():
    before_smoke = classify_hyperframes_version("0.8.0", window())

    assert before_smoke.status == "unknown_newer"
    assert before_smoke.allow_discovery is True
    assert before_smoke.allow_handoff is False
    assert before_smoke.discovery_only is True
    assert before_smoke.requires_smoke is True

    failed_smoke = classify_hyperframes_version("0.8.0", window(), smoke_passed=False)

    assert failed_smoke.status == "unknown_newer"
    assert failed_smoke.allow_handoff is False
    assert failed_smoke.block_reason == "compatibility_smoke_failed"
    assert failed_smoke.recommend_downgrade_to == "0.7.21"

    passed_smoke = classify_hyperframes_version("0.8.0", window(), smoke_passed=True)

    assert passed_smoke.status == "unknown_newer"
    assert passed_smoke.allow_handoff is True
    assert passed_smoke.guarded_mode is True
    assert passed_smoke.warning_level == "strong_warning"


def test_prerelease_versions_require_smoke_instead_of_stable_supported_path():
    before_smoke = classify_hyperframes_version("0.7.3-rc.1", window())

    assert before_smoke.status == "prerelease"
    assert before_smoke.allow_discovery is True
    assert before_smoke.allow_handoff is False
    assert before_smoke.requires_smoke is True
    assert before_smoke.guarded_mode is True

    after_smoke = classify_hyperframes_version("0.7.3-rc.1", window(), smoke_passed=True)

    assert after_smoke.status == "prerelease"
    assert after_smoke.allow_handoff is True
    assert after_smoke.guarded_mode is True


def test_parse_version_tuple_ignores_common_suffixes_for_numeric_base_only():
    assert parse_version_tuple("0.7.3") == (0, 7, 3)
    assert parse_version_tuple("0.7.3-beta.1") == (0, 7, 3)
    assert parse_version_tuple("1.0") == (1, 0, 0)
