# Dogfood Yellow Gates + HyperFrames Capability Radar

> Date: 2026-07-02
> Status: implementation design for post-dogfood hardening
> Input report: `F:/Framepack-01-test/reports/2026-07-02-non-template-dogfood/REPORT.md`

## Verdict

The dogfood did not find a broken kitchen. It found three missing labels on the pass counter:

1. script direction is selected but not proven as a director decision,
2. scene continuity is described but boundary proofs are not scaffolded into the production ledger,
3. context sync exists at the workbench root but not at the case level.

Separately, the AIE / HyperFrames discussion shows Framepack needs a capability radar: before it asks an Agent to rebuild an effect or manually gather assets, it should know whether HyperFrames already has the official road.

## Design Goals

- Keep the implementation small and evidence-based: no state machine, no database.
- Add detectors/templates that make the next test session know what proof to provide.
- Preserve role boundaries: Framepack directs; HyperFrames captures, catalogs, builds, previews, renders.
- Treat HyperFrames capability knowledge as a versioned capability map, not scattered prose.

## 1. Script / Timing Evidence

Current state: `script-lanes.md` can say `lane: A` while `user_confirmed: false`, producing yellow. Audio evidence already has `.framepack/audio-cues.json`.

Change:

- Update `script-lanes.md` template to include a third valid proof path: `director_decision: true` plus `decision_reason:`.
- Update `check_script_lanes()`:
  - RED: missing file or no selected lane.
  - YELLOW: selected lane but no confirmation, no director decision, no waiver.
  - GREEN: selected lane + one of:
    - `user_confirmed: true`
    - `director_decision: true` with non-empty `decision_reason`
    - non-empty `waiver_reason`
- Update placeholder detection to treat these new fields as placeholders until filled.

Why: autonomous director mode should not require fake user confirmation. It needs a signed kitchen ticket: “I chose Lane A because X.”

## 2. Boundary Proof Scaffolding

Current state: `scene_continuity` only turns green when `timeline-manifest.json` has `scene.continuity.boundary_proofs`, but `sync_timeline_from_project()` does not scaffold the place where proofs belong.

Change:

- When syncing scenes, ensure every scene has:
  ```json
  "continuity": {
    "outgoing_seed": "",
    "incoming_match": "",
    "boundary_proofs": []
  }
  ```
- For every boundary between scene N and N+1, add a required proof entry under top-level `proofs.required`:
  ```json
  {
    "type": "boundary",
    "from": "scene_01",
    "to": "scene_02",
    "time": 6.0,
    "label": "scene_01_to_scene_02_boundary",
    "required": true
  }
  ```
- Do not auto-green the gate. Empty `boundary_proofs` remain yellow. The point is to give the test/build agent a proof shelf, not forge proof.

Why: this changes “remember to prove the cut works” into “the ledger tells you exactly which cuts need evidence.”

## 3. Case-level Context Sync

Current state: hydration writes `F:/Framepack-01-test/.framepack/context-sync.md`, but case readiness checks `case/.framepack/context-sync.md`.

Change:

- `hydrate_context(workbench_root, plugin_dir)` still writes the workbench report.
- Additionally write a slim copy of the final context-sync report to each `cases/*/.framepack/context-sync.md` for standard cases that have `AGENTS.md` or `CLAUDE.md`.
- Include `scope: case` and `case_dir:` in the copied report.

Why: test sessions enter a case directory. The case should carry its own hygiene receipt.

## 4. HyperFrames Capability Radar

Current state: capability knowledge exists in docs/skills but is not a project artifact or readiness gate.

Change:

- Add `core/hyperframes_capabilities.py` with a versioned built-in capability map covering:
  - official workflows: product-launch-video, website-to-video, faceless-explainer, pr-to-video, embedded-captions, talking-head-recut, motion-graphics, remotion-to-hyperframes
  - CLI capabilities: capture, catalog/add, tts, transcribe, remove-background, lint/validate/inspect/snapshot/preview/render, lambda
  - official reuse surfaces: skills pack (`npx skills add heygen-com/hyperframes`), registry/catalog components, logo outro, parallax/logo patterns, sponsor/logo walls as capability candidates
- Add `scripts/framepack_hyperframes_capabilities.py --format json|markdown`.
- Add a readiness gate `HyperFrames Capability Alignment`:
  - GREEN when `.framepack/hyperframes-capability-alignment.md` exists with at least one `used:` or `waived:` entry.
  - YELLOW when the project mentions URL/website/catalog/logo/sponsor/capture but no capability-alignment artifact exists.
  - None when not applicable.
- Add a template for `.framepack/hyperframes-capability-alignment.md`.

Why: Framepack should check the equipment room before asking the cook to whittle chopsticks by hand.

## Test Plan

TDD order:

1. Script lane green via director decision / waiver.
2. Timeline sync scaffolds continuity and required boundary proof entries while preserving existing proofs.
3. Hydration writes case-level context-sync.md.
4. Capability map script emits website-to-video/capture/catalog/skills-pack entries.
5. Capability alignment gate warns when URL/capture-ish project lacks artifact and greens when a decision artifact exists.
6. Full plugin suite + deployed suite + dogfood smoke + md5 sync.

## Non-goals

- Do not auto-install HyperFrames latest or official skills.
- Do not bump Framepack version in this change.
- Do not mark boundary continuity green without actual proof evidence.
- Do not replace HyperFrames workflows; just route/delegate to them.
