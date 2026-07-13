# Framepack Codex Director v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a distributable `framepack-director` Codex plugin whose Chinese director workflow turns real briefs and local assets into reviewable HyperFrames previews, truthful taste evidence, and a version-bound production handoff.

**Architecture:** Codex remains the conversation host. A host-agnostic director engine persists versioned project events, loads bundled skills and proven weapons, and feeds a single Preview Composer. A local Chinese browser workbench projects the same state for visual review. The repository builds a self-contained Codex plugin bundle; user projects contain only their own Framepack artifacts and media.

**Tech Stack:** TypeScript ESM, Node.js, Zod, Vitest, esbuild, vanilla HTML/CSS/JS, GSAP, HyperFrames 0.7.56, Codex plugin manifest and marketplace.

---

## Delivery map

The approved specification contains several independently testable subsystems. Execute them in this order:

1. Portable Codex plugin boundary and project contracts.
2. Truthful director pipeline: events, assets, skills, styles, weapons, Composer, hashes.
3. Chinese browser workbench and Codex orchestration.
4. Proven legacy-asset migration and three workflow fixtures.
5. Legacy Hermes removal, packaging, installation, and final acceptance.

Do not call the Codex version complete after the first product fixture. The first fixture is the truth-loop milestone; v1 completion requires all final acceptance tasks.

## Target file structure

```text
apps/director-workbench/
  public/{index.html,main.js,style.css}
  src/{server.ts,api.ts,event-stream.ts}
packages/director-contracts/src/
  index.ts project.ts events.ts assets.ts direction.ts arsenal.ts review.ts
packages/director-engine/src/
  cli.ts orchestrator.ts project-store.ts content-hash.ts asset-intake.ts
  skill-runtime.ts style-catalog.ts storyboard.ts weapon-runtime.ts weapon-bench.ts preview-composer.ts
  audit.ts approval.ts doctor.ts
packages/director-assets/
  skills/<skill>/SKILL.md
  skills/framepack-director/scripts/framepack-director.mjs
  skills/<skill>/references/*
  styles/catalog.json
  weapons/{text-split-enter,caption-clip-wipe,number-count-up,...}/{manifest.json,index.js,scorecard.json}
  specimens/styles/*
packages/hyperframes-bridge/src/
  index.ts inspector.ts runner.ts snapshot-plan.ts handoff.ts
plugins/framepack-director/
  .codex-plugin/plugin.json
  skills/framepack-director/SKILL.md
  assets/workbench/*
  assets/runtime/*
scripts/{build-plugin.ts,validate-no-legacy.ts,validate-migration-ledger.ts}
.agents/plugins/marketplace.json
tests/{contracts,project-store,asset-intake,skill-runtime,style-catalog,
  weapon-runtime,preview-composer,orchestrator,audit,server,plugin,e2e}.test.ts
```

## Task 1: Lock the portable plugin boundary

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `scripts/validate-no-legacy.ts`
- Create: `tests/legacy-boundary.test.ts`

- [ ] **Step 1: Write a failing legacy-boundary test**

```ts
import { scanLegacyReferences } from '../scripts/validate-no-legacy.js';
import { expect, test } from 'vitest';

test('new runtime never imports the archived Hermes plugin', () => {
  expect(scanLegacyReferences(['apps', 'packages', 'plugins'])).toEqual([]);
});
```

- [ ] **Step 2: Run the focused test and confirm it fails on current legacy references**

Run: `npx vitest run tests/legacy-boundary.test.ts`

Expected: FAIL because `scripts/validate-no-legacy.ts` does not exist.

- [ ] **Step 3: Add the repository validator**

```ts
const forbidden = ['framepack-plugin/', 'framepack-e2e-test/', 'Hermes_windows', 'ctx.inject_message'];
const roots = ['apps', 'packages', 'plugins'];
// Walk only the new runtime roots; print each matching file and exit 1 when found.
```

Add scripts:

```json
{
  "plugin:build": "tsx scripts/build-plugin.ts",
  "plugin:validate": "tsx scripts/validate-no-legacy.ts",
  "verify": "npm run typecheck && npm test && npm run plugin:validate"
}
```

- [ ] **Step 4: Run the focused test and validator**

Run: `npx vitest run tests/legacy-boundary.test.ts && npm run plugin:validate`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json scripts/validate-no-legacy.ts tests/legacy-boundary.test.ts
git commit -m "test: lock Codex runtime boundary"
```

## Task 2: Create versioned project, event, and hash contracts

**Files:**
- Create: `packages/director-contracts/src/project.ts`
- Create: `packages/director-contracts/src/events.ts`
- Create: `packages/director-contracts/src/assets.ts`
- Create: `packages/director-contracts/src/direction.ts`
- Create: `packages/director-contracts/src/review.ts`
- Modify: `packages/director-contracts/src/index.ts`
- Create: `tests/project-contracts.test.ts`

- [ ] **Step 1: Write failing schema tests**

```ts
test('a brief event preserves Chinese intent', () => {
  const event = DirectorEventSchema.parse({
    version: '1.0', id: 'evt-1', type: 'brief.updated', at: '2026-07-13T00:00:00.000Z',
    payload: { goal: '突出产品，降低科技感', audience: '第一次接触产品的人' },
  });
  expect(event.payload.goal).toContain('降低科技感');
});

test('review evidence is bound to one content hash', () => {
  expect(() => ReviewScorecardSchema.parse({ buildId: 'b1', contentHash: '', source: 'human' })).toThrow();
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `npx vitest run tests/project-contracts.test.ts`

Expected: FAIL because the schemas do not exist.

- [ ] **Step 3: Implement schemas with exact version fields**

```ts
export const DirectorEventSchema = z.discriminatedUnion('type', [
  BaseEvent.extend({ type: z.literal('brief.updated'), payload: BriefSchema }),
  BaseEvent.extend({ type: z.literal('assets.changed'), payload: z.object({ assetIds: z.array(z.string()) }) }),
  BaseEvent.extend({ type: z.literal('direction.confirmed'), payload: z.object({ directionId: z.string() }) }),
  BaseEvent.extend({ type: z.literal('feedback.added'), payload: z.object({ text: z.string().min(1) }) }),
  BaseEvent.extend({ type: z.literal('decision.recorded'), payload: ApprovalSchema }),
]);

export const ProjectStateSchema = z.object({
  version: z.literal('1.0'), projectId: z.string(), phase: ProjectPhaseSchema,
  currentBuildId: z.string().nullable(), contentHash: z.string().nullable(), updatedAt: z.string().datetime(),
});
```

The scorecard must include `contentHash`, `source`, `reviewer`, `reviewedAt`, seven 1–5 scores, reasons, evidence frame paths, average, and verdict.

- [ ] **Step 4: Run tests and typecheck**

Run: `npx vitest run tests/project-contracts.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/director-contracts tests/project-contracts.test.ts
git commit -m "feat: define versioned director contracts"
```

## Task 3: Persist events and invalidate stale evidence

**Files:**
- Create: `packages/director-engine/src/project-store.ts`
- Create: `packages/director-engine/src/content-hash.ts`
- Modify: `packages/director-engine/src/index.ts`
- Create: `tests/project-store.test.ts`

- [ ] **Step 1: Write failing state-transition tests**

```ts
test('feedback creates a new content hash and stales prior approval', async () => {
  const store = await createTestProject();
  const before = await store.recordApproval('b1', 'hash-a', '方向确认');
  await store.appendEvent(feedbackEvent('降低科技感'));
  const state = await store.readState();
  expect(state.contentHash).not.toBe(before.contentHash);
  expect(await store.readApproval()).toMatchObject({ status: 'stale' });
});

test.each(['brief', 'asset', 'direction', 'storyboard', 'skill', 'weapon-plan', 'weapon-code', 'font', 'vendor', 'hyperframes', 'composer-config', 'composer-version'])('%s changes stale prior evidence', async (input) => {
  const project = await approvedProject();
  await mutateFingerprintInput(project, input);
  expect((await project.readApproval()).status).toBe('stale');
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `npx vitest run tests/project-store.test.ts`

Expected: FAIL because the store is missing.

- [ ] **Step 3: Implement atomic JSONL events and canonical hashing**

Use `.framepack/events.jsonl`, `.framepack/state.json`, and write-to-temp-plus-rename for atomic state updates. Hash sorted JSON containing brief, asset hashes, direction, storyboard, skill load plan plus loaded skill hashes, weapon load plan plus loaded weapon hashes, HyperFrames version, fonts/vendor hashes, Composer configuration, and Composer version.

```ts
export function contentHash(input: ContentFingerprint): string {
  return createHash('sha256').update(stableStringify(input)).digest('hex');
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/project-store.test.ts`

Expected: PASS, including Windows path fixtures.

- [ ] **Step 5: Commit**

```bash
git add packages/director-engine/src/project-store.ts packages/director-engine/src/content-hash.ts packages/director-engine/src/index.ts tests/project-store.test.ts
git commit -m "feat: persist director events and stale evidence"
```

## Task 4: Build truthful asset intake

**Files:**
- Create: `packages/director-engine/src/asset-intake.ts`
- Create: `packages/director-contracts/src/assets.ts`
- Create: `tests/asset-intake.test.ts`

- [ ] **Step 1: Write failing tests for empty and real assets**

```ts
test('an empty asset folder is missing, never strong', async () => {
  const result = await inspectAssets(emptyProject());
  expect(result.summary).toBe('missing');
  expect(result.assets).toEqual([]);
});

test('a PNG is hashed and assigned to a scene only after confirmation', async () => {
  const result = await inspectAssets(projectWith('product.png'));
  expect(result.assets[0]).toMatchObject({ mediaType: 'image/png', status: 'available' });
  expect(result.assets[0].sha256).toMatch(/^[a-f0-9]{64}$/);
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `npx vitest run tests/asset-intake.test.ts`

- [ ] **Step 3: Implement supported formats, limits, hashes, and ledger**

Write `.framepack/assets.json` and the Chinese `.framepack/asset-intake.md`. Support PNG/JPEG/WebP, MP4/MOV/WebM, Markdown/text/PDF, and URL capture records. Do not copy private absolute paths into handoff output.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/asset-intake.test.ts`

Expected: PASS; corrupt and oversize fixture errors name the exact file.

- [ ] **Step 5: Commit**

```bash
git add packages/director-contracts/src/assets.ts packages/director-engine/src/asset-intake.ts tests/asset-intake.test.ts
git commit -m "feat: inspect real director assets"
```

## Task 5: Extract host-agnostic skills and record actual loads

**Files:**
- Create: `packages/director-assets/skills/framepack-director/SKILL.md`
- Create: `packages/director-assets/skills/product-launch-video/SKILL.md`
- Create: `packages/director-assets/skills/framepack-director/references/{asset-intake.md,visual-styles.md,kinetic-grammar.md,taste-moves.md}`
- Create: `packages/director-assets/skills/framepack-arsenal/SKILL.md`
- Create: `packages/director-assets/skills/framepack-reference-miner/SKILL.md`
- Create: `packages/director-engine/src/skill-runtime.ts`
- Create: `scripts/validate-migration-ledger.ts`
- Modify: `docs/migration/legacy-inheritance.md`
- Create: `tests/skill-runtime.test.ts`

- [ ] **Step 1: Write failing routing and receipt tests**

```ts
test('product launch loads the director, workflow, and arsenal playbooks', async () => {
  const receipt = await loadSkills({ intent: 'product-launch-video', assets: ['product.png'] });
  expect(receipt.loaded.map((item) => item.id)).toEqual(['framepack-director', 'product-launch-video', 'framepack-arsenal']);
  expect(receipt.loaded.every((item) => /^[a-f0-9]{64}$/.test(item.sha256))).toBe(true);
});

test('applying a workflow skill leaves observable output evidence', async () => {
  const result = await applySkillPlan(productLaunchBrief());
  expect(result.receipt.applied).toContainEqual(expect.objectContaining({
    skillId: 'product-launch-video', outputPaths: ['direction.rhythm', 'storyboard.scenes'],
  }));
  expect(result.storyboard.scenes[0].purpose).toBe('hook');
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `npx vitest run tests/skill-runtime.test.ts`

- [ ] **Step 3: Extract only host-agnostic guidance**

Rewrite concise Codex-facing skills. Preserve intent routing, asset awareness, visual physics, kinetic continuity, weapon matching, provenance, and reference DNA. Exclude Hermes hooks, deployment paths, plugin versions, and `ctx.inject_message` behavior. Record every source path and historical commit in `docs/migration/legacy-inheritance.md`.

- [ ] **Step 4: Implement load receipts**

Write `.framepack/skill-load-plan.json` before loading and `.framepack/skill-load-receipt.json` after reading. Receipt entries contain ID, absolute resolved source for local execution, portable plugin-relative path, sha256, loadedAt, and reason. Also write `.framepack/skill-application-receipt.json` mapping each applied rule to concrete direction/storyboard output paths and their value hashes. Tests must prove that changing the loaded workflow skill changes those output hashes; reading a file alone is not execution proof.

Create `scripts/validate-migration-ledger.ts`. It cross-checks every migrated asset manifest's `legacySource`, `sourceCommit`, `license`, and `currentPath` against `docs/migration/legacy-inheritance.md`.

- [ ] **Step 5: Run tests and migration ledger check**

Run: `npx vitest run tests/skill-runtime.test.ts && npm run plugin:validate && npx tsx scripts/validate-migration-ledger.ts`

- [ ] **Step 6: Commit**

```bash
git add packages/director-assets/skills packages/director-engine/src/skill-runtime.ts scripts/validate-migration-ledger.ts docs/migration/legacy-inheritance.md tests/skill-runtime.test.ts
git commit -m "feat: migrate Codex director playbooks"
```

## Task 6: Migrate the style and taste catalog

**Files:**
- Create: `packages/director-assets/styles/catalog.json`
- Create: `packages/director-engine/src/style-catalog.ts`
- Create: `packages/director-contracts/src/direction.ts`
- Create: `tests/style-catalog.test.ts`

- [ ] **Step 1: Write failing style-selection tests**

```ts
test('lower technology feedback changes direction semantics', () => {
  const before = chooseDirection({ goal: 'SaaS 发布', feedback: [] });
  const after = chooseDirection({ goal: 'SaaS 发布', feedback: ['降低科技感，增加温度'] });
  expect(after.primaryStyle).not.toBe(before.primaryStyle);
  expect(after.avoid).toContain('neon-interface-cliches');
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `npx vitest run tests/style-catalog.test.ts`

- [ ] **Step 3: Encode eight styles and director grammar**

Each style contains stable ID, Chinese name, palette, local font family, motion energy, atmosphere, suitable intents, avoid list, and provenance. Direction selection permits one primary style, one supporting style, one to three taste moves, and zero to two surprise operators.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/style-catalog.test.ts`

- [ ] **Step 5: Commit**

```bash
git add packages/director-assets/styles packages/director-engine/src/style-catalog.ts packages/director-contracts/src/direction.ts tests/style-catalog.test.ts
git commit -m "feat: migrate director taste catalog"
```

## Task 7: Generate and revise structured storyboards

**Files:**
- Create: `packages/director-contracts/src/storyboard.ts`
- Create: `packages/director-engine/src/storyboard.ts`
- Modify: `packages/director-contracts/src/index.ts`
- Create: `tests/storyboard.test.ts`

- [ ] **Step 1: Write failing storyboard behavior tests**

```ts
test('a product brief becomes timed Chinese scene beats', () => {
  const storyboard = generateStoryboard(productBrief(), warmDirection());
  expect(storyboard.scenes.map((scene) => scene.purpose)).toEqual(['hook', 'proof', 'cta']);
  expect(storyboard.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0)).toBe(30);
  expect(storyboard.scenes[1].assetIds).toContain('product-image');
});

test('feedback revises scene semantics instead of appending a note', () => {
  const before = generateStoryboard(productBrief(), technologyDirection());
  const after = reviseStoryboard(before, '降低科技感，产品再突出', warmDirection());
  expect(after.revisionOf).toBe(before.id);
  expect(after.scenes[0].visualFocus).not.toBe(before.scenes[0].visualFocus);
  expect(after.scenes.some((scene) => scene.assetIds.includes('product-image'))).toBe(true);
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `npx vitest run tests/storyboard.test.ts`

Expected: FAIL because storyboard contracts and generator do not exist.

- [ ] **Step 3: Implement the storyboard contract and generator**

Each scene contains stable ID, Chinese title, purpose, start, duration, narrative beat, visual focus, foreground/midground/background layers, asset IDs, motion grammar, transition seed, audio intent, negative constraints, and revision lineage. Persist `.framepack/storyboard.json` plus a concise Chinese `.framepack/storyboard.md`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/storyboard.test.ts tests/project-store.test.ts`

- [ ] **Step 5: Commit**

```bash
git add packages/director-contracts/src/storyboard.ts packages/director-contracts/src/index.ts packages/director-engine/src/storyboard.ts tests/storyboard.test.ts
git commit -m "feat: generate revisable director storyboards"
```

## Task 8: Build the weapon registry and candidate state

**Files:**
- Create: `packages/director-contracts/src/arsenal.ts`
- Create: `packages/director-assets/weapons/text-split-enter/{manifest.json,index.js}`
- Create: `packages/director-assets/weapons/caption-clip-wipe/{manifest.json,index.js}`
- Create: `packages/director-assets/weapons/number-count-up/{manifest.json,index.js}`
- Create: `packages/director-engine/src/weapon-runtime.ts`
- Create: `tests/weapon-runtime.test.ts`

- [ ] **Step 1: Write failing maturity and invocation tests**

```ts
test('candidate weapons cannot be auto-selected', async () => {
  const result = await resolveWeapons(storyboardFixture(), candidateRegistry());
  expect(result.selected).toEqual([]);
  expect(result.candidates.map((weapon) => weapon.id)).toContain('text-split-enter');
});

test('a load plan without an HTML invocation receipt fails', () => {
  expect(verifyWeaponCalls(plan(['text-split-enter']), [])).toContain('weapon_not_invoked:text-split-enter');
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `npx vitest run tests/weapon-runtime.test.ts`

- [ ] **Step 3: Migrate the first three weapons**

Copy only the reusable function logic, replace external CDN assumptions with injected local runtimes, add Zod parameter schemas, and preserve source provenance. All three manifests start as `candidate`; no checked-in scorecard may promote them.

- [ ] **Step 4: Implement matching and receipts**

Write `.framepack/weapon-load-plan.json` and `.framepack/weapon-call-receipt.json`. A hand-written fallback must record checked sources, rejected candidates, and reason.

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/weapon-runtime.test.ts`

- [ ] **Step 6: Commit**

```bash
git add packages/director-contracts/src/arsenal.ts packages/director-assets/weapons packages/director-engine/src/weapon-runtime.ts tests/weapon-runtime.test.ts
git commit -m "feat: add Codex weapon candidate registry"
```

## Task 9: Prove the first three weapons with real benches

**Files:**
- Create: `packages/director-engine/src/weapon-bench.ts`
- Create: `tests/weapon-bench.test.ts`
- Create after evidence review: `packages/director-assets/weapons/text-split-enter/scorecard.json`
- Create after evidence review: `packages/director-assets/weapons/caption-clip-wipe/scorecard.json`
- Create after evidence review: `packages/director-assets/weapons/number-count-up/scorecard.json`
- Create after evidence review: `docs/evidence/weapons/{text-split-enter,caption-clip-wipe,number-count-up}/`

- [ ] **Step 1: Write failing promotion-gate tests**

```ts
test('a weapon cannot become proven without both ratios and an identified reviewer', () => {
  expect(() => promoteWeapon(candidateWeapon(), { evidence: ['16:9'], reviewer: '' })).toThrow();
});

test('generated evidence without subjective review remains compatible', () => {
  expect(classifyWeapon(completeAutomatedBench())).toBe('compatible');
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `npx vitest run tests/weapon-bench.test.ts`

- [ ] **Step 3: Generate real 16:9 and 9:16 benches for each weapon**

For `text-split-enter`, `caption-clip-wipe`, and `number-count-up`, generate two HyperFrames projects, run real `lint`, `check`, and snapshot capture, and write an evidence manifest with command output hashes and critical frame paths. Automated success promotes only to `compatible`.

- [ ] **Step 4: Pause for visual review and write identified scorecards**

Use actual rendered contact sheets. The reviewer source must be `codex`, `independent_model`, or `human`, with reviewer/model ID, time, build hashes, seven score reasons, and cited frames. If no identified reviewer completes this step, leave the weapon `compatible` and do not auto-select it.

- [ ] **Step 5: Promote only reviewed weapons and rerun matching tests**

Run: `npx vitest run tests/weapon-bench.test.ts tests/weapon-runtime.test.ts`

Expected: only weapons with complete dual-ratio evidence and review scorecards become `proven`.

- [ ] **Step 6: Commit**

```bash
git add packages/director-engine/src/weapon-bench.ts packages/director-assets/weapons docs/evidence/weapons tests/weapon-bench.test.ts
git commit -m "test: prove first Codex animation weapons"
```

## Task 10: Replace the fixed template with Preview Composer

**Files:**
- Create: `packages/director-engine/src/preview-composer.ts`
- Split: `packages/hyperframes-bridge/src/template.ts` into `inspector.ts`, `runner.ts`, `snapshot-plan.ts`, `handoff.ts`
- Modify: `packages/director-engine/src/index.ts`
- Create: `tests/preview-composer.test.ts`

- [ ] **Step 1: Write failing content-driven preview tests**

```ts
test('Chinese brief and product asset appear in the composed preview', async () => {
  const build = await composePreview(productLaunchFixture({ title: '让每一次协作更轻松', asset: 'product.png' }));
  expect(build.html).toContain('让每一次协作更轻松');
  expect(build.html).toContain('public/assets/product.png');
  expect(build.html).not.toContain('Make it felt.');
});

test('feedback changes build hash and visible direction', async () => {
  const first = await composePreview(productLaunchFixture());
  const second = await composePreview(productLaunchFixture({ feedback: '降低科技感' }));
  expect(second.buildId).not.toBe(first.buildId);
  expect(second.html).not.toBe(first.html);
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `npx vitest run tests/preview-composer.test.ts`

- [ ] **Step 3: Implement the single Composer**

Composer accepts validated spec, assets, direction, storyboard, skill receipt, and weapon plan. It writes local HTML, CSS, fonts, GSAP, build report, and weapon call receipt. It must throw on missing required assets, stale input hashes, or unavailable planned weapons; it must never fall back to generic English content.

- [ ] **Step 4: Keep HyperFrames structural inspection deterministic**

Require root duration/dimensions, timed clips, inner wrappers, root-level media, local resources, seek-safe timelines, literal font families, and `window.__timelines['main']`.

- [ ] **Step 5: Run Composer and bridge tests**

Run: `npx vitest run tests/preview-composer.test.ts tests/bridge.test.ts`

- [ ] **Step 6: Commit**

```bash
git add packages/director-engine/src/preview-composer.ts packages/director-engine/src/index.ts packages/hyperframes-bridge/src tests/preview-composer.test.ts tests/bridge.test.ts
git commit -m "feat: compose project-specific previews"
```

## Task 11: Make audit and approval evidence truthful

**Files:**
- Modify: `packages/director-engine/src/audit.ts`
- Create: `packages/director-engine/src/approval.ts`
- Modify: `packages/director-contracts/src/review.ts`
- Modify: `tests/audit.test.ts`

- [ ] **Step 1: Add failing regressions**

```ts
test('empty assets are reported as missing', async () => {
  const audit = await auditProject(await projectWithoutAssets());
  expect(audit.materialUsage).toBe('missing');
});

test('approval from an old build cannot hand off', async () => {
  const project = await approvedProject('hash-a');
  await addFeedback(project, '突出产品');
  await expect(handoffProject(project)).rejects.toThrow('approval is stale');
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `npx vitest run tests/audit.test.ts`

- [ ] **Step 3: Separate technical, deterministic, and subjective evidence**

Technical failures block. Deterministic material/contrast/safe-area checks cite files and frame times. Subjective scorecards record reviewer source and remain `needs_review` when no reviewer exists. Approval and waiver bind to build ID plus content hash.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/audit.test.ts`

- [ ] **Step 5: Commit**

```bash
git add packages/director-engine/src/audit.ts packages/director-engine/src/approval.ts packages/director-contracts/src/review.ts tests/audit.test.ts
git commit -m "fix: bind review evidence to real builds"
```

## Task 12: Add the Codex Host Orchestrator and portable CLI

**Files:**
- Create: `packages/director-engine/src/orchestrator.ts`
- Create: `packages/director-engine/src/doctor.ts`
- Modify: `packages/director-engine/src/cli.ts`
- Create: `tests/orchestrator.test.ts`
- Modify: `tests/cli.test.ts`

- [ ] **Step 1: Write failing orchestration tests**

```ts
test('a Codex brief runs intake, skills, direction, weapons, and compose in order', async () => {
  const events: string[] = [];
  await runDirectorTask(fixtureBrief(), instrumentedServices(events));
  expect(events).toEqual(['assets', 'skills', 'direction', 'storyboard', 'weapons', 'compose']);
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `npx vitest run tests/orchestrator.test.ts tests/cli.test.ts`

- [ ] **Step 3: Implement explicit commands**

```text
node <plugin-skill>/scripts/framepack-director.mjs doctor
node <plugin-skill>/scripts/framepack-director.mjs init <project> --title <title> --aspect <16:9|9:16> --duration <seconds>
node <plugin-skill>/scripts/framepack-director.mjs brief <project> --goal <text> [--audience <text>]
node <plugin-skill>/scripts/framepack-director.mjs assets <project> add <paths...>
node <plugin-skill>/scripts/framepack-director.mjs direct <project> --proposal-file <codex-authored-json-path>
node <plugin-skill>/scripts/framepack-director.mjs revise <project> --feedback <text> --proposal-file <codex-authored-json-path>
node <plugin-skill>/scripts/framepack-director.mjs serve <project> [--port 0]
node <plugin-skill>/scripts/framepack-director.mjs review <project> --scorecard <review-json>
node <plugin-skill>/scripts/framepack-director.mjs approve <project> --reason <text>
node <plugin-skill>/scripts/framepack-director.mjs waive <project> --reason <text>
node <plugin-skill>/scripts/framepack-director.mjs handoff <project>
```

The plugin does not register a PATH command. Its bundled `framepack-director` skill resolves the directory containing its own `SKILL.md`, then runs the adjacent `scripts/framepack-director.mjs`. `doctor` checks Node, writable project root, local HyperFrames 0.7.56, browser port availability, fonts/vendor files, and ffprobe. It prints Chinese remediation without modifying a project unless Codex runs an explicit, user-authorized install command.

`direct --proposal-file` and `revise --proposal-file` read a UTF-8 Codex-authored JSON file conforming to `DirectionProposalSchema`. Tests cover Chinese, spaces, emoji, and proposals larger than the Windows command-line limit. The CLI validates and records the current skill hashes, proposal hash, applied output paths, command results, retry count, and cancellation state in `.framepack/host-run-receipt.json`. This is the concrete bridge from the current Codex conversation to the deterministic engine.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/orchestrator.test.ts tests/cli.test.ts`

- [ ] **Step 5: Commit**

```bash
git add packages/director-engine/src/orchestrator.ts packages/director-engine/src/doctor.ts packages/director-engine/src/cli.ts tests/orchestrator.test.ts tests/cli.test.ts
git commit -m "feat: orchestrate Codex director tasks"
```

## Task 13: Rebuild the API around project state and events

**Files:**
- Create: `apps/director-workbench/src/api.ts`
- Create: `apps/director-workbench/src/event-stream.ts`
- Modify: `apps/director-workbench/src/server.ts`
- Modify: `tests/server.test.ts`

- [ ] **Step 1: Write failing API tests**

Test `/api/project`, `/api/assets`, `/api/direction`, `/api/storyboard`, `/api/review`, `/api/events`, `/api/jobs`, and `/api/decision`. Require Chinese error messages, correct HTTP status codes, path containment, body-size limits, and cancellation.

- [ ] **Step 2: Run and confirm RED**

Run: `npx vitest run tests/server.test.ts`

- [ ] **Step 3: Implement API handlers as thin director-engine calls**

The server must not duplicate project transitions. Use server-sent events for status updates. Bind to `127.0.0.1`, choose a free port when `--port 0`, return a 409 for stale decisions, and serve preview assets only under the selected project.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/server.test.ts`

- [ ] **Step 5: Commit**

```bash
git add apps/director-workbench/src tests/server.test.ts
git commit -m "feat: expose versioned director workbench API"
```

## Task 14: Build the Chinese Director Cockpit

**Files:**
- Rewrite: `apps/director-workbench/public/index.html`
- Rewrite: `apps/director-workbench/public/main.js`
- Rewrite: `apps/director-workbench/public/style.css`
- Create: `tests/workbench-copy.test.ts`
- Create: `docs/evidence/workbench/README.md`

- [ ] **Step 1: Write failing copy and hierarchy tests**

```ts
test('the workbench exposes no developer English in primary UI', () => {
  const html = readFileSync('apps/director-workbench/public/index.html', 'utf8');
  expect(html).toContain('今天想做一支什么样的片子？');
  expect(html).not.toMatch(/Build preview|Extract proof|Run taste audit|Handoff/);
});

test('the browser never pretends to be a Codex chat surface', () => {
  const html = readFileSync('apps/director-workbench/public/index.html', 'utf8');
  expect(html).not.toContain('id="director-chat-input"');
  expect(html).toContain('请在当前 Codex 对话中告诉我');
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `npx vitest run tests/workbench-copy.test.ts`

- [ ] **Step 3: Implement the approved layout**

Build the three-lane cockpit: director communication/brief, dominant preview stage, director judgment, plus bottom storyboard timeline. Use deep ink surfaces, warm white type, one vermilion accent, local Chinese fonts, cardless divisions, and one primary action per state.

- [ ] **Step 4: Implement stateful interactions**

Render the nine Chinese phase labels, asset gaps, direction summary, skill and weapon provenance in expandable details, preview controls, stale evidence, review scorecards, approve/waive reasons, connection loss, job cancellation, and comparison of current versus prior build. Creative actions such as changing style or rewriting scenes explicitly point the user back to the current Codex conversation; only deterministic actions such as approve, waive, retry connection, and cancel job write browser events directly.

- [ ] **Step 5: Run DOM/copy tests**

Run: `npx vitest run tests/workbench-copy.test.ts tests/server.test.ts`

- [ ] **Step 6: Run browser QA before committing**

Start a real fixture server, then use Playwright CLI at 1440×900, 1280×800, and 430×932. At each size, snapshot first, verify the preview-stage rectangle and viewport rectangle, confirm the desktop stage uses at least 55% of main-workspace width, confirm narrow-screen order is director context → preview → judgment, and check console errors. Save screenshots and measured JSON in `docs/evidence/workbench/`.

Also verify the connection-loss screen, all nine Chinese states, one primary action per state, 40×40 minimum targets, and that normal/large text colors meet 4.5:1/3:1 contrast. Fix failures before the commit.

- [ ] **Step 7: Commit**

```bash
git add apps/director-workbench/public tests/workbench-copy.test.ts docs/evidence/workbench
git commit -m "feat: build Chinese director cockpit"
```

## Task 15: Package the Codex plugin and repo marketplace

**Files:**
- Create: `plugins/framepack-director/.codex-plugin/plugin.json`
- Create: `plugins/framepack-director/skills/framepack-director/SKILL.md`
- Create: `plugins/framepack-director/skills/framepack-director/scripts/framepack-director.mjs`
- Create: `scripts/build-plugin.ts`
- Create: `.agents/plugins/marketplace.json`
- Create: `tests/plugin.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Scaffold with the official plugin creator**

Run from `C:\Users\LENOVO\.codex\skills\.system\plugin-creator`:

```powershell
python scripts/create_basic_plugin.py framepack-director --path F:\hyperframes\.worktrees\codex-director-workbench\plugins --with-skills --with-scripts --with-assets
```

Do not create or edit the user's personal marketplace during repository development. The committed repo marketplace is created under `.agents/plugins/marketplace.json`.

Install deterministic build and Chinese-font dependencies:

```powershell
npm install --save-dev esbuild @fontsource/noto-sans-sc
```

The bundled Chinese typeface is Noto Sans SC under OFL-1.1. Copy its license into the plugin and require it in packaging tests.

- [ ] **Step 2: Write failing plugin tests**

```ts
test('plugin manifest, bundle, assets, and marketplace resolve', () => {
  const manifest = JSON.parse(readFileSync('plugins/framepack-director/.codex-plugin/plugin.json', 'utf8'));
  expect(manifest).toMatchObject({ name: 'framepack-director', skills: './skills/' });
  expect(existsSync('plugins/framepack-director/skills/framepack-director/scripts/framepack-director.mjs')).toBe(true);
  expect(existsSync('plugins/framepack-director/assets/runtime/fonts/NotoSansSC-Regular.woff2')).toBe(true);
  expect(existsSync('plugins/framepack-director/assets/runtime/fonts/OFL-1.1.txt')).toBe(true);
  expect(marketplaceEntry().source.path).toBe('./plugins/framepack-director');
});
```

- [ ] **Step 3: Run and confirm RED**

Run: `npx vitest run tests/plugin.test.ts`

- [ ] **Step 4: Implement deterministic bundle generation**

Use esbuild to bundle the CLI/server engine and runtime dependencies into `skills/framepack-director/scripts/framepack-director.mjs`. Copy workbench assets, Noto Sans SC plus OFL license, GSAP, skill assets, style catalog, and proven weapons into the plugin. The bundle locates assets relative to `import.meta.url`; it never assumes the source repository path.

The plugin `SKILL.md` is the executable entry. It instructs Codex to resolve the directory containing that loaded skill and invoke its adjacent script for `doctor`, project creation, proposal application, revision, serving, review, approval, and handoff. Do not claim that installation creates a global `framepack` executable; v1 is invoked through the installed skill.

Manifest identity:

```json
{
  "name": "framepack-director",
  "version": "0.1.0",
  "description": "中文编程式视频导演工作台，为 HyperFrames 生成可审片样片与生产交接包。",
  "author": { "name": "Framepack Project" },
  "skills": "./skills/",
  "interface": {
    "displayName": "Framepack 导演台",
    "shortDescription": "把想法和素材变成可审片的动态样片",
    "longDescription": "在 Codex 中完成中文需求分诊、素材整理、导演方向、动态样片、审片证据与 HyperFrames 生产交接。",
    "developerName": "Framepack Project",
    "category": "Productivity",
    "capabilities": ["Interactive", "Write"],
    "defaultPrompt": [
      "帮我做一支产品发布视频",
      "根据这些素材给我一版导演方案",
      "打开 Framepack 导演台继续审片"
    ],
    "brandColor": "#B4472D"
  }
}
```

Committed marketplace identity:

```json
{
  "name": "framepack",
  "interface": { "displayName": "Framepack" },
  "plugins": [{
    "name": "framepack-director",
    "source": { "source": "local", "path": "./plugins/framepack-director" },
    "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
    "category": "Productivity"
  }]
}
```

- [ ] **Step 5: Validate with project and official validators**

Run:

```powershell
npm run plugin:build
npx vitest run tests/plugin.test.ts
python C:\Users\LENOVO\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py plugins\framepack-director
```

Expected: all PASS and no placeholder fields.

- [ ] **Step 6: Commit**

```bash
git add plugins/framepack-director .agents/plugins/marketplace.json scripts/build-plugin.ts tests/plugin.test.ts package.json package-lock.json
git commit -m "feat: package Framepack Codex plugin"
```

## Task 16: Prove the first real product-launch loop

**Files:**
- Create: `tests/fixtures/product-launch/{brief.json,product.png,brand.md}`
- Create: `tests/e2e-product-launch.test.ts`
- Create: `docs/evidence/product-launch/README.md`

- [ ] **Step 1: Write a failing 16:9 and 9:16 E2E test**

The automated test initializes a Chinese brief, imports real local fixture assets, directs, composes, runs HyperFrames lint/check, captures six frames, and proves the project remains `needs_review` without an identified subjective reviewer. It then adds feedback “降低科技感、产品再突出”, rebuilds, and proves the hash, storyboard semantics, HTML, and evidence frames changed. Automated fixtures must never claim `source: human`.

- [ ] **Step 2: Run and confirm RED**

Run: `npx vitest run tests/e2e-product-launch.test.ts`

- [ ] **Step 3: Make only the minimum fixes required by the fixture**

Do not relax assertions or replace real snapshot capture with a stub. Store generated artifacts under ignored `tmp/e2e-product-launch-*`; copy only selected evidence frames and the report into `docs/evidence/product-launch/`.

- [ ] **Step 4: Perform an identified visual-review checkpoint**

Open the actual contact sheets and motion preview. Write a scorecard with `source: codex` and the current Codex model/session identifier, or pause for the user and record `source: human`. Cite build hash, frame paths, per-dimension reasons, and review time. If no reviewer performs this step, leave the project `needs_review` and do not approve or hand off.

- [ ] **Step 5: Run HyperFrames checks explicitly**

Run:

```powershell
npx --no-install hyperframes lint tmp\e2e-product-launch-169 --json
npx --no-install hyperframes check tmp\e2e-product-launch-169 --json
npx --no-install hyperframes lint tmp\e2e-product-launch-916 --json
npx --no-install hyperframes check tmp\e2e-product-launch-916 --json
```

Expected: zero errors and zero warnings in both ratios.

- [ ] **Step 6: Approve the reviewed build and prove handoff**

Use the reviewed content hash. Confirm a stale pre-feedback scorecard cannot approve the post-feedback build, then approve the reviewed build and generate handoff.

- [ ] **Step 7: Commit**

```bash
git add tests/fixtures/product-launch tests/e2e-product-launch.test.ts docs/evidence/product-launch
git commit -m "test: prove product launch director loop"
```

## Task 17: Expand to v1 workflow and arsenal coverage

**Files:**
- Create: `packages/director-assets/skills/faceless-explainer/SKILL.md`
- Create: `packages/director-assets/skills/website-to-video/SKILL.md`
- Add: three more proven weapon folders under `packages/director-assets/weapons/`
- Create: eight style specimens under `packages/director-assets/specimens/styles/`
- Create: `tests/e2e-faceless.test.ts`
- Create: `tests/e2e-website.test.ts`
- Create: `tests/style-specimens.test.ts`

- [ ] **Step 1: Add failing workflow and specimen tests**

Require one feedback/revision round per workflow, six proven weapons total, and eight visible style specimens. Every specimen must use Noto Sans SC or another locally licensed font, local assets, and pass HyperFrames lint/check.

- [ ] **Step 2: Run and confirm RED**

Run: `npx vitest run tests/e2e-faceless.test.ts tests/e2e-website.test.ts tests/style-specimens.test.ts`

- [ ] **Step 3: Implement the two additional skills and three weapons**

Select weapons by commercial value and HyperFrames safety from the migration ledger. Do not migrate deprecated `transitions-pack`. For each additional weapon, repeat Task 9's dual-ratio bench, real lint/check/snapshots, and identified visual review. Mark every unverified historical asset `candidate`, never `proven`.

- [ ] **Step 4: Render and review eight style specimens**

Create Chinese visual examples, not YAML screens. Score them using the seven-dimension schema and keep the scorecard plus evidence frames.

For `website-to-video`, require an explicitly supplied URL, record capture consent and timestamp, run the official HyperFrames capture capability, localize screenshots/tokens, record source URLs and derived hashes, and test timeout/403/partial-capture recovery without discarding successful assets.

On timeout, inspect `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, npm proxy, git proxy, and Windows proxy settings, then retry the official capture command through the detected proxy before declaring partial failure. The retry and final failure reason are written to the asset ledger.

- [ ] **Step 5: Run all workflow tests**

Run: `npx vitest run tests/e2e-product-launch.test.ts tests/e2e-faceless.test.ts tests/e2e-website.test.ts tests/style-specimens.test.ts`

- [ ] **Step 6: Refresh and verify the distributable plugin**

Run `npm run plugin:build`, then extend `tests/plugin.test.ts` to assert the packaged plugin contains exactly the three workflow skills (`product-launch-video`, `faceless-explainer`, `website-to-video`), six `proven` weapon manifests plus scorecards, and eight style specimens. Compare sha256 values for every source asset and packaged copy; any stale or missing bundle file fails the test.

Run:

```powershell
npm run plugin:build
npx vitest run tests/plugin.test.ts
python C:\Users\LENOVO\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py plugins\framepack-director
```

Expected: PASS with source/package hash equality. This package-refresh commit must exist before Task 19 clean-clone installation.

- [ ] **Step 7: Commit**

```bash
git add packages/director-assets tests docs/evidence docs/migration/legacy-inheritance.md plugins/framepack-director
git commit -m "feat: complete Codex director workflow coverage"
```

## Task 18: Remove the legacy runtime from the new branch

**Files:**
- Delete from current branch: `framepack-plugin/`
- Delete from current branch: `framepack-e2e-test/`
- Delete from current branch: legacy `.hermes/` handoff, research, and Hermes-only plans
- Delete from current branch: root `.framepack/` Hermes deployment receipts
- Delete any remaining Hermes-only deployment files identified by the denylist
- Rewrite: `AGENTS.md`
- Modify: `scripts/validate-no-legacy.ts`
- Create: `tests/legacy-retirement.test.ts`
- Modify: `README.md`
- Modify: `docs/README.zh-CN.md`

- [ ] **Step 1: Write and run the failing retirement test**

```ts
test('archived Hermes source is absent from the new branch', () => {
  expect(existsSync('framepack-plugin')).toBe(false);
  expect(existsSync('framepack-e2e-test')).toBe(false);
  expect(existsSync('.hermes')).toBe(false);
  expect(existsSync('.framepack/hermes_patches.json')).toBe(false);
  expect(scanAllTrackedFiles({ allow: [
    'docs/migration/legacy-inheritance.md',
    'docs/superpowers/specs/2026-07-13-framepack-chinese-director-workbench-redesign.md',
    'docs/superpowers/plans/2026-07-13-framepack-codex-director-v1.md',
    'scripts/validate-no-legacy.ts',
    'tests/legacy-retirement.test.ts',
  ] })).toEqual([]);
});
```

`scanAllTrackedFiles` is exported by `scripts/validate-no-legacy.ts`. It reads `git ls-files` for the whole repository and rejects relocated Hermes hooks, Python plugin runtimes, deployment scripts, `ctx.inject_message`, `Hermes_windows`, imports/spawns/path reads of archived runtime names, and forbidden runtime dependencies. The script's CLI path runs this same full tracked-file scan, so `npm run plugin:validate` enforces retirement outside Vitest. Only the explicit documentation/enforcement allowlist may contain historical source paths.

Run: `npx vitest run tests/legacy-retirement.test.ts`

Expected: FAIL while the tracked legacy directories still exist.

- [ ] **Step 2: Verify every selected legacy asset has a provenance entry**

Run: `npx tsx scripts/validate-migration-ledger.ts`

Expected: PASS with all migrated skill/style/weapon sources recorded.

- [ ] **Step 3: Remove legacy runtime directories from the feature branch**

Use `git rm` only for tracked legacy paths after confirming the resolved worktree root is `F:\hyperframes\.worktrees\codex-director-workbench`. Remove the two legacy runtime trees, `.hermes/`, and tracked root `.framepack/` Hermes receipts. Rewrite `AGENTS.md` as a short Codex-first development guide. The removed content remains available in Git history and is not copied into an archive folder.

- [ ] **Step 4: Rewrite public documentation around Codex installation and use**

Document:

```text
Personal local testing: install from the personal marketplace, then start a new task.
Repo/team: codex plugin marketplace add <repo-or-local-root>
Install: codex plugin add framepack-director@framepack
Use: open a new Codex task and say “帮我做一支产品发布视频”; the installed skill invokes its bundled script by plugin-relative path.
Project output: only .framepack, .hyperframes, frame.md, index.html, and local public assets.
```

- [ ] **Step 5: Run boundary and full tests**

Run: `npm run verify && npx vitest run tests/legacy-retirement.test.ts && npx tsx scripts/validate-migration-ledger.ts`

Expected: verification PASS; the tracked-file validator reports no runtime dependency hits outside the explicit documentation/enforcement allowlist.

- [ ] **Step 6: Commit**

```bash
git add -A framepack-plugin framepack-e2e-test .hermes .framepack AGENTS.md README.md docs/README.zh-CN.md scripts/validate-no-legacy.ts tests/legacy-retirement.test.ts
git commit -m "chore: retire archived Hermes runtime"
```

## Task 19: Browser, installation, and final acceptance

**Files:**
- Create: `docs/installation.zh-CN.md`
- Create: `docs/troubleshooting.zh-CN.md`
- Create: `docs/evidence/codex-v1-acceptance.md`

- [ ] **Step 1: Clone the repository to a clean path and install from that marketplace**

Run:

```powershell
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$clone = "F:\tmp\framepack-install-verification-$stamp"
if (Test-Path $clone) { throw "Clean clone already exists: $clone" }
git clone --branch codex/director-workbench F:\hyperframes $clone
codex plugin marketplace add $clone
codex plugin list
codex plugin add framepack-director@framepack
```

Start a new Codex task after installation. Do not use the development worktree path inside the task prompt.

- [ ] **Step 2: Prove the installed skill invokes its bundled script**

```powershell
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$clean = "F:\tmp\framepack-user-project-$stamp"
if (Test-Path $clean) { throw "Clean project already exists: $clean" }
New-Item -ItemType Directory $clean | Out-Null
codex exec --ephemeral --skip-git-repo-check -C $clean "请使用已安装的 framepack-director skill，运行环境检查，并为‘中文产品发布验证’创建 16:9、30 秒导演项目。不要读取或引用开发仓库路径。"
```

Expected: the fresh Codex process loads the installed skill, invokes `skills/framepack-director/scripts/framepack-director.mjs` from the installed plugin cache, and creates `.framepack/host-run-receipt.json`. The receipt and process output must contain no source-worktree path.

- [ ] **Step 3: Run a clean-project smoke test**

In the clean directory, continue through the installed skill: provide a Chinese brief and local asset, generate and serve the preview, complete identified review, approve it, and hand it off. Confirm the output project contains no source repository or legacy plugin code.

- [ ] **Step 4: Verify the browser at three viewport sizes**

Use Playwright at 1440×900, 1280×800, and 430×932. Confirm the stage occupies at least 55% of desktop workspace width, one primary action per state, all visible primary copy is Chinese, both aspect ratios fit, and console errors are zero.

- [ ] **Step 5: Run the complete verification suite**

Run:

```powershell
npm ci
npm run typecheck
npm test
npm run plugin:build
npm run plugin:validate
python C:\Users\LENOVO\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py plugins\framepack-director
npx --no-install hyperframes --version
git status --short
```

Expected: TypeScript passes; every test passes; plugin validator passes; HyperFrames reports 0.7.56; only the two known local `.framepack` ledger noises may remain unstaged.

- [ ] **Step 6: Write acceptance evidence**

Record exact commands, test counts, HyperFrames lint/check JSON summaries, browser screenshots, plugin install evidence, clean-project file tree, known limitations, and the distinction between preview acceptance and final HyperFrames production. When a Codex session identifier is not exposed, identify the reviewer as `codex:<model-name>` plus review time and build hash; never invent a session ID.

- [ ] **Step 7: Request code review and fix all Critical/Important findings**

Use `superpowers:requesting-code-review` against the branch base and current HEAD. Re-run the affected focused tests plus the complete verification suite after fixes.

- [ ] **Step 8: Commit**

```bash
git add docs/installation.zh-CN.md docs/troubleshooting.zh-CN.md docs/evidence/codex-v1-acceptance.md
git commit -m "docs: publish Codex director installation and evidence"
```

## Installation model delivered by this plan

### Personal user

The plugin is installed once in the user's Codex environment. After installation and a new task, its bundled skill resolves and invokes its own packaged script in any authorized local project. It does not create a global PATH command, and no Framepack source checkout is required.

### Project or team

The project or team adds the Git marketplace source, installs `framepack-director`, and shares the same plugin version. The video project receives only its own `.framepack/`, `.hyperframes/`, `frame.md`, `index.html`, and `public/` assets.

### Workspace sharing

After local validation, the plugin can be shared from the desktop plugin details page with selected workspace members or groups. Public marketplace submission remains a separate release decision and is not required for Codex v1 acceptance.
