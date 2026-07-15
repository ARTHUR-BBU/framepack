import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWorkbenchApi } from './api.js';
import { readCurrentBuildRoot } from '../../../packages/director-engine/src/approval.js';

const publicDir = resolve(fileURLToPath(new URL('../public/', import.meta.url)));
const contentType = (path: string) => path.endsWith('.html') ? 'text/html; charset=utf-8' : path.endsWith('.css') ? 'text/css; charset=utf-8' : path.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'application/octet-stream';

export async function startWorkbenchServer(projectDir: string, port = 4173): Promise<{ url: string; close: () => Promise<void> }> {
  const root = resolve(projectDir);
  const api = createWorkbenchApi(root);
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    try {
      if (url.pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
      if (await api(request, response, url)) return;
      if (url.pathname.startsWith('/preview/public/')) {
        const buildRoot = await readCurrentBuildRoot(root);
        const asset = resolve(buildRoot, url.pathname.slice('/preview/'.length));
        if (!isInside(resolve(buildRoot, 'public'), asset)) { response.writeHead(403).end(); return; }
        if (!existsSync(asset) || !isInside(await realpath(resolve(buildRoot, 'public')), await realpath(asset))) { response.writeHead(403).end(); return; }
        await serveFile(asset, response); return;
      }
      if (url.pathname === '/preview/' || url.pathname === '/preview/index.html') {
        await serveFile(join(await readCurrentBuildRoot(root), 'index.html'), response); return;
      }
      const requested = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      const candidate = resolve(publicDir, normalize(requested));
      if (!isInside(publicDir, candidate)) { response.writeHead(403).end(); return; }
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

async function serveFile(path: string, response: import('node:http').ServerResponse): Promise<void> { if (!existsSync(path)) { response.writeHead(404).end(); return; } response.writeHead(200, { 'content-type': contentType(path) }); response.end(await readFile(path)); }
function isInside(parent: string, candidate: string): boolean { const path = relative(parent, candidate); return path === '' || (!path.startsWith('..') && !path.startsWith('/') && !path.startsWith('\\')); }

if (process.argv[1]?.endsWith('server.ts')) {
  const project = process.argv[2];
  if (!project) throw new Error('usage: framepack director serve <project>');
  startWorkbenchServer(project, Number(process.env.PORT ?? 4173)).then(({ url }) => console.log(`Director Workbench: ${url}`));
}
