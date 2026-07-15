import { expect, test } from 'vitest';
import {
  ApprovalSchema,
  BuildManifestSchema,
  HandoffManifestSchema,
  dimensionsForAspect,
  renderStoryboardMarkdown,
} from '@framepack/director-contracts';

test('returns canonical 16:9 dimensions', () => {
  expect(dimensionsForAspect('16:9')).toEqual({ width: 1920, height: 1080 });
});

test('renders a readable storyboard contract', () => {
  expect(renderStoryboardMarkdown({ title: 'Pulse', scenes: ['Hook', 'Proof'] }))
    .toContain('## Scene 2 — Proof');
});

test('rejects a silent approval state', () => {
  expect(() => ApprovalSchema.parse({ state: 'silent' })).toThrow();
});

test('rejects a handoff whose dimensions contradict its aspect ratio', () => {
  expect(() => HandoffManifestSchema.parse({
    handoffVersion: '1.0', source: 'framepack-director-preview', aspectRatio: '16:9',
    width: 1080, height: 1920, durationSeconds: 30, htmlEntry: 'index.html',
    previewApproved: true, tasteGate: 'pass', audioNeeded: false, subtitleNeeded: false,
    bgmNeeded: false, hyperframesActions: ['lint'], knownRisks: [], renderNotes: 'test',
  })).toThrow('dimensions');
});

test('binds every creative-review artifact to one immutable build directory', () => {
  const root = '.framepack/builds/build-abc';
  const build = BuildManifestSchema.parse({
    version: '1.0',
    buildId: 'build-abc',
    contentHash: 'a'.repeat(64),
    root,
    htmlEntry: `${root}/index.html`,
    storyboard: `${root}/storyboard.json`,
    weaponReceipt: `${root}/weapon-call-receipt.json`,
    snapshots: `${root}/preview-snapshots`,
    audit: `${root}/taste-audit.json`,
    approval: `${root}/approval.json`,
    createdAt: '2026-07-15T00:00:00.000Z',
  });

  expect(build.htmlEntry).toBe(`${root}/index.html`);
  expect(() => BuildManifestSchema.parse({ ...build, audit: '.framepack/taste-audit.json' })).toThrow('stay inside');
});
