import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { initProject } from '../packages/director-engine/src/index.js';
import { startWorkbenchServer } from '../apps/director-workbench/src/server.js';

test('serves the director cockpit, project summary, and preview only inside its project root', async () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-workbench-'));
  await initProject(project, { title: 'Pulse', aspectRatio: '16:9', durationSeconds: 30 });
  const server = await startWorkbenchServer(project, 0);
  try {
    expect((await fetch(`${server.url}/api/project`)).status).toBe(200);
    expect((await fetch(`${server.url}/`)).headers.get('content-type')).toContain('text/html');
    expect((await fetch(`${server.url}/preview/`)).status).toBe(404);
    expect((await fetch(`${server.url}/../package.json`)).status).not.toBe(200);
  } finally {
    await server.close();
  }
});
