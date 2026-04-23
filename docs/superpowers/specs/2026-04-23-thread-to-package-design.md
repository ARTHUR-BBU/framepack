# Thread To Package Design

## Summary

Add a first text-thread source compiler to Framepack:

`thread file -> SourceBundle -> VideoBrief -> ScenePlan -> Project Package`

This route targets pasted social threads, post sequences, and similar multi-block text sources without requiring a live platform API.

## Scope

This design covers only:

- local text files passed through the CLI
- lightweight thread parsing from paragraph-separated text blocks
- compilation into the existing `case-explainer` planner
- package output with a thread-flavored `SOURCE_MANIFEST.json`

This design does not cover:

- live X/Twitter API fetches
- platform authentication
- post metrics, embeds, or media download
- a planner specialized for social-short pacing

## Design

### 1. Input boundary

The CLI and compiler should accept a thread source through:

- `--thread-file`

The first version keeps source selection mutually exclusive:

- `--config`
- `--input`
- `--url`
- `--thread-file`

### 2. Ingest behavior

Thread ingest should preserve textual post structure rather than compressing it too early.

The ingest layer should:

- read a local UTF-8 text file
- split the file into post blocks on blank-line boundaries
- normalize leading numbering or bullet prefixes
- emit a `SourceBundle` with one collected artifact per post

The ingest layer should not:

- infer platform metadata
- guess engagement metrics
- decide final scene count

### 3. Source manifest

The generated package should continue to write:

- `SOURCE_MANIFEST.json`

For thread packages, the manifest should record:

- `sourceType: "thread"`
- `title`
- `summary`
- `posts`
- `collectedAt`

This keeps the package shape stable while allowing source-specific payloads.

### 4. Planning behavior

The existing `case-explainer` planner remains the first planner for thread sources.

That means:

- thread ingest preserves post blocks
- brief compilation turns posts into structured source materials
- the current planner compresses those materials into the fixed first-version scene model

### 5. Packaging behavior

Thread-generated packages should look the same as markdown and website packages, with:

- a thread-flavored `SOURCE_MANIFEST.json`

No new package-only file is needed in the first version.

### 6. Error handling

The first version should fail clearly when:

- the thread file path does not exist
- the thread file produces zero post blocks after normalization
- conflicting source arguments are provided

## Testing

Required coverage:

- parsing paragraph-separated thread text into posts
- compiling a thread `SourceBundle`
- compiling a thread `VideoBrief`
- CLI `generate --thread-file`
- CLI `validate --thread-file`
- thread package output includes `SOURCE_MANIFEST.json` with `sourceType: "thread"`

## Rationale

This keeps the architecture aligned with the compiler-first model:

- source compilers stay separate from planning
- source manifests remain package-stable
- thread/post inputs become first-class without blocking on platform APIs
