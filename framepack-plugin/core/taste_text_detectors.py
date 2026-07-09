"""Prompt-level taste detectors for Framepack Director artifacts."""

from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Any

from .taste_read import TasteContext
from .taste_rules import acceptance_for


EXPANDED_PROMPT_PATH = ".hyperframes/expanded-prompt.md"


@dataclass
class TextTasteIssue:
    code: str
    severity: str
    message: str
    suggestion: str | None = None
    path: str | None = None
    scene: str | None = None
    details: dict[str, Any] | None = None


_VISIBLE_COPY_RE = re.compile(r"^\s*(?:text|headline|copy|cta|caption|title)\s*:\s*(?P<copy>.+)$", re.I | re.M)
_VISUAL_SUBJECT_RE = re.compile(
    r"\b(product|screenshot|dashboard|ui|interface|device|app|logo|image|photo|footage|video|object|mascot|texture|visual|mockup|brand mark|generated image)\b",
    re.I,
)
_CONCRETE_PRODUCT_RE = re.compile(
    r"\b(product|screenshot|dashboard|ui|interface|device|app|logo|brand mark|footage|real image|product image|component preview|screen recording)\b",
    re.I,
)
_ABSTRACT_SURFACE_RE = re.compile(r"\b(abstract|gradient|particles?|glow(?:ing)?|ribbons?|aura|dots?|waves?|background)\b", re.I)
_TEXT_ONLY_RE = re.compile(r"\b(text|headline|copy|title|typography|type)\s*:", re.I)
_KINETIC_TYPE_RE = re.compile(r"\b(kinetic typography|kinetic type|typography attack|type attack|letterform|speaker lineup|launch date)\b", re.I)


def _first_scene(expanded_prompt: str) -> str:
    if not expanded_prompt.strip():
        return ""
    scene_match = re.search(r"^\s*#{1,4}\s*Scene\s*1\b[^\n]*\n", expanded_prompt, re.I | re.M)
    if not scene_match:
        return "\n".join(expanded_prompt.strip().splitlines()[:8])
    start = scene_match.start()
    next_match = re.search(r"^\s*#{1,4}\s*Scene\s*[2-9]\b", expanded_prompt[scene_match.end() :], re.I | re.M)
    if next_match:
        return expanded_prompt[start : scene_match.end() + next_match.start()]
    return expanded_prompt[start:]


def _detect_opening_visual_absence(expanded_prompt: str, taste_context: TasteContext) -> TextTasteIssue | None:
    scene = _first_scene(expanded_prompt)
    if not scene.strip() or _VISUAL_SUBJECT_RE.search(scene):
        return None
    if not _TEXT_ONLY_RE.search(scene):
        return None

    severity = "risk"
    details: dict[str, Any] = {"register": taste_context.register}
    if taste_context.register == "event_teaser" and _KINETIC_TYPE_RE.search(scene):
        severity = "suggestion"
        details["downgraded_reason"] = "event_teaser kinetic typography can intentionally carry the opening beat"

    return TextTasteIssue(
        code="opening_visual_absence",
        severity=severity,
        message="Opening beat appears to rely on text without a concrete visual subject; the film may start like a slide, not a commercial.",
        suggestion=acceptance_for("opening_visual_absence"),
        path=EXPANDED_PROMPT_PATH,
        scene="Scene 1",
        details=details,
    )


def _detect_copy_punctuation_slop(frame_md: str, expanded_prompt: str) -> list[TextTasteIssue]:
    sources = (("frame.md", frame_md), (EXPANDED_PROMPT_PATH, expanded_prompt))
    issues: list[TextTasteIssue] = []
    for path, text in sources:
        for match in _VISIBLE_COPY_RE.finditer(text):
            visible_copy = match.group("copy")
            if "—" not in visible_copy and "–" not in visible_copy:
                continue
            issues.append(
                TextTasteIssue(
                    code="copy_punctuation_slop",
                    severity="suggestion",
                    message="Visible copy uses em/en dash punctuation, a high-frequency generated-copy tell.",
                    suggestion=acceptance_for("copy_punctuation_slop"),
                    path=path,
                    details={"copy": visible_copy[:160]},
                )
            )
    return issues


def _scene_blocks(expanded_prompt: str) -> list[str]:
    matches = list(re.finditer(r"^\s*#{1,4}\s*Scene\s*\d+\b[^\n]*", expanded_prompt, re.I | re.M))
    if not matches:
        stripped = expanded_prompt.strip()
        return [stripped] if stripped else []
    blocks: list[str] = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(expanded_prompt)
        blocks.append(expanded_prompt[match.start():end].strip())
    return [block for block in blocks if block]


def _layout_signature(scene: str) -> str | None:
    text = scene.lower()
    if re.search(r"\b(centered|centre|center)\b", text) and re.search(r"\b(headline|text|copy|title|cta)\b", text) and re.search(r"\b(background|gradient|particles?|waves?|glow)\b", text):
        return "centered_text_over_background"
    if re.search(r"\b(left|right)\s+(?:rail|column|panel)\b", text) and re.search(r"\b(headline|copy|text)\b", text):
        return "split_text_panel"
    if re.search(r"\b(card|cards)\b", text) and re.search(r"\bgrid|stack|carousel\b", text):
        return "card_grid_stack"
    return None


def _detect_scene_layout_repetition(expanded_prompt: str) -> TextTasteIssue | None:
    signatures = [sig for scene in _scene_blocks(expanded_prompt) if (sig := _layout_signature(scene))]
    if len(signatures) < 3:
        return None
    repeated = max(set(signatures), key=signatures.count)
    count = signatures.count(repeated)
    if count < 3:
        return None
    return TextTasteIssue(
        code="scene_layout_repetition",
        severity="suggestion",
        message="Multiple scenes repeat the same layout grammar, making the film feel templated.",
        suggestion=acceptance_for("scene_layout_repetition"),
        path=EXPANDED_PROMPT_PATH,
        details={"repeated_layout": repeated, "count": count, "scene_count": len(signatures)},
    )


def _is_product_led_context(taste_context: TasteContext, expanded_prompt: str) -> bool:
    text = f"{taste_context.register}\n{taste_context.visual_family}\n{expanded_prompt}"
    if taste_context.register in {"brand_film", "event_teaser"}:
        return True
    return bool(re.search(r"\b(product_launch|website_to_video|product-led|product led|product\s+launch|product\s+demo|ui\s+demo|dashboard)\b", text, re.I))


def _is_negated_product_line(line: str) -> bool:
    if not _CONCRETE_PRODUCT_RE.search(line):
        return False
    product_terms = r"product|product shot|screenshot|dashboard|ui|interface|device|app|logo|screen|footage"
    negation_terms = r"no|none|without|missing|absent|lacks?|never|not|not shown|is missing|are missing"
    return bool(
        re.search(rf"\b(?:{negation_terms})\b[^\n.]*\b(?:{product_terms})\b", line, re.I)
        or re.search(rf"\b(?:{product_terms})\b[^\n.]*\b(?:{negation_terms})\b", line, re.I)
        or re.search(rf"\b(?:{product_terms})\s*:\s*(?:none|n/?a|null|no|absent|missing)\b", line, re.I)
    )


def _has_concrete_product_scene(scene: str) -> bool:
    for line in scene.splitlines():
        if _CONCRETE_PRODUCT_RE.search(line) and not _is_negated_product_line(line):
            return True
    return False


def _detect_product_presence_weak(expanded_prompt: str, taste_context: TasteContext) -> TextTasteIssue | None:
    if not _is_product_led_context(taste_context, expanded_prompt):
        return None
    scenes = _scene_blocks(expanded_prompt)
    if len(scenes) < 2:
        return None
    product_scenes = [scene for scene in scenes if _has_concrete_product_scene(scene)]
    abstract_scenes = [scene for scene in scenes if _ABSTRACT_SURFACE_RE.search(scene)]
    if len(product_scenes) >= 1:
        return None
    if len(abstract_scenes) < 2:
        return None
    return TextTasteIssue(
        code="product_presence_weak",
        severity="risk",
        message="Product-led direction is declared, but scene beats do not give the product/UI/logo enough concrete visual presence.",
        suggestion=acceptance_for("product_presence_weak"),
        path=EXPANDED_PROMPT_PATH,
        details={"product_scene_count": len(product_scenes), "abstract_scene_count": len(abstract_scenes), "scene_count": len(scenes)},
    )


def _detect_copy_overcrowding(expanded_prompt: str, taste_context: TasteContext) -> TextTasteIssue | None:
    scenes = _scene_blocks(expanded_prompt)
    if len(scenes) < 3:
        return None
    copy_lines = list(_VISIBLE_COPY_RE.finditer(expanded_prompt))
    if len(copy_lines) < 8:
        return None
    product_scene_count = sum(1 for scene in scenes if _has_concrete_product_scene(scene))
    if product_scene_count >= 2:
        return None
    severity = "risk" if taste_context.register in {"product_launch", "website_to_video", "product_ui"} else "suggestion"
    return TextTasteIssue(
        code="copy_overcrowding",
        severity=severity,
        message="Visible copy is carrying too many beats across scenes; the film risks becoming narrated slides instead of visual storytelling.",
        suggestion=acceptance_for("copy_overcrowding"),
        path=EXPANDED_PROMPT_PATH,
        details={"copy_line_count": len(copy_lines), "product_scene_count": product_scene_count, "scene_count": len(scenes)},
    )


_FAKE_PRECISION_RE = re.compile(
    r"\b(\d+[.,]\d{2,}\s*%|\d+[.,]\d{1,}\s*[xX]\b|\d{2,}[kKmM]\b|\d+\.\d+\s*(?:lb|kg|ms|fps)\b)"
)
_PRECISION_SOURCE_RE = re.compile(r"\b(source|real data|mock|sample|provided by user|benchmark|measured|verified|actual)\b", re.I)
_VERSION_LABEL_RE = re.compile(r"(?:^|\s)(v\d+[.\d]*|version\s*\d+[.\d]*)\s*$", re.I)
_SCROLL_CUE_RE = re.compile(r"\b(scroll (?:down|up|to (?:explore|see|continue)|for more))\b", re.I)
_SECTION_NUMBER_RE = re.compile(r"^\s*\d{1,2}\s*[/–—]\s*\d{1,2}\s*$")
_WEATHER_TIME_RE = re.compile(r"\b(\d{1,2}[:]\d{2}\s*(?:am|pm)?|\d{1,3}°[fc]\b|sunrise|sunset|new york|london|tokyo|san francisco)\b", re.I)


def _detect_fake_precision(frame_md: str, expanded_prompt: str) -> list[TextTasteIssue]:
    sources = (("frame.md", frame_md), (EXPANDED_PROMPT_PATH, expanded_prompt))
    issues: list[TextTasteIssue] = []
    for path, text in sources:
        for match in _FAKE_PRECISION_RE.finditer(text):
            span_start = max(0, match.start() - 120)
            span_end = min(len(text), match.end() + 120)
            context = text[span_start:span_end]
            if _PRECISION_SOURCE_RE.search(context):
                continue
            issues.append(
                TextTasteIssue(
                    code="fake_precision",
                    severity="suggestion",
                    message="Copy uses a fake-precise metric without a source, which reads like AI-invented proof.",
                    suggestion=acceptance_for("fake_precision"),
                    path=path,
                    details={"metric": match.group(1)},
                )
            )
    return issues


def _detect_ui_debris_copy(frame_md: str, expanded_prompt: str) -> list[TextTasteIssue]:
    sources = (("frame.md", frame_md), (EXPANDED_PROMPT_PATH, expanded_prompt))
    issues: list[TextTasteIssue] = []
    for path, text in sources:
        for match in _VISIBLE_COPY_RE.finditer(text):
            copy = match.group("copy").strip()
            if _VERSION_LABEL_RE.search(copy):
                issues.append(_make_ui_debris_issue(path, copy, "version_label"))
            elif _SCROLL_CUE_RE.search(copy):
                issues.append(_make_ui_debris_issue(path, copy, "scroll_cue"))
            elif _SECTION_NUMBER_RE.match(copy):
                issues.append(_make_ui_debris_issue(path, copy, "section_number"))
            elif _WEATHER_TIME_RE.search(copy):
                issues.append(_make_ui_debris_issue(path, copy, "weather_time_strip"))
    return issues


def _make_ui_debris_issue(path: str, copy: str, signal: str) -> TextTasteIssue:
    return TextTasteIssue(
        code="ui_debris_copy",
        severity="suggestion",
        message=f"Decorative UI debris in visible copy ({signal}), which clutters the screen without product value.",
        suggestion=acceptance_for("ui_debris_copy"),
        path=path,
        details={"signal": signal, "copy": copy[:160]},
    )


def detect_text_taste_issues(frame_md: str, expanded_prompt: str, taste_context: TasteContext) -> list[TextTasteIssue]:
    issues: list[TextTasteIssue] = []
    opening_issue = _detect_opening_visual_absence(expanded_prompt, taste_context)
    if opening_issue:
        issues.append(opening_issue)
    layout_issue = _detect_scene_layout_repetition(expanded_prompt)
    if layout_issue:
        issues.append(layout_issue)
    product_issue = _detect_product_presence_weak(expanded_prompt, taste_context)
    if product_issue:
        issues.append(product_issue)
    copy_issue = _detect_copy_overcrowding(expanded_prompt, taste_context)
    if copy_issue:
        issues.append(copy_issue)
    issues.extend(_detect_copy_punctuation_slop(frame_md, expanded_prompt))
    issues.extend(_detect_fake_precision(frame_md, expanded_prompt))
    issues.extend(_detect_ui_debris_copy(frame_md, expanded_prompt))
    return issues
