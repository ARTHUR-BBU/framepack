# Website To Package Design

## Summary

Add a first end-to-end website route to Framepack:

`public URL -> SourceBundle -> VideoBrief -> ScenePlan -> Project Package`

The first version keeps ingest conservative. It collects and preserves website structure, then reuses the existing `case-explainer` planner to decide what to keep in the video.

## Scope

This design covers only:

- public single-page URLs
- HTML fetch and lightweight content extraction
- website source compilation into the existing planning chain
- package output with a `SOURCE_MANIFEST.json`

This design does not cover:

- authenticated pages
- multi-page crawling
- screenshots or browser capture
- tweet/thread-specific compilers
- a new planner specialized for websites

## Design

### 1. Input boundary

The CLI and compiler should accept a website source through:

- `--url`

The website route should remain mutually exclusive with:

- `--input`
- `--config`

for the first version.

The first version should support only a single public URL at a time.

### 2. Ingest behavior

Website ingest should preserve source structure rather than compressing it into scenes too early.

The ingest layer should:

- fetch the HTML for a public URL
- extract:
  - page title
  - meta description
  - lightweight section structure from `h1/h2 + p`
- compile those results into a `SourceBundle`

The ingest layer should not:

- decide final scene count
- merge sections for storytelling
- infer animation or render behavior

### 3. Source manifest

The generated project package should include:

- `SOURCE_MANIFEST.json`

The manifest should record:

- `sourceType`
- `url`
- `title`
- `summary`
- extracted `sections`
- `collectedAt`

This keeps the route compatible with future source compilers such as tweet/thread inputs.

### 4. Planning behavior

The existing `case-explainer` planner should remain the first planner used for website input.

That means the route becomes:

- website ingest preserves structure
- brief compiler turns website sections into `sourceMaterials`
- existing planner selects and compresses content into the fixed first-version scene model

This avoids splitting the architecture too early while keeping website ingest useful.

### 5. Packaging behavior

Website-generated packages should look the same as markdown-generated packages, plus:

- `SOURCE_MANIFEST.json`

This keeps the engineering package stable across source types.

### 6. Error handling

The first version should fail clearly when:

- URL fetch returns non-200
- extracted website content is empty
- user provides conflicting source arguments

Errors should stay at the compiler/interface layer. The planner should only run on valid website `SourceBundle` output.

## Testing

Required coverage:

- HTML extraction into title, summary, and sections
- URL fetch into `SourceBundle`
- website route through compiler into `VideoBrief`
- CLI website argument validation
- website `generate` and `validate` reusing the current planner
- package output includes `SOURCE_MANIFEST.json`

## Rationale

This keeps the architecture aligned with the long-term model:

- source compilers stay distinct from planning
- ingest preserves content
- planners decide narrative compression
- packages remain source-agnostic except for explicit source manifests

That structure will carry cleanly into future tweet/thread/post compilers.
