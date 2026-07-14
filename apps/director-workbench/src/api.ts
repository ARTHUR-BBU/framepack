import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import {
  approveProject,
  auditProject,
  buildProject,
  handoffProject,
  readProjectSpec,
  snapshotProject,
  waiveProject,
} from '../../../packages/director-engine/src/index.js';
import { readCurrentBuildEvidence } from '../../../packages/director-engine/src/approval.js';
import { createEventStream, type EventStream } from './event-stream.js';

const BODY_LIMIT = 64 * 1024;
const CANCELLATION_WINDOW_MS = 100;
type JobName = 'build' | 'snapshot' | 'audit' | 'handoff';
type JobState = { id: string; name: JobName; status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'; result?: unknown; error?: string };

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function json(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

function publicError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('not initialized')) return new ApiError(404, '项目尚未初始化，请先创建导演项目');
  if (message.includes('stale') || message.includes('content hash')) return new ApiError(409, '预览已过期，请重新审片后再决定');
  if (message.includes('approval required')) return new ApiError(409, '交接前需要先完成批准或风险放行');
  if (message.includes('audit must pass')) return new ApiError(409, '技术审计尚未通过，暂时不能执行这个决定');
  return new ApiError(500, '导演工作台内部处理失败，请稍后重试');
}

async function body(request: IncomingMessage): Promise<Record<string, unknown>> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += value.length;
    if (size > BODY_LIMIT) throw new ApiError(413, '请求内容过大，请精简后重试');
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as Record<string, unknown>; }
  catch { throw new ApiError(400, '请求不是有效的 JSON'); }
}

async function readArtifact(root: string, name: string): Promise<unknown> {
  const path = join(root, '.framepack', name);
  if (!existsSync(path)) return null;
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

export function createWorkbenchApi(root: string, stream: EventStream = createEventStream()): (request: IncomingMessage, response: ServerResponse, url: URL) => Promise<boolean> {
  const jobs = new Map<string, JobState>();
  const runners: Record<JobName, () => Promise<unknown>> = {
    build: () => buildProject(root), snapshot: () => snapshotProject(root), audit: () => auditProject(root), handoff: () => handoffProject(root),
  };

  const startJob = (name: JobName): JobState => {
    const job: JobState = { id: randomUUID(), name, status: 'queued' };
    jobs.set(job.id, job);
    stream.publish('job.queued', { id: job.id, name });
    setTimeout(async () => {
      if (job.status === 'cancelled') return;
      job.status = 'running'; stream.publish('job.running', { id: job.id, name });
      try {
        const result = await runners[name]();
        if (jobs.get(job.id)?.status === 'cancelled') return;
        job.status = 'completed'; job.result = result; stream.publish('job.completed', { id: job.id, name, result });
      } catch (error) {
        job.status = 'failed'; job.error = error instanceof Error ? error.message : String(error);
        stream.publish('job.failed', { id: job.id, name, error: job.error });
      }
    }, CANCELLATION_WINDOW_MS);
    return job;
  };

  return async (request, response, url) => {
    if (!url.pathname.startsWith('/api/')) return false;
    try {
      if (request.method === 'GET' && url.pathname === '/api/project') {
        const spec = await readProjectSpec(root);
        json(response, 200, { version: '1.0', spec, files: { built: existsSync(join(root, 'index.html')), audited: existsSync(join(root, '.framepack', 'taste-audit.json')), handedOff: existsSync(join(root, '.framepack', 'handoff-manifest.json')) } }); return true;
      }
      const artifact: Record<string, string> = { '/api/assets': 'asset-ledger.json', '/api/direction': 'direction.json', '/api/storyboard': 'storyboard.json', '/api/review': 'taste-audit.json' };
      if (request.method === 'GET' && artifact[url.pathname]) { json(response, 200, { version: '1.0', data: await readArtifact(root, artifact[url.pathname]) }); return true; }
      if (request.method === 'GET' && url.pathname === '/api/events') { stream.respond(response, url.searchParams.get('once') === '1'); return true; }
      if (request.method === 'GET' && url.pathname === '/api/jobs') { json(response, 200, { version: '1.0', jobs: [...jobs.values()] }); return true; }
      if (request.method === 'POST' && url.pathname === '/api/jobs') {
        const input = await body(request); const name = input.job;
        if (!['build', 'snapshot', 'audit', 'handoff'].includes(String(name))) throw new ApiError(400, `不支持的任务：${String(name)}`);
        json(response, 202, startJob(name as JobName)); return true;
      }
      const cancel = url.pathname.match(/^\/api\/jobs\/([^/]+)\/cancel$/);
      if (request.method === 'POST' && cancel) {
        const job = jobs.get(cancel[1]);
        if (!job) throw new ApiError(404, '找不到这个任务');
        if (job.status !== 'queued') throw new ApiError(409, '任务已经开始执行，当前操作无法安全取消');
        job.status = 'cancelled'; stream.publish('job.cancelled', { id: job.id, name: job.name }); json(response, 200, job); return true;
      }
      if (request.method === 'POST' && (url.pathname === '/api/decision' || url.pathname === '/api/approval')) {
        const input = await body(request);
        const current = await readCurrentBuildEvidence(root);
        if (typeof input.previewBuildId !== 'string' || typeof input.contentHash !== 'string') throw new ApiError(400, '决定必须包含预览编号和内容指纹');
        if ((input.previewBuildId && input.previewBuildId !== current.buildId) || (input.contentHash && input.contentHash !== current.contentHash)) throw new ApiError(409, '预览已过期，请重新审片后再决定');
        const state = input.state; const reason = typeof input.reason === 'string' && input.reason.trim() ? input.reason : '';
        if (!reason || !['approved', 'waived'].includes(String(state))) throw new ApiError(400, '决定类型或理由无效');
        const result = state === 'approved' ? await approveProject(root, reason) : await waiveProject(root, reason);
        stream.publish('decision.recorded', result); json(response, 200, { status: 'completed', result }); return true;
      }
      throw new ApiError(404, `接口不存在：${url.pathname}`);
    } catch (error) {
      const safe = publicError(error);
      json(response, safe.status, { error: safe.message });
      return true;
    }
  };
}
