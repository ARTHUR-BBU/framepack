"""Weapon enforcement: check that weapon-load-plan weapons are actually called in HTML.

This module provides the reusable detection layer shared by:
- quality_audit (advisory P0 issues)
- post_tool_call hard gate (blocking RuntimeError)
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .quality_audit import _canonical_function_name, _has_canonical_function_call
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


def check_weapon_implementation(project_dir: str | Path) -> list[WeaponViolation]:
    """Check that all framepack_builtin weapons selected in the load plan are called in HTML.

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
        if not _has_canonical_function_call(html, function_name):
            violations.append(
                WeaponViolation(
                    scene=scene.scene,
                    weapon_id=selected.id,
                    function_name=function_name,
                    source=selected.source,
                    reuse_mode=selected.reuse_mode,
                    message=(
                        f"Weapon Load Plan selected {selected.id!r} for {scene.scene}, "
                        f"but index.html does not call canonical function {function_name}(). "
                        f"Load the weapon .js and call the function, or change the plan to HANDWRITE."
                    ),
                )
            )
    return violations
