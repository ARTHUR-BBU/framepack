"""HyperFrames version support-window policy for Framepack.

This module is intentionally pure: no shell, no network, no filesystem writes.
It classifies an installed HyperFrames version against the support window shipped
by Framepack so higher-level doctor/upgrade code can decide whether to proceed,
probe, guard, upgrade, or recommend downgrade.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass(frozen=True)
class HyperFramesSupportWindow:
    supported_min: str
    supported_max_tested: str
    soft_max: str
    hard_block_below: str
    unknown_newer_policy: str = "warn_and_probe"
    latest_supported_for_downgrade: str | None = None


@dataclass(frozen=True)
class HyperFramesVersionDecision:
    installed_version: str
    status: str
    allow_discovery: bool
    allow_handoff: bool
    guarded_mode: bool = False
    discovery_only: bool = False
    requires_smoke: bool = False
    recommend_upgrade: bool = False
    recommend_downgrade_to: str | None = None
    warning_level: str | None = None
    block_reason: str | None = None
    notes: list[str] = field(default_factory=list)


def parse_version_tuple(version: str) -> tuple[int, int, int]:
    """Parse a semver-ish string into a 3-part integer tuple.

    Non-numeric suffixes such as ``-beta.1`` or ``+build`` are ignored for the
    numeric base. Classification remains conservative about prerelease suffixes.
    """
    match = re.match(r"^\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?", version)
    if not match:
        return (0, 0, 0)
    parts = [int(part) if part is not None else 0 for part in match.groups()]
    return (parts[0], parts[1], parts[2])


def is_prerelease(version: str) -> bool:
    return bool(re.match(r"^\s*\d+(?:\.\d+){0,2}-[A-Za-z0-9]", version))


def same_soft_band(version: str, soft_max: str) -> bool:
    """Return whether ``version`` is in the declared soft compatibility band.

    Currently supports patterns like ``0.7.x`` or exact major/minor/patch-ish
    strings. This stays deliberately small until real support metadata needs more.
    """
    version_tuple = parse_version_tuple(version)
    soft = soft_max.strip()
    if soft.endswith(".x"):
        prefix = soft[:-2]
        prefix_parts = prefix.split(".")
        if len(prefix_parts) == 1:
            return version_tuple[0] == int(prefix_parts[0])
        if len(prefix_parts) == 2:
            return version_tuple[:2] == (int(prefix_parts[0]), int(prefix_parts[1]))
    return version_tuple == parse_version_tuple(soft)


def classify_hyperframes_version(
    installed_version: str,
    window: HyperFramesSupportWindow,
    smoke_passed: bool | None = None,
) -> HyperFramesVersionDecision:
    installed = parse_version_tuple(installed_version)
    supported_min = parse_version_tuple(window.supported_min)
    supported_max = parse_version_tuple(window.supported_max_tested)
    hard_block_below = parse_version_tuple(window.hard_block_below)
    downgrade_target = window.latest_supported_for_downgrade or window.supported_max_tested

    if installed < hard_block_below:
        return HyperFramesVersionDecision(
            installed_version=installed_version,
            status="hard_too_old",
            allow_discovery=True,
            allow_handoff=False,
            recommend_upgrade=True,
            block_reason="hyperframes_too_old",
            notes=[
                f"installed HyperFrames {installed_version} is below hard_block_below {window.hard_block_below}",
            ],
        )

    if installed < supported_min:
        return HyperFramesVersionDecision(
            installed_version=installed_version,
            status="too_old",
            allow_discovery=True,
            allow_handoff=False,
            recommend_upgrade=True,
            warning_level="warning",
            notes=[
                f"installed HyperFrames {installed_version} is below supported_min {window.supported_min}",
            ],
        )

    if is_prerelease(installed_version):
        allow_handoff = smoke_passed is True
        return HyperFramesVersionDecision(
            installed_version=installed_version,
            status="prerelease",
            allow_discovery=True,
            allow_handoff=allow_handoff,
            guarded_mode=True,
            requires_smoke=smoke_passed is not True,
            recommend_downgrade_to=None if allow_handoff else downgrade_target,
            warning_level="warning",
            notes=[
                f"installed HyperFrames {installed_version} is a prerelease; require capability probes and blank smoke",
            ],
        )

    if supported_min <= installed <= supported_max:
        return HyperFramesVersionDecision(
            installed_version=installed_version,
            status="supported",
            allow_discovery=True,
            allow_handoff=True,
            notes=[
                f"installed HyperFrames {installed_version} is within tested support window",
            ],
        )

    if same_soft_band(installed_version, window.soft_max):
        allow_handoff = smoke_passed is True
        return HyperFramesVersionDecision(
            installed_version=installed_version,
            status="newer_same_band",
            allow_discovery=True,
            allow_handoff=allow_handoff,
            guarded_mode=True,
            requires_smoke=smoke_passed is not True,
            warning_level="warning",
            notes=[
                f"installed HyperFrames {installed_version} is newer than tested max {window.supported_max_tested} but inside soft band {window.soft_max}",
                "run capability probes and blank smoke before handoff",
            ],
        )

    if smoke_passed is False:
        return HyperFramesVersionDecision(
            installed_version=installed_version,
            status="unknown_newer",
            allow_discovery=True,
            allow_handoff=False,
            discovery_only=False,
            guarded_mode=False,
            requires_smoke=False,
            recommend_downgrade_to=downgrade_target,
            warning_level="strong_warning",
            block_reason="compatibility_smoke_failed",
            notes=[
                f"installed HyperFrames {installed_version} is outside supported band {window.soft_max}",
                "isolated blank smoke failed; block handoff",
            ],
        )

    if smoke_passed is True:
        return HyperFramesVersionDecision(
            installed_version=installed_version,
            status="unknown_newer",
            allow_discovery=True,
            allow_handoff=True,
            discovery_only=False,
            guarded_mode=True,
            requires_smoke=False,
            warning_level="strong_warning",
            notes=[
                f"installed HyperFrames {installed_version} is outside supported band {window.soft_max}",
                "isolated blank smoke passed; allow guarded mode only",
            ],
        )

    return HyperFramesVersionDecision(
        installed_version=installed_version,
        status="unknown_newer",
        allow_discovery=True,
        allow_handoff=False,
        discovery_only=True,
        guarded_mode=True,
        requires_smoke=True,
        warning_level="strong_warning",
        notes=[
            f"installed HyperFrames {installed_version} is outside supported band {window.soft_max}",
            "run discovery-only probes and isolated blank smoke before handoff",
        ],
    )
