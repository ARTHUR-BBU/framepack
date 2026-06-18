"""Tests for weapon architecture contract.

Validates that weapon .js source files comply with the Element-Inject pattern:
- Function signature must be (tl, elements, opts, ...) — operate on existing elements
- Function body must NOT contain createElement / createElementNS / innerHTML assignment
  (those create DOM at runtime, conflicting with HyperFrames static-structure-first rule)

This is the foundation of the v0.13.0 weapon architecture refactor.
"""

import re
from pathlib import Path

import pytest

WEAPONS_DIR = (
    Path(__file__).resolve().parent.parent
    / "skills" / "framepack-animation-library"
)
PARTS_DIR = WEAPONS_DIR / "parts" / "references"
BLOCKS_DIR = WEAPONS_DIR / "blocks" / "references"

# Files that are NOT weapons (utilities / deprecated)
SKIP_FILES = {"hf-utils.js", "transitions-pack.js"}

# Weapons that are currently self-DOM-creating (the 9 to be refactored)
# As each is refactored, it moves from this set to the compliant set.
# bg-blur-mask.js was refactored in Phase 1 — now compliant ✅
# All weapons have been refactored to Element-Inject pattern.
# This set is empty — no weapon is exempt from the architecture contract.
SELF_DOM_WEAPONS = set()


def _weapon_js_files() -> list[tuple[str, Path]]:
    """Return (name, path) for all weapon .js files in parts/ and blocks/."""
    result = []
    for directory in (PARTS_DIR, BLOCKS_DIR):
        if not directory.is_dir():
            continue
        for js_file in sorted(directory.glob("*.js")):
            if js_file.name in SKIP_FILES:
                continue
            result.append((js_file.name, js_file))
    return result


def _check_no_createElement(source: str) -> list[str]:
    """Return list of createElement violations found in source."""
    violations = []
    # createElement( — direct DOM creation
    if re.search(r'\bcreateElement\s*\(', source):
        violations.append("createElement()")
    # createElementNS( — SVG namespace DOM creation
    if re.search(r'\bcreateElementNS\s*\(', source):
        violations.append("createElementNS()")
    # innerHTML = (assignment, not read) — destructive DOM rebuild
    if re.search(r'\.innerHTML\s*=\s*[^=]', source):
        violations.append("innerHTML assignment")
    return violations


# ── Contract: every weapon file must be testable ──

def test_weapon_js_files_are_discoverable():
    """All weapon .js files should be found by the test harness."""
    files = _weapon_js_files()
    names = [name for name, _ in files]
    # We expect at least 17 parts + 4 active blocks = 21
    assert len(files) >= 20, f"Only found {len(files)} weapon files: {names}"


# ── Contract: compliant weapons must have zero createElement ──

@pytest.mark.parametrize("name,path", _weapon_js_files())
def test_weapon_has_no_runtime_dom_creation(name, path):
    """Every weapon that is NOT in the SELF_DOM_WEAPONS set must have zero
    createElement / createElementNS / innerHTML assignment in its source.

    Self-DOM weapons are temporarily excluded — they're being refactored.
    As each is refactored, it's removed from SELF_DOM_WEAPONS and must pass this test.
    """
    if name in SELF_DOM_WEAPONS:
        pytest.skip(f"{name} is pending refactor (self-DOM weapon)")

    source = path.read_text(encoding="utf-8")
    violations = _check_no_createElement(source)
    assert not violations, (
        f"{name} contains runtime DOM creation: {violations}. "
        f"Weapon functions must operate on pre-existing elements, not create DOM. "
        f"See weapon architecture contract in design doc "
        f"2026-06-18--v0130-weapon-architecture-refactor.md"
    )


# ── Contract: bg-blur-mask should become compliant after Phase 1 ──

def test_bg_blur_mask_is_element_inject_compliant():
    """After Phase 1 refactor, bg-blur-mask.js must have zero createElement.

    This test will FAIL until bg-blur-mask is refactored.
    Once refactored, remove bg-blur-mask.js from SELF_DOM_WEAPONS.
    """
    path = PARTS_DIR / "bg-blur-mask.js"
    if not path.is_file():
        pytest.fail("bg-blur-mask.js not found")
    source = path.read_text(encoding="utf-8")
    violations = _check_no_createElement(source)
    assert not violations, (
        f"bg-blur-mask.js still contains runtime DOM creation: {violations}. "
        f"Phase 1 refactor should have removed all createElement calls."
    )
