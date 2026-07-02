"""Built-in HyperFrames capability radar for Framepack routing.

This is a small, versioned map of HyperFrames-owned capabilities that
Framepack should consider before asking an Agent to rebuild assets/effects by
hand. It is advisory and intentionally static: production stays pinned while
reconnaissance can update this map after compatibility smoke tests.
"""

from __future__ import annotations

import json
from typing import Any

SUPPORTED_WINDOW = "0.7.3-0.7.21"
RECON_TARGET = "0.7.24"
SKILLS_PACK_INSTALL = "npx skills add heygen-com/hyperframes"
OBSERVED_0_7_24_SKILLS = [
    "embedded-captions",
    "faceless-explainer",
    "general-video",
    "hyperframes",
    "hyperframes-animation",
    "hyperframes-cli",
    "hyperframes-core",
    "hyperframes-creative",
    "hyperframes-keyframes",
    "hyperframes-media",
    "hyperframes-registry",
    "media-use",
    "motion-graphics",
    "music-to-video",
    "pr-to-video",
    "product-launch-video",
    "remotion-to-hyperframes",
    "slideshow",
    "talking-head-recut",
    "website-to-video",
]

_CAPABILITIES: list[dict[str, Any]] = [
    {
        "id": "website-to-video",
        "kind": "workflow",
        "triggers": ["website", "url", "homepage", "landing page", "官网", "网页", "活动页"],
        "hyperframes_owner": "website-to-HyperFrames skill / capture workflow",
        "framepack_role": "decide when source capture is the right warm start; pass URL and brand/story constraints",
        "commands": ["npx hyperframes capture <url> -o <project>/capture"],
    },
    {
        "id": "capture",
        "kind": "cli",
        "triggers": ["extract website assets", "screenshots", "palette", "fonts", "visible text", "capture"],
        "hyperframes_owner": "HyperFrames CLI capture",
        "framepack_role": "request capture evidence instead of manually asking for every web asset first",
        "commands": ["npx hyperframes capture https://example.com -o capture"],
    },
    {
        "id": "product-launch-video",
        "kind": "workflow",
        "triggers": ["launch", "product", "发布", "产品片"],
        "hyperframes_owner": "official product-launch-video workflow",
        "framepack_role": "shape product story, proof points, and acceptance redlines",
    },
    {
        "id": "embedded-captions",
        "kind": "workflow",
        "triggers": ["captions", "subtitles", "transcript", "字幕", "旁白"],
        "hyperframes_owner": "embedded captions / transcribe workflow",
        "framepack_role": "decide script lane and caption style constraints",
        "commands": ["npx hyperframes transcribe", "npx hyperframes tts"],
    },
    {
        "id": "motion-graphics",
        "kind": "workflow",
        "triggers": ["motion graphics", "kinetic", "logo reveal", "logo outro", "动效", "片头"],
        "hyperframes_owner": "official motion-graphics workflow and registry blocks",
        "framepack_role": "select visual metaphor and proof frames; do not handwrite catalog-grade blocks first",
    },
    {
        "id": "catalog",
        "kind": "reuse_surface",
        "triggers": ["catalog", "component", "block", "registry", "sponsor wall", "logo wall", "parallax grid"],
        "hyperframes_owner": "HyperFrames catalog / registry",
        "framepack_role": "record evaluated catalog candidates and why used/waived",
        "commands": ["npx hyperframes catalog", "npx hyperframes add <component>"],
    },
    {
        "id": "official-skills-pack",
        "kind": "reuse_surface",
        "triggers": ["skills pack", "sponsor wall", "parallax", "logo grid", "official animation"],
        "hyperframes_owner": "HyperFrames official skills pack",
        "framepack_role": "prefer official animation skills before local arsenal or handwrite",
        "commands": [SKILLS_PACK_INSTALL],
    },
    {
        "id": "faceless-explainer",
        "kind": "workflow",
        "triggers": ["explainer", "faceless", "讲解", "解释视频"],
        "hyperframes_owner": "official faceless-explainer workflow",
        "framepack_role": "prepare narrative spine, rhythm, and source truth constraints",
    },
    {
        "id": "general-video",
        "kind": "workflow",
        "triggers": ["general video", "custom composition", "brand reel", "montage", "通用视频"],
        "hyperframes_owner": "official general-video workflow",
        "framepack_role": "use when no narrower official workflow fits; still provide director bible and QA redlines",
    },
    {
        "id": "music-to-video",
        "kind": "workflow",
        "triggers": ["music video", "BGM-driven", "audio reactive", "音乐视频", "卡点"],
        "hyperframes_owner": "official music-to-video workflow",
        "framepack_role": "decide rhythm/story and require cue evidence; let HyperFrames handle media workflow",
    },
    {
        "id": "pr-to-video",
        "kind": "workflow",
        "triggers": ["pull request", "PR", "changelog", "release video"],
        "hyperframes_owner": "official pr-to-video workflow",
        "framepack_role": "select audience and story angle from code/change facts",
    },
    {
        "id": "talking-head-recut",
        "kind": "workflow",
        "triggers": ["talking head", "interview", "podcast", "lower thirds", "overlay", "访谈", "口播"],
        "hyperframes_owner": "official talking-head-recut workflow",
        "framepack_role": "choose packaging angle and graphic-overlay taste; do not alter source footage semantics",
    },
    {
        "id": "slideshow",
        "kind": "workflow",
        "triggers": ["deck", "slides", "presentation", "slideshow", "PPT", "演示"],
        "hyperframes_owner": "official slideshow workflow",
        "framepack_role": "shape sequence and acceptance criteria; leave deck rendering mechanics to HyperFrames",
    },
    {
        "id": "lambda-render",
        "kind": "render_surface",
        "triggers": ["4k", "long render", "cloud", "lambda", "HDR"],
        "hyperframes_owner": "HyperFrames Lambda / render pipeline",
        "framepack_role": "advise render path and taste audit; never replace renderer",
        "commands": ["npx hyperframes lambda render ./project --wait"],
    },
]


def capability_map() -> dict[str, Any]:
    """Return the built-in HyperFrames capability map."""

    return {
        "schema_version": "1.0.0",
        "kind": "framepack_hyperframes_capability_map",
        "hyperframes_supported_window": SUPPORTED_WINDOW,
        "hyperframes_recon_target": RECON_TARGET,
        "principle": "Framepack decides; HyperFrames executes; do not rebuild official capabilities first.",
        "skills_pack": {"install": SKILLS_PACK_INSTALL, "observed_0_7_24_skills": list(OBSERVED_0_7_24_SKILLS)},
        "capabilities": list(_CAPABILITIES),
    }


def render_capability_markdown(data: dict[str, Any] | None = None) -> str:
    """Render a compact markdown capability map."""

    data = data or capability_map()
    lines = [
        "# HyperFrames Capability Radar",
        "",
        f"- supported_window: {data.get('hyperframes_supported_window')}",
        f"- reconnaissance_target: {data.get('hyperframes_recon_target')}",
        f"- skills_pack: `{data.get('skills_pack', {}).get('install', '')}`",
        "- boundary: Framepack decides; HyperFrames executes.",
        "",
        "| id | kind | HyperFrames owner | Framepack role |",
        "|---|---|---|---|",
    ]
    for item in data.get("capabilities", []):
        lines.append(
            f"| {item.get('id')} | {item.get('kind')} | {item.get('hyperframes_owner', '')} | {item.get('framepack_role', '')} |"
        )
    lines.append("")
    return "\n".join(lines)


def to_json(data: dict[str, Any] | None = None) -> str:
    return json.dumps(data or capability_map(), ensure_ascii=False, indent=2) + "\n"
