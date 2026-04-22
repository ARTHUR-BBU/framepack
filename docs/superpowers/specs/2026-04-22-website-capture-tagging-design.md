# Website Capture Tagging Design

## Summary

Add a lightweight planning layer to website `captureTargets` so generated packages do not only say what to capture, but also why each capture matters and what kind of asset it should become.

The first version stays rule-based and conservative:

- narrative label first
- visual form hint second
- fallback safely to `highlight`

## Scope

This design covers only:

- website-generated `captureTargets`
- rule-based label assignment
- package output through `ASSET_PLAN.json` and `HANDOFF.md`

This design does not cover:

- screenshot automation
- browser capture
- model-based semantic classification
- markdown-specific capture tagging
- new scene planners

## Design

### 1. Tag model

Each website `captureTarget` should carry:

- `purposeTag`
  - `hero`
  - `proof`
  - `workflow`
  - `highlight`
- `assetForm`
  - `screenshot`
  - `section-card`
  - `text-overlay`

`purposeTag` is the primary label.  
`assetForm` is a secondary production hint.

### 2. Classification strategy

The first version should be fully rule-based.

Use section position and section text as signals:

- first section defaults to `hero`
- sections with words like `how`, `process`, `steps`, `workflow` prefer `workflow`
- sections with words like `proof`, `result`, `metric`, `review`, `customer`, `evidence` prefer `proof`
- later sections without a stronger match fall back to `highlight`

For `assetForm`:

- `hero` defaults to `screenshot`
- `workflow` defaults to `section-card`
- `proof` defaults to `text-overlay`
- `highlight` falls back to `section-card`

If no strong rule matches, keep the system conservative:

- `purposeTag: highlight`
- `assetForm: section-card`

### 3. Scene linkage

The existing `recommendedSceneIds` behavior stays in place.

The new tags do not replace scene linkage. They refine it:

- `recommendedSceneIds` answers where the capture fits
- `purposeTag` answers what storytelling job it performs
- `assetForm` answers how the follow-on agent should likely realize it

### 4. Package output

The tags should appear in:

- `ASSET_PLAN.json`
- `HANDOFF.md`

`HANDOFF.md` should format each capture target as:

- section title
- suggested asset name
- recommended scenes
- purpose tag
- asset form

### 5. Error handling

This layer should never block package generation.

If classification is uncertain:

- keep the capture target
- assign fallback values
- avoid throwing

## Testing

Required coverage:

- first website section is tagged as `hero`
- workflow-like sections are tagged as `workflow`
- proof-like sections are tagged as `proof`
- unmatched sections fall back to `highlight`
- `assetForm` is emitted alongside `purposeTag`
- `HANDOFF.md` includes both new labels

## Rationale

This keeps the system production-oriented without pretending to be smarter than it is.

The package gains stronger planning hints for downstream agents, while the behavior stays deterministic, cheap, and easy to debug.
