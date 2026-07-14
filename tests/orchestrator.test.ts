import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { appendFeedbackOnce, runDirectorTask, type DirectorServices } from '../packages/director-engine/src/orchestrator.js';

test('a Codex brief runs intake, skills, direction, storyboard, weapons, and compose in order', async () => {
  const projectDir = mkdtempSync(join(tmpdir(), 'framepack-orchestrator-'));
  const events: string[] = [];
  const step = (name: string, value: unknown) => async () => { events.push(name); return value; };
  const services: DirectorServices = {
    assets: step('assets', { assets: [] }),
    skills: step('skills', { loaded: [{ id: 'framepack-director', sha256: 'a'.repeat(64) }] }),
    direction: step('direction', { id: 'direction' }),
    storyboard: step('storyboard', { id: 'storyboard' }),
    weapons: step('weapons', { selected: [] }),
    compose: async () => { events.push('compose'); return { buildId: 'build-1' }; },
  };
  const result = await runDirectorTask({ projectDir, brief: { goal: '发布中文产品 🚀', audience: '第一次使用的人', constraints: [] } }, services);
  expect(events).toEqual(['assets', 'skills', 'direction', 'storyboard', 'weapons', 'compose']);
  expect(result.buildId).toBe('build-1');
  expect(JSON.parse(readFileSync(join(projectDir, '.framepack', 'host-run-receipt.json'), 'utf8'))).toMatchObject({ status: 'completed', command: 'direct', retryCount: 0, cancelled: false });
});

test('a failed service records a truthful failed host receipt', async () => {
  const projectDir = mkdtempSync(join(tmpdir(), 'framepack-orchestrator-'));
  const services = {
    assets: async () => { throw new Error('asset intake failed'); },
    skills: async () => ({}), direction: async () => ({}), storyboard: async () => ({}), weapons: async () => ({}), compose: async () => ({ buildId: 'never' }),
  } satisfies DirectorServices;
  await expect(runDirectorTask({ projectDir, brief: { goal: '测试', audience: '用户', constraints: [] } }, services)).rejects.toThrow('asset intake failed');
  expect(JSON.parse(readFileSync(join(projectDir, '.framepack', 'host-run-receipt.json'), 'utf8'))).toMatchObject({ status: 'failed', cancelled: false });
});

test('retryCount records retries actually performed', async () => {
  const projectDir = mkdtempSync(join(tmpdir(), 'framepack-orchestrator-'));
  let attempts = 0;
  const services: DirectorServices = {
    assets: async () => { attempts += 1; if (attempts === 1) throw new Error('temporary'); return {}; },
    skills: async () => ({}), direction: async () => ({}), storyboard: async () => ({}), weapons: async () => ({}), compose: async () => ({ buildId: 'after-retry' }),
  };
  await expect(runDirectorTask({ projectDir, brief: { goal: '重试', audience: '用户', constraints: [] }, retryCount: 1 }, services)).resolves.toEqual({ buildId: 'after-retry' });
  expect(attempts).toBe(2);
  expect(JSON.parse(readFileSync(join(projectDir, '.framepack', 'host-run-receipt.json'), 'utf8')).retryCount).toBe(1);
});

test('retry helpers keep feedback idempotent', () => {
  expect(appendFeedbackOnce(['同一反馈'], '同一反馈')).toEqual(['同一反馈']);
  expect(appendFeedbackOnce([], '新反馈')).toEqual(['新反馈']);
});

test('failed receipt accumulates outputs written by earlier attempts', async () => {
  const projectDir = mkdtempSync(join(tmpdir(), 'framepack-orchestrator-'));
  let attempt = 0;
  const services: DirectorServices = {
    assets: async () => { attempt += 1; if (attempt === 2) throw new Error('second attempt fails early'); return {}; },
    skills: async () => ({}), direction: async () => ({ persisted: true }), storyboard: async () => { throw new Error('first attempt fails late'); }, weapons: async () => ({}), compose: async () => ({ buildId: 'never' }),
  };
  await expect(runDirectorTask({ projectDir, brief: { goal: '累计', audience: '用户', constraints: [] }, retryCount: 1 }, services)).rejects.toThrow('second attempt fails early');
  const receipt = JSON.parse(readFileSync(join(projectDir, '.framepack', 'host-run-receipt.json'), 'utf8'));
  expect(receipt.stageResults).toHaveProperty('direction');
  expect(receipt.appliedOutputPaths).toContain('.framepack/direction.json');
});
