import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { AssetLedgerSchema, ProjectSpecSchema, WeaponLoadPlanSchema } from '../packages/director-contracts/src/index.js';
import { chooseDirection, composePreview, generateStoryboard, stableStringify } from '../packages/director-engine/src/index.js';
import { inspectPreviewHtml } from '../packages/hyperframes-bridge/src/index.js';

const temporaryPaths: string[] = [];
afterEach(async () => Promise.all(temporaryPaths.splice(0).map((path) => rm(path, { recursive: true, force: true }))));

async function fixture(overrides: { title?: string; feedback?: string[]; missingAsset?: boolean; staleWeaponPlan?: boolean } = {}) {
  const projectDir = await mkdtemp(join(tmpdir(), 'framepack-composer-'));
  temporaryPaths.push(projectDir);
  const title = overrides.title ?? '让每一次协作更轻松';
  const skillPath = join(projectDir, 'skills', 'product-launch-video', 'SKILL.md');
  await mkdir(join(projectDir, 'skills', 'product-launch-video'), { recursive: true });
  await writeFile(skillPath, '---\\nname: product-launch-video\\n---\\n', 'utf8');
  const skillHash = createHash('sha256').update('---\\nname: product-launch-video\\n---\\n').digest('hex');
  const feedback = overrides.feedback ?? [];
  const direction = chooseDirection({ goal: `${title} SaaS 产品发布`, feedback });
  const storyboard = generateStoryboard({
    title, durationSeconds: 18, corePromise: title, benefits: ['节省 120 小时', '重点自动浮现'], cta: '立即体验', assetIds: ['product'],
  }, direction);
  const assetPath = join(projectDir, 'public', 'assets', 'product.png');
  if (!overrides.missingAsset) {
    await mkdir(join(projectDir, 'public', 'assets'), { recursive: true });
    await writeFile(assetPath, 'product-image', 'utf8');
  }
  const semanticStoryboard = { ...storyboard, createdAt: undefined };
  delete semanticStoryboard.createdAt;
  const inputHash = createHash('sha256').update(stableStringify(semanticStoryboard)).digest('hex');
  return {
    projectDir,
    spec: ProjectSpecSchema.parse({ title, aspectRatio: '16:9', durationSeconds: 18, width: 1920, height: 1080 }),
    assets: AssetLedgerSchema.parse({
      version: '1.0', summary: 'available', inspectedAt: new Date().toISOString(),
      assets: [{ version: '1.0', id: 'product', kind: 'image', mediaType: 'image/png', status: 'available', source: 'user', sourcePath: 'public/assets/product.png', sha256: createHash('sha256').update('product-image').digest('hex'), bytes: 13, assignedSceneIds: storyboard.scenes.filter((scene) => scene.assetIds.includes('product')).map((scene) => scene.id), confirmed: true }],
    }),
    direction,
    storyboard,
    skillReceipt: { version: '1.0' as const, intent: 'product-launch-video' as const, loaded: [{ id: 'product-launch-video', role: 'director' as const, resolvedSource: skillPath, portablePath: 'skills/product-launch-video/SKILL.md', sha256: skillHash, loadedAt: new Date().toISOString(), reason: '产品发布工作流' }], completedAt: new Date().toISOString() },
    weaponPlan: WeaponLoadPlanSchema.parse({ version: '1.0', storyboardId: storyboard.id, inputHash: overrides.staleWeaponPlan ? 'f'.repeat(64) : inputHash, selected: [], candidates: [], fallbacks: [] }),
    feedback,
  };
}

describe('project-specific preview composer', () => {
  test('Chinese brief and product asset appear in the composed preview', async () => {
    const input = await fixture();
    const build = await composePreview(input);
    expect(build.html).toContain('让每一次协作更轻松');
    expect(build.html).toContain('public/assets/product.png');
    expect(build.html).not.toContain('Make it felt.');
    const buildRoot = join(input.projectDir, '.framepack', 'builds', build.buildId);
    expect(await readFile(join(buildRoot, 'index.html'), 'utf8')).toBe(build.html);
    expect(await readFile(join(buildRoot, 'public', 'preview.css'), 'utf8')).toContain('Noto Sans SC');
    const css = await readFile(join(buildRoot, 'public', 'preview.css'), 'utf8');
    expect(css).toContain('#root{position:relative;width:100vw;height:100vh;overflow:hidden}');
    expect(css).toMatch(/\.purpose\{[^}]+\}\.scene-copy\{/);
    expect(css).toMatch(/\.direction-note\{[^}]+\}\.product-asset\{/);
    expect(await readFile(join(buildRoot, 'html-build-report.md'), 'utf8')).toContain('structural_contract: pass');
    expect(JSON.parse(await readFile(join(buildRoot, 'weapon-call-receipt.json'), 'utf8'))).toMatchObject({ verificationErrors: [] });
    expect(inspectPreviewHtml(build.html).codes).toEqual([]);
  });

  test('writes each preview into its own immutable build without replacing a root draft', async () => {
    const input = await fixture();
    await writeFile(join(input.projectDir, 'index.html'), '<main>user draft</main>', 'utf8');
    const first = await composePreview(input);
    input.feedback = ['第二版需要更克制'];
    const second = await composePreview(input);

    expect(first.buildId).not.toBe(second.buildId);
    expect(await readFile(join(input.projectDir, 'index.html'), 'utf8')).toBe('<main>user draft</main>');
    expect(await readFile(join(input.projectDir, '.framepack', 'builds', first.buildId, 'index.html'), 'utf8')).toBe(first.html);
    expect(await readFile(join(input.projectDir, '.framepack', 'builds', second.buildId, 'index.html'), 'utf8')).toBe(second.html);
    expect(JSON.parse(await readFile(join(input.projectDir, '.framepack', 'current-build.json'), 'utf8'))).toMatchObject({ buildId: second.buildId });
  });

  test('feedback changes build hash and visible direction', async () => {
    const first = await fixture();
    const second = await fixture({ feedback: ['降低科技感'] });
    const firstBuild = await composePreview(first);
    const secondBuild = await composePreview(second);
    expect(secondBuild.buildId).not.toBe(firstBuild.buildId);
    expect(secondBuild.html).toContain('柔和信号');
    expect(secondBuild.html).toContain('降低科技感');
  }, 15_000);

  test('missing assigned assets stop composition instead of falling back', async () => {
    await expect(composePreview(await fixture({ missingAsset: true }))).rejects.toThrow(/asset.*missing/i);
  });

  test('selected ESM weapons are embedded into the seek-safe production timeline', async () => {
    const input = await fixture();
    const entry = await readFile(join(process.cwd(), 'packages', 'director-assets', 'weapons', 'text-split-enter', 'index.js'));
    input.weaponPlan = WeaponLoadPlanSchema.parse({ ...input.weaponPlan, selected: [{ sceneId: input.storyboard.scenes[0].id, weaponId: 'text-split-enter', functionName: 'textSplitEnter', entry: 'text-split-enter/index.js', entryHash: createHash('sha256').update(entry.toString('utf8').replace(/\r\n/g, '\n')).digest('hex'), params: {} }] });
    const build = await composePreview(input);
    expect(build.html).toContain('framepack-weapon-module:{"entry":"text-split-enter/index.js"');
    expect(build.html).toContain('function textSplitEnter(');
    expect(build.html).not.toContain(`import { textSplitEnter } from './text-split-enter/index.js'`);
    const gsapReceipt = JSON.parse(await readFile(join(input.projectDir, '.framepack', 'builds', build.buildId, 'gsap-capability-receipt.json'), 'utf8'));
    expect(gsapReceipt.loaded.map((item: { id: string }) => item.id)).toEqual(['gsap-core', 'gsap-timeline', 'gsap-utils', 'gsap-performance']);
    expect(gsapReceipt.excluded).toContain('gsap-scrolltrigger');
  });

  test('a skill changed after its receipt stops composition', async () => {
    const input = await fixture();
    await writeFile(input.skillReceipt.loaded[0].resolvedSource, 'changed', 'utf8');
    await expect(composePreview(input)).rejects.toThrow(/skill.*hash|skill.*changed/i);
  });
  test('malformed skill receipts stop composition before loaded items are consumed', async () => {
    const input = await fixture();
    input.skillReceipt = { ...input.skillReceipt, completedAt: 'not-a-date', loaded: [{ id: '', resolvedSource: '', portablePath: '', sha256: 'nope', loadedAt: 'yesterday', reason: '' }] } as typeof input.skillReceipt;
    await expect(composePreview(input)).rejects.toThrow(/invalid skill load receipt/i);
  });

  test('unconfirmed unreferenced root media never enters the preview', async () => {
    const input = await fixture();
    input.assets = AssetLedgerSchema.parse({ ...input.assets, assets: [...input.assets.assets, { version: '1.0', id: 'draft-video', kind: 'video', mediaType: 'video/mp4', status: 'available', source: 'user', sourcePath: 'public/assets/draft.mp4', sha256: 'b'.repeat(64), bytes: 10, assignedSceneIds: [], confirmed: false }] });
    const build = await composePreview(input);
    expect(build.html).not.toContain('draft.mp4');
  });

  test('weapon invocation is pinned to the owning scene absolute time', async () => {
    const input = await fixture();
    const entry = await readFile(join(process.cwd(), 'packages', 'director-assets', 'weapons', 'text-split-enter', 'index.js'));
    input.weaponPlan = WeaponLoadPlanSchema.parse({ ...input.weaponPlan, selected: [{ sceneId: input.storyboard.scenes[0].id, weaponId: 'text-split-enter', functionName: 'textSplitEnter', entry: 'text-split-enter/index.js', entryHash: createHash('sha256').update(entry.toString('utf8').replace(/\r\n/g, '\n')).digest('hex'), params: {} }] });
    const build = await composePreview(input);
    expect(build.html).toContain(`,${input.storyboard.scenes[0].startSeconds + 0.18});`);
  });
  test('asset assignment drift from the storyboard stops composition', async () => {
    const input = await fixture();
    input.assets = AssetLedgerSchema.parse({ ...input.assets, assets: input.assets.assets.map((asset) => ({ ...asset, assignedSceneIds: [input.storyboard.scenes[0].id] })) });
    await expect(composePreview(input)).rejects.toThrow(/asset assignment.*stale/i);
  });

  test('a planned weapon targeting a missing scene stops composition', async () => {
    const input = await fixture();
    const entry = await readFile(join(process.cwd(), 'packages', 'director-assets', 'weapons', 'text-split-enter', 'index.js'));
    input.weaponPlan = WeaponLoadPlanSchema.parse({ ...input.weaponPlan, selected: [{ sceneId: 'missing-scene', weaponId: 'text-split-enter', functionName: 'textSplitEnter', entry: 'text-split-enter/index.js', entryHash: createHash('sha256').update(entry.toString('utf8').replace(/\r\n/g, '\n')).digest('hex'), params: {} }] });
    await expect(composePreview(input)).rejects.toThrow(/weapon plan.*scene/i);
  });
  test('unavailable planned weapons stop composition', async () => {
    const input = await fixture();
    input.weaponPlan = WeaponLoadPlanSchema.parse({
      ...input.weaponPlan,
      selected: [{ sceneId: input.storyboard.scenes[0].id, weaponId: 'text-split-enter', functionName: 'textSplitEnter', entry: 'text-split-enter/index.js', entryHash: 'a'.repeat(64), params: {} }],
    });
    await expect(composePreview({ ...input, weaponRoot: join(input.projectDir, 'missing-weapons') })).rejects.toThrow(/planned weapon unavailable/i);
  });

  test('weapon embedding rejects script-boundary injection even when the hash matches', async () => {
    const input = await fixture();
    const weaponRoot = join(input.projectDir, 'unsafe-weapons');
    const entry = 'text-split-enter/index.js';
    const source = `export function textSplitEnter() { return "</script>"; }`;
    await mkdir(join(weaponRoot, 'text-split-enter'), { recursive: true });
    await writeFile(join(weaponRoot, entry), source, 'utf8');
    input.weaponPlan = WeaponLoadPlanSchema.parse({
      ...input.weaponPlan,
      selected: [{ sceneId: input.storyboard.scenes[0].id, weaponId: 'text-split-enter', functionName: 'textSplitEnter', entry, entryHash: createHash('sha256').update(source).digest('hex'), params: {} }],
    });
    await expect(composePreview({ ...input, weaponRoot })).rejects.toThrow(/unsafe script boundary/i);
  });

  test('weapon embedding rejects dynamic imports even when the hash matches', async () => {
    const input = await fixture();
    const weaponRoot = join(input.projectDir, 'dynamic-import-weapons');
    const entry = 'text-split-enter/index.js';
    const source = `export function textSplitEnter() { return import('./unlocked.js'); }`;
    await mkdir(join(weaponRoot, 'text-split-enter'), { recursive: true });
    await writeFile(join(weaponRoot, entry), source, 'utf8');
    input.weaponPlan = WeaponLoadPlanSchema.parse({
      ...input.weaponPlan,
      selected: [{ sceneId: input.storyboard.scenes[0].id, weaponId: 'text-split-enter', functionName: 'textSplitEnter', entry, entryHash: createHash('sha256').update(source).digest('hex'), params: {} }],
    });
    await expect(composePreview({ ...input, weaponRoot })).rejects.toThrow(/imports are not supported/i);
  });

  test('stale weapon plans stop composition', async () => {
    await expect(composePreview(await fixture({ staleWeaponPlan: true }))).rejects.toThrow(/weapon plan.*stale/i);
  });
});
