"""Tests for P0.3 Arsenal Provenance Gate.

Declared weapons in Execution Manifest must have binding records in
.framepack/arsenal.json, or an explicit HANDWRITE waiver.
"""

from __future__ import annotations

from pathlib import Path

from core.render_readiness import (
    GateStatus,
    check_arsenal,
)


def _make_framepack(tmp_path: Path) -> Path:
    fp = tmp_path / ".framepack"
    fp.mkdir(exist_ok=True)
    return fp


def _make_hyperframes(tmp_path: Path) -> Path:
    hf = tmp_path / ".hyperframes"
    hf.mkdir(exist_ok=True)
    return hf


class TestArsenalProvenance:
    def test_no_webrasenal_json_missing(self, tmp_path):
        """No arsenal.json and no weapons declared = RED (existing behavior)."""
        r = check_arsenal(tmp_path)
        assert r.status is GateStatus.RED

    def test_empty_arsenal_no_manifest(self, tmp_path):
        """arsenal.json exists but empty, no expanded-prompt = GREEN."""
        fp = _make_framepack(tmp_path)
        (fp / "arsenal.json").write_text('{"weapons": {}}', encoding="utf-8")
        r = check_arsenal(tmp_path)
        assert r.status is GateStatus.GREEN

    def test_weapon_declared_but_no_binding(self, tmp_path):
        """Manifest declares weapon but arsenal.json doesn't bind it = YELLOW."""
        fp = _make_framepack(tmp_path)
        hf = _make_hyperframes(tmp_path)
        (fp / "arsenal.json").write_text('{"weapons": {}}', encoding="utf-8")
        (hf / "expanded-prompt.md").write_text(
            "# Story\n\n## Execution Manifest\n\n"
            "- id: text-split-enter\n  source: framepack-animation-library\n"
            "  used_by: scene_1\n",
            encoding="utf-8",
        )
        r = check_arsenal(tmp_path)
        assert r.status is GateStatus.YELLOW
        assert "unbound" in r.evidence.lower() or "provenance" in r.evidence.lower()

    def test_weapon_declared_and_bound(self, tmp_path):
        """Manifest declares weapon and arsenal.json has matching binding = GREEN."""
        import json
        fp = _make_framepack(tmp_path)
        hf = _make_hyperframes(tmp_path)
        (fp / "arsenal.json").write_text(json.dumps({
            "weapons": {
                "text-split-enter": {
                    "binding": "builtin_weapon",
                    "source": "framepack-animation-library",
                }
            }
        }), encoding="utf-8")
        (hf / "expanded-prompt.md").write_text(
            "# Story\n\n## Execution Manifest\n\n"
            "- id: text-split-enter\n  source: framepack-animation-library\n"
            "  used_by: scene_1\n",
            encoding="utf-8",
        )
        r = check_arsenal(tmp_path)
        assert r.status is GateStatus.GREEN

    def test_handwrite_weapon_no_binding_needed(self, tmp_path):
        """HANDWRITE weapons don't need arsenal binding."""
        fp = _make_framepack(tmp_path)
        hf = _make_hyperframes(tmp_path)
        (fp / "arsenal.json").write_text('{"weapons": {}}', encoding="utf-8")
        (hf / "expanded-prompt.md").write_text(
            "# Story\n\n## Execution Manifest\n\n"
            "- HANDWRITE: scene_4, reason: custom sprite timing\n",
            encoding="utf-8",
        )
        r = check_arsenal(tmp_path)
        assert r.status is GateStatus.GREEN

    def test_partial_binding(self, tmp_path):
        """2 weapons declared, 1 bound, 1 not = YELLOW."""
        import json
        fp = _make_framepack(tmp_path)
        hf = _make_hyperframes(tmp_path)
        (fp / "arsenal.json").write_text(json.dumps({
            "weapons": {
                "text-split-enter": {"binding": "builtin_weapon"}
            }
        }), encoding="utf-8")
        (hf / "expanded-prompt.md").write_text(
            "# Story\n\n## Execution Manifest\n\n"
            "- id: text-split-enter\n  used_by: scene_1\n"
            "- id: card-cascade\n  used_by: scene_2\n",
            encoding="utf-8",
        )
        r = check_arsenal(tmp_path)
        assert r.status is GateStatus.YELLOW
        assert "card-cascade" in r.evidence or "1" in r.evidence
