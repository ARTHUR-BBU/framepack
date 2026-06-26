"""Framepack vNext intent router.

Small deterministic router that decides which HyperFrames 0.7 workflow (or
Framepack-native path) should receive a fuzzy video request. This is deliberately
stdlib-only and advisory: it helps the Agent ask for the right assets and prepare
a handoff, but it never blocks the user.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
import re


USER_ASSET_CHOICES = [
    "provide_assets",
    "generate_programmatic_visuals",
    "continue_without_assets",
]


@dataclass(frozen=True)
class IntentRoute:
    workflow: str
    confidence: str
    reason: str
    framepack_role: str
    hyperframes_role: str
    likely_assets: list[str]
    handoff_risks: list[str]
    user_choices: list[str]

    def to_dict(self) -> dict:
        return asdict(self)


def _has_url(text: str) -> bool:
    return bool(re.search(r"https?://|\bwww\.", text, re.I))


def _contains_any(text: str, keywords: tuple[str, ...]) -> bool:
    lowered = text.lower()
    return any(keyword.lower() in lowered for keyword in keywords)


def _route(
    *,
    workflow: str,
    confidence: str,
    reason: str,
    framepack_role: str,
    hyperframes_role: str,
    likely_assets: list[str],
    handoff_risks: list[str],
) -> IntentRoute:
    return IntentRoute(
        workflow=workflow,
        confidence=confidence,
        reason=reason,
        framepack_role=framepack_role,
        hyperframes_role=hyperframes_role,
        likely_assets=likely_assets,
        handoff_risks=handoff_risks,
        user_choices=list(USER_ASSET_CHOICES),
    )


def route_intent(user_text: str | None) -> IntentRoute:
    """Classify a fuzzy video request into a workflow and asset needs."""

    text = (user_text or "").strip()
    lowered = text.lower()

    if _contains_any(lowered, ("reference video", "参考视频", "动态网页", "提炼", "extract", "template extraction", "motion dna")):
        return _route(
            workflow="framepack-reference-extraction",
            confidence="high",
            reason="request asks to mine a reference into a reusable pattern/template",
            framepack_role="reference mining, motion DNA, dynamic arsenal registration",
            hyperframes_role="build and validate extracted template when ready",
            likely_assets=["reference video or URL", "target brand assets", "usage rights notes"],
            handoff_risks=["reference may be visually strong but legally or technically unsuitable"],
        )

    if _contains_any(
        lowered,
        (
            "noema",
            "template reuse",
            "use template",
            "复用模板",
            "模板",
            "模版",
            "视频模板",
            "视频模版",
            "参考模板",
            "参考模版",
            "模板参考",
            "模版参考",
            "内置模板",
            "内置模版",
            "模板起步",
            "模版起步",
            "找个模板",
            "找个模版",
        ),
    ):
        return _route(
            workflow="framepack-template-reuse",
            confidence="high",
            reason="request asks for a template/menu/reuse path instead of only historical case references",
            framepack_role="template menu first, template recommendation, template selection, asset intake, Director Story Bible, taste QA",
            hyperframes_role="render validated template composition after edits",
            likely_assets=["template variables", "brand assets", "replacement props", "CTA copy"],
            handoff_risks=["searching only historical case/mp4 references can skip the v0.16 Template Arsenal menu"],
        )

    if re.search(r"github\.com/.+/(pull|commit)/|\bpr\s*#?\d+\b|pull request", lowered):
        return _route(
            workflow="pr-to-video",
            confidence="high",
            reason="request references a GitHub PR or code change",
            framepack_role="impact framing, visual metaphor, taste QA",
            hyperframes_role="read PR, build code-change explainer, validate render",
            likely_assets=["PR link", "release context", "repo/product branding"],
            handoff_risks=["without impact framing, the video may become a raw diff tour"],
        )

    if _contains_any(lowered, ("字幕", "subtitles", "captions")) and _contains_any(lowered, ("mp4", "talking-head", "talking head", "访谈", "原视频", "footage")):
        return _route(
            workflow="embedded-captions",
            confidence="high",
            reason="request asks to add subtitles/captions to existing footage",
            framepack_role="caption style direction and pre-render taste QA",
            hyperframes_role="transcribe, caption, preview in Studio, render",
            likely_assets=["source video", "transcript", "caption style reference", "brand fonts"],
            handoff_risks=["bad caption style can hide the speaker or feel generic"],
        )

    if _contains_any(lowered, ("graphic overlays", "overlays", "lower-thirds", "lower third", "数据卡", "包装", "访谈")) and _contains_any(lowered, ("video", "mp4", "talking", "访谈", "采访")):
        return _route(
            workflow="graphic-overlays",
            confidence="high",
            reason="request asks to package existing footage with designed graphics",
            framepack_role="overlay concept, asset intake, taste QA",
            hyperframes_role="transcribe, build overlay cards, preview, render",
            likely_assets=["source video", "overlay copy", "brand assets", "data/proof points"],
            handoff_risks=["overlays can become decorative stickers unless tied to the message"],
        )

    if _contains_any(lowered, ("logo sting", "lower-third", "lower third", "kinetic", "动效", "motion graphic", "透明背景", "stat", "数字")) and _contains_any(lowered, ("8 秒", "8s", "10 秒", "10s", "short", "短")):
        return _route(
            workflow="motion-graphics",
            confidence="high",
            reason="request is short, motion-first, and likely unnarrated",
            framepack_role="motion taste, catalog/arsenal selection, pre-render QA",
            hyperframes_role="build short composition or transparent overlay",
            likely_assets=["logo", "brand colors", "stat/copy", "animation reference"],
            handoff_risks=["without a precise motion idea, short pieces can feel like a stock preset"],
        )

    if _contains_any(lowered, ("product launch", "产品发布", "产品广告", "promo", "推广", "saas", "startup", "新品")):
        return _route(
            workflow="product-launch-video",
            confidence="high" if _has_url(text) or _contains_any(lowered, ("product", "产品", "saas")) else "medium",
            reason="request markets or launches a product",
            framepack_role="creative expansion, asset intake, Director Story Bible, taste QA",
            hyperframes_role="capture/build/validate/studio/render via product-launch workflow",
            likely_assets=["logo", "product screenshots", "brand colors", "BGM", "CTA copy"],
            handoff_risks=["without product screenshots or proof assets, visuals may become generic SaaS abstractions"],
        )

    if _has_url(text) and _contains_any(lowered, ("website", "homepage", "site", "portfolio", "网页", "网站", "tour")):
        return _route(
            workflow="website-to-video",
            confidence="high",
            reason="request turns a general website into a video",
            framepack_role="creative direction, asset intake, taste QA",
            hyperframes_role="capture website visuals, build tour/showcase, validate/render",
            likely_assets=["website screenshots", "logo", "brand notes", "preferred sections", "BGM"],
            handoff_risks=["raw website capture can become a scroll recording unless a story arc is added"],
        )

    if _contains_any(lowered, ("解释", "科普", "explainer", "explain", "article", "notes", "topic", "原理")):
        return _route(
            workflow="faceless-explainer",
            confidence="high",
            reason="request explains a topic without requiring website capture",
            framepack_role="metaphor, story arc, asset intake, taste QA",
            hyperframes_role="script/storyboard/TTS/build/validate via explainer workflow",
            likely_assets=["topic notes", "reference examples", "BGM", "voice preference"],
            handoff_risks=["without metaphor or concrete examples, abstract visuals can become generic 抽象图形"],
        )

    return _route(
        workflow="general-video",
        confidence="low" if len(text) < 40 else "medium",
        reason="request does not clearly match a specialized workflow",
        framepack_role="clarify intent, ask for assets, produce Director Story Bible",
        hyperframes_role="general composition workflow after handoff",
        likely_assets=["creative brief", "brand assets", "reference video", "BGM", "CTA copy"],
        handoff_risks=["unclear input may produce a technically valid but shallow video"],
    )
