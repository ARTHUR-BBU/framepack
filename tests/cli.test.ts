import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { expect, test } from 'vitest';

test('runs the director init command from the local CLI', () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-cli-'));
  const result = spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'packages/director-engine/src/cli.ts', 'init', project, '--aspect', '16:9', '--duration', '30', '--title', 'Pulse'], { cwd: process.cwd(), encoding: 'utf8' });
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('initialized');
}, 15_000);

test('doctor prints Chinese remediation without mutating an uninitialized project', () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-doctor-'));
  const result = spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'packages/director-engine/src/cli.ts', 'doctor', project], { cwd: process.cwd(), encoding: 'utf8' });
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('环境检查');
  expect(result.stdout).toContain('runtime-assets');
  expect(existsSync(join(project, '.framepack'))).toBe(false);
}, 15_000);

test('direct reads a large UTF-8 proposal file instead of command-line JSON', () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-cli-proposal-'));
  const cli = ['node_modules/tsx/dist/cli.mjs', 'packages/director-engine/src/cli.ts'];
  expect(spawnSync(process.execPath, [...cli, 'init', project, '--title', '中文产品 🚀', '--aspect', '16:9', '--duration', '30'], { cwd: process.cwd(), encoding: 'utf8' }).status).toBe(0);
  const proposalPath = join(project, '导演方案.json');
  writeFileSync(proposalPath, JSON.stringify({ version: '1.0', id: 'proposal-1', title: '温暖协作方案 🚀', summary: '温暖而克制'.repeat(5000), visualStyleId: 'soft-signal', rhythm: 'hook-punch-breathe-cta', assetIds: [] }));
  const result = spawnSync(process.execPath, [...cli, 'direct', project, '--proposal-file', proposalPath], { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  expect(result.status).toBe(0);
  const receipt = JSON.parse(readFileSync(join(project, '.framepack', 'host-run-receipt.json'), 'utf8'));
  expect(receipt).toMatchObject({ command: 'direct', status: 'completed', cancelled: false });
  expect(receipt.proposalHash).toMatch(/^[a-f0-9]{64}$/);
  expect(receipt.stageResults).toMatchObject({ assets: expect.stringMatching(/^[a-f0-9]{64}$/), compose: expect.stringMatching(/^[a-f0-9]{64}$/) });
  expect(readFileSync(join(project, 'index.html'), 'utf8')).toContain('温暖协作方案 🚀');
}, 30_000);

test('brief and assets commands preserve Chinese text and local files', () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-cli-intake-'));
  const cli = ['node_modules/tsx/dist/cli.mjs', 'packages/director-engine/src/cli.ts'];
  expect(spawnSync(process.execPath, [...cli, 'init', project, '--title', '演示', '--aspect', '16:9', '--duration', '20'], { cwd: process.cwd(), encoding: 'utf8' }).status).toBe(0);
  const brief = spawnSync(process.execPath, [...cli, 'brief', project, '--goal', '让协作更有温度 🌿', '--audience', '第一次使用的人'], { cwd: process.cwd(), encoding: 'utf8' });
  expect(brief.status).toBe(0);
  expect(JSON.parse(readFileSync(join(project, '.framepack', 'brief.json'), 'utf8')).goal).toContain('🌿');
  const source = join(project, '品牌资料.txt');
  writeFileSync(source, '品牌语气：温暖、克制');
  const assets = spawnSync(process.execPath, [...cli, 'assets', project, 'add', source], { cwd: process.cwd(), encoding: 'utf8' });
  expect(assets.status).toBe(0);
  expect(existsSync(join(project, 'assets', '品牌资料.txt'))).toBe(true);
}, 30_000);

test('cancelled revise records cancellation without changing feedback', () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-cli-cancel-'));
  const cli = ['node_modules/tsx/dist/cli.mjs', 'packages/director-engine/src/cli.ts'];
  expect(spawnSync(process.execPath, [...cli, 'init', project, '--title', '取消测试', '--aspect', '16:9', '--duration', '20'], { cwd: process.cwd(), encoding: 'utf8' }).status).toBe(0);
  const proposalPath = join(project, 'proposal.json');
  writeFileSync(proposalPath, JSON.stringify({ version: '1.0', id: 'p-cancel', title: '不应应用', summary: '取消的方案', visualStyleId: 'soft-signal', rhythm: 'calm', assetIds: [] }));
  const result = spawnSync(process.execPath, [...cli, 'revise', project, '--feedback', '不应写入', '--proposal-file', proposalPath, '--cancelled'], { cwd: process.cwd(), encoding: 'utf8' });
  expect(result.status).toBe(1);
  expect(JSON.parse(readFileSync(join(project, '.framepack', 'feedback.json'), 'utf8'))).toEqual([]);
  expect(JSON.parse(readFileSync(join(project, '.framepack', 'host-run-receipt.json'), 'utf8'))).toMatchObject({ status: 'cancelled', cancelled: true, appliedOutputPaths: [] });
}, 30_000);
