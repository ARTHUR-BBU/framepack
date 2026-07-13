import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { stableStringify } from './content-hash.js';

type SkillIntent = 'product-launch-video' | 'reference-video' | 'general-video';

export type SkillLoadInput = {
  projectDir: string;
  skillRoot: string;
  intent: SkillIntent;
  assets: string[];
};

export type LoadedSkill = {
  id: string;
  resolvedSource: string;
  portablePath: string;
  sha256: string;
  loadedAt: string;
  reason: string;
};

export type SkillLoadReceipt = {
  version: '1.0';
  intent: SkillIntent;
  loaded: LoadedSkill[];
  completedAt: string;
};

type RuntimeRules = {
  assetPolicy?: string;
  continuityPolicy?: string;
  approvalPolicy?: string;
  rhythm?: string;
  scenePurposes?: string[];
  assetPurposes?: string[];
  assetPriority?: string;
  avoid?: string[];
  weaponPolicy?: string;
  handwritePolicy?: string;
  referencePolicy?: string;
  confidenceLabels?: string[];
  requiredLayers?: string[];
};

type SkillRequest = { id: string; reason: string };

export type ApplySkillInput = SkillLoadInput & {
  brief: { goal: string; audience: string };
};

export type SkillApplicationReceipt = {
  version: '1.0';
  loadReceiptHash: string;
  applied: Array<{
    skillId: string;
    ruleId: string;
    outputPaths: string[];
    valueHashes: Record<string, string>;
  }>;
  appliedAt: string;
};

function routeSkills(intent: SkillIntent): SkillRequest[] {
  const director = { id: 'framepack-director', reason: 'translate intent and enforce truthful director boundaries' };
  const arsenal = { id: 'framepack-arsenal', reason: 'match storyboard purposes to evidenced motion weapons' };
  if (intent === 'product-launch-video') {
    return [director, { id: 'product-launch-video', reason: 'apply the product-led launch rhythm' }, arsenal];
  }
  if (intent === 'reference-video') {
    return [director, { id: 'framepack-reference-miner', reason: 'extract transferable reference DNA' }, arsenal];
  }
  return [director, arsenal];
}

function hash(value: string | unknown): string {
  const serialized = typeof value === 'string' ? value : stableStringify(value);
  return createHash('sha256').update(serialized).digest('hex');
}

function parseSkillName(markdown: string): string {
  const match = markdown.match(/^---\s*[\s\S]*?^name:\s*([^\r\n]+)[\s\S]*?^---/m);
  if (!match) throw new Error('skill has no valid frontmatter name');
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

function parseRuntimeRules(markdown: string, skillId: string): RuntimeRules {
  const match = markdown.match(/```framepack-rules\s*([\s\S]*?)```/);
  if (!match) throw new Error(`${skillId} has no framepack-rules block`);
  try {
    return JSON.parse(match[1]) as RuntimeRules;
  } catch {
    throw new Error(`${skillId} has invalid framepack-rules JSON`);
  }
}

async function writeProjectJson(projectDir: string, filename: string, value: unknown): Promise<void> {
  const directory = join(resolve(projectDir), '.framepack');
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, filename), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function loadSkills(input: SkillLoadInput): Promise<SkillLoadReceipt> {
  const projectDir = resolve(input.projectDir);
  const skillRoot = resolve(input.skillRoot);
  const requested = routeSkills(input.intent);
  await writeProjectJson(projectDir, 'skill-load-plan.json', {
    version: '1.0',
    intent: input.intent,
    assets: input.assets,
    requested,
    plannedAt: new Date().toISOString(),
  });

  const loaded: LoadedSkill[] = [];
  for (const request of requested) {
    const source = resolve(skillRoot, request.id, 'SKILL.md');
    const withinRoot = relative(skillRoot, source);
    if (withinRoot.startsWith('..') || isAbsolute(withinRoot)) throw new Error(`skill path escapes root: ${request.id}`);
    let markdown: string;
    try {
      markdown = await readFile(source, 'utf8');
    } catch {
      throw new Error(`cannot load required skill: ${request.id}`);
    }
    if (parseSkillName(markdown) !== request.id) throw new Error(`skill frontmatter name mismatch: ${request.id}`);
    parseRuntimeRules(markdown, request.id);
    loaded.push({
      id: request.id,
      resolvedSource: source,
      portablePath: `skills/${request.id}/SKILL.md`,
      sha256: hash(markdown),
      loadedAt: new Date().toISOString(),
      reason: request.reason,
    });
  }

  const receipt: SkillLoadReceipt = {
    version: '1.0',
    intent: input.intent,
    loaded,
    completedAt: new Date().toISOString(),
  };
  await writeProjectJson(projectDir, 'skill-load-receipt.json', receipt);
  return receipt;
}

export async function applySkillPlan(input: ApplySkillInput): Promise<{
  direction: Record<string, unknown>;
  storyboard: { scenes: Array<{ id: string; purpose: string; assetIds: string[] }> };
  loadReceipt: SkillLoadReceipt;
  applicationReceipt: SkillApplicationReceipt;
}> {
  const loadReceipt = await loadSkills(input);
  const rules = new Map<string, RuntimeRules>();
  for (const loaded of loadReceipt.loaded) {
    const markdown = await readFile(loaded.resolvedSource, 'utf8');
    if (hash(markdown) !== loaded.sha256) throw new Error(`skill changed after load: ${loaded.id}`);
    rules.set(loaded.id, parseRuntimeRules(markdown, loaded.id));
  }

  const director = rules.get('framepack-director') ?? {};
  const workflowSkillId = input.intent === 'reference-video' ? 'framepack-reference-miner' : input.intent;
  const workflow = rules.get(workflowSkillId) ?? {};
  const arsenal = rules.get('framepack-arsenal') ?? {};
  const scenePurposes = workflow.scenePurposes ?? ['hook', 'proof', 'cta'];
  const assetPurposes = new Set(workflow.assetPurposes ?? []);
  const direction: Record<string, unknown> = {
    goal: input.brief.goal,
    audience: input.brief.audience,
    rhythm: workflow.rhythm ?? 'hook-proof-cta',
    assetPolicy: director.assetPolicy,
    continuityPolicy: director.continuityPolicy,
    approvalPolicy: director.approvalPolicy,
    assetPriority: workflow.assetPriority,
    weaponPolicy: arsenal.weaponPolicy,
    referencePolicy: workflow.referencePolicy,
    confidenceLabels: workflow.confidenceLabels,
    requiredReferenceLayers: workflow.requiredLayers,
    avoid: workflow.avoid ?? [],
  };
  const storyboard = {
    scenes: scenePurposes.map((purpose, index) => ({
      id: `scene-${index + 1}`,
      purpose,
      assetIds: assetPurposes.has(purpose) ? [...input.assets] : [],
    })),
  };

  const applied: SkillApplicationReceipt['applied'] = [];
  if (rules.has('framepack-director')) {
    applied.push({
      skillId: 'framepack-director',
      ruleId: 'director-boundaries',
      outputPaths: ['direction.assetPolicy', 'direction.continuityPolicy', 'direction.approvalPolicy'],
      valueHashes: {
        'direction.assetPolicy': hash(direction.assetPolicy),
        'direction.continuityPolicy': hash(direction.continuityPolicy),
        'direction.approvalPolicy': hash(direction.approvalPolicy),
      },
    });
  }
  if (rules.has(workflowSkillId)) {
    const referencePaths = [
      'direction.rhythm',
      'direction.referencePolicy',
      'direction.confidenceLabels',
      'direction.requiredReferenceLayers',
      'storyboard.scenes',
    ];
    const productPaths = ['direction.rhythm', 'storyboard.scenes'];
    const outputPaths = workflowSkillId === 'framepack-reference-miner' ? referencePaths : productPaths;
    const values: Record<string, unknown> = {
      'direction.rhythm': direction.rhythm,
      'direction.referencePolicy': direction.referencePolicy,
      'direction.confidenceLabels': direction.confidenceLabels,
      'direction.requiredReferenceLayers': direction.requiredReferenceLayers,
      'storyboard.scenes': storyboard.scenes,
    };
    applied.push({
      skillId: workflowSkillId,
      ruleId: 'workflow-rhythm',
      outputPaths,
      valueHashes: Object.fromEntries(outputPaths.map((path) => [path, hash(values[path])])),
    });
  }
  if (rules.has('framepack-arsenal')) {
    applied.push({
      skillId: 'framepack-arsenal',
      ruleId: 'weapon-evidence-policy',
      outputPaths: ['direction.weaponPolicy'],
      valueHashes: { 'direction.weaponPolicy': hash(direction.weaponPolicy) },
    });
  }

  const applicationReceipt: SkillApplicationReceipt = {
    version: '1.0',
    loadReceiptHash: hash(loadReceipt),
    applied,
    appliedAt: new Date().toISOString(),
  };
  await Promise.all([
    writeProjectJson(input.projectDir, 'direction.json', direction),
    writeProjectJson(input.projectDir, 'storyboard.json', storyboard),
    writeProjectJson(input.projectDir, 'skill-application-receipt.json', applicationReceipt),
  ]);
  return { direction, storyboard, loadReceipt, applicationReceipt };
}
