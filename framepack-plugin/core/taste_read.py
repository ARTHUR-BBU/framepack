"""Taste-read compiler for Framepack Director artifacts.

Taste read is the short, explicit answer to "what kind of film are we making?".
It adapts Taste Skill's brief inference and Impeccable's register split into
Framepack's video-native vocabulary.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import re
from typing import Any


REGISTERS = {
    "brand_film",
    "product_launch",
    "website_to_video",
    "explainer",
    "product_ui",
    "event_teaser",
}

_DIAL_KEYS = ("design_variance", "motion_intensity", "visual_density")
_CONTROL_FROM_DIALS = {
    "design_variance": ("creative_autonomy", False),
    "motion_intensity": ("motion_dynamism", False),
    "visual_density": ("atmosphere_density", False),
}


@dataclass
class TasteContext:
    register: str
    explicit_taste_read: bool
    audience: str | None = None
    visual_family: str | None = None
    anti_references: list[str] = field(default_factory=list)
    dials: dict[str, int] = field(default_factory=dict)
    control_profile: dict[str, float] = field(default_factory=dict)
    issues: list[dict[str, Any]] = field(default_factory=list)


def _section_block(text: str, key: str) -> str:
    lines = text.splitlines()
    for index, line in enumerate(lines):
        match = re.match(rf"^(?P<indent>\s*){re.escape(key)}\s*:\s*(?P<inline>.*)$", line, re.I)
        if not match:
            continue
        inline = match.group("inline").strip()
        if inline:
            return inline

        parent_indent = len(match.group("indent"))
        body: list[str] = []
        for child in lines[index + 1 :]:
            if not child.strip():
                body.append(child)
                continue
            child_indent = len(child) - len(child.lstrip())
            if child_indent <= parent_indent:
                break
            body.append(child)
        return "\n".join(body)
    return ""


def _scalar_from_block(block: str, key: str) -> str | None:
    match = re.search(rf"^\s*{re.escape(key)}\s*:\s*(.+?)\s*$", block, re.I | re.M)
    if not match:
        return None
    return match.group(1).strip().strip('"\'')


def _list_from_block(block: str, key: str) -> list[str]:
    match = re.search(rf"^\s*{re.escape(key)}\s*:\s*(?P<inline>\[[^\n]*\]|[^\n]*)$", block, re.I | re.M)
    if not match:
        return []
    inline = match.group("inline").strip()
    if inline.startswith("[") and inline.endswith("]"):
        return [part.strip().strip('"\'') for part in inline[1:-1].split(",") if part.strip()]

    lines = block.splitlines()
    values: list[str] = []
    collecting = False
    key_indent = 0
    for line in lines:
        if re.match(rf"^\s*{re.escape(key)}\s*:\s*$", line, re.I):
            collecting = True
            key_indent = len(line) - len(line.lstrip())
            continue
        if not collecting:
            continue
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip())
        if indent <= key_indent:
            break
        item = re.sub(r"^\s*-\s*", "", line).strip().strip('"\'')
        if item:
            values.append(item)
    return values


def _parse_int_dial(value: str | None) -> int | None:
    if value is None:
        return None
    try:
        parsed = int(value)
    except ValueError:
        return None
    return parsed if 1 <= parsed <= 10 else None


def _parse_float(value: str | None) -> float | None:
    if value is None:
        return None
    try:
        parsed = float(value)
    except ValueError:
        return None
    return parsed if 0 <= parsed <= 1 else None


def _infer_register(frame_md: str, expanded_prompt: str) -> str:
    text = f"{frame_md}\n{expanded_prompt}".lower()
    if re.search(r"website\s*(?:to\s*)?video|url capture|site trailer|capture/", text):
        return "website_to_video"
    if re.search(r"product\s+launch|launch\s+video|commercial|new\s+(?:app|product|feature)", text):
        return "product_launch"
    if re.search(r"conference|event|speaker|agenda|teaser|save the date|launch date", text):
        return "event_teaser"
    if re.search(r"dashboard|admin|settings|app ui|product ui|interface demo", text):
        return "product_ui"
    if re.search(r"explainer|explain|education|how it works|tutorial", text):
        return "explainer"
    return "brand_film"


def _parse_control_profile(frame_md: str) -> dict[str, float]:
    block = _section_block(frame_md, "control_profile")
    profile: dict[str, float] = {}
    for key in ("creative_autonomy", "restraint_force", "atmosphere_density", "motion_dynamism", "weapon_reliance"):
        value = _parse_float(_scalar_from_block(block, key))
        if value is not None:
            profile[key] = value
    return profile


def _derive_control_profile(existing: dict[str, float], dials: dict[str, int]) -> dict[str, float]:
    profile = dict(existing)
    for dial_key, (control_key, invert) in _CONTROL_FROM_DIALS.items():
        if control_key in profile or dial_key not in dials:
            continue
        value = dials[dial_key] / 10
        profile[control_key] = round(1 - value if invert else value, 2)
    return profile


def parse_taste_context(frame_md: str, expanded_prompt: str) -> TasteContext:
    read_block = _section_block(frame_md, "taste_read")
    explicit_read = bool(read_block.strip())
    register = _scalar_from_block(read_block, "register") if explicit_read else None
    if register not in REGISTERS:
        register = _infer_register(frame_md, expanded_prompt)

    dial_block = _section_block(frame_md, "taste_dials")
    dials: dict[str, int] = {}
    issues: list[dict[str, Any]] = []
    if dial_block.strip():
        invalid = False
        parsed: dict[str, int] = {}
        for key in _DIAL_KEYS:
            value = _parse_int_dial(_scalar_from_block(dial_block, key))
            if value is None:
                invalid = True
            else:
                parsed[key] = value
        if invalid:
            issues.append({"code": "invalid_taste_dial", "message": "taste_dials must be integers from 1 to 10."})
        elif len(parsed) == len(_DIAL_KEYS):
            dials = parsed

    existing_profile = _parse_control_profile(frame_md)
    return TasteContext(
        register=register,
        explicit_taste_read=explicit_read,
        audience=_scalar_from_block(read_block, "audience") if explicit_read else None,
        visual_family=_scalar_from_block(read_block, "visual_family") if explicit_read else None,
        anti_references=_list_from_block(read_block, "anti_references") if explicit_read else [],
        dials=dials,
        control_profile=_derive_control_profile(existing_profile, dials),
        issues=issues,
    )
