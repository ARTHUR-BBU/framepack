import { mkdtempSync } from 'node:fs';
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
