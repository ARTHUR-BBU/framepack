"""Framepack → HyperFrames handoff manifest helpers."""

from __future__ import annotations

import json
from typing import Iterable

from core.intent_router import IntentRoute


DEFAULT_QA_REDLINES = [
    "no text-only reuse",
    "no stale source-domain props",
    "no remote random image providers",
    "must preserve user-confirmed metaphor",
]

DEFAULT_USER_DECISION_POINTS = [
    "after Director Story Bible",
    "after Studio preview",
    "before render",
]

DEFAULT_DIRECTOR_ACCEPTANCE = {
    "hero_frames_required": True,
    "minimum_hero_frames": 3,
    "must_read_required": True,
    "reject_if_required": True,
    "default_reject_if": [
        "primary subject face or logo is unintentionally occluded",
        "more than two identity layers compete in a reveal frame",
        "recurring motif is present but unreadable at proof timestamps",
        "contrast/overflow/media warnings are waived without rationale",
    ],
}


def _list(value: Iterable[str] | None) -> list[str]:
    return [str(item) for item in (value or []) if str(item).strip()]


def build_handoff_manifest(
    route: IntentRoute,
    *,
    tone: str | None = None,
    metaphor: str | None = None,
    rhythm: str | None = None,
    forbidden: Iterable[str] | None = None,
    catalog_candidates: Iterable[str] | None = None,
    framepack_arsenal_candidates: Iterable[str] | None = None,
) -> dict:
    """Build a small machine-readable handoff contract.

    The manifest constrains HyperFrames without replacing its official workflows.
    It is advisory, asset-aware, and always leaves render approval to the user.
    """

    return {
        "workflow": route.workflow,
        "routing": route.to_dict(),
        "render_policy": "Framepack advises; user decides",
        "source_inputs": {
            "route_reason": route.reason,
            "assets": route.likely_assets,
        },
        "asset_intake": {
            "likely_assets": route.likely_assets,
            "user_choices": route.user_choices,
            "missing_assets_are_advisory": True,
            "handoff_risks": route.handoff_risks,
        },
        "creative_constraints": {
            "tone": tone,
            "metaphor": metaphor,
            "rhythm": rhythm,
            "forbidden": _list(forbidden),
        },
        "hyperframes_pipeline_hints": {
            "studio_preview_required": True,
            "framepack_pre_render_audit": True,
            "capture": route.workflow in {"product-launch-video", "website-to-video"},
            "voiceover": "optional",
        },
        "catalog_candidates": _list(catalog_candidates),
        "framepack_arsenal_candidates": _list(framepack_arsenal_candidates),
        "director_acceptance": {
            **DEFAULT_DIRECTOR_ACCEPTANCE,
            "default_reject_if": list(DEFAULT_DIRECTOR_ACCEPTANCE["default_reject_if"]),
        },
        "qa_redlines": list(DEFAULT_QA_REDLINES),
        "user_decision_points": list(DEFAULT_USER_DECISION_POINTS),
    }


def render_handoff_manifest_markdown(manifest: dict) -> str:
    """Render the handoff contract as a markdown section with JSON payload."""

    payload = json.dumps(manifest, ensure_ascii=False, indent=2)
    return (
        "## Framepack Handoff Manifest\n\n"
        "This is the director-to-studio handoff. HyperFrames executes the workflow; "
        "Framepack supplies creative constraints and advisory QA.\n\n"
        "```json\n"
        f"{payload}\n"
        "```\n"
    )
