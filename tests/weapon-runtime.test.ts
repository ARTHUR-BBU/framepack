import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import {
  loadWeaponRegistry,
  persistWeaponEvidence,
  resolveWeapons,
  renderWeaponInvocation,
  verifyWeaponCalls,
} from '../packages/director-engine/src/index.js';
import {
  WeaponLoadPlanSchema,
  WeaponManifestSchema,
  type Storyboard,
} from '../packages/director-contracts/src/index.js';
import { generateStoryboard } from '../packages/director-engine/src/storyboard.js';
import { DirectionSelectionSchema } from '../packages/director-contracts/src/direction.js';

const temporaryPaths: string[] = [];

function storyboard(): Storyboard {
  return generateStoryboard({
    title: '效率发布片', durationSeconds: 20, corePromise: '把工作化繁为简',
    benefits: ['节省 120 小时', '重点自动浮现'], cta: '立即体验', assetIds: ['product'],
  }, DirectionSelectionSchema.parse({
    version: '1.0', primaryStyle: 'swiss-pulse', supportingStyle: 'soft-signal',
    tasteMoves: ['product-reveal-ritual'], surpriseOperators: [], avoid: ['generic-card-grid'], rationale: '产品证据优先',
  }));
}

afterEach(async () => {
  await Promise.all(temporaryPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe('Codex weapon runtime', () => {
  test('bundled manifests start as honest candidates with portable provenance', async () => {
    const registry = await loadWeaponRegistry();
    expect(registry.weapons.map((weapon) => weapon.id).sort()).toEqual(['caption-clip-wipe', 'number-count-up', 'text-split-enter']);
    expect(registry.weapons.every((weapon) => weapon.maturity === 'candidate')).toBe(true);
    expect(registry.weapons.every((weapon) => weapon.source.commit.length === 40 && !weapon.entry.startsWith('/'))).toBe(true);
  });

  test('candidate weapons are suggested but cannot be auto-selected', async () => {
    const result = await resolveWeapons(storyboard(), await loadWeaponRegistry());
    expect(result.selected).toEqual([]);
    expect(result.candidates.map((candidate) => candidate.weaponId)).toContain('text-split-enter');
    expect(result.candidates.map((candidate) => candidate.weaponId)).toContain('number-count-up');
  });

  test('a load plan without an HTML invocation receipt fails', () => {
    const inputHash = 'a'.repeat(64);
    const plan = WeaponLoadPlanSchema.parse({
      version: '1.0', storyboardId: 'storyboard-1', inputHash,
      selected: [{ sceneId: 'scene-1', weaponId: 'text-split-enter', functionName: 'textSplitEnter', entry: 'text-split-enter/index.js', entryHash: 'b'.repeat(64), params: { duration: 0.6 } }],
      candidates: [], fallbacks: [],
    });
    expect(verifyWeaponCalls(plan, '')).toContain('weapon_not_invoked:text-split-enter');
    const params = { splitMode: 'horizontal', direction: 'inward', travelDistance: 40, staggerPerChar: 0.03, duration: 0.6 };
    const invocation = renderWeaponInvocation(plan.selected[0], inputHash);
    const html = `<script src="text-split-enter/index.js" data-sha256="${'b'.repeat(64)}"></script><script>${invocation}</script>`;
    expect(verifyWeaponCalls(plan, html)).toEqual([]);
    expect(verifyWeaponCalls(plan, html.replace('textSplitEnter(window', 'lookalikeAnimation(window'))).toContain('weapon_invocation_mismatch:text-split-enter');
    expect(verifyWeaponCalls(plan, html.replace('b'.repeat(64), 'c'.repeat(64)))).toContain('weapon_entry_hash_mismatch:text-split-enter');
    const bait = `JSON.parse(${JSON.stringify(JSON.stringify(params))});`;
    expect(verifyWeaponCalls(plan, html.replace(invocation, `${bait}${invocation.replace('0.6', '9')}`))).toContain('weapon_invocation_mismatch:text-split-enter');
  });

  test('parameter contracts reject unsafe or meaningless values', async () => {
    const registry = await loadWeaponRegistry();
    const counter = registry.weapons.find((weapon) => weapon.id === 'number-count-up')!;
    expect(() => counter.parameters.parse({ targetValue: Number.NaN })).toThrow();
    expect(() => counter.parameters.parse({ targetValue: 120, duration: -1 })).toThrow();
    expect(() => WeaponLoadPlanSchema.parse({
      version: '1.0', storyboardId: 's', inputHash: 'a'.repeat(64), candidates: [], fallbacks: [],
      selected: [{ sceneId: 'x', weaponId: 'number-count-up', functionName: 'numberCountUp', entry: 'number-count-up/index.js', entryHash: 'b'.repeat(64), params: { targetValue: 1, splitMode: 'horizontal' } }],
    })).toThrow();
  });

  test('portable manifest paths reject URLs and file URIs', () => {
    const valid = {
      version: '1.0', id: 'text-split-enter', chineseName: '标题', maturity: 'candidate', functionName: 'textSplitEnter',
      entry: 'text-split-enter/index.js', engine: 'gsap', purposes: ['hook'], signals: ['标题'],
      source: { asset: 'legacy/text.js', commit: 'a'.repeat(40), license: 'MIT' },
    };
    expect(() => WeaponManifestSchema.parse({ ...valid, entry: 'https://cdn.example/x.js' })).toThrow();
    expect(() => WeaponManifestSchema.parse({ ...valid, source: { ...valid.source, asset: 'file:///secret.js' } })).toThrow();
  });

  test('fallback evidence is recorded separately for every unresolved scene', async () => {
    const result = await resolveWeapons(storyboard(), await loadWeaponRegistry());
    expect(result.fallbacks.map((fallback) => fallback.sceneId).sort()).toEqual([...new Set(result.candidates.map((candidate) => candidate.sceneId))].sort());
    expect(result.fallbacks.every((fallback) => fallback.checkedSources.length > 0 && fallback.reason.length > 0)).toBe(true);
  });

  test('persists load and call receipts, including an honest hand-written fallback', async () => {
    const projectDir = await mkdtemp(join(tmpdir(), 'framepack-weapons-'));
    temporaryPaths.push(projectDir);
    const plan = WeaponLoadPlanSchema.parse({
      version: '1.0', storyboardId: 'storyboard-1', inputHash: 'a'.repeat(64), selected: [], candidates: [{ sceneId: 'scene-1', weaponId: 'text-split-enter', reason: '标题需要分裂入场', maturity: 'candidate' }],
      fallbacks: [{ sceneId: 'scene-1', checkedSources: ['text-split-enter'], rejectedCandidates: ['text-split-enter:candidate_not_proven'], reason: '没有已验证武器，保留手写并等待试拍' }],
    });
    await persistWeaponEvidence(projectDir, plan, '<html></html>');
    const savedPlan = JSON.parse(await readFile(join(projectDir, '.framepack', 'weapon-load-plan.json'), 'utf8'));
    const receipt = JSON.parse(await readFile(join(projectDir, '.framepack', 'weapon-call-receipt.json'), 'utf8'));
    expect(savedPlan.fallbacks[0].checkedSources).toEqual(['text-split-enter']);
    expect(receipt.calls).toEqual([]);
    expect(receipt.verificationErrors).toEqual([]);
  });
});
