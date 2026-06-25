# Director Final Gates Implementation Plan

> **For Hermes:** Implement directly with TDD, then run independent review and deployment verification.

**Goal:** Add Framepack director-level final-readiness gates so HyperFrames projects can distinguish renderable draft from final candidate.

**Architecture:** Extend the existing advisory workflow seams: `handoff_manifest.py` declares the acceptance contract, `pre_render_audit.py` reports missing evidence before preview/render, and `render_readiness.py` labels final-readiness evidence. No HTML rewriting, no case-specific animation fixes.

**Tech Stack:** Python stdlib, pytest, existing Framepack plugin modules.

---

## Task 1: Add manifest-level director acceptance defaults

**Objective:** Every generated Handoff Manifest carries a machine-readable acceptance contract.

**Files:**
- Modify: `framepack-plugin/core/handoff_manifest.py`
- Test: `framepack-plugin/tests/test_handoff_manifest.py`

**Steps:**
1. Add a failing test asserting `manifest["director_acceptance"]` exists.
2. Expected defaults:
   - `hero_frames_required is True`
   - `minimum_hero_frames == 3`
   - `must_read_required is True`
   - `reject_if_required is True`
   - default reject-if strings mention occlusion, identity layers, motif readability, and waived warnings.
3. Implement constants and add the block to `build_handoff_manifest()`.
4. Run `python -m pytest tests/test_handoff_manifest.py -q -o "addopts="`.

## Task 2: Add pre-render final-readiness findings

**Objective:** Pre-render audit surfaces missing final acceptance evidence as advisory findings.

**Files:**
- Modify: `framepack-plugin/core/pre_render_audit.py`
- Test: `framepack-plugin/tests/test_pre_render_audit.py`

**Steps:**
1. Add tests for:
   - Missing hero/proof frame + must-read/reject-if evidence emits `missing_hero_frame_acceptance_contract` P1.
   - Filled handoff/taste evidence suppresses that finding.
   - Asset intake with assets but no roles emits `asset_roles_missing` P2.
   - Motion footage with no encoding/keyframe/re-encode evidence emits `motion_footage_quality_unrecorded` P2.
2. Confirm RED with targeted pytest.
3. Implement lightweight text heuristics only.
4. Preserve existing advisory verdict behavior.
5. Run `python -m pytest tests/test_pre_render_audit.py -q -o "addopts="`.

## Task 3: Add Director Acceptance readiness gate and label semantics

**Objective:** Readiness Board represents final-readiness evidence, not just artifact existence.

**Files:**
- Modify: `framepack-plugin/core/render_readiness.py`
- Test: `framepack-plugin/tests/test_render_readiness.py`

**Steps:**
1. Add tests for new gate order and statuses:
   - Missing contract → RED.
   - Hero/proof frames without must-read/reject-if → YELLOW.
   - Hero/proof frames with must-read and reject-if → GREEN.
2. Add test that a no-RED board with yellow Director Acceptance gets `recommended_label == "revision_required"`.
3. Confirm RED.
4. Implement helper and gate.
5. Update existing green-project fixtures with the new evidence.
6. Run `python -m pytest tests/test_render_readiness.py -q -o "addopts="`.

## Task 4: Regression sample smoke on Ederson workbench case

**Objective:** Prove the new gates diagnose the workflow gap on the real sample without editing that case.

**Files:**
- No source edits.

**Steps:**
1. Run `python scripts/framepack_readiness.py F:/Framepack-01-test/cases/ederson-manutd --json --no-write` from `framepack-plugin`.
2. Expect the output to include `Director Acceptance` and a non-final label if proof evidence is missing/incomplete.
3. Do not modify the case files.

## Task 5: Full verification and deployment sync

**Objective:** Verify source and active deployed plugin are consistent.

**Files:**
- Sync modified files to `F:/Hermes_windows/plugins/framepack/`.

**Steps:**
1. Run targeted tests for the three changed modules.
2. Run full plugin suite: `python -m pytest tests/ -q -o "addopts="`.
3. Copy changed source/test/design files only where applicable; plugin runtime files must be synced to deployment.
4. Verify MD5 source vs deployed for modified plugin runtime files.
5. Run deployed runtime smoke importing from `F:/Hermes_windows/plugins/framepack`.

## Task 6: Independent review

**Objective:** Get a fresh-context review of the implementation.

**Steps:**
1. Collect `git diff -- framepack-plugin/core framepack-plugin/tests .hermes/designs .hermes/plans`.
2. Run static added-line scan for secrets / shell injection / eval / pickle.
3. Dispatch reviewer subagent with diff and scan results.
4. Fix blocking findings, if any, with regression tests first.

## Stop conditions

- Do not commit unless explicitly asked later.
- Do not edit `F:/Framepack-01-test/cases/ederson-manutd/index.html`.
- Do not turn advisory gates into render blockers.
