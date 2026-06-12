"""Execution Manifest parser for Framepack handoff documents."""

from __future__ import annotations

from dataclasses import dataclass
import re


@dataclass
class ManifestWeapon:
    id: str
    source: str | None
    used_by: list[str]
    code: str | None = None
    handwrite: bool = False
    reason: str | None = None


def _manifest_section(text: str) -> str:
    match = re.search(r"^##\s+Execution Manifest\s*$", text, re.IGNORECASE | re.MULTILINE)
    if not match:
        return ""
    rest = text[match.end():]
    next_heading = re.search(r"^##\s+", rest, re.MULTILINE)
    return rest[: next_heading.start()] if next_heading else rest


def _split_values(value: str) -> list[str]:
    value = value.strip().strip("[]")
    if not value:
        return []
    return [item.strip().strip("'\"") for item in re.split(r"[,\s]+", value) if item.strip().strip("'\"")]


def _parse_kv_block(block: dict[str, str]) -> ManifestWeapon | None:
    weapon_id = block.get("id") or block.get("weapon")
    if not weapon_id:
        return None
    source = block.get("source")
    used_raw = block.get("used_by") or block.get("scene") or block.get("scenes") or ""
    used_by = _split_values(used_raw)
    reason = block.get("reason")
    handwrite = weapon_id.upper() == "HANDWRITE"
    return ManifestWeapon(id="HANDWRITE" if handwrite else weapon_id, source=source, used_by=used_by, code=block.get("code"), handwrite=handwrite, reason=reason)


def parse_execution_manifest(text: str) -> list[ManifestWeapon]:
    """Parse a lenient markdown/YAML-ish Execution Manifest.

    Supports both:
    - `weapons:` list with `id/source/used_by`
    - markdown bullets like `- weapon: text-split-enter` + indented `scene:`
    - `- HANDWRITE: scene_4, reason: custom timeline`
    """
    section = _manifest_section(text)
    if not section.strip():
        return []

    weapons: list[ManifestWeapon] = []
    current: dict[str, str] | None = None

    def flush():
        nonlocal current
        if current:
            parsed = _parse_kv_block(current)
            if parsed:
                weapons.append(parsed)
        current = None

    for raw_line in section.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()
        if not stripped or stripped == "weapons:":
            continue

        handwrite = re.match(r"^-\s*HANDWRITE\s*:\s*(.+)$", stripped, re.IGNORECASE)
        if handwrite:
            flush()
            payload = handwrite.group(1)
            scene_part, _, reason_part = payload.partition("reason:")
            used_scene = scene_part.replace(",", " ").strip()
            reason = reason_part.strip() if reason_part else None
            weapons.append(ManifestWeapon(id="HANDWRITE", source=None, used_by=_split_values(used_scene), handwrite=True, reason=reason))
            continue

        bullet_kv = re.match(r"^-\s*(id|weapon)\s*:\s*(.+)$", stripped)
        if bullet_kv:
            flush()
            current = {bullet_kv.group(1): bullet_kv.group(2).strip()}
            continue

        kv = re.match(r"^(id|weapon|source|used_by|scene|scenes|code|reason)\s*:\s*(.+)$", stripped)
        if kv and current is not None:
            current[kv.group(1)] = kv.group(2).strip()
            continue

    flush()
    return weapons
