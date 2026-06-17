# Framepack / HyperFrames Test Workbench Structure

Use this when a release or test-team workflow needs one or more real case projects under a shared local workbench.

## Why this exists

A messy workbench causes three recurring failures:

1. New case projects inherit stale files from older experiments.
2. People delete the old scene to make the root "look clean" and lose the very evidence needed for release/debug review.
3. Root-level `AGENTS.md` (product/workbench rules) and case-local `AGENTS.md` (HyperFrames authoring rules) get treated as duplicates instead of layered scopes.

## Recommended layout

```text
<workbench>/
├── AGENTS.md
├── .hermes/
│   ├── CONTEXT.md
│   └── designs/
├── cases/
│   ├── pearl-luxe-30s/
│   ├── watch-launch-15s/
│   └── legacy-root-composition/
├── reports/
│   ├── v0.10.3/
│   └── v0.10.6/
└── scratch/
```

## What goes where

### Keep at workbench root

- `AGENTS.md`
- `.hermes/`
- `cases/`
- `reports/`
- `scratch/`

The root is the control room, not the active set.

### Put inside `cases/<name>/`

- `index.html`
- `frame.md`
- `.hyperframes/`
- `.framepack/`
- assets / renders / snapshots
- `package.json`, `meta.json`, `hyperframes.json`
- case-local `AGENTS.md`

If it is part of building, auditing, or replaying one concrete composition, it belongs with that case.

### Put inside `reports/<version>/`

- test-team markdown report
- test-team JSON report
- case quality audit JSON/MD
- proof review outputs that are meant to be consumed as release evidence

Keep a copy in the workbench even when the source repo also owns the canonical report path.

### Put inside `cases/legacy-*`

Use this for old root-level compositions that already contain meaningful evidence:
- render outputs
- snapshots / contact sheets
- `.framepack/arsenal.json`
- `.framepack/timeline-manifest.json`
- prompt files

That is not scratch; it is historical evidence.

### Put inside `scratch/`

Only disposable experiments that have no ongoing audit or release value.

## Root vs case-local AGENTS.md

Read them in this order:

1. root `AGENTS.md`
2. case-local `AGENTS.md`

Interpretation:

- root `AGENTS.md` = workbench constitution
  - product boundaries
  - release-test rules
  - global guardrails

- case-local `AGENTS.md` = stage manual
  - HyperFrames composition structure
  - `window.__timelines`
  - `data-*` rules
  - `npm run check` / render flow

The rule of thumb:
- root tells you what lane not to leave
- case tells you how this exact composition is authored and verified

## Restructuring checklist

1. Create `cases/`, `reports/`, and `scratch/` if missing.
2. Move the active case directory under `cases/`.
3. Sweep root-level composition artifacts into `cases/legacy-<name>/` instead of deleting them.
4. Move or copy historical release reports into `reports/<version>/`.
5. From the new case path, run `npm run check` to confirm the move did not break relative-path assumptions.
6. If the case participates in a test-team command, rerun the exact command with the new `--case-project` path.

## Pitfalls

- Do not leave `index.html`, `frame.md`, and `video.mp4` loose in the workbench root once the case is known-good enough to preserve.
- Do not delete old root-level experiments just because a cleaner structure exists now; archive them as `legacy-*` first.
- Do not treat root and case `AGENTS.md` as contradictions by default. Most of the time they are layered scopes.
- Do not assume moving the case is enough; always re-run `npm run check` from the new path.
