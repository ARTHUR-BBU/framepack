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
