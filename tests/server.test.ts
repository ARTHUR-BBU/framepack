import { existsSync, mkdtempSync } from 'node:fs';
import { mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { buildProject, initProject } from '../packages/director-engine/src/index.js';
import { startWorkbenchServer } from '../apps/director-workbench/src/server.js';

test('serves the director cockpit, project summary, and preview only inside its project root', async () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-workbench-'));
  await initProject(project, { title: 'Pulse', aspectRatio: '16:9', durationSeconds: 30 });
  await buildProject(project);
  const server = await startWorkbenchServer(project, 0);
  try {
    const projectResponse = await fetch(`${server.url}/api/project`);
    expect(projectResponse.status).toBe(200);
    expect((await projectResponse.json())).toMatchObject({
      currentBuild: { buildId: expect.any(String), contentHash: expect.stringMatching(/^[a-f0-9]{64}$/) },
      provenance: { skills: { loaded: expect.any(Array) }, weapons: { selected: expect.any(Array) } },
      decision: null,
    });
    expect((await fetch(`${server.url}/`)).headers.get('content-type')).toContain('text/html');
    expect((await fetch(`${server.url}/preview/`)).status).toBe(200);
    expect((await fetch(`${server.url}/preview/public/vendor/gsap.min.js`)).headers.get('content-type')).toContain('javascript');
    expect((await fetch(`${server.url}/preview/public/../private/secret.js`)).status).not.toBe(200);
    expect((await fetch(`${server.url}/favicon.ico`)).status).toBe(204);
    expect((await fetch(`${server.url}/../package.json`)).status).not.toBe(200);
  } finally {
    await server.close();
  }
});

test('exposes versioned project artifacts with Chinese API errors', async () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-api-'));
  await initProject(project, { title: '中文导演台', aspectRatio: '16:9', durationSeconds: 12 });
  const server = await startWorkbenchServer(project, 0);
  try {
    for (const endpoint of ['assets', 'direction', 'storyboard', 'review']) {
      const response = await fetch(`${server.url}/api/${endpoint}`);
      expect(response.status, endpoint).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
    }
    const missing = await fetch(`${server.url}/api/not-found`);
    expect(missing.status).toBe(404);
    expect((await missing.json()).error).toContain('接口不存在');
  } finally {
    await server.close();
  }
});

test('rejects oversized and invalid job requests without escaping the selected project', async () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-api-limit-'));
  await initProject(project, { title: 'Boundary', aspectRatio: '9:16', durationSeconds: 12 });
  const server = await startWorkbenchServer(project, 0);
  try {
    const oversized = await fetch(`${server.url}/api/jobs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ job: 'build', padding: 'x'.repeat(70_000) }) });
    expect(oversized.status).toBe(413);
    expect((await oversized.json()).error).toContain('请求内容过大');
    const invalid = await fetch(`${server.url}/api/jobs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ job: 'destroy' }) });
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).error).toContain('不支持的任务');
    expect((await fetch(`${server.url}/preview/public/../../../../package.json`)).status).not.toBe(200);
  } finally {
    await server.close();
  }
});

test('streams job lifecycle events and supports cancellation', async () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-api-events-'));
  await initProject(project, { title: 'Events', aspectRatio: '16:9', durationSeconds: 12 });
  const server = await startWorkbenchServer(project, 0);
  try {
    const started = await fetch(`${server.url}/api/jobs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ job: 'build' }) });
    expect(started.status).toBe(202);
    const job = await started.json() as { id: string };
    const cancelled = await fetch(`${server.url}/api/jobs/${job.id}/cancel`, { method: 'POST' });
    expect(cancelled.status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(existsSync(join(project, 'index.html'))).toBe(false);
    const events = await fetch(`${server.url}/api/events?once=1`, { headers: { accept: 'text/event-stream' } });
    expect(events.status).toBe(200);
    expect(events.headers.get('content-type')).toContain('text/event-stream');
    const text = await events.text();
    expect(text).toContain('job.queued');
  } finally {
    await server.close();
  }
});

test('pushes live SSE events after the client connects', async () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-api-live-events-'));
  await initProject(project, { title: 'Live Events', aspectRatio: '16:9', durationSeconds: 12 });
  const server = await startWorkbenchServer(project, 0);
  const abort = new AbortController();
  try {
    const events = await fetch(`${server.url}/api/events`, { signal: abort.signal });
    const reader = events.body!.getReader();
    const first = new TextDecoder().decode((await reader.read()).value);
    expect(first).toContain('connected');
    await fetch(`${server.url}/api/jobs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ job: 'build' }) });
    let live = '';
    while (!live.includes('job.queued')) live += new TextDecoder().decode((await reader.read()).value);
    expect(live).toContain('job.queued');
  } finally {
    abort.abort();
    await server.close();
  }
});

test('returns 409 when a decision targets an obsolete preview build', async () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-api-decision-'));
  await initProject(project, { title: 'Decision', aspectRatio: '16:9', durationSeconds: 12 });
  const first = await buildProject(project);
  const server = await startWorkbenchServer(project, 0);
  try {
    const feedback = JSON.parse(await readFile(join(project, '.framepack', 'feedback.json'), 'utf8')) as string[];
    await writeFile(join(project, '.framepack', 'feedback.json'), JSON.stringify([...feedback, 'changed'], null, 2));
    await buildProject(project);
    const response = await fetch(`${server.url}/api/decision`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ state: 'approved', reason: 'old build', previewBuildId: first.buildId, contentHash: '0'.repeat(64) }) });
    expect(response.status).toBe(409);
    expect((await response.json()).error).toContain('预览已过期');
  } finally {
    await server.close();
  }
});

test('requires build id and content hash for decisions', async () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-api-decision-proof-'));
  await initProject(project, { title: 'Proof', aspectRatio: '16:9', durationSeconds: 12 });
  await buildProject(project);
  const server = await startWorkbenchServer(project, 0);
  try {
    for (const endpoint of ['decision', 'approval']) {
      const response = await fetch(`${server.url}/api/${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ state: 'approved', reason: 'missing proof' }) });
      expect(response.status, endpoint).toBe(400);
      expect((await response.json()).error).toContain('预览编号和内容指纹');
    }
  } finally { await server.close(); }
});

test('does not follow preview asset junctions outside the selected project', async () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-api-link-'));
  const outside = mkdtempSync(join(tmpdir(), 'framepack-outside-'));
  await initProject(project, { title: 'Link', aspectRatio: '16:9', durationSeconds: 12 });
  await writeFile(join(outside, 'secret.js'), 'outside-secret');
  await mkdir(join(project, 'public'), { recursive: true });
  await symlink(outside, join(project, 'public', 'linked'), 'junction');
  const server = await startWorkbenchServer(project, 0);
  try {
    expect((await fetch(`${server.url}/preview/public/linked/secret.js`)).status).toBe(403);
  } finally { await server.close(); }
});

test('maps internal failures to Chinese HTTP errors', async () => {
  const project = mkdtempSync(join(tmpdir(), 'framepack-api-uninitialized-'));
  const server = await startWorkbenchServer(project, 0);
  try {
    const response = await fetch(`${server.url}/api/project`);
    expect(response.status).toBe(404);
    expect((await response.json()).error).toContain('项目尚未初始化');
  } finally { await server.close(); }
});
