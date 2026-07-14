import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ApprovalSchema, PROJECT_FILES, type Approval } from '@framepack/director-contracts';

export type CurrentBuildEvidence = { buildId: string; contentHash: string };

export async function readCurrentBuildEvidence(projectDir: string): Promise<CurrentBuildEvidence> {
  const [report, html] = await Promise.all([
    readFile(join(projectDir, PROJECT_FILES.buildReport), 'utf8'),
    readFile(join(projectDir, 'index.html')),
  ]);
  const buildId = report.match(/^- build_id:\s*(\S+)\s*$/m)?.[1];
  if (!buildId) throw new Error('current build report has no build_id');
  return { buildId, contentHash: createHash('sha256').update(html).digest('hex') };
}

export async function assertApprovalCurrent(projectDir: string, input: unknown): Promise<Approval> {
  const approval = ApprovalSchema.parse(input);
  const current = await readCurrentBuildEvidence(projectDir);
  if (approval.previewBuildId !== current.buildId || approval.contentHash !== current.contentHash) {
    throw new Error('approval is stale for the current build');
  }
  return approval;
}
