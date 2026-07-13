import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { approveProject, auditProject, buildProject, handoffProject, readProjectSpec, snapshotProject, waiveProject } from '../../../packages/director-engine/src/index.js';

const publicDir = resolve(fileURLToPath(new URL('../public/', import.meta.url)));
const contentType = (path: string) => path.endsWith('.html') ? 'text/html; charset=utf-8' : path.endsWith('.css') ? 'text/css; charset=utf-8' : path.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'application/octet-stream';

export async function startWorkbenchServer(projectDir: string, port = 4173): Promise<{ url: string; close: () => Promise<void> }> {
  const root = resolve(projectDir);
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    try {
      if (url.pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
      if (url.pathname === '/api/project') {
        const spec = await readProjectSpec(root);
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ spec, files: { built: existsSync(join(root, 'index.html')), audited: existsSync(join(root, '.framepack', 'taste-audit.json')), handedOff: existsSync(join(root, '.framepack', 'handoff-manifest.json')) } }));
        return;
      }
      if (url.pathname === '/api/jobs' && request.method === 'POST') {
        const body = await readBody(request);
        const job = JSON.parse(body).job as string;
        const result = job === 'build' ? await buildProject(root) : job === 'snapshot' ? await snapshotProject(root) : job === 'audit' ? await auditProject(root) : job === 'handoff' ? await handoffProject(root) : undefined;
        if (!result) throw new Error(`unknown job: ${job}`);
        response.writeHead(200, { 'content-type': 'application/json' }); response.end(JSON.stringify({ status: 'completed', result })); return;
      }
      if (url.pathname === '/api/approval' && request.method === 'POST') {
        const body = JSON.parse(await readBody(request)) as { state: 'approved' | 'waived'; reason: string };
        const result = body.state === 'approved' ? await approveProject(root, body.reason) : await waiveProject(root, body.reason);
        response.writeHead(200, { 'content-type': 'application/json' }); response.end(JSON.stringify({ status: 'completed', result })); return;
      }
      if (url.pathname.startsWith('/preview/public/')) {
        const asset = resolve(root, url.pathname.slice('/preview/'.length));
        if (!asset.startsWith(resolve(root, 'public'))) { response.writeHead(403).end(); return; }
        await serveFile(asset, response); return;
      }
      if (url.pathname.startsWith('/preview/')) {
        await serveFile(join(root, 'index.html'), response); return;
      }
      const requested = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      const candidate = resolve(publicDir, normalize(requested));
      if (!candidate.startsWith(publicDir)) { response.writeHead(403).end(); return; }
      await serveFile(candidate, response);
    } catch (error) {
      response.writeHead(404, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    }
  });
  await new Promise<void>((resolveListen) => server.listen(port, '127.0.0.1', resolveListen));
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  return { url: `http://127.0.0.1:${actualPort}`, close: () => new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose())) };
}

async function readBody(request: import('node:http').IncomingMessage): Promise<string> { let body = ''; for await (const chunk of request) body += chunk; return body; }
async function serveFile(path: string, response: import('node:http').ServerResponse): Promise<void> { if (!existsSync(path)) { response.writeHead(404).end(); return; } response.writeHead(200, { 'content-type': contentType(path) }); response.end(await readFile(path)); }

if (process.argv[1]?.endsWith('server.ts')) {
  const project = process.argv[2];
  if (!project) throw new Error('usage: framepack director serve <project>');
  startWorkbenchServer(project, Number(process.env.PORT ?? 4173)).then(({ url }) => console.log(`Director Workbench: ${url}`));
}
