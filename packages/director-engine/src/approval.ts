import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ApprovalSchema, CurrentBuildPointerSchema, PROJECT_FILES, type Approval } from '@framepack/director-contracts';

export type CurrentBuildEvidence = { buildId: string; contentHash: string };

export async function readCurrentBuildRoot(projectDir: string): Promise<string> {
  const pointer = CurrentBuildPointerSchema.parse(JSON.parse(await readFile(join(projectDir, PROJECT_FILES.currentBuild), 'utf8')));
  return join(projectDir, '.framepack', 'builds', pointer.buildId);
}

export async function readCurrentBuildEvidence(projectDir: string): Promise<CurrentBuildEvidence> {
  const pointer = CurrentBuildPointerSchema.parse(JSON.parse(await readFile(join(projectDir, PROJECT_FILES.currentBuild), 'utf8')));
  const html = await readFile(join(await readCurrentBuildRoot(projectDir), 'index.html'));
  const contentHash = createHash('sha256').update(html).digest('hex');
  if (contentHash !== pointer.contentHash) throw new Error('current build pointer content hash does not match its HTML');
  return { buildId: pointer.buildId, contentHash };
}

export async function assertApprovalCurrent(projectDir: string, input: unknown): Promise<Approval> {
  const approval = ApprovalSchema.parse(input);
  const current = await readCurrentBuildEvidence(projectDir);
  if (approval.previewBuildId !== current.buildId || approval.contentHash !== current.contentHash) {
    throw new Error('approval is stale for the current build');
  }
  return approval;
}
