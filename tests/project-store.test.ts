import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  contentHash,
  createProjectStore,
  type ContentFingerprint,
} from '../packages/director-engine/src/index.js';

const projects: string[] = [];

function fingerprint(): ContentFingerprint {
  return {
    brief: { goal: '突出产品', audience: '新用户' },
    assetHashes: { product: 'asset-a' },
    direction: { title: '克制首映' },
    storyboard: { scenes: [{ id: 's1', message: '产品登场' }] },
    skillLoadPlan: { workflows: ['product-launch-video'] },
    loadedSkillHashes: { 'product-launch-video': 'skill-a' },
    weaponLoadPlan: { sceneWeapons: { s1: 'text-split-enter' } },
    loadedWeaponHashes: { 'text-split-enter': 'weapon-a' },
    hyperframesVersion: '0.7.56',
    fontHashes: { 'NotoSansSC-Regular.woff2': 'font-a' },
    vendorHashes: { 'gsap.min.js': 'vendor-a' },
    composerConfig: { width: 1920, height: 1080, fps: 30 },
    composerVersion: '1.0.0',
  };
}

async function testProject(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), 'framepack-project-store-'));
  projects.push(path);
  return path;
}

afterEach(async () => {
  await Promise.all(projects.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe('director project event store', () => {
  test('feedback creates a new content hash and stales prior approval', async () => {
    const projectDir = await testProject();
    const store = await createProjectStore(projectDir, fingerprint());
    const before = await store.recordApproval('build-1', '方向确认');

    await store.appendEvent({
      version: '1.0',
      id: 'evt-feedback-1',
      type: 'feedback.added',
      at: '2026-07-13T00:00:00.000Z',
      payload: { text: '降低科技感' },
    });

    const state = await store.readState();
    expect(state.contentHash).not.toBe(before.contentHash);
    expect(state.currentBuildId).toBeNull();
    expect(await store.readApproval()).toMatchObject({ status: 'stale' });
    expect(await readFile(join(projectDir, '.framepack', 'events.jsonl'), 'utf8')).toContain('降低科技感');
  });

  test('recorded approval and decision event are one consistent audit action', async () => {
    const projectDir = await testProject();
    const store = await createProjectStore(projectDir, fingerprint());
    const approval = await store.recordApproval('build-1', '方向确认');
    const events = (await readFile(join(projectDir, '.framepack', 'events.jsonl'), 'utf8'))
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as { type: string; payload: unknown });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: 'decision.recorded', payload: approval });
    expect(await store.readApproval()).toMatchObject({ ...approval, status: 'current' });
  });

  test('an appended decision event materializes the matching approval state', async () => {
    const projectDir = await testProject();
    const store = await createProjectStore(projectDir, fingerprint());
    const currentHash = (await store.readState()).contentHash!;
    await store.appendEvent({
      version: '1.0',
      id: 'evt-external-decision',
      type: 'decision.recorded',
      at: '2026-07-13T00:00:00.000Z',
      payload: {
        state: 'approved',
        reason: '外部确认',
        previewBuildId: 'build-external',
        contentHash: currentHash,
        decidedAt: '2026-07-13T00:00:00.000Z',
      },
    });

    expect(await store.readApproval()).toMatchObject({
      previewBuildId: 'build-external',
      contentHash: currentHash,
      status: 'current',
    });
    expect(await store.readState()).toMatchObject({ phase: 'approved', currentBuildId: 'build-external' });
  });

  test.each([
    'brief',
    'assetHashes',
    'direction',
    'storyboard',
    'skillLoadPlan',
    'loadedSkillHashes',
    'weaponLoadPlan',
    'loadedWeaponHashes',
    'fontHashes',
    'vendorHashes',
    'hyperframesVersion',
    'composerConfig',
    'composerVersion',
  ] as const)('%s changes stale prior evidence', async (field) => {
    const projectDir = await testProject();
    const store = await createProjectStore(projectDir, fingerprint());
    await store.recordApproval('build-1', '方向确认');
    const current = await store.readFingerprint();

    await store.updateFingerprint({
      ...current,
      [field]: typeof current[field] === 'string'
        ? `${current[field]}-changed`
        : { ...(current[field] as object), changed: true },
    });

    expect((await store.readApproval())?.status).toBe('stale');
  });

  test('canonical hashing ignores object key insertion order and supports Windows paths', () => {
    const first = fingerprint();
    const second = {
      ...first,
      brief: { audience: '新用户', goal: '突出产品' },
      composerConfig: { fps: 30, height: 1080, width: 1920, output: 'C:\\影片\\预览' },
    };
    const third = {
      ...first,
      composerConfig: { output: 'C:\\影片\\预览', width: 1920, fps: 30, height: 1080 },
    };

    expect(contentHash(second)).toBe(contentHash(third));
    expect(contentHash(first)).not.toBe(contentHash(second));
  });

  test('approval is stale when fingerprint advanced but state write was interrupted', async () => {
    const projectDir = await testProject();
    const store = await createProjectStore(projectDir, fingerprint());
    await store.recordApproval('build-1', '方向确认');
    await writeFile(
      join(projectDir, '.framepack', 'content-fingerprint.json'),
      `${JSON.stringify({ ...fingerprint(), composerVersion: '1.0.1' }, null, 2)}\n`,
      'utf8',
    );

    expect((await store.readApproval())?.status).toBe('stale');
  });

  test('concurrent feedback events are serialized without losing either change', async () => {
    const projectDir = await testProject();
    const store = await createProjectStore(projectDir, fingerprint());
    await Promise.all(['降低科技感', '产品再突出'].map((text, index) => store.appendEvent({
      version: '1.0',
      id: `evt-concurrent-${index}`,
      type: 'feedback.added',
      at: `2026-07-13T00:00:0${index}.000Z`,
      payload: { text },
    })));

    const current = await store.readFingerprint();
    expect(current.brief).toMatchObject({ feedback: ['降低科技感', '产品再突出'] });
  });

  test('canonical hashing does not depend on machine locale collation', () => {
    const localeCompare = vi.spyOn(String.prototype, 'localeCompare').mockImplementation(() => {
      throw new Error('locale collation must not participate in canonical hashing');
    });
    try {
      expect(contentHash({
        ...fingerprint(),
        composerConfig: { 中文: true, alpha: true, 'é': true },
      })).toMatch(/^[a-f0-9]{64}$/);
    } finally {
      localeCompare.mockRestore();
    }
  });
});
