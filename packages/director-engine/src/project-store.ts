import { randomUUID } from 'node:crypto';
import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import {
  ApprovalSchema,
  DirectorEventSchema,
  ProjectStateSchema,
  type Approval,
  type DirectorEvent,
  type ProjectState,
} from '@framepack/director-contracts';
import { contentHash, type ContentFingerprint } from './content-hash.js';

const FRAMEPACK_DIR = '.framepack';
const STATE_FILE = 'state.json';
const EVENTS_FILE = 'events.jsonl';
const FINGERPRINT_FILE = 'content-fingerprint.json';
const APPROVAL_FILE = 'approval.json';

export type ApprovalEvidence = Approval & { status: 'current' | 'stale' };

export type ProjectStore = {
  appendEvent(event: DirectorEvent): Promise<void>;
  readState(): Promise<ProjectState>;
  readFingerprint(): Promise<ContentFingerprint>;
  updateFingerprint(fingerprint: ContentFingerprint): Promise<ProjectState>;
  recordApproval(buildId: string, reason: string, state?: Approval['state']): Promise<Approval>;
  readApproval(): Promise<ApprovalEvidence | null>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporary, path);
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

export async function createProjectStore(projectDir: string, initialFingerprint: ContentFingerprint): Promise<ProjectStore> {
  const root = resolve(projectDir);
  const framepackDir = join(root, FRAMEPACK_DIR);
  const statePath = join(framepackDir, STATE_FILE);
  const eventsPath = join(framepackDir, EVENTS_FILE);
  const fingerprintPath = join(framepackDir, FINGERPRINT_FILE);
  const approvalPath = join(framepackDir, APPROVAL_FILE);
  let appendQueue: Promise<void> = Promise.resolve();
  await mkdir(framepackDir, { recursive: true });

  if (!existsSync(statePath)) {
    const now = new Date().toISOString();
    const initialState = ProjectStateSchema.parse({
      version: '1.0',
      projectId: `${basename(root) || 'director-project'}-${randomUUID()}`,
      phase: 'intake',
      currentBuildId: null,
      contentHash: contentHash(initialFingerprint),
      updatedAt: now,
    });
    await writeJsonAtomic(fingerprintPath, initialFingerprint);
    await writeJsonAtomic(statePath, initialState);
  }

  async function readState(): Promise<ProjectState> {
    return ProjectStateSchema.parse(await readJson(statePath));
  }

  async function readFingerprint(): Promise<ContentFingerprint> {
    return readJson<ContentFingerprint>(fingerprintPath);
  }

  async function updateFingerprint(fingerprint: ContentFingerprint): Promise<ProjectState> {
    const state = await readState();
    const nextHash = contentHash(fingerprint);
    const nextState = ProjectStateSchema.parse({
      ...state,
      phase: state.phase === 'approved' && state.contentHash !== nextHash ? 'review' : state.phase,
      currentBuildId: state.contentHash !== nextHash ? null : state.currentBuildId,
      contentHash: nextHash,
      updatedAt: new Date().toISOString(),
    });
    await writeJsonAtomic(fingerprintPath, fingerprint);
    await writeJsonAtomic(statePath, nextState);
    return nextState;
  }

  async function appendEventNow(input: DirectorEvent): Promise<void> {
    const event = DirectorEventSchema.parse(input);
    if (event.type === 'decision.recorded') {
      const currentHash = contentHash(await readFingerprint());
      if (event.payload.contentHash !== currentHash) {
        throw new Error('decision content hash does not match the current project fingerprint');
      }
    }
    await appendFile(eventsPath, `${JSON.stringify(event)}\n`, 'utf8');
    if (event.type === 'decision.recorded') {
      await writeJsonAtomic(approvalPath, event.payload);
      const state = await readState();
      await writeJsonAtomic(statePath, ProjectStateSchema.parse({
        ...state,
        phase: 'approved',
        currentBuildId: event.payload.previewBuildId,
        contentHash: event.payload.contentHash,
        updatedAt: event.payload.decidedAt,
      }));
      return;
    }

    const fingerprint = await readFingerprint();
    if (event.type === 'brief.updated') {
      await updateFingerprint({ ...fingerprint, brief: event.payload });
      return;
    }
    if (event.type === 'feedback.added') {
      const brief = isRecord(fingerprint.brief) ? fingerprint.brief : { value: fingerprint.brief };
      const feedback = Array.isArray(brief.feedback) ? brief.feedback : [];
      await updateFingerprint({ ...fingerprint, brief: { ...brief, feedback: [...feedback, event.payload.text] } });
      return;
    }
    if (event.type === 'assets.changed') {
      await updateFingerprint({
        ...fingerprint,
        assetHashes: { ...fingerprint.assetHashes, $selectedAssetIds: event.payload.assetIds.join(',') },
      });
      return;
    }
    await updateFingerprint({
      ...fingerprint,
      direction: {
        ...(isRecord(fingerprint.direction) ? fingerprint.direction : { value: fingerprint.direction }),
        confirmedDirectionId: event.payload.directionId,
      },
    });
  }

  function appendEvent(input: DirectorEvent): Promise<void> {
    const operation = appendQueue.then(() => appendEventNow(input));
    appendQueue = operation.catch(() => undefined);
    return operation;
  }

  async function recordApprovalNow(buildId: string, reason: string, state: Approval['state'] = 'approved'): Promise<Approval> {
    const currentHash = contentHash(await readFingerprint());
    const approval = ApprovalSchema.parse({
      state,
      reason,
      previewBuildId: buildId,
      contentHash: currentHash,
      decidedAt: new Date().toISOString(),
    });
    await appendEventNow({
      version: '1.0',
      id: `evt-${randomUUID()}`,
      type: 'decision.recorded',
      at: approval.decidedAt,
      payload: approval,
    });
    return approval;
  }

  function recordApproval(buildId: string, reason: string, state: Approval['state'] = 'approved'): Promise<Approval> {
    const operation = appendQueue.then(() => recordApprovalNow(buildId, reason, state));
    appendQueue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  async function readApproval(): Promise<ApprovalEvidence | null> {
    if (!existsSync(approvalPath)) return null;
    const approval = ApprovalSchema.parse(await readJson(approvalPath));
    const fingerprint = await readFingerprint();
    return { ...approval, status: approval.contentHash === contentHash(fingerprint) ? 'current' : 'stale' };
  }

  return { appendEvent, readState, readFingerprint, updateFingerprint, recordApproval, readApproval };
}
