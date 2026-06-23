import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.handoff_manifest import build_handoff_manifest, render_handoff_manifest_markdown
from core.intent_router import route_intent


def test_builds_manifest_from_intent_route():
    route = route_intent("Make a product launch video for https://example.com")
    manifest = build_handoff_manifest(
        route,
        tone="brutalist premium",
        metaphor="factory as organism",
        rhythm="hook-proof-build-payoff",
        catalog_candidates=["caption-kinetic-slam", "code-diff"],
    )

    assert manifest["workflow"] == "product-launch-video"
    assert manifest["creative_constraints"]["tone"] == "brutalist premium"
    assert manifest["creative_constraints"]["metaphor"] == "factory as organism"
    assert manifest["hyperframes_pipeline_hints"]["studio_preview_required"] is True
    assert manifest["hyperframes_pipeline_hints"]["framepack_pre_render_audit"] is True
    assert "no text-only reuse" in manifest["qa_redlines"]
    assert "caption-kinetic-slam" in manifest["catalog_candidates"]


def test_manifest_carries_user_decision_points():
    route = route_intent("做一个解释 DNS 的科普视频")
    manifest = build_handoff_manifest(route)

    assert manifest["user_decision_points"] == [
        "after Director Story Bible",
        "after Studio preview",
        "before render",
    ]
    assert manifest["render_policy"] == "Framepack advises; user decides"


def test_manifest_markdown_contains_json_payload():
    route = route_intent("product promo for my SaaS")
    manifest = build_handoff_manifest(route, forbidden=["generic SaaS gradients"])
    md = render_handoff_manifest_markdown(manifest)

    assert "## Framepack Handoff Manifest" in md
    assert "```json" in md
    payload = md.split("```json", 1)[1].split("```", 1)[0]
    parsed = json.loads(payload)
    assert parsed["workflow"] == "product-launch-video"
    assert "generic SaaS gradients" in parsed["creative_constraints"]["forbidden"]


def test_manifest_defaults_preserve_asset_intake_and_user_choices():
    route = route_intent("帮我做个有感觉的视频")
    manifest = build_handoff_manifest(route)

    assert manifest["asset_intake"]["likely_assets"] == route.likely_assets
    assert manifest["asset_intake"]["user_choices"] == route.user_choices
    assert manifest["asset_intake"]["missing_assets_are_advisory"] is True
