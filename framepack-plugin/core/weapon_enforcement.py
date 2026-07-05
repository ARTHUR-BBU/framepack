"""Weapon enforcement: check that weapon-load-plan weapons are actually called in HTML.

This module provides the reusable detection layer shared by:
- quality_audit (advisory P0 issues)
- post_tool_call hard gate (blocking RuntimeError)
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json
import re

from .quality_audit import (
    _canonical_function_name,
    _find_closing_paren,
    _has_canonical_function_call,
    _mask_js_comments_and_strings,
)
from .weapon_load_plan import load_weapon_load_plan


@dataclass(frozen=True)
class WeaponViolation:
    """A selected weapon that is missing from index.html."""

    scene: str
    weapon_id: str
    function_name: str
    source: str
    reuse_mode: str
    message: str


@dataclass(frozen=True)
class WeaponUsageEvidence:
    """Evidence that an HTML file really used a selected weapon."""

    weapon_id: str
    function_name: str
    function_called: bool
    script_loaded: bool
    local_shim_detected: bool
    preset_or_params_present: bool
    notes: tuple[str, ...] = ()

    @property
    def passes_gate(self) -> bool:
        return (
            self.function_called
            and self.script_loaded
            and not self.local_shim_detected
            and self.preset_or_params_present
        )


def _script_src_values(html: str) -> list[str]:
    pattern = re.compile(r"<script\b[^>]*\bsrc\s*=\s*(['\"])(?P<src>.*?)\1", re.IGNORECASE | re.DOTALL)
    return [match.group("src") for match in pattern.finditer(html)]


def _has_script_load(html: str, weapon_id: str, ref_path: str | None) -> bool:
    srcs = _script_src_values(html)
    if not srcs:
        return False
    candidates = {weapon_id}
    if ref_path:
        normalized_ref = ref_path.replace("\\", "/")
        candidates.add(normalized_ref)
        candidates.add(Path(normalized_ref).name)
    return any(any(candidate and candidate in src.replace("\\", "/") for candidate in candidates) for src in srcs)


def _has_local_shim(masked_html: str, function_name: str) -> bool:
    name = re.escape(function_name)
    patterns = [
        rf"\bfunction\s+{name}\s*\(",
        rf"\b(?:const|let|var)\s+{name}\s*=",
        rf"\bwindow\s*\.\s*{name}\s*=\s*(?:function|\([^)]*\)\s*=>|[^;]+=>)",
    ]
    return any(re.search(pattern, masked_html) for pattern in patterns)


def _function_call_args(html: str, masked_html: str, function_name: str) -> list[str]:
    pattern = re.compile(rf"\b{re.escape(function_name)}\s*\(")
    args: list[str] = []
    for match in pattern.finditer(masked_html):
        if not _has_canonical_function_call(masked_html[match.start():], function_name):
            continue
        open_index = masked_html.find("(", match.start())
        close_index = _find_closing_paren(masked_html, open_index)
        if close_index is None:
            continue
        args.append(html[open_index + 1: close_index])
    return args


def _call_has_preset_or_params(args: str, params_hint: dict[str, object] | None) -> bool:
    compact = re.sub(r"\s+", "", args)
    if compact in {"", "{}"}:
        return False

    # When a plan asks for a preset, accept either an explicit preset field or
    # the preset's concrete key params. A loose target+duration call is still
    # too easy to fake; Phase 2 requires a real recipe, not a garnish label.
    wants_preset = bool(params_hint and params_hint.get("preset_id"))
    if wants_preset:
        if re.search(r"\bpreset\s*:", args):
            return True
        required = [
            key
            for key in ("target", "duration", "direction", "stagger")
            if params_hint and key in params_hint
        ]
        if not required:
            required = ["target", "duration"]
        return all(re.search(rf"\b{re.escape(key)}\s*:", args) for key in required)

    return bool(re.search(r"\b(?:target|selector|duration|text|value|preset)\s*:", args))


def analyze_weapon_usage(
    html: str,
    *,
    weapon_id: str,
    function_name: str,
    ref_path: str | None = None,
    params_hint: dict[str, object] | None = None,
) -> WeaponUsageEvidence:
    """Analyze whether a selected builtin weapon is truly used in HTML.

    This is intentionally conservative. A bare function name is not enough:
    the HTML must load the canonical weapon file, avoid local shims, and call
    the function with non-empty/preset-quality params.
    """
    masked = _mask_js_comments_and_strings(html)
    args = _function_call_args(html, masked, function_name)
    local_shim = _has_local_shim(masked, function_name)
    script_loaded = _has_script_load(html, weapon_id, ref_path)
    params_present = any(_call_has_preset_or_params(arg, params_hint) for arg in args)

    notes: list[str] = []
    if not args:
        notes.append("canonical function call missing")
    if not script_loaded:
        notes.append("canonical weapon script not loaded")
    if local_shim:
        notes.append("local shim shadows canonical weapon function")
    if args and not params_present:
        notes.append("weapon call has empty/default params")

    return WeaponUsageEvidence(
        weapon_id=weapon_id,
        function_name=function_name,
        function_called=bool(args),
        script_loaded=script_loaded,
        local_shim_detected=local_shim,
        preset_or_params_present=params_present,
        notes=tuple(notes),
    )


def _ref_path_from_load(load: dict[str, object]) -> str | None:
    file_path = load.get("file_path") or load.get("path") or load.get("reference")
    return str(file_path) if file_path else None


RECEIPT_JSON = "weapon-enforcement-receipt.json"


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _receipt_path(project_dir: str | Path) -> Path:
    return Path(project_dir) / ".framepack" / RECEIPT_JSON


def write_weapon_enforcement_receipt(project_dir: str | Path, violations: list[WeaponViolation]) -> None:
    """Persist a receipt tying the current index.html bytes to a clean gate run."""
    project = Path(project_dir)
    html_path = project / "index.html"
    if not html_path.is_file():
        return
    receipt = {
        "kind": "framepack_weapon_enforcement_receipt",
        "version": "0.1",
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "index_html_sha256": _sha256_file(html_path),
        "violations": [v.__dict__ for v in violations],
    }
    path = _receipt_path(project)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")


def is_weapon_enforcement_receipt_current(project_dir: str | Path) -> tuple[bool, str]:
    """Return whether index.html still matches a zero-violation enforcement receipt."""
    project = Path(project_dir)
    html_path = project / "index.html"
    if load_weapon_load_plan(project) is None:
        return True, "no weapon-load-plan; receipt not required"
    if not html_path.is_file():
        return True, "no index.html; receipt not required"

    path = _receipt_path(project)
    if not path.is_file():
        return False, "weapon enforcement receipt missing"
    try:
        receipt = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return False, f"weapon enforcement receipt unreadable: {exc}"

    if receipt.get("violations"):
        return False, "weapon enforcement receipt records violations"

    current_sha = _sha256_file(html_path)
    receipt_sha = str(receipt.get("index_html_sha256", ""))
    if current_sha != receipt_sha:
        return False, "weapon enforcement receipt stale: index.html sha mismatch"
    return True, "weapon enforcement receipt current"


def check_weapon_implementation(project_dir: str | Path) -> list[WeaponViolation]:
    """Check that all framepack_builtin weapons selected in the load plan are truly used.

    Returns a list of violations (empty = all good).
    Does NOT raise — callers decide whether to block or advise.
    """
    project = Path(project_dir)
    html_path = project / "index.html"
    if not html_path.is_file():
        return []

    try:
        html = html_path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return []

    plan = load_weapon_load_plan(project)
    if plan is None:
        return []

    violations: list[WeaponViolation] = []
    for scene in plan.scenes:
        if scene.handwrite or not scene.selected:
            continue
        selected = next((match for match in scene.matches if match.id == scene.selected), None)
        if selected is None or selected.source != "framepack_builtin":
            continue
        function_name = _canonical_function_name(selected.id)
        if not function_name:
            continue
        evidence = analyze_weapon_usage(
            html,
            weapon_id=selected.id,
            function_name=function_name,
            ref_path=_ref_path_from_load(selected.load),
            params_hint=selected.params_hint,
        )
        if not evidence.passes_gate:
            detail = "; ".join(evidence.notes) if evidence.notes else "insufficient weapon usage evidence"
            violations.append(
                WeaponViolation(
                    scene=scene.scene,
                    weapon_id=selected.id,
                    function_name=function_name,
                    source=selected.source,
                    reuse_mode=selected.reuse_mode,
                    message=(
                        f"Weapon Load Plan selected {selected.id!r} for {scene.scene}, "
                        f"but index.html does not show real canonical weapon usage: {detail}. "
                        f"Load the weapon .js and call {function_name}() with preset-quality params, "
                        f"or change the plan to HANDWRITE with a concrete waiver."
                    ),
                )
            )
    return violations
