# Framepack Gate Engine Implementation Plan

> **For Hermes:** Execute directly in this session with strict TDD. Do not commit. Sync changed plugin files to deployed plugin directory and MD5-verify before final completion.

**Goal:** Refactor Framepack readiness gates into a managed Gate Engine and implement P0/P1/P2 Director-intent closure gates.

**Architecture:** Introduce `core/gates/` with shared types/context/engine/registry. Keep `core/render_readiness.py` as a compatibility facade exporting the existing public API. Add focused gate modules for source extraction, design choice, storyboard preview, audio cues, scene continuity, control profile consistency, and workflow-aware asset depth.

**Tech Stack:** Python stdlib, pytest, existing Framepack plugin modules.

---

## Task 1: Gate Engine foundation with legacy compatibility

**Objective:** Create the `core/gates` package and prove existing readiness API still works.

**Files:**
- Create: `framepack-plugin/core/gates/__init__.py`
- Create: `framepack-plugin/core/gates/types.py`
- Create: `framepack-plugin/core/gates/artifacts.py`
- Create: `framepack-plugin/core/gates/parsers.py`
- Create: `framepack-plugin/core/gates/engine.py`
- Create: `framepack-plugin/core/gates/legacy.py`
- Modify: `framepack-plugin/core/render_readiness.py`
- Test: `framepack-plugin/tests/test_gate_engine_foundation.py`

**Steps:**
1. Write failing tests asserting `build_readiness_board()` still returns existing gate names and `render_board_markdown()` works.
2. Run targeted test and observe import/failure.
3. Add shared dataclasses and engine.
4. Move/wrap legacy checkers safely.
5. Run targeted tests and existing readiness tests.

## Task 2: Add new artifact templates

**Objective:** Add source/design/storyboard templates and expose them through `ALL_TEMPLATES`.

**Files:**
- Modify: `framepack-plugin/core/gate_templates.py`
- Modify as needed: `framepack-plugin/core/case_scaffolder.py`
- Test: `framepack-plugin/tests/test_gate_templates.py`

**Steps:**
1. Write failing template tests for `source-intake.md`, `design-choice.md`, `storyboard-preview.md`.
2. Implement templates.
3. Run tests.

## Task 3: Source Extraction gate

**Objective:** URL/source-driven projects require source-intake evidence or explicit extraction failure/waiver.

**Files:**
- Create: `framepack-plugin/core/gates/source_extraction.py`
- Modify: `framepack-plugin/core/gates/registry.py`
- Test: `framepack-plugin/tests/test_gate_source_extraction.py`

**Steps:**
1. Test RED when handoff/source URL exists and source-intake missing.
2. Test GREEN when method/summary/narrative/must-preserve fields exist.
3. Test YELLOW when extraction failed with reason/waiver.
4. Implement minimal gate.

## Task 4: Storyboard Preview gate

**Objective:** Expanded prompts for user-facing videos require storyboard preview with Visual/Feel/Key and confirmation/waiver.

**Files:**
- Create: `framepack-plugin/core/gates/storyboard_preview.py`
- Modify: `framepack-plugin/core/gates/registry.py`
- Test: `framepack-plugin/tests/test_gate_storyboard_preview.py`

**Steps:**
1. Test RED when expanded-prompt has scenes but storyboard missing.
2. Test GREEN with Visual/Feel/Key, recurring motifs, user_confirmed true.
3. Test YELLOW when storyboard exists but not confirmed.
4. Implement gate.

## Task 5: Audio Cue gate

**Objective:** BGM/beat/drop/audio-reactive mentions require valid audio cue ledger or manual/waiver evidence.

**Files:**
- Create: `framepack-plugin/core/gates/audio_cues.py`
- Modify: `framepack-plugin/core/gates/registry.py`
- Test: `framepack-plugin/tests/test_gate_audio_cues.py`

**Steps:**
1. Test no audio mention means gate not applicable or GREEN/NA not shown.
2. Test YELLOW/RED when BGM/drop is mentioned with no cue evidence.
3. Test GREEN with valid `.framepack/audio-cues.json`.
4. Test YELLOW with explicit manual cue plan/waiver.
5. Implement gate.

## Task 6: Scene Continuity gate

**Objective:** Multi-scene projects require Kinetic Continuity and timeline/proof binding.

**Files:**
- Create: `framepack-plugin/core/gates/scene_continuity.py`
- Modify: `framepack-plugin/core/timeline_manifest.py` if needed for parsing continuity metadata
- Modify: `framepack-plugin/core/gates/registry.py`
- Test: `framepack-plugin/tests/test_gate_scene_continuity.py`

**Steps:**
1. Test RED for multi-scene prompt with no Kinetic Continuity.
2. Test YELLOW when Kinetic Continuity text exists but timeline continuity absent.
3. Test GREEN when timeline scenes carry continuity/boundary proofs or waiver.
4. Implement gate and parser support as needed.

## Task 7: Control Profile expanded consistency gate

**Objective:** Extend checks to motion_dynamism and creative_autonomy while preserving existing restraint audit behavior.

**Files:**
- Create: `framepack-plugin/core/gates/control_profile.py`
- Modify: `framepack-plugin/core/restraint_audit.py` only if necessary
- Modify: `framepack-plugin/core/gates/registry.py`
- Test: `framepack-plugin/tests/test_gate_control_profile.py`

**Steps:**
1. Test low motion_dynamism + many aggressive verbs → YELLOW.
2. Test high motion_dynamism + only soft verbs → YELLOW.
3. Test low creative_autonomy without style/reference/weapon support → YELLOW.
4. Test balanced supported profile → GREEN.
5. Implement gate.

## Task 8: Workflow-aware Asset Intake gate

**Objective:** Existing Asset Intake should check workflow-specific expected assets, not just file existence.

**Files:**
- Create/Modify: `framepack-plugin/core/gates/asset_intake.py`
- Modify: `framepack-plugin/core/gates/legacy.py` or registry to replace old asset gate
- Test: `framepack-plugin/tests/test_gate_asset_intake_workflow.py`

**Steps:**
1. Test product-launch-video missing product/CTA/audio decisions → YELLOW.
2. Test embedded-captions expects source video/caption style/transcript decision.
3. Test explicit missing/waiver keeps advisory state, not crash.
4. Implement gate.

## Task 9: Registry integration and output management

**Objective:** Group gates by category and keep hook summary compact.

**Files:**
- Modify: `framepack-plugin/core/gates/engine.py`
- Modify: `framepack-plugin/hooks/on_pre_tool_call.py` if needed
- Test: `framepack-plugin/tests/test_gate_engine_integration.py`

**Steps:**
1. Test board includes new gate names in expected order.
2. Test markdown groups categories or at least carries category metadata.
3. Test compact summary remains one-line and not wall-of-text.
4. Implement.

## Task 10: Verification and deployment sync

**Objective:** Prove source and deployed plugin are consistent.

**Commands:**
- `cd framepack-plugin && python -m pytest tests/test_gate_*.py -q -o "addopts="`
- `cd framepack-plugin && python -m pytest tests/ -q -o "addopts="`
- static scan for secrets/shell injection patterns
- copy changed plugin files to `F:/Hermes_windows/plugins/framepack/`
- MD5 compare source vs deployed changed files
- deployed import smoke for readiness board

**Completion criteria:**
- Targeted gate tests pass.
- Full plugin tests pass.
- Deployment MD5 checks pass.
- Smoke import from deployed plugin passes.
