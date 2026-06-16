"""Execution Manifest parser tests."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.execution_manifest import parse_execution_manifest


def test_parse_manifest_yaml_weapon_list():
    text = """
## Execution Manifest

weapons:
  - id: text-split-enter
    source: builtin
    used_by: scene_1
  - id: caption-clip-wipe
    source: builtin
    used_by: [scene_2, scene_3]

## Negative Prompt
ignore this
"""

    weapons = parse_execution_manifest(text)

    assert weapons[0].id == "text-split-enter"
    assert weapons[0].source == "builtin"
    assert weapons[0].used_by == ["scene_1"]
    assert weapons[1].id == "caption-clip-wipe"
    assert weapons[1].used_by == ["scene_2", "scene_3"]


def test_parse_manifest_markdown_bullets():
    text = """
## Execution Manifest
- weapon: text-split-enter
  scene: scene_1
- weapon: bg-blur-mask
  scenes: scene_2, scene_3
"""

    weapons = parse_execution_manifest(text)

    assert [w.id for w in weapons] == ["text-split-enter", "bg-blur-mask"]
    assert weapons[1].used_by == ["scene_2", "scene_3"]


def test_parse_handwrite_entry():
    text = """
## Execution Manifest
- HANDWRITE: scene_4, reason: custom tactical timeline
"""

    weapons = parse_execution_manifest(text)

    assert len(weapons) == 1
    assert weapons[0].id == "HANDWRITE"
    assert weapons[0].handwrite is True
    assert weapons[0].used_by == ["scene_4"]
    assert weapons[0].reason == "custom tactical timeline"


def test_empty_manifest_returns_empty_list():
    assert parse_execution_manifest("# No manifest here") == []


def test_parse_scene_keyed_manifest_blocks_with_params_and_handwrite():
    text = """
## Execution Manifest

```yaml
scene_2:
  needs: "text coalescing from split halves"
  weapon: text-split-enter
  kind: part
  skill_path: "framepack:framepack-animation-library"
  file: "parts/text-split-enter.md"
  code: "parts/references/text-split-enter.js"
  params:
    splitMode: "horizontal"
    direction: "inward"
    travelDistance: "60px"
    duration: 0.7

scene_6_extra2:
  needs: "final 2s hold"
  weapon: HANDWRITE
  reason: "timeline management, not an animation weapon"
```

## Weapon Coverage Summary
ignore this
"""

    weapons = parse_execution_manifest(text)

    assert [w.id for w in weapons] == ["text-split-enter", "HANDWRITE"]
    assert weapons[0].used_by == ["scene_2"]
    assert weapons[0].code == "parts/references/text-split-enter.js"
    assert weapons[0].params == {
        "splitMode": "horizontal",
        "direction": "inward",
        "travelDistance": "60px",
        "duration": 0.7,
    }
    assert weapons[1].used_by == ["scene_6_extra2"]
    assert weapons[1].handwrite is True
    assert weapons[1].reason == "timeline management, not an animation weapon"


def test_parse_scene_keyed_manifest_with_motion_semantics():
    text = """
## Execution Manifest
scene_1:
  motion_role: hook_mystery
  grammar: tension_release
  taste_move: object_worship
  surprise: scale_violation
  weapon: text-split-enter
  code: parts/references/text-split-enter.js
  params:
    target: "#s1-title"
"""
    weapons = parse_execution_manifest(text)
    assert len(weapons) == 1
    weapon = weapons[0]
    assert weapon.id == "text-split-enter"
    assert weapon.motion_role == "hook_mystery"
    assert weapon.grammar == "tension_release"
    assert weapon.taste_move == "object_worship"
    assert weapon.surprise == "scale_violation"


def test_parse_markdown_bullet_manifest_with_motion_semantics():
    text = """
## Execution Manifest
- weapon: text-split-enter
  scene: scene_1
  motion_role: hook_mystery
  grammar: tension_release
  taste_move: object_worship
  surprise: scale_violation
"""
    weapons = parse_execution_manifest(text)
    assert len(weapons) == 1
    weapon = weapons[0]
    assert weapon.id == "text-split-enter"
    assert weapon.motion_role == "hook_mystery"
    assert weapon.grammar == "tension_release"
    assert weapon.taste_move == "object_worship"
    assert weapon.surprise == "scale_violation"
