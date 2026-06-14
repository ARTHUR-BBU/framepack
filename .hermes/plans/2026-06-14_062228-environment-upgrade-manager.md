# Framepack Environment & Upgrade Manager Implementation Plan

> **For Hermes:** Use executing-plans and test-driven-development to implement this plan task-by-task.

**Goal:** Build the first production slice of Framepack's Environment & Upgrade Manager: HyperFrames support-window classification plus skill overlay merge/provenance primitives.

**Architecture:** Start with pure, deterministic core modules that require no live network or shell: `core/hyperframes_support.py` for version/support-window decisions and `core/skill_overlay_manager.py` for managed hardening overlays. Keep CLI doctor/upgrade scripts for a later slice after the primitives are proven. This keeps TDD tight and avoids side effects.

**Tech Stack:** Python 3.11 stdlib, pytest, existing Framepack plugin layout under `framepack-plugin/`.

---

## Scope for this first implementation slice

Implement two foundations:

1. HyperFrames support window classifier.
2. Skill overlay manager that applies Framepack-shipped hardening blocks to local HyperFrames skills without deleting user-local blocks.

Do not yet implement live installers, npm extraction, or destructive updates. Those depend on these primitives.

## Task 1: Add HyperFrames support-window tests

**Objective:** Define version classification behavior before implementation.

**Files:**
- Create: `F:\hyperframes\framepack-plugin\tests\test_hyperframes_support.py`
- Create later: `F:\hyperframes\framepack-plugin\core\hyperframes_support.py`

**Tests to add:**

- supported version returns `supported` and `allow_handoff=True`.
- below `supported_min` returns `too_old`, allows discovery, blocks handoff unless degraded mode.
- below `hard_block_below` returns `hard_too_old`, blocks handoff.
- newer patch in same `soft_max` band returns `newer_same_band`, requires smoke/probe, allows guarded handoff only after smoke.
- unknown newer minor/major returns `unknown_newer`, requires discovery-only probes and isolated smoke.
- semver-like comparison handles prerelease/build-ish suffixes by ignoring non-numeric suffix for ordering.

**Verification:**

Run:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_hyperframes_support.py -q -o "addopts="
```

Expected RED: import failure for `core.hyperframes_support`.

## Task 2: Implement `core/hyperframes_support.py`

**Objective:** Make support-window tests pass with small pure functions.

**Files:**
- Create: `F:\hyperframes\framepack-plugin\core\hyperframes_support.py`

**Implementation outline:**

- Enum/string constants for statuses:
  - `supported`
  - `too_old`
  - `hard_too_old`
  - `newer_same_band`
  - `unknown_newer`
- Dataclasses:
  - `HyperFramesSupportWindow`
  - `HyperFramesVersionDecision`
- Functions:
  - `parse_version_tuple(version: str) -> tuple[int, int, int]`
  - `same_soft_band(version: str, soft_max: str) -> bool`
  - `classify_hyperframes_version(installed_version: str, window: HyperFramesSupportWindow, smoke_passed: bool | None = None) -> HyperFramesVersionDecision`

**Policy:**

- `hard_too_old`: block everything except discovery.
- `too_old`: allow discovery, recommend upgrade, block handoff unless user explicitly chooses degraded mode later.
- `supported`: allow normal handoff.
- `newer_same_band`: warn/probe; allow guarded handoff only if `smoke_passed=True`.
- `unknown_newer`: discovery-only until isolated smoke passes; if smoke passes, guarded mode; if fails, block.

**Verification:** same targeted pytest should pass.

## Task 3: Add skill overlay manager tests

**Objective:** Define how Framepack-shipped hardening enters local HyperFrames skills.

**Files:**
- Create: `F:\hyperframes\framepack-plugin\tests\test_skill_overlay_manager.py`
- Create later: `F:\hyperframes\framepack-plugin\core\skill_overlay_manager.py`

**Tests to add:**

- applying overlay inserts provenance managed block when absent.
- applying same overlay twice is idempotent.
- updating overlay replaces only the Framepack managed block with matching id.
- user-local block outside Framepack markers is preserved.
- official text containing equivalent phrase can mark overlay as `upstream_absorbed` and avoid duplicate insertion.
- malformed existing Framepack marker returns `manual_review_required` instead of guessing.

**Verification:** targeted pytest should fail first because module does not exist.

## Task 4: Implement `core/skill_overlay_manager.py`

**Objective:** Make overlay tests pass with deterministic text operations.

**Files:**
- Create: `F:\hyperframes\framepack-plugin\core\skill_overlay_manager.py`

**Implementation outline:**

- Dataclasses:
  - `SkillOverlay`
  - `OverlayApplyResult`
- Functions:
  - `managed_block_start(overlay)`
  - `managed_block_end(overlay)`
  - `apply_overlay(skill_text, overlay) -> OverlayApplyResult`
  - `apply_overlays(skill_text, overlays) -> OverlayApplyResult`
- Marker format:

```markdown
<!-- FRAMEPACK HARDENING START id=<id> source=framepack@<version> target=<skill> -->
...
<!-- FRAMEPACK HARDENING END id=<id> -->
```

**Policy:**

- Replace only exact matching managed block by id.
- Preserve all non-managed text, including user-local notes.
- If start marker exists without end marker, do not edit; return `manual_review_required=True`.
- If `equivalent_phrases` are already found in official/local skill text, report `upstream_absorbed=True` and skip insertion unless policy forces insert.

**Verification:** targeted pytest should pass.

## Task 5: Integrate design docs/reference metadata lightly

**Objective:** Add minimal machine-readable support metadata without building full installer.

**Files:**
- Create: `F:\hyperframes\framepack-plugin\compat\hyperframes-support.yaml` or `.json` if PyYAML dependency is undesirable.

**Recommendation:** Use JSON to avoid adding dependency.

Example:

```json
{
  "framepack_version": "0.10.1",
  "hyperframes": {
    "supported_min": "0.6.90",
    "supported_max_tested": "0.6.97",
    "soft_max": "0.6.x",
    "hard_block_below": "0.6.80",
    "unknown_newer_policy": "warn_and_probe",
    "latest_supported_for_downgrade": "0.6.97"
  }
}
```

Add a small loader if needed, or defer loader to next slice.

## Task 6: Full test and deploy sync

**Objective:** Verify source and active deployment match.

**Commands:**

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/ -q -o "addopts="
cp -r F:/hyperframes/framepack-plugin/core/* F:/Hermes_windows/plugins/framepack/core/
cp -r F:/hyperframes/framepack-plugin/compat F:/Hermes_windows/plugins/framepack/  # if compat exists
cd F:/hyperframes/framepack-plugin && python -m pytest tests/ -q -o "addopts="
```

Then run a deployed import smoke:

```bash
PYTHONPATH=F:/Hermes_windows/plugins/framepack python - <<'PY'
from core.hyperframes_support import HyperFramesSupportWindow, classify_hyperframes_version
from core.skill_overlay_manager import SkillOverlay, apply_overlay
print(classify_hyperframes_version('0.6.97', HyperFramesSupportWindow('0.6.90','0.6.97','0.6.x','0.6.80')).status)
print(apply_overlay('# Skill\n', SkillOverlay(id='x', target_skill='hyperframes', framepack_version='0.10.1', body='hello')).changed)
PY
```

Expected: `supported` and `True`.

## Task 7: Update docs/changelog if code lands

**Objective:** Record the new primitives as v0.10.2 groundwork or unreleased work.

**Files likely:**
- `F:\hyperframes\CHANGELOG.md`
- `F:\hyperframes\framepack-plugin\skills\framepack\SKILL.md`
- `F:\hyperframes\AGENTS.md` if product rules change

Do not bump release version unless explicitly deciding this is a release.

## Risks and open questions

- Full installer/updater should not be implemented until overlay and support-window primitives are stable.
- We need a later decision on whether support metadata is JSON or YAML. JSON avoids dependency.
- Need later integration with actual Hermes skill paths/profile handling; this first slice intentionally avoids writing outside test temp dirs.
- Need later UX around manual review conflicts.

## Completion criteria for first slice

- New support-window classifier tests pass.
- New overlay manager tests pass.
- Full plugin test suite passes.
- Source modules are synced to `F:\Hermes_windows\plugins\framepack\`.
- Deployed import smoke passes.
