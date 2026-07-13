import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import {
  generateStoryboard,
  createProjectStore,
  persistStoryboard,
  reviseStoryboard,
} from '../packages/director-engine/src/index.js';
import {
  DirectionSelectionSchema,
  StoryboardSchema,
} from '../packages/director-contracts/src/index.js';

const temporaryPaths: string[] = [];

function productBrief() {
  return {
    title: 'AI 笔记发布片',
    durationSeconds: 30,
    corePromise: '让混乱的想法自动变清晰',
    benefits: ['自动归纳', '重点提取', '快速回顾'],
    cta: '立即体验',
    assetIds: ['product-image'],
  };
}

function direction(primaryStyle: 'data-drift' | 'soft-signal') {
  return DirectionSelectionSchema.parse({
    version: '1.0',
    primaryStyle,
    supportingStyle: primaryStyle === 'data-drift' ? 'swiss-pulse' : 'velvet-standard',
    tasteMoves: primaryStyle === 'data-drift' ? ['system-awakening'] : ['human-imperfection'],
    surpriseOperators: [],
    avoid: primaryStyle === 'data-drift' ? ['meaningless-code-rain'] : ['neon-interface-cliches'],
    rationale: primaryStyle === 'data-drift' ? '技术信号空间' : '温暖真实材质',
  });
}

afterEach(async () => {
  await Promise.all(temporaryPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe('structured director storyboards', () => {
  test('a product brief becomes timed Chinese scene beats', () => {
    const storyboard = generateStoryboard(productBrief(), direction('soft-signal'));
    expect(storyboard.scenes.map((scene) => scene.purpose)).toEqual(['hook', 'proof', 'cta']);
    expect(storyboard.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0)).toBe(30);
    expect(storyboard.scenes[1].assetIds).toContain('product-image');
    expect(storyboard.scenes.every((scene) => /[\u3400-\u9fff]/.test(scene.title))).toBe(true);
    expect(storyboard.scenes.every((scene) => (
      scene.layers.background.length > 0
      && scene.layers.midground.length > 0
      && scene.layers.foreground.length > 0
    ))).toBe(true);
    expect(StoryboardSchema.parse(storyboard)).toEqual(storyboard);
  });

  test('feedback revises scene semantics instead of appending a note', () => {
    const before = generateStoryboard(productBrief(), direction('data-drift'));
    const after = reviseStoryboard(before, '降低科技感，产品再突出', direction('soft-signal'));

    expect(after.revisionOf).toBe(before.id);
    expect(after.revisionReason).toBe('降低科技感，产品再突出');
    expect(after.scenes[0].visualFocus).not.toBe(before.scenes[0].visualFocus);
    expect(after.scenes.some((scene) => scene.assetIds.includes('product-image'))).toBe(true);
    expect(after.scenes.flatMap((scene) => scene.negativeConstraints)).toContain('neon-interface-cliches');
  });

  test('persists JSON truth and a concise Chinese review document', async () => {
    const projectDir = await mkdtemp(join(tmpdir(), 'framepack-storyboard-'));
    temporaryPaths.push(projectDir);
    const storyboard = generateStoryboard(productBrief(), direction('soft-signal'));
    const store = await createProjectStore(projectDir, {
      brief: productBrief(), direction: direction('soft-signal'), storyboard: null, assetHashes: {},
      skillLoadPlan: {}, loadedSkillHashes: {}, weaponLoadPlan: {}, loadedWeaponHashes: {},
      hyperframesVersion: '0.7.56', fontHashes: {}, vendorHashes: {}, composerConfig: {}, composerVersion: '1.0.0',
    });
    await store.recordApproval('preview-before-change', '用户确认旧版');
    await persistStoryboard(projectDir, storyboard, store);

    expect(StoryboardSchema.parse(JSON.parse(await readFile(join(projectDir, '.framepack', 'storyboard.json'), 'utf8')))).toEqual(storyboard);
    const markdown = await readFile(join(projectDir, '.framepack', 'storyboard.md'), 'utf8');
    expect(markdown).toContain('# 导演分镜');
    expect(markdown).toContain('真实素材');
    expect(markdown).not.toContain('undefined');
    expect(markdown).toContain('背景层');
    expect(markdown).toContain('修订来源');
    const { createdAt: _createdAt, ...semanticStoryboard } = storyboard;
    expect((await store.readFingerprint()).storyboard).toEqual(semanticStoryboard);
    expect((await store.readApproval())?.status).toBe('stale');
  });

  test('the contract rejects overlapping or incomplete time windows', () => {
    const storyboard = generateStoryboard(productBrief(), direction('soft-signal'));
    expect(() => StoryboardSchema.parse({
      ...storyboard,
      scenes: storyboard.scenes.map((scene, index) => index === 1 ? { ...scene, startSeconds: 0 } : scene),
    })).toThrow();
  });

  test('records real timestamps and scene-level revision lineage', () => {
    const beforeTime = Date.now();
    const before = generateStoryboard(productBrief(), direction('data-drift'));
    expect(Date.parse(before.createdAt)).toBeGreaterThanOrEqual(beforeTime);
    expect(before.scenes.every((scene) => scene.revisionOf === null && scene.revisionReason === null)).toBe(true);

    const after = reviseStoryboard(before, '降低科技感，产品再突出', direction('soft-signal'));
    expect(after.scenes.every((scene, index) => scene.revisionOf === before.scenes[index].id)).toBe(true);
    expect(after.scenes.every((scene) => scene.revisionReason === '降低科技感，产品再突出')).toBe(true);
  });

  test('the brief contract rejects durations too short for its scene count', () => {
    expect(() => generateStoryboard({ ...productBrief(), durationSeconds: 0.001 }, direction('soft-signal'))).toThrow(/duration/i);
    expect(generateStoryboard({ ...productBrief(), durationSeconds: 0.003 }, direction('soft-signal')).scenes.map((scene) => scene.durationSeconds)).toEqual([0.001, 0.001, 0.001]);
    expect(generateStoryboard({ ...productBrief(), durationSeconds: 0.004, scenePurposes: ['hook', 'proof', 'experience', 'cta'] }, direction('soft-signal')).scenes.every((scene) => scene.durationSeconds === 0.001)).toBe(true);
  });

  test('regenerating identical semantics does not stale an approval merely because time changed', async () => {
    const projectDir = await mkdtemp(join(tmpdir(), 'framepack-storyboard-stable-'));
    temporaryPaths.push(projectDir);
    const store = await createProjectStore(projectDir, {
      brief: productBrief(), direction: direction('soft-signal'), storyboard: null, assetHashes: {},
      skillLoadPlan: {}, loadedSkillHashes: {}, weaponLoadPlan: {}, loadedWeaponHashes: {},
      hyperframesVersion: '0.7.56', fontHashes: {}, vendorHashes: {}, composerConfig: {}, composerVersion: '1.0.0',
    });
    await persistStoryboard(projectDir, generateStoryboard(productBrief(), direction('soft-signal')), store);
    await store.recordApproval('preview-current', '确认当前语义');
    await new Promise((resolve) => setTimeout(resolve, 2));
    await persistStoryboard(projectDir, generateStoryboard(productBrief(), direction('soft-signal')), store);
    expect((await store.readApproval())?.status).toBe('current');
  });
});
