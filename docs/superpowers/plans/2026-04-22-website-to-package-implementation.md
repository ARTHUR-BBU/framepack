# Website To Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first end-to-end website route so Framepack can compile a public single-page URL into the existing case-explainer project package flow.

**Architecture:** Keep website ingest separate from planning. The new route should fetch and preserve website structure as a `SourceBundle`, reuse the existing `case-explainer` planner, and emit the same engineering package as markdown plus a `SOURCE_MANIFEST.json` that records the source details.

**Tech Stack:** TypeScript, Node.js fetch/file APIs, existing compiler/planning/package layers, CLI argument parsing, JSON/Markdown artifacts, TDD

---

## Progress Tracking

### Milestones

- `M1` Compiler can build a website project from a public URL
- `M2` Package output includes `SOURCE_MANIFEST.json`
- `M3` CLI supports `--url` for `generate` and `validate`
- `M4` Conflicting source arguments fail clearly
- `M5` Docs and automated coverage reflect the website workflow

### Status Board

- `M1`: pending
- `M2`: pending
- `M3`: pending
- `M4`: pending
- `M5`: pending

### Reporting Format

Every execution update should include:

1. current batch
2. completed items
3. verification results
4. risks or blockers
5. next step

## File Structure

- Modify: `F:\hyperframes\src\core\types.ts`
  - Add a source-manifest contract that packaging can write without leaking ingest internals.
- Modify: `F:\hyperframes\src\compiler\index.ts`
  - Add a website project compile path that fetches a URL, builds a website `SourceBundle`, compiles a `VideoBrief`, and runs the existing project builder.
- Modify: `F:\hyperframes\src\video\index.ts`
  - Thread source-bundle information through the project build result so packaging can write `SOURCE_MANIFEST.json`.
- Modify: `F:\hyperframes\src\video\package\project-package.ts`
  - Emit `SOURCE_MANIFEST.json` when source data is present.
- Modify: `F:\hyperframes\src\interfaces\cli\index.ts`
  - Parse `--url`, reject conflicting source arguments, and route website generate/validate through the compiler.
- Modify: `F:\hyperframes\scripts\run-tests.mjs`
  - Add compiler, package, and CLI coverage for the website route.
- Modify: `F:\hyperframes\README.md`
  - Document public URL usage and first-version constraints.

## Task 1: Add website project compilation and source manifest contracts

**Files:**
- Modify: `F:\hyperframes\src\core\types.ts`
- Modify: `F:\hyperframes\src\compiler\index.ts`
- Modify: `F:\hyperframes\src\video\index.ts`
- Modify: `F:\hyperframes\scripts\run-tests.mjs`

- [ ] **Step 1: Write the failing tests**

Add tests that verify:
- a website URL can compile all the way into a project result
- the project result carries source-manifest data
- fetch failures surface as compiler errors

Use a stub fetch implementation in tests so the route stays deterministic.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`  
Expected: FAIL because no website project compiler exists and no source-manifest contract is returned.

- [ ] **Step 3: Add the source-manifest type**

Define a focused type in `src/core/types.ts` for:
- `sourceType`
- `url`
- `title`
- `summary`
- `sections`
- `collectedAt`

Keep it separate from `SourceBundle` so packaging can depend on a stable artifact shape.

- [ ] **Step 4: Add website project compilation**

Extend `src/compiler/index.ts` with an async website route that:
- calls `fetchWebsiteSourceBundle(...)`
- compiles the resulting `VideoBrief`
- calls the existing case-explainer project builder

Update `src/video/index.ts` so the project result can carry the source manifest forward to packaging.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`  
Expected: PASS for the new website compiler tests.

- [ ] **Step 6: Commit**

```bash
git add src/core/types.ts src/compiler/index.ts src/video/index.ts scripts/run-tests.mjs
git commit -m "feat: add website project compilation flow"
```

## Task 2: Emit SOURCE_MANIFEST.json in generated packages

**Files:**
- Modify: `F:\hyperframes\src\video\package\project-package.ts`
- Modify: `F:\hyperframes\src\video\index.ts`
- Modify: `F:\hyperframes\scripts\run-tests.mjs`

- [ ] **Step 1: Write the failing package tests**

Add tests that verify:
- website-generated packages include `SOURCE_MANIFEST.json`
- markdown-generated packages do not invent a website source manifest
- the manifest content matches the compiled source data

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`  
Expected: FAIL because `SOURCE_MANIFEST.json` is not emitted.

- [ ] **Step 3: Implement package manifest emission**

Update package creation so website-based project results write:
- `SOURCE_MANIFEST.json`

Do not change the rest of the package layout for markdown.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`  
Expected: PASS with package output coverage updated.

- [ ] **Step 5: Commit**

```bash
git add src/video/package/project-package.ts src/video/index.ts scripts/run-tests.mjs
git commit -m "feat: emit source manifests for website packages"
```

## Task 3: Add CLI website input flow and source-argument validation

**Files:**
- Modify: `F:\hyperframes\src\interfaces\cli\index.ts`
- Modify: `F:\hyperframes\src\compiler\index.ts`
- Modify: `F:\hyperframes\scripts\run-tests.mjs`

- [ ] **Step 1: Write the failing CLI tests**

Add tests that verify:
- `generate --url ...` succeeds with a stubbed fetch response
- `validate --url ...` succeeds with a stubbed fetch response
- `--url` cannot be combined with `--input`
- `--url` cannot be combined with `--config`
- missing both `--input` and `--url` still fails clearly

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`  
Expected: FAIL because CLI requires `--input` today and has no website route.

- [ ] **Step 3: Implement CLI website routing**

Update CLI option parsing so source input becomes:
- `--input`
- or `--url`
- or `--config`

The first version should reject combinations instead of trying to merge sources.

Route `generate` and `validate` to the markdown or website compiler path based on the selected source.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`  
Expected: PASS with CLI website coverage green.

- [ ] **Step 5: Commit**

```bash
git add src/interfaces/cli/index.ts src/compiler/index.ts scripts/run-tests.mjs
git commit -m "feat: add website cli generate and validate flows"
```

## Task 4: Update docs and full verification

**Files:**
- Modify: `F:\hyperframes\README.md`
- Modify: `F:\hyperframes\scripts\run-tests.mjs`

- [ ] **Step 1: Document the website route**

Add README coverage for:
- first-version public URL support
- `generate --url ...`
- `validate --url ...`
- limitations: single page, no auth, no screenshots/capture

- [ ] **Step 2: Run full verification**

Run:
- `npm run typecheck`
- `npm test`
- `npm run build`

Expected:
- all pass
- website route tests included

- [ ] **Step 3: Commit**

```bash
git add README.md scripts/run-tests.mjs
git commit -m "docs: add website route usage"
```
