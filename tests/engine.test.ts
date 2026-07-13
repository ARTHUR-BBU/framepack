import { existsSync, readFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { buildProject, initProject, snapshotProject } from '../packages/director-engine/src/index.js';

test('initializes, builds, and plans proof frames for a director preview', async () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-director-'));
  await initProject(project, { title: 'Pulse', aspectRatio: '16:9', durationSeconds: 30 });
  const build = await buildProject(project);
  const calls: string[][] = [];
  const snapshot = await snapshotProject(project, { runner: async (args) => { calls.push(args); } });

  expect(existsSync(join(project, 'frame.md'))).toBe(true);
  expect(existsSync(join(project, '.framepack', 'storyboard.md'))).toBe(true);
  expect(existsSync(join(project, 'public', 'vendor', 'gsap.min.js'))).toBe(true);
  expect(existsSync(join(project, 'public', 'fonts', 'Inter-Regular.woff2'))).toBe(true);
  expect(readFileSync(join(project, 'index.html'), 'utf8')).toContain('window.__timelines[\'main\']');
  expect(build.inspection.codes).toEqual([]);
  expect(snapshot.frames.map((frame) => frame.label)).toEqual(['scene-1-settled', 'transition-1-midpoint', 'scene-2-settled', 'transition-2-midpoint', 'scene-3-settled', 'final-hold']);
  expect(calls[0]).toEqual(expect.arrayContaining(['snapshot', project, '--no-end']));
});
