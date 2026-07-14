import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { approveProject, auditProject, buildProject, handoffProject, initProject, snapshotProject, waiveProject } from '../packages/director-engine/src/index.js';

async function readyProject() {
  const project = mkdtempSync(join(tmpdir(), 'framepack-audit-'));
  await initProject(project, { title: 'Pulse', aspectRatio: '16:9', durationSeconds: 30 });
  await buildProject(project);
  await snapshotProject(project, { runner: async () => undefined });
  return project;
}

test('does not allow technical failure to be waived', async () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-audit-'));
  await initProject(project, { title: 'Broken', aspectRatio: '16:9', durationSeconds: 30 });
  await expect(waiveProject(project, 'ship anyway')).rejects.toThrow('technical audit must pass');
});

test('requires explicit approval before a technically valid preview can hand off', async () => {
  const project = await readyProject();
  const audit = await auditProject(project);
  expect(audit.technical.status).toBe('pass');
  await expect(handoffProject(project)).rejects.toThrow('approval required');
  await approveProject(project, 'preview accepted');
  expect((await handoffProject(project)).previewApproved).toBe(true);
});

test('merges an optional taste evaluator result without faking one by default', async () => {
  const project = await readyProject();
  const audit = await auditProject(project, { evaluator: { evaluate: async () => ({ gate: 'pass', motionQuality: 'strong', note: 'live review passed' }) } });
  expect(audit.taste.gate).toBe('pass');
  expect(audit.taste.motionQuality).toBe('strong');
});

test('persists a truthful waiver for taste review', async () => {
  const project = await readyProject();
  await auditProject(project);
  const approval = await waiveProject(project, 'text-only draft is accepted for this test');
  expect(approval.state).toBe('waived');
});

test('empty assets are reported as missing with deterministic evidence', async () => {
  const project = await readyProject();
  const audit = await auditProject(project);
  expect(audit.materialUsage).toBe('missing');
  expect(audit.deterministic.material.files).toContain('.framepack/asset-ledger.json');
  expect(audit.deterministic.safeArea.frameTimes.length).toBeGreaterThan(0);
  expect(audit.subjective.status).toBe('needs_review');
});

test('approval binds the real build and becomes stale after feedback rebuild', async () => {
  const project = await readyProject();
  await auditProject(project);
  const approval = await approveProject(project, 'first build accepted');
  expect(approval.previewBuildId).not.toBe('current');
  const feedbackPath = join(project, '.framepack', 'feedback.json');
  writeFileSync(feedbackPath, JSON.stringify(['突出产品']) + '\n');
  await buildProject(project);
  await expect(handoffProject(project)).rejects.toThrow('approval is stale');
  expect(JSON.parse(readFileSync(join(project, '.framepack', 'approval.json'), 'utf8')).contentHash).toBe(approval.contentHash);
});
test('deterministic contrast and safe-area checks produce evidence-backed results', async () => {
  const project = await readyProject();
  const audit = await auditProject(project);
  expect(audit.deterministic.contrast.status).toBe('pass');
  expect(audit.deterministic.safeArea.status).toBe('pass');
  expect(audit.taste.recommendation).toBe(false);
});

test('an identified scorecard is the only path to reviewed subjective evidence', async () => {
  const project = await readyProject();
  const report = readFileSync(join(project, '.framepack', 'html-build-report.md'), 'utf8');
  const buildId = report.match(/^- build_id:\s*(\S+)/m)?.[1] ?? '';
  const contentHash = createHash('sha256').update(readFileSync(join(project, 'index.html'))).digest('hex');
  const scores = { intentClarity: 4, productFocus: 4, visualHierarchy: 4, materialQuality: 4, motionChoreography: 4, rhythm: 4, restraint: 4 };
  const reasons = { intentClarity: '意图清楚', productFocus: '产品聚焦', visualHierarchy: '层级清楚', materialQuality: '素材可核对', motionChoreography: '动作连贯', rhythm: '节奏合理', restraint: '保持克制' };
  const evidenceFrame = '.framepack/preview-snapshots/scene-1.png';
  writeFileSync(join(project, evidenceFrame), 'png-proof');
  const scorecard = { version: '1.0' as const, buildId, contentHash, source: 'codex' as const, reviewer: 'codex:gpt-5', reviewedAt: new Date().toISOString(), scores, reasons, evidenceFrames: [evidenceFrame], average: 4, verdict: 'pass' as const };
  const audit = await auditProject(project, { scorecard });
  expect(audit.subjective).toMatchObject({ status: 'reviewed', scorecard: { reviewer: 'codex:gpt-5', buildId } });
  expect(audit.taste.recommendation).toBe(true);
});
test('waiver is also bound to the current build and cannot cross a rebuild', async () => {
  const project = await readyProject();
  await auditProject(project);
  const waiver = await waiveProject(project, 'accept current draft only');
  expect(waiver.previewBuildId).not.toBe('current');
  writeFileSync(join(project, '.framepack', 'feedback.json'), JSON.stringify(['改变节奏']) + '\n');
  await buildProject(project);
  await expect(handoffProject(project)).rejects.toThrow('approval is stale');
});
test('a failing identified scorecard blocks recommendation and approval', async () => {
  const project = await readyProject();
  const report = readFileSync(join(project, '.framepack', 'html-build-report.md'), 'utf8');
  const buildId = report.match(/^- build_id:\s*(\S+)/m)?.[1] ?? '';
  const contentHash = createHash('sha256').update(readFileSync(join(project, 'index.html'))).digest('hex');
  const evidenceFrame = '.framepack/preview-snapshots/review-fail.png';
  writeFileSync(join(project, evidenceFrame), 'png-proof');
  const scores = { intentClarity: 2, productFocus: 2, visualHierarchy: 2, materialQuality: 2, motionChoreography: 2, rhythm: 2, restraint: 2 };
  const reasons = { intentClarity: '意图不清', productFocus: '产品不突出', visualHierarchy: '层级混乱', materialQuality: '素材不足', motionChoreography: '动作断裂', rhythm: '节奏失衡', restraint: '元素过多' };
  const scorecard = { version: '1.0' as const, buildId, contentHash, source: 'human' as const, reviewer: 'user:identified', reviewedAt: new Date().toISOString(), scores, reasons, evidenceFrames: [evidenceFrame], average: 2, verdict: 'fail' as const };
  const audit = await auditProject(project, { scorecard });
  expect(audit.taste.gate).toBe('fail');
  expect(audit.taste.recommendation).toBe(false);
  await expect(approveProject(project, 'ignore failed review')).rejects.toThrow('taste failure');
});

test('reviewed evidence rejects a missing evidence frame', async () => {
  const project = await readyProject();
  const report = readFileSync(join(project, '.framepack', 'html-build-report.md'), 'utf8');
  const buildId = report.match(/^- build_id:\s*(\S+)/m)?.[1] ?? '';
  const contentHash = createHash('sha256').update(readFileSync(join(project, 'index.html'))).digest('hex');
  const scores = { intentClarity: 4, productFocus: 4, visualHierarchy: 4, materialQuality: 4, motionChoreography: 4, rhythm: 4, restraint: 4 };
  const reasons = { intentClarity: '清楚', productFocus: '聚焦', visualHierarchy: '清楚', materialQuality: '可核对', motionChoreography: '连贯', rhythm: '合理', restraint: '克制' };
  const scorecard = { version: '1.0' as const, buildId, contentHash, source: 'human' as const, reviewer: 'user:identified', reviewedAt: new Date().toISOString(), scores, reasons, evidenceFrames: ['.framepack/preview-snapshots/missing.png'], average: 4, verdict: 'pass' as const };
  await expect(auditProject(project, { scorecard })).rejects.toThrow('evidence frame is missing');
});
