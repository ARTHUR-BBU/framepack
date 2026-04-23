# Thread To Package Implementation Plan

## Goal

Implement a first thread/post source compiler that lets Framepack generate and validate case-explainer packages from local text-thread files.

## Task Breakdown

1. Expand core source contracts
- extend `SourceManifest` to support `thread`
- add thread post types in `src/core/types.ts`

2. Add thread ingest
- create `src/ingest/thread/index.ts`
- parse paragraph-separated text into normalized posts
- emit `SourceBundle`

3. Extend brief compilation and compiler entrypoints
- support `thread` in `src/planning/brief/index.ts`
- add `compileThreadVideoBrief(...)`
- add `compileThreadCaseExplainerProject(...)`

4. Extend CLI source selection
- add `--thread-file`
- keep source args mutually exclusive
- route `generate` and `validate` through the thread compiler path

5. Update package and docs
- ensure `SOURCE_MANIFEST.json` carries thread metadata
- update README command and scope docs

6. Verification
- add red tests for thread ingest, compiler, and CLI flows
- run `npm run typecheck`
- run `npm test`
- run `npm run build`

## Acceptance

- Framepack accepts `--thread-file`
- thread packages generate through the existing case-explainer planner
- thread packages remain package-compatible with current runtime and packaging layers
