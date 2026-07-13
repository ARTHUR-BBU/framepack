import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { expect, test } from 'vitest';

test('runs the director init command from the local CLI', () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-cli-'));
  const result = spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'packages/director-engine/src/cli.ts', 'init', project, '--aspect', '16:9', '--duration', '30', '--title', 'Pulse'], { cwd: process.cwd(), encoding: 'utf8' });
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('initialized');
});
