"""Framepack quality-beyond-lint semantic audit.

This module is report-first. It does not render, mutate project files, or replace
`npx hyperframes lint`; it catches handoff/semantic failures that structural lint
cannot see: stale arsenal registry, manifest/HTML weapon drift, manual data-hf-id,
and obvious creative-implementation mismatches.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
import json
import math
import re
from pathlib import Path
from typing import Any

from .builtin_weapons import resolve_builtin_weapon
from .execution_manifest import ManifestWeapon, parse_execution_manifest
from .proof_audit import audit_proofs
from .timeline_manifest import load_timeline, validate_timeline


@dataclass
class QualityIssue:
    code: str
    severity: str
    message: str
    path: str | None = None
    scene: str | None = None
    weapon_id: str | None = None
    details: dict[str, Any] | None = None


@dataclass
class QualityAuditReport:
    project_dir: str
    issues: list[QualityIssue]
    summary: dict[str, int]

    def to_dict(self) -> dict[str, Any]:
        return {
            "kind": "framepack_quality_audit",
            "project_dir": self.project_dir,
            "summary": dict(self.summary),
            "issues": [asdict(issue) for issue in self.issues],
        }


SEVERITIES = ("P0", "P1", "P2", "P3")

PARAM_ALIASES = {
    "elastic-scale-enter": {
        "scale_from": "fromScale",
        "ease_elastic": "ease",
    },
}


def _read(path: Path) -> str:
    """Read text file, return '' if missing. Mirrored in taste_audit.py — keep in sync."""
    return path.read_text(encoding="utf-8") if path.is_file() else ""


def _load_json(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def _coerce_float(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _target_duration(expanded_prompt: str, html: str) -> float | None:
    match = re.search(r"TOTAL\s+DURATION\s*:\s*([0-9]+(?:\.[0-9]+)?)", expanded_prompt, re.I)
    if match:
        return float(match.group(1))
    match = re.search(r"data-duration=[\"']([0-9]+(?:\.[0-9]+)?)[\"']", html)
    if match:
        return float(match.group(1))
    return None


def _norm(value: object) -> str:
    text = str(value).strip().strip("'\"")
    # Preserve units, normalize only numeric spelling.
    try:
        number = float(text)
    except ValueError:
        return text
    if not math.isfinite(number):
        return text
    return str(int(number)) if number.is_integer() else str(number)


def _is_remote_url(value: str) -> bool:
    return bool(re.match(r"^(?:https?:)?//", value.strip(), re.I))


def _font_src_urls(html: str) -> list[str]:
    urls: list[str] = []
    for block in re.findall(r"@font-face\s*\{(?P<body>.*?)\}", html, re.I | re.S):
        for url in re.findall(r"url\(\s*['\"]?(?P<url>[^)'\"\s]+)['\"]?\s*\)", block, re.I):
            urls.append(url.strip())
    return urls


def _audit_font_dependencies(project_dir: Path, html: str) -> list[QualityIssue]:
    issues: list[QualityIssue] = []
    html_path = project_dir / "index.html"
    external_matches = sorted(set(re.findall(r"https?://fonts\.(?:googleapis|gstatic)\.com/[^\s'\"<>]+", html, re.I)))
    if external_matches:
        issues.append(
            QualityIssue(
                "external_font_dependency",
                "P1",
                "index.html depends on live Google Fonts; use proxy/VPN for acquisition if needed, then vendor a local font asset under assets/fonts for production portability",
                str(html_path),
                details={
                    "urls": external_matches,
                    "proxy_note": "Proxy/VPN may be used for acquisition, but production HTML should not depend on live Google Fonts.",
                },
            )
        )

    for url in _font_src_urls(html):
        if _is_remote_url(url) or url.startswith("data:"):
            continue
        asset_path = (project_dir / url).resolve()
        try:
            inside_project = asset_path.is_relative_to(project_dir.resolve())
        except AttributeError:  # pragma: no cover - py<3.9 defensive
            inside_project = str(asset_path).startswith(str(project_dir.resolve()))
        if not inside_project or not asset_path.is_file():
            issues.append(
                QualityIssue(
                    "font_face_missing_local_asset",
                    "P2",
                    f"@font-face references missing or out-of-project local font asset: {url}",
                    str(html_path),
                    details={"asset": url, "resolved": str(asset_path)},
                )
            )
    return issues


def _hex_luminance(hex_color: str) -> float | None:
    text = hex_color.strip().lstrip("#")
    if len(text) == 3:
        text = "".join(char * 2 for char in text)
    if len(text) not in {6, 8} or not re.fullmatch(r"[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?", text):
        return None
    r = int(text[0:2], 16) / 255
    g = int(text[2:4], 16) / 255
    b = int(text[4:6], 16) / 255
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _extract_hex_colors(text: str) -> list[str]:
    return re.findall(r"#[0-9a-fA-F]{3,8}\b", text)


def _audit_visibility(project_dir: Path, frame_md: str, html: str) -> list[QualityIssue]:
    signals: list[str] = []
    dark_colors = []
    for color in _extract_hex_colors(frame_md + "\n" + html):
        luminance = _hex_luminance(color)
        if luminance is not None and luminance < 0.10:
            dark_colors.append(color)
    if len(set(dark_colors)) >= 2:
        signals.append("dark_palette_low_contrast")

    for value in re.findall(r"brightness\(\s*([0-9.]+)\s*\)", html, re.I):
        amount = _coerce_float(value)
        if amount is not None and amount < 0.5:
            signals.append("brightness")
            break

    if re.search(r"rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*(?:0\.[7-9]\d*|1(?:\.0+)?)\s*\)", html, re.I):
        signals.append("heavy_black_overlay")

    if len(signals) >= 2:
        return [
            QualityIssue(
                "low_visibility_risk",
                "P2",
                "Static visibility heuristic found a dark palette combined with dimming/black overlay; run proof-frame review before handing to test group",
                str(project_dir / "index.html"),
                details={"signals": sorted(set(signals)), "dark_colors": sorted(set(dark_colors))},
            )
        ]
    return []


def _split_js_object_entries(raw: str) -> list[str]:
    entries: list[str] = []
    current: list[str] = []
    quote: str | None = None
    escaped = False
    for char in raw:
        if escaped:
            current.append(char)
            escaped = False
            continue
        if char == "\\" and quote:
            current.append(char)
            escaped = True
            continue
        if char in {"'", '"'}:
            current.append(char)
            quote = None if quote == char else char if quote is None else quote
            continue
        if char == "," and quote is None:
            entry = "".join(current).strip()
            if entry:
                entries.append(entry)
            current = []
            continue
        current.append(char)
    entry = "".join(current).strip()
    if entry:
        entries.append(entry)
    return entries


def _parse_js_object(raw: str) -> dict[str, str]:
    values: dict[str, str] = {}
    for entry in _split_js_object_entries(raw):
        match = re.match(r"^([A-Za-z_][\w]*)\s*:\s*(.+)$", entry, re.S)
        if match:
            values[match.group(1)] = match.group(2).strip().strip("'\"")
    return values


def _extract_function_option_objects(html: str, function_name: str) -> list[dict[str, str]]:
    pattern = re.compile(rf"{re.escape(function_name)}\s*\([^;]*?\{{(?P<body>[^{{}}]*)\}}[^;]*?\)", re.S)
    return [_parse_js_object(match.group("body")) for match in pattern.finditer(html)]


def _normalize_params(weapon_id: str, params: dict[str, object]) -> dict[str, object]:
    aliases = PARAM_ALIASES.get(weapon_id, {})
    return {aliases.get(key, key): value for key, value in params.items()}


def _canonical_function_name(weapon_id: str) -> str | None:
    weapon = resolve_builtin_weapon(weapon_id)
    if not weapon:
        return None
    function_name = weapon.get("function")
    return str(function_name) if function_name else None


def _inline_gsap_hint(html: str, weapon_id: str, params: dict[str, object]) -> dict[str, object]:
    """Best-effort hint for inline animation code that resembles a weapon but bypasses its function.

    Detects both GSAP (gsap.to/from/fromTo/timeline) and anime.js (anime()/animate())
    inline rewrites. The function name is historical — it now covers multiple engines.
    """
    gsap_call = bool(re.search(r"\bgsap\.(?:to|from|fromTo|timeline)\s*\(", html))
    anime_call = bool(re.search(r"\banime\s*\(|\banime\s*\.\s*stagger\s*\(", html))
    animate_call = bool(re.search(r"\banimate\s*\(", html)) and bool(re.search(r"\bstagger\s*\(", html))
    signals: list[str] = []
    if gsap_call:
        signals.append("gsap_call")
    if anime_call:
        signals.append("anime_call")
    if animate_call:
        signals.append("animate_call")
    if weapon_id == "text-split-enter" and re.search(r"\bstagger\s*:", html) and re.search(r"\b(?:y|x)\s*:\s*-?\d+", html):
        signals.append("text_split_like_stagger_travel")
    if weapon_id == "anime-text-split" and re.search(r"\bstagger\s*[\(:]", html) and re.search(r"\b(?:translateY|translateX|y|x)\s*[:,]\s*-?\d+", html):
        signals.append("anime_text_split_like_stagger")
    for key, value in params.items():
        normalized = _norm(value)
        if normalized and normalized in html:
            signals.append(f"param_value:{key}")
    engine_inline = gsap_call or anime_call or animate_call
    suspected = engine_inline and len(signals) >= 2
    return {
        "suspected": suspected,
        "signals": signals,
        "recommendation": "Replace the inline animation lookalike with the canonical function call from arsenal.json; pattern-equivalent inline code does not satisfy the weapon binding contract.",
    }


def _find_matching_call(calls: list[dict[str, str]], params: dict[str, object]) -> dict[str, str] | None:
    if not calls:
        return None

    def score(call: dict[str, str]) -> tuple[int, int]:
        exact = 0
        shared = 0
        for key, expected in params.items():
            if key not in call:
                continue
            shared += 1
            if _norm(call[key]) == _norm(expected):
                exact += 1
        return exact, shared

    scored = [(score(call), call) for call in calls]
    best_score, best_call = max(scored, key=lambda item: item[0])
    if params and best_score[1] == 0:
        return None
    return best_call


def _audit_arsenal(project_dir: Path, arsenal: dict[str, Any], manifest: list[ManifestWeapon], duration: float | None) -> list[QualityIssue]:
    issues: list[QualityIssue] = []
    arsenal_path = project_dir / ".framepack" / "arsenal.json"
    if not arsenal:
        return [QualityIssue("arsenal_missing", "P0", ".framepack/arsenal.json is missing or invalid", str(arsenal_path))]

    if arsenal.get("project") and arsenal.get("project") != project_dir.name:
        issues.append(
            QualityIssue(
                "arsenal_project_mismatch",
                "P0",
                f"arsenal project is {arsenal.get('project')!r}, expected {project_dir.name!r}",
                str(arsenal_path),
                details={"actual": arsenal.get("project"), "expected": project_dir.name},
            )
        )

    arsenal_duration = arsenal.get("hyperframes_config", {}).get("duration")
    arsenal_duration_value = _coerce_float(arsenal_duration)
    if duration is not None and arsenal_duration is not None and arsenal_duration_value is None:
        issues.append(
            QualityIssue(
                "arsenal_duration_invalid",
                "P0",
                f"arsenal duration is non-numeric: {arsenal_duration!r}",
                str(arsenal_path),
                details={"actual": arsenal_duration, "expected": float(duration)},
            )
        )
    elif duration is not None and arsenal_duration_value is not None and arsenal_duration_value != float(duration):
        issues.append(
            QualityIssue(
                "arsenal_duration_mismatch",
                "P0",
                f"arsenal duration is {arsenal_duration}, expected {duration:g}",
                str(arsenal_path),
                details={"actual": arsenal_duration_value, "expected": float(duration)},
            )
        )

    weapons = arsenal.get("weapons") if isinstance(arsenal.get("weapons"), dict) else {}
    for ref in manifest:
        if ref.handwrite or ref.id == "HANDWRITE":
            continue
        if ref.id not in weapons:
            issues.append(
                QualityIssue(
                    "manifest_weapon_missing_from_arsenal",
                    "P0",
                    f"Manifest weapon {ref.id!r} is not registered in arsenal.json",
                    str(arsenal_path),
                    scene=ref.used_by[0] if ref.used_by else None,
                    weapon_id=ref.id,
                )
            )
        elif not weapons[ref.id].get("used_by"):
            issues.append(
                QualityIssue(
                    "arsenal_used_by_empty",
                    "P1",
                    f"Arsenal weapon {ref.id!r} has empty used_by",
                    str(arsenal_path),
                    weapon_id=ref.id,
                )
            )
    return issues


def _audit_html_guardrails(project_dir: Path, html: str, manifest: list[ManifestWeapon]) -> list[QualityIssue]:
    issues: list[QualityIssue] = []
    html_path = project_dir / "index.html"
    manual_ids = re.findall(r"data-hf-id=", html)
    if manual_ids:
        issues.append(
            QualityIssue(
                "manual_data_hf_id",
                "P1",
                f"index.html contains {len(manual_ids)} manual data-hf-id attributes; HyperFrames compiler owns these IDs",
                str(html_path),
                details={"count": len(manual_ids)},
            )
        )

    declared = {ref.id for ref in manifest if not ref.handwrite}
    has_card_structure = bool(re.search(r"id=[\"'][^\"']*card|class=[\"'][^\"']*(?:text-card|card-grid)", html, re.I))
    has_card_cascade_call = bool(re.search(r"buildCardCascade|cardCascadeReveal|card-cascade-reveal", html, re.I))
    if has_card_structure and "card-cascade-reveal" not in declared and not has_card_cascade_call:
        issues.append(
            QualityIssue(
                "undeclared_card_cascade",
                "P1",
                "HTML implements a card cascade/card grid, but Execution Manifest does not declare card-cascade-reveal or an approved card-cascade HANDWRITE entry",
                str(html_path),
                weapon_id="card-cascade-reveal",
            )
        )
    return issues


def _build_canonical_snippet(function_name: str, params: dict[str, object]) -> str:
    """Build a canonical code snippet showing correct parameter usage."""
    param_lines = []
    for key, value in params.items():
        if isinstance(value, str):
            param_lines.append(f'    {key}: "{value}"')
        else:
            param_lines.append(f"    {key}: {value}")
    joined = ",\n".join(param_lines)
    return f"{function_name}({{\n{joined}\n}})"


def _audit_parameter_drift(project_dir: Path, html: str, manifest: list[ManifestWeapon]) -> list[QualityIssue]:
    issues: list[QualityIssue] = []
    html_path = project_dir / "index.html"
    for ref in manifest:
        if ref.handwrite or not ref.params:
            continue
        fn = _canonical_function_name(ref.id)
        if not fn:
            continue
        calls = _extract_function_option_objects(html, fn)
        params = _normalize_params(ref.id, ref.params)
        call = _find_matching_call(calls, params)
        if call is None:
            issues.append(
                QualityIssue(
                    "manifest_weapon_not_called",
                    "P0",
                    f"⛔ BLOCKING: Manifest weapon {ref.id!r} maps to {fn}(), but no call was found in index.html. After v0.13 Element-Inject refactor, all weapons are callable — Agent must use the canonical function, not inline GSAP lookalikes",
                    str(html_path),
                    scene=ref.used_by[0] if ref.used_by else None,
                    weapon_id=ref.id,
                    details={"function": fn, "inline_hint": _inline_gsap_hint(html, ref.id, params)},
                )
            )
            continue
        drift: dict[str, dict[str, str]] = {}
        for key, expected in params.items():
            if key not in call:
                continue
            actual = call[key]
            if _norm(actual) != _norm(expected):
                drift[key] = {"expected": _norm(expected), "actual": _norm(actual)}
        if drift:
            canonical_snippet = _build_canonical_snippet(fn, params)
            issues.append(
                QualityIssue(
                    "weapon_parameter_drift",
                    "P1",
                    f"Weapon {ref.id!r} call parameters drift from Execution Manifest",
                    str(html_path),
                    ref.used_by[0] if ref.used_by else None,
                    ref.id,
                    {"function": fn, "drift": drift, "canonical_snippet": canonical_snippet},
                )
            )
    return issues


def _audit_timeline(project_dir: Path, html: str, expanded_prompt: str, duration: float | None) -> list[QualityIssue]:
    issues: list[QualityIssue] = []
    timeline_path = project_dir / ".framepack" / "timeline-manifest.json"
    has_production_context = bool(expanded_prompt.strip() or html.strip())
    if not timeline_path.exists():
        if has_production_context:
            issues.append(
                QualityIssue(
                    "timeline_manifest_missing",
                    "P1",
                    ".framepack/timeline-manifest.json is missing; production timings, locks, proofs, and carryover dependencies have no ledger",
                    str(timeline_path),
                )
            )
        return issues

    try:
        timeline = load_timeline(timeline_path)
    except ValueError as exc:
        return [
            QualityIssue(
                "timeline_manifest_invalid",
                "P0",
                str(exc),
                str(timeline_path),
            )
        ]

    manifest_duration = timeline.get("project", {}).get("duration")
    manifest_duration_value = _coerce_float(manifest_duration)
    if duration is not None and manifest_duration is not None and manifest_duration_value is None:
        issues.append(
            QualityIssue(
                "timeline_duration_invalid",
                "P1",
                f"timeline manifest duration is non-numeric: {manifest_duration!r}",
                str(timeline_path),
                details={"actual": manifest_duration, "expected": float(duration)},
            )
        )
    elif duration is not None and manifest_duration_value is not None and manifest_duration_value != float(duration):
        issues.append(
            QualityIssue(
                "timeline_duration_mismatch",
                "P1",
                f"timeline manifest duration is {manifest_duration}, expected {duration:g}",
                str(timeline_path),
                details={"actual": manifest_duration_value, "expected": float(duration)},
            )
        )

    for warning in validate_timeline(timeline, project_dir):
        issues.append(
            QualityIssue(
                warning.code,
                warning.severity,
                warning.message,
                str(timeline_path),
                scene=warning.scene,
                details=warning.details,
            )
        )
    for proof_issue in audit_proofs(project_dir, timeline):
        issues.append(
            QualityIssue(
                proof_issue.code,
                proof_issue.severity,
                proof_issue.message,
                proof_issue.path,
                scene=proof_issue.scene,
                details=proof_issue.details,
            )
        )
    return issues


def _summarize(issues: list[QualityIssue]) -> dict[str, int]:
    summary = {severity: 0 for severity in SEVERITIES}
    for issue in issues:
        summary[issue.severity] = summary.get(issue.severity, 0) + 1
    return summary


def _audit_lint_cache(project_dir: Path) -> list[QualityIssue]:
    """Read .framepack/hyperframes-findings.json cache and convert classified
    HyperFrames lint findings into QualityIssue objects.

    Upstream limitations get prefixed with 'upstream:' in their code.
    Quality issues use their bare code.
    Unknown warnings default to upstream_limit (safe).
    """
    html_path = project_dir / "index.html"
    try:
        from .warning_classifier import load_lint_cache, merge_classified_into_quality_issues
        cache = load_lint_cache(project_dir)
        if cache is None:
            return []
        classified = cache.get("classified", [])
        return merge_classified_into_quality_issues(classified, str(html_path))
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning("Lint cache audit failed: %s", exc)
        return []


def audit_project(project_dir: str | Path) -> QualityAuditReport:
    project_dir = Path(project_dir)
    expanded_prompt = _read(project_dir / ".hyperframes" / "expanded-prompt.md")
    frame_md = _read(project_dir / "frame.md")
    html = _read(project_dir / "index.html")
    arsenal = _load_json(project_dir / ".framepack" / "arsenal.json")
    manifest = parse_execution_manifest(expanded_prompt)
    duration = _target_duration(expanded_prompt, html)

    issues: list[QualityIssue] = []
    issues.extend(_audit_arsenal(project_dir, arsenal, manifest, duration))
    issues.extend(_audit_html_guardrails(project_dir, html, manifest))
    issues.extend(_audit_parameter_drift(project_dir, html, manifest))
    issues.extend(_audit_font_dependencies(project_dir, html))
    issues.extend(_audit_visibility(project_dir, frame_md, html))
    issues.extend(_audit_timeline(project_dir, html, expanded_prompt, duration))
    issues.extend(_audit_lint_cache(project_dir))

    return QualityAuditReport(str(project_dir), issues, _summarize(issues))
