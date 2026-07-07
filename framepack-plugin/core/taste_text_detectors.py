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


def detect_text_taste_issues(frame_md: str, expanded_prompt: str, taste_context: TasteContext) -> list[TextTasteIssue]:
    issues: list[TextTasteIssue] = []
    opening_issue = _detect_opening_visual_absence(expanded_prompt, taste_context)
    if opening_issue:
        issues.append(opening_issue)
    issues.extend(_detect_copy_punctuation_slop(frame_md, expanded_prompt))
    return issues
