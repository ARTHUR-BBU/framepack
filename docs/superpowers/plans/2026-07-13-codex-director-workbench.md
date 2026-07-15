# Framepack Codex Director Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Codex-first browser workbench and CLI that turns a brief into a HyperFrames-compatible, reviewable HTML animation preview and an approved handoff package.

**Architecture:** A TypeScript workspace owns all new code. `packages/director-contracts` validates project files, `packages/director-engine` performs deterministic init/build/snapshot/audit/handoff jobs, `packages/hyperframes-bridge` enforces HTML compatibility, and `apps/director-workbench` is a browser UI served locally by the CLI. The legacy Python/Hermes plugin is not imported or modified.

**Tech Stack:** Node.js 22, TypeScript, Vitest, Zod, Vite vanilla TypeScript, GSAP 3, HyperFrames 0.7.56, Sharp.

---

## Locked file structure

| Path | Responsibility |
| --- | --- |
| `package.json` | workspace scripts and runtime/dev dependencies |
| `packages/director-contracts/src/index.ts` | schemas, shared types, Markdown/JSON file names |
| `packages/hyperframes-bridge/src/index.ts` | HTML generator compliance inspection and local-resource checks |
| `packages/director-engine/src/index.ts` | init/build/snapshot/audit/approval/handoff operations |
| `packages/director-engine/src/cli.ts` | `framepack director …` command parser |
| `apps/director-workbench/src/server.ts` | local HTTP API plus static UI serving |
| `apps/director-workbench/src/main.ts` | browser state, job controls, review UI |
| `apps/director-workbench/index.html` / `src/style.css` | five-pane director cockpit |
| `tests/contracts.test.ts` | schema and file-contract behavior |
| `tests/bridge.test.ts` | every mandatory HTML compatibility regression |
| `tests/engine.test.ts` | project lifecycle, gates and handoff behavior |
| `tests/server.test.ts` | local browser API behavior |
| `fixtures/product-explainer/` | 16:9 and 9:16 director-preview fixture inputs |
| `docs/migration/legacy-inheritance.md` | provenance for selectively reimplemented historical rules |

### Task 1: Bootstrap the isolated TypeScript workspace and latest HyperFrames

**Files:**
- Modify: `package.json`, `package-lock.json`, `.gitignore`
- Create: `tsconfig.json`, `vitest.config.ts`, `packages/*/src/.gitkeep`, `apps/director-workbench/src/.gitkeep`
- Test: `tests/workspace.test.ts`

- [ ] **Step 1: Write a failing workspace test** that imports `@framepack/director-contracts` and asserts the public `PROJECT_FILES` constant exposes `handoffManifest`.

```ts
import { expect, test } from 'vitest';
import { PROJECT_FILES } from '@framepack/director-contracts';
test('exposes the handoff contract path', () => expect(PROJECT_FILES.handoffManifest).toBe('.framepack/handoff-manifest.json'));
```
- [ ] **Step 2: Run `npm test -- tests/workspace.test.ts`; expect module-resolution failure.**
- [ ] **Step 3: Add npm workspaces, `test`, `typecheck`, `director`, and `director:serve` scripts; add TypeScript, Vitest, Zod, Vite, GSAP and local workspace package manifests. Pin `hyperframes` to `0.7.56`.**
- [ ] **Step 4: Add the minimal contracts export, run the targeted test, then run `npm test` and `npm run typecheck`; expect all new TypeScript tests to pass.**
- [ ] **Step 5: Commit `chore: bootstrap Codex director workspace`.**

### Task 2: Define and validate the cross-platform project contract

**Files:**
- Create: `packages/director-contracts/src/index.ts`, `packages/director-contracts/src/markdown.ts`, `tests/contracts.test.ts`

- [ ] **Step 1: Write failing tests for a valid 16:9 manifest, rejection of an invalid approval state, and rejection when width/height do not match aspect ratio.**

```ts
expect(() => ApprovalSchema.parse({ state: 'silent' })).toThrow();
expect(dimensionsForAspect('16:9')).toEqual({ width: 1920, height: 1080 });
```
- [ ] **Step 2: Run `npm test -- tests/contracts.test.ts`; expect missing exports.**
- [ ] **Step 3: Implement `AspectRatioSchema`, `ProjectSpecSchema`, `TasteAuditSchema`, `ApprovalSchema`, `HandoffManifestSchema`, `PROJECT_FILES`, `dimensionsForAspect`, and Markdown renderers for intake, storyboard, preview report, taste audit and render plan.**
- [ ] **Step 4: Run the targeted test and `npm run typecheck`; expect pass.**
- [ ] **Step 5: Commit `feat: define director project contracts`.**

### Task 3: Build the HyperFrames compatibility bridge and deterministic preview HTML

**Files:**
- Create: `packages/hyperframes-bridge/src/index.ts`, `packages/hyperframes-bridge/src/template.ts`, `tests/bridge.test.ts`

- [ ] **Step 1: Write failing tests that reject missing root `data-start`, a clip without timing/wrapper, nested video, video without z-index, external CDN, CSS font variables, `repeat:-1`, clip-root animation, and `tl.set` initial hiding. Write a passing 16:9 and 9:16 generated-preview test.**

```ts
expect(inspectPreviewHtml('<div id="root" data-duration="30"></div>').codes).toContain('root-start-missing');
expect(inspectPreviewHtml(generatePreviewHtml(spec)).codes).toEqual([]);
```
- [ ] **Step 2: Run `npm test -- tests/bridge.test.ts`; expect missing bridge exports.**
- [ ] **Step 3: Implement `generatePreviewHtml(spec)` with root composition, three timed scenes, local GSAP reference, safe `fromTo` timeline registration, and an `inspectPreviewHtml(html)` report containing each violation code.**
- [ ] **Step 4: Run targeted tests and `npx --no-install hyperframes lint --json` against a generated fixture; expect no errors.**
- [ ] **Step 5: Commit `feat: generate HyperFrames-safe director previews`.**

### Task 4: Implement the CLI director lifecycle

**Files:**
- Create: `packages/director-engine/src/index.ts`, `packages/director-engine/src/cli.ts`, `tests/engine.test.ts`, `fixtures/product-explainer/brief.json`

- [ ] **Step 1: Write failing lifecycle tests for `initProject`, `buildProject`, and `snapshotProject`: each required file exists, GSAP is copied locally, snapshots cover every settled scene/transition/final hold, and build refuses a structurally invalid output.**

```ts
const project = await initProject(tmpPath, { aspect: '16:9', durationSeconds: 30, title: 'Demo' });
await buildProject(project);
expect(readFileSync(join(project, 'public/vendor/gsap.min.js'))).toBeTruthy();
expect((await snapshotProject(project)).frames).toHaveLength(7);
```
- [ ] **Step 2: Run `npm test -- tests/engine.test.ts`; expect missing lifecycle exports.**
- [ ] **Step 3: Implement project initialization, local asset/font/vendor directories, frame/storyboard creation, build report generation, GSAP vendoring, deterministic snapshot-plan generation, and the CLI commands `init`, `build`, and `snapshot`.**
- [ ] **Step 4: Run targeted tests, `npm run director -- init fixtures/product-explainer --aspect 16:9 --duration 30`, then build/snapshot; expect required artifacts and snapshot plan.**
- [ ] **Step 5: Commit `feat: add director preview lifecycle CLI`.**

### Task 5: Implement technical and taste gates with explicit approval

**Files:**
- Create: `packages/director-engine/src/audit.ts`, `packages/director-engine/src/taste-evaluator.ts`, `tests/audit.test.ts`
- Modify: `packages/director-engine/src/index.ts`, `packages/director-engine/src/cli.ts`

- [ ] **Step 1: Write failing tests: missing media or invalid HTML produces a non-waivable technical failure; text-only/low-motion output produces `fail`; an optional evaluator result is merged into the audit; a taste failure needs explicit waiver; approved/waived audit can hand off only after technical pass.**

```ts
await expect(approveProject(project, 'ready')).rejects.toThrow('technical audit must pass');
expect((await auditProject(project, { evaluator: fakeEvaluator('strong') })).taste.motionQuality).toBe('strong');
```
- [ ] **Step 2: Run `npm test -- tests/audit.test.ts`; expect missing audit exports.**
- [ ] **Step 3: Implement deterministic detectors, `TasteEvaluator` dependency injection, optional Responses-API evaluator configured only with `FRAMEPACK_TASTE_API_KEY` and `FRAMEPACK_TASTE_MODEL`, Markdown audit output, and persisted `approval.json`. Default without credentials is `needs_review`, never a fabricated LLM pass.**
- [ ] **Step 4: Implement `audit`, `approve`, and `waive` CLI subcommands; run targeted tests and verify no technical failure can produce approval.**
- [ ] **Step 5: Commit `feat: add preview taste and approval gates`.**

### Task 6: Generate the HyperFrames handoff package

**Files:**
- Modify: `packages/director-engine/src/index.ts`, `packages/director-engine/src/cli.ts`
- Create: `tests/handoff.test.ts`

- [ ] **Step 1: Write failing tests that require a passed technical audit plus approved/waived taste state, validate `handoff-manifest.json`, and assert `.hyperframes/render-plan.md` tells HyperFrames to lint, check, render, ffprobe, and snapshot-review.**

```ts
await expect(handoffProject(project)).rejects.toThrow('approval required');
await approveProject(project, 'approved after preview');
expect(HandoffManifestSchema.parse(await handoffProject(project)).hyperframesActions).toContain('ffprobe');
```
- [ ] **Step 2: Run `npm test -- tests/handoff.test.ts`; expect missing handoff export.**
- [ ] **Step 3: Implement `handoffProject`, record unresolved waived issues and exact dimensions/timing, and add the `handoff` CLI subcommand.**
- [ ] **Step 4: Run targeted test and validate generated JSON with `HandoffManifestSchema`.**
- [ ] **Step 5: Commit `feat: create approved HyperFrames handoff packages`.**

### Task 7: Build the Codex browser director workbench

**Files:**
- Create: `apps/director-workbench/package.json`, `apps/director-workbench/index.html`, `apps/director-workbench/src/main.ts`, `apps/director-workbench/src/style.css`, `apps/director-workbench/src/server.ts`, `tests/server.test.ts`
- Modify: `packages/director-engine/src/cli.ts`

- [ ] **Step 1: Write failing server tests for project summary retrieval, job execution result serialization, preview HTML serving, and refusal to run a project outside the explicitly supplied root.**

```ts
expect((await api.get('/api/project')).status).toBe(200);
expect((await api.post('/api/jobs/build')).body.status).toBe('completed');
expect((await api.get('/preview/')).headers.get('content-type')).toContain('text/html');
```
- [ ] **Step 2: Run `npm test -- tests/server.test.ts`; expect missing server implementation.**
- [ ] **Step 3: Implement a local-only server with `/api/project`, `/api/jobs/:name`, `/api/approval`, and `/preview/` endpoints. It receives the target project path at startup and refuses path traversal/outside-root access.**
- [ ] **Step 4: Implement a Vite vanilla TypeScript UI with the five locked views, preview iframe, snapshot strip, audit result, revision actions, and approval/waiver controls. It must call the API rather than duplicate pipeline logic.**
- [ ] **Step 5: Add `framepack director serve <project>` and verify that the Codex in-app browser can load the emitted local URL.**
- [ ] **Step 6: Commit `feat: add Codex director browser workbench`.**

### Task 8: Complete migration record, documentation, and end-to-end verification

**Files:**
- Create: `docs/migration/legacy-inheritance.md`, `docs/codex-director-workbench.md`, `tests/e2e.test.ts`
- Modify: `README.md`, `docs/README.zh-CN.md`

- [ ] **Step 1: Write a failing end-to-end test that runs 16:9 and 9:16 fixture projects through init/build/snapshot/audit/approve/handoff and verifies every required artifact.**

```ts
for (const aspect of ['16:9', '9:16'] as const) {
  const project = await runDirectorFixture(aspect);
  expect(existsSync(join(project, '.framepack/handoff-manifest.json'))).toBe(true);
}
```
- [ ] **Step 2: Run `npm test -- tests/e2e.test.ts`; expect missing or incomplete full pipeline.**
- [ ] **Step 3: Add the inheritance provenance ledger, Codex operating guide, and concise README language that makes Codex the sole supported host and HyperFrames the renderer/post-production layer.**
- [ ] **Step 4: Run `npm test`, `npm run typecheck`, both fixture lifecycle commands, `npx --no-install hyperframes lint --json`, `npx --no-install hyperframes check --json`, and manual browser review of a live preview.**
- [ ] **Step 5: Commit `docs: document Codex director workflow` and `test: verify director preview end to end`.**

## Baseline note

The legacy Python suite currently has 14 known failures in this worktree: hard-coded legacy worktree/deployment assumptions, Windows GBK Unicode output, and unavailable symlink privilege. The user explicitly approved them as legacy baseline noise. New TypeScript tests must be fully green; no new work may depend on the legacy plugin.
