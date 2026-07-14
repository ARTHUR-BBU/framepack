import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { AssetLedgerSchema, BriefSchema, DirectionProposalSchema, DirectionSelectionSchema, StoryboardSchema, type Brief, type DirectionProposal } from '@framepack/director-contracts';
import { stableStringify } from './content-hash.js';
import { SkillLoadReceiptSchema } from './skill-runtime.js';
import { loadWeaponRegistry, resolveWeapons } from './weapon-runtime.js';
import { generateStoryboard, reviseStoryboard } from './storyboard.js';

export type DirectorTaskInput = { projectDir: string; brief: Brief; proposal?: unknown; command?: 'direct' | 'revise'; retryCount?: number; cancelled?: boolean };
export type DirectorServices = {
  assets(input: DirectorTaskInput): Promise<unknown>;
  skills(input: DirectorTaskInput & { assets: unknown }): Promise<unknown>;
  direction(input: DirectorTaskInput & { assets: unknown; skills: unknown }): Promise<unknown>;
  storyboard(input: DirectorTaskInput & { assets: unknown; skills: unknown; direction: unknown }): Promise<unknown>;
  weapons(input: DirectorTaskInput & { storyboard: unknown }): Promise<unknown>;
  compose(input: DirectorTaskInput & { assets: unknown; skills: unknown; direction: unknown; storyboard: unknown; weapons: unknown }): Promise<{ buildId: string }>;
};

export type HostRunReceipt = {
  version: '1.0'; command: 'direct' | 'revise'; status: 'completed' | 'failed' | 'cancelled';
  briefHash: string; skillHashes: string[]; proposalHash: string; appliedOutputPaths: string[];
  buildId: string | null; retryCount: number; cancelled: boolean; error: string | null; completedAt: string;
  stageResults: Record<string, string>;
};

export async function runDirectorTask(raw: DirectorTaskInput, services: DirectorServices): Promise<{ buildId: string }> {
  const input = { ...raw, brief: BriefSchema.parse(raw.brief) };
  await mkdir(join(input.projectDir, '.framepack'), { recursive: true });
  if (input.cancelled) {
    await persistReceipt(input.projectDir, receipt(input, 'cancelled', null, null, {}, 0));
    throw new Error('director task cancelled');
  }
  const maximumRetries = Math.max(0, input.retryCount ?? 0);
  const accumulatedEvidence: Record<string, unknown> = {};
  for (let retriesPerformed = 0; ; retriesPerformed += 1) {
    const evidence: Record<string, unknown> = {};
    try {
      const assets = evidence.assets = accumulatedEvidence.assets = await services.assets(input);
      const skills = evidence.skills = accumulatedEvidence.skills = await services.skills({ ...input, assets });
      const direction = evidence.direction = accumulatedEvidence.direction = await services.direction({ ...input, assets, skills });
      const storyboard = evidence.storyboard = accumulatedEvidence.storyboard = await services.storyboard({ ...input, assets, skills, direction });
      const weapons = evidence.weapons = accumulatedEvidence.weapons = await services.weapons({ ...input, storyboard });
      const composed = await services.compose({ ...input, assets, skills, direction, storyboard, weapons });
      evidence.compose = accumulatedEvidence.compose = composed;
      await persistReceipt(input.projectDir, receipt(input, 'completed', composed.buildId, null, accumulatedEvidence, retriesPerformed));
      return composed;
    } catch (error) {
      if (retriesPerformed < maximumRetries) continue;
      await persistReceipt(input.projectDir, receipt(input, 'failed', null, error instanceof Error ? error.message : String(error), accumulatedEvidence, retriesPerformed));
      throw error;
    }
  }
}

function receipt(input: DirectorTaskInput, status: HostRunReceipt['status'], buildId: string | null, error: string | null, evidence: Record<string, unknown> = {}, retriesPerformed = 0): HostRunReceipt {
  const hash = (value: unknown) => createHash('sha256').update(stableStringify(value)).digest('hex');
  const loaded = evidence && typeof evidence.skills === 'object' && evidence.skills && 'loaded' in evidence.skills ? (evidence.skills as { loaded?: Array<{ sha256?: string }> }).loaded ?? [] : [];
  const stageResults = Object.fromEntries(Object.entries(evidence).map(([key, value]) => [key, hash(value)]));
  const appliedOutputPaths = [
    ...(evidence.direction ? ['.framepack/direction.json', '.framepack/direction-proposal.json', ...(input.command === 'revise' ? ['.framepack/feedback.json'] : [])] : []),
    ...(evidence.storyboard ? ['.framepack/storyboard.json'] : []),
    ...(evidence.weapons ? ['.framepack/weapon-load-plan.json'] : []),
    ...(evidence.compose ? ['index.html'] : []),
  ];
  return {
    version: '1.0', command: input.command ?? 'direct', status, briefHash: hash(input.brief),
    skillHashes: loaded.flatMap((item) => item.sha256 ? [item.sha256] : []),
    proposalHash: hash(input.proposal ?? { status }),
    appliedOutputPaths,
    buildId, retryCount: retriesPerformed, cancelled: status === 'cancelled', error, completedAt: new Date().toISOString(), stageResults,
  };
}

export async function runProjectProposal(input: { projectDir: string; brief: Brief; proposal: DirectionProposal; feedback?: string; retryCount?: number; cancelled?: boolean }): Promise<{ buildId: string }> {
  const proposal = DirectionProposalSchema.parse(input.proposal);
  const json = async (name: string) => JSON.parse(await readFile(join(input.projectDir, '.framepack', name), 'utf8')) as unknown;
  const services: DirectorServices = {
    assets: async () => AssetLedgerSchema.parse(await json('asset-ledger.json')),
    skills: async () => SkillLoadReceiptSchema.parse(await json('skill-load-receipt.json')),
    direction: async () => {
      const current = DirectionSelectionSchema.parse(await json('direction.json'));
      const supportingStyle = current.supportingStyle === proposal.visualStyleId ? (proposal.visualStyleId === 'swiss-pulse' ? 'soft-signal' : 'swiss-pulse') : current.supportingStyle;
      const direction = DirectionSelectionSchema.parse({ ...current, primaryStyle: proposal.visualStyleId, supportingStyle, rationale: `${proposal.summary}\n节奏：${proposal.rhythm}` });
      const writes = [
        writeFile(join(input.projectDir, '.framepack', 'direction.json'), `${JSON.stringify(direction, null, 2)}\n`, 'utf8'),
        writeFile(join(input.projectDir, '.framepack', 'direction-proposal.json'), `${JSON.stringify(proposal, null, 2)}\n`, 'utf8'),
      ];
      if (input.feedback) {
        const feedbackPath = join(input.projectDir, '.framepack', 'feedback.json');
        const feedbackItems = JSON.parse(await readFile(feedbackPath, 'utf8')) as string[];
        appendFeedbackOnce(feedbackItems, input.feedback);
        writes.push(writeFile(feedbackPath, `${JSON.stringify(feedbackItems, null, 2)}\n`, 'utf8'));
      }
      await Promise.all(writes);
      return direction;
    },
    storyboard: async ({ assets, direction }) => {
      const current = StoryboardSchema.parse(await json('storyboard.json'));
      const ledger = AssetLedgerSchema.parse(assets);
      const requested = new Set(proposal.assetIds);
      for (const id of requested) if (!ledger.assets.some((asset) => asset.id === id && asset.status === 'available' && asset.confirmed)) throw new Error(`proposal asset is unavailable or unconfirmed: ${id}`);
      const sourceBrief = StoryboardSchema.parse(current).sourceBrief;
      const nextBrief = { ...sourceBrief, title: proposal.title, corePromise: proposal.summary, assetIds: proposal.assetIds };
      const semanticBase = StoryboardSchema.parse({ ...current, sourceBrief: nextBrief });
      const regenerated = input.feedback
        ? reviseStoryboard(semanticBase, input.feedback, DirectionSelectionSchema.parse(direction))
        : generateStoryboard(nextBrief, DirectionSelectionSchema.parse(direction));
      const storyboard = StoryboardSchema.parse({ ...regenerated, scenes: regenerated.scenes.map((scene, index) => ({
        ...scene,
        title: index === 0 ? proposal.title : scene.title,
        motionGrammar: proposal.rhythm.includes('punch') ? 'breath-punch-silence' : scene.motionGrammar,
        assetIds: ledger.assets.filter((asset) => requested.has(asset.id) && asset.assignedSceneIds.includes(scene.id)).map((asset) => asset.id),
      })) });
      await writeFile(join(input.projectDir, '.framepack', 'storyboard.json'), `${JSON.stringify(storyboard, null, 2)}\n`, 'utf8');
      return storyboard;
    },
    weapons: async ({ storyboard }) => {
      const plan = await resolveWeapons(StoryboardSchema.parse(storyboard), await loadWeaponRegistry());
      await writeFile(join(input.projectDir, '.framepack', 'weapon-load-plan.json'), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
      return plan;
    },
    compose: async () => (await import('./index.js')).buildProject(input.projectDir),
  };
  return runDirectorTask({ projectDir: input.projectDir, brief: BriefSchema.parse(input.brief), proposal, command: input.feedback ? 'revise' : 'direct', retryCount: input.retryCount, cancelled: input.cancelled }, services);
}

export function appendFeedbackOnce(items: string[], feedback: string): string[] {
  if (!items.includes(feedback)) items.push(feedback);
  return items;
}

async function persistReceipt(projectDir: string, value: HostRunReceipt): Promise<void> {
  await writeFile(join(projectDir, '.framepack', 'host-run-receipt.json'), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
