# Director Final Gates Design

> Framepack v0.15.x post-release hardening design. This is a design-to-implementation record for turning the Ederson/ManU test report into reusable Framepack workflow gates, not a one-off animation fix.

## Goal

Harden Framepack's HyperFrames video workflow so a project can be clearly labeled as `draft`, `revision_required`, `final_candidate`, or `standard_sample` based on director-level evidence — not only on HyperFrames lint/render success.

The motivating sample is `F:/Framepack-01-test/cases/ederson-manutd/TEST_REPORT_2026-06-24.md`, whose verdict was:

> Draft 通过 / 不建议直接发布

That report proves Framepack can reach a renderable draft, but it also exposes four reusable workflow gaps:

1. Key-frame visual acceptance is still mostly human prose.
2. Asset intake records existence, but not asset role / legal / encoding / quality constraints.
3. Handoff Manifest constrains production intent, but does not yet carry enough final-frame reject criteria.
4. Readiness/Taste gates distinguish missing artifacts, but not `draft pass` vs `final blocked` cleanly.

## Non-goal

Do **not** fix `cases/ederson-manutd/index.html` as part of this work. The case is evidence and a regression specimen. Framepack should learn a gate; the individual composition can be refined later by HyperFrames production work.

## Root-cause analysis

### Symptom from test report

- `python -m pytest tests/test_polish_contract.py -q` passed: structural contract was satisfied.
- `npm run check` passed with warnings: HyperFrames structure was renderable.
- `snapshot` and `render` succeeded: a real MP4 was produced.
- Human/visual review still rejected final release because:
  - Scene 4 / 14.8s had residual layer/occlusion conflicts around face/shoulder/arm.
  - Devil-ball trail existed but was not visually strong enough at key timestamps.
  - Contrast/overflow/media-keyframe warnings remained non-blocking but final-relevant.

### Root cause

Existing Framepack gates answer “do the expected artifacts exist?” better than “does the director contract prove this is final-safe?”

Current modules already have the right seams:

- `core/handoff_manifest.py` — place to declare director acceptance contract.
- `core/pre_render_audit.py` — place to surface taste/final-readiness warnings before render.
- `core/render_readiness.py` — place to label workflow evidence.
- `scripts/framepack_readiness.py` — CLI/report surface.
- Tests already exist for all three modules.

So the fix should be additive: extend these seams with product gates, not create a parallel framework.

## Proposed architecture

### 1. Director Acceptance Contract in Handoff Manifest

Add a machine-readable `director_acceptance` block to every manifest:

```json
{
  "director_acceptance": {
    "hero_frames_required": true,
    "minimum_hero_frames": 3,
    "must_read_required": true,
    "reject_if_required": true,
    "default_reject_if": [
      "primary subject face or logo is unintentionally occluded",
      "more than two identity layers compete in a reveal frame",
      "recurring motif is present but unreadable at proof timestamps",
      "contrast/overflow/media warnings are waived without rationale"
    ]
  }
}
```

This does not require Framepack to know every future timestamp. It establishes the contract that generated handoff artifacts should include them.

### 2. Pre-render Taste Audit as final-readiness audit

Enhance `audit_pre_render()` to inspect `.framepack/handoff-manifest.md`, `.framepack/taste-audit.md`, and `.framepack/asset-intake.md` for final-readiness evidence:

- `missing_hero_frame_acceptance_contract` — P1 when manifest/story bible does not mention hero/proof frames plus must-read/reject-if conditions.
- `taste_audit_missing_final_verdict` — P1 when a taste audit exists but has no verdict/reject criteria.
- `asset_roles_missing` — P2 when asset intake lists assets but does not classify roles such as `visual_subject`, `brand_mark`, `motion_footage`, `audio`, `placeholder`.
- `motion_footage_quality_unrecorded` — P2 when video assets are listed without keyframe/encoding/re-encode evidence.

Keep the audit advisory. It can recommend `NEEDS_USER_DECISION`, but it must not block the render command.

### 3. Readiness Board final label semantics

Current labels are `draft`, `provisional`, `standard_sample`. Add an intermediate label:

- RED gates → `draft`
- no RED but final-evidence gates YELLOW → `revision_required`
- no RED, ordinary advisory YELLOW → `provisional`
- all GREEN → `standard_sample`

Add a new gate `Director Acceptance` after `Handoff Manifest`:

- RED: no handoff/story bible evidence for hero/proof frames.
- YELLOW: hero frames exist but lack must-read/reject-if criteria.
- GREEN: hero/proof frames plus must-read and reject-if criteria present.

This is the “现场导演拿着审片清单卡 final”的 gate.

### 4. Asset role gate stays lightweight

Do not build a full media analyzer in this pass. The first increment should only check whether the asset-intake document captures roles and production constraints. Actual ffprobe/media checking can be a future CLI extension.

## Acceptance criteria

1. New tests fail before implementation and pass after implementation.
2. Existing full Framepack plugin suite still passes.
3. `framepack_readiness.py` on the Ederson sample reports the new Director Acceptance / final-readiness evidence instead of treating renderability as final readiness.
4. Modified plugin files are synced to `F:/Hermes_windows/plugins/framepack/`.
5. Source-vs-deployed MD5 matches for every modified plugin file.
6. Deployed runtime smoke imports the deployed modules and exercises the new gates.

## Risks

- Regex-only scanners can false-positive comments or generic text. Mitigation: use conservative text heuristics and tests for missing vs present contracts.
- Making gates too strict could annoy draft workflows. Mitigation: advisory only; final labels communicate risk without blocking.
- The design must not move Framepack into HTML audit ownership. HyperFrames still owns structure/render; Framepack owns director acceptance evidence.

## Implementation sketch

- Add helper functions in `core/render_readiness.py`:
  - `_has_director_acceptance_contract(text)`
  - `check_director_acceptance(project_dir)`
- Add `Director Acceptance` to `GATE_NAMES_IN_ORDER` and `_GATE_CHECKERS`.
- Update `recommended_label` logic to emit `revision_required` when final gates are yellow.
- Add helper functions in `core/pre_render_audit.py` for lightweight evidence checks.
- Extend `build_handoff_manifest()` with default `director_acceptance` contract.
- Add tests in:
  - `tests/test_handoff_manifest.py`
  - `tests/test_pre_render_audit.py`
  - `tests/test_render_readiness.py`

## Product framing

Framepack is not becoming the renderer cop. It is becoming the director who says:

> “可以出 draft，但 final 之前，这些关键帧必须拿证据说话。”

That is the missing product muscle exposed by the Ederson report.
