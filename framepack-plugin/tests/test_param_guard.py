"""Param guard tests — direction 4.

Tests the pre-write parameter reference card system:
  1. extract_param_card — parses Manifest, generates reference card
  2. No manifest → None
  3. Empty params → only weapon names, no values
  4. Exact value matching
  5. quality_audit P1 includes canonical code snippet
"""

import tempfile
import shutil
from pathlib import Path

import pytest


# ── Test fixtures ────────────────────────────────────────────────────────

SAMPLE_EXPANDED_WITH_MANIFEST = """# Brand Video — Expanded Prompt

## Scene 1: Hero Reveal
Opening with staggered text reveal.

## Execution Manifest
```yaml
weapons:
  - id: text-split-enter
    source: builtin
    used_by: scene_1
    params:
      staggerAmount: 0.85
      ease: "power2.out"
      duration: 1.2

  - id: particle-field
    source: builtin
    used_by: scene_2
    params:
      particleCount: 40
      radius: 120

  - id: card-cascade-reveal
    source: builtin
    used_by: scene_3
    params:
      columns: 3
      gap: 24
      staggerAmount: 0.15
```
"""

SAMPLE_EXPANDED_NO_MANIFEST = """# Brand Video — Expanded Prompt

## Scene 1: Hero Reveal
Opening with staggered text reveal.
"""

SAMPLE_EXPANDED_HANDWRITE_ONLY = """# Brand Video

## Execution Manifest
```yaml
weapons:
  - HANDWRITE: scene_4, reason: custom timeline magic

  - id: text-split-enter
    source: builtin
    used_by: scene_1
    params:
      staggerAmount: 0.85
```
"""

SAMPLE_EXPANDED_NO_PARAMS = """# Brand Video

## Execution Manifest
```yaml
weapons:
  - id: text-split-enter
    source: builtin
    used_by: scene_1

  - id: particle-field
    source: builtin
    used_by: scene_2
```
"""

# ── Test: extract_param_card ───────────────────────────────────────────


class TestExtractParamCard:

    def test_extracts_card_from_manifest(self):
        """Should generate reference card with all weapon params."""
        d = self._make_project(SAMPLE_EXPANDED_WITH_MANIFEST)
        try:
            from core.param_guard import extract_param_card
            card = extract_param_card(str(d))
            assert card is not None
            assert "text-split-enter" in card
            assert "0.85" in card
            assert "power2.out" in card
            assert "1.2" in card
            assert "particle-field" in card
            assert "40" in card
            assert "120" in card
            assert "card-cascade-reveal" in card
            assert "columns: 3" in card
            assert "gap: 24" in card
        finally:
            shutil.rmtree(d)

    def test_returns_none_when_no_manifest(self):
        """Should return None when expanded-prompt.md has no Execution Manifest."""
        d = self._make_project(SAMPLE_EXPANDED_NO_MANIFEST)
        try:
            from core.param_guard import extract_param_card
            card = extract_param_card(str(d))
            assert card is None
        finally:
            shutil.rmtree(d)

    def test_skips_handwrite_weapons(self):
        """Should not list HANDWRITE weapons in the card."""
        d = self._make_project(SAMPLE_EXPANDED_HANDWRITE_ONLY)
        try:
            from core.param_guard import extract_param_card
            card = extract_param_card(str(d))
            assert card is not None
            assert "HANDWRITE" not in card
            assert "text-split-enter" in card
            assert "0.85" in card
        finally:
            shutil.rmtree(d)

    def test_shows_weapon_name_only_when_no_params(self):
        """Weapons without params should appear with name only, no param lines."""
        d = self._make_project(SAMPLE_EXPANDED_NO_PARAMS)
        try:
            from core.param_guard import extract_param_card
            card = extract_param_card(str(d))
            assert card is not None
            assert "text-split-enter" in card
            assert "particle-field" in card
            # No specific values since no params
            # But weapon names should be present
            lines = [l.strip() for l in card.split("\n") if l.strip()]
            assert any("text-split-enter" in l for l in lines)
            assert any("particle-field" in l for l in lines)
        finally:
            shutil.rmtree(d)

    def test_card_contains_warning_footer(self):
        """Card should contain a warning about using exact values."""
        d = self._make_project(SAMPLE_EXPANDED_WITH_MANIFEST)
        try:
            from core.param_guard import extract_param_card
            card = extract_param_card(str(d))
            assert "EXACT" in card or "exact" in card.lower()
        finally:
            shutil.rmtree(d)

    def test_values_match_manifest_exactly(self):
        """Card values must match manifest values character-for-character."""
        d = self._make_project(SAMPLE_EXPANDED_WITH_MANIFEST)
        try:
            from core.param_guard import extract_param_card
            card = extract_param_card(str(d))
            # 0.85 not 0.5, power2.out not power3.out
            assert "0.85" in card
            assert "0.5" not in card
            assert "power2.out" in card
            assert "power3.out" not in card
            assert "1.2" in card
        finally:
            shutil.rmtree(d)

    def test_returns_none_for_missing_expanded_prompt(self):
        """Should return None when .hyperframes/expanded-prompt.md doesn't exist."""
        d = Path(tempfile.mkdtemp())
        try:
            from core.param_guard import extract_param_card
            card = extract_param_card(str(d))
            assert card is None
        finally:
            shutil.rmtree(d)

    # ── helpers ──

    @staticmethod
    def _make_project(expanded_content: str) -> Path:
        d = Path(tempfile.mkdtemp())
        hf = d / ".hyperframes"
        hf.mkdir()
        hf.joinpath("expanded-prompt.md").write_text(expanded_content, encoding="utf-8")
        return d


# ── Test: quality_audit P1 canonical snippet ────────────────────────────


class TestQualityAuditCanonicalSnippet:
    """When P1 weapon_parameter_drift fires, issue.details should include
    a 'canonical_snippet' key with the correct function call."""

    def test_drift_issue_includes_canonical_snippet(self):
        """P1 drift issue should include canonical code snippet."""
        from core.quality_audit import _audit_parameter_drift, _canonical_function_name
        from core.execution_manifest import ManifestWeapon

        weapon = ManifestWeapon(
            id="text-split-enter",
            source="builtin",
            used_by=["scene_1"],
            params={"staggerAmount": 0.85, "ease": "power2.out", "duration": 1.2},
        )
        manifest = [weapon]

        # HTML uses the CORRECT canonical function name but WRONG param values — drift
        html = """
        <script>
        textSplitEnter(".hero-text", {
            staggerAmount: 0.5,
            ease: "power3.out",
            duration: 2.0
        });
        </script>
        """

        d = Path(tempfile.mkdtemp())
        try:
            issues = _audit_parameter_drift(d, html, manifest)
            assert len(issues) == 1
            issue = issues[0]
            assert issue.code == "weapon_parameter_drift"
            assert issue.severity == "P2"
            # The canonical snippet should be in details
            assert "canonical_snippet" in (issue.details or {}), \
                "P2 drift issue should include canonical_snippet in details"
            snippet = issue.details["canonical_snippet"]
            assert "0.85" in snippet
            assert "power2.out" in snippet
            assert "1.2" in snippet
        finally:
            shutil.rmtree(d)

    def test_no_drift_no_canonical_snippet(self):
        """No drift → issue should not be raised (no need for snippet)."""
        from core.quality_audit import _audit_parameter_drift
        from core.execution_manifest import ManifestWeapon

        weapon = ManifestWeapon(
            id="text-split-enter",
            source="builtin",
            used_by=["scene_1"],
            params={"staggerAmount": 0.85, "ease": "power2.out", "duration": 1.2},
        )
        manifest = [weapon]

        # HTML with CORRECT values — no drift
        html = """
        <script>
        textSplitEnter(".hero-text", {
            staggerAmount: 0.85,
            ease: "power2.out",
            duration: 1.2
        });
        </script>
        """

        d = Path(tempfile.mkdtemp())
        try:
            issues = _audit_parameter_drift(d, html, manifest)
            drift_issues = [i for i in issues if i.code == "weapon_parameter_drift"]
            assert len(drift_issues) == 0
        finally:
            shutil.rmtree(d)
