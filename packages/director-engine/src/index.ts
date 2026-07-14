import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AssetLedgerSchema,
  dimensionsForAspect,
  PROJECT_FILES,
  ProjectSpecSchema,
  renderAssetIntakeMarkdown,
  renderPreviewReportMarkdown,
  renderStoryboardMarkdown,
  type AspectRatio,
  type ProjectSpec,
} from '@framepack/director-contracts';
import { inspectPreviewHtml } from '../../hyperframes-bridge/src/index.js';
import { composePreview } from './preview-composer.js';
import { chooseDirection } from './style-catalog.js';
import { generateStoryboard } from './storyboard.js';
import { loadSkills, type SkillLoadReceipt } from './skill-runtime.js';
import { stableStringify } from './content-hash.js';

export { approveProject, auditProject, handoffProject, waiveProject, type AuditResult } from './audit.js';
export { confirmAssetAssignment, inspectAssets, type AssetInspectionOptions, type UrlCapture } from './asset-intake.js';
export { contentHash, stableStringify, type ContentFingerprint } from './content-hash.js';
export { createProjectStore, type ApprovalEvidence, type ProjectStore } from './project-store.js';
export {
  applySkillPlan,
  loadSkills,
  type ApplySkillInput,
  type LoadedSkill,
  type SkillApplicationReceipt,
  type SkillLoadInput,
  type SkillLoadReceipt,
} from './skill-runtime.js';
export { chooseDirection, loadStyleCatalog } from './style-catalog.js';
export { generateStoryboard, persistStoryboard, reviseStoryboard } from './storyboard.js';
export {
  loadWeaponRegistry,
  extractWeaponCalls,
  persistWeaponEvidence,
  resolveWeapons,
  renderWeaponInvocation,
  verifyWeaponCalls,
  type RuntimeWeapon,
  type WeaponRegistry,
} from './weapon-runtime.js';
export { classifyWeaponBench, generateWeaponBench, promoteWeapon, runWeaponBenchEvidence, verifyWeaponProofFiles } from './weapon-bench.js';

const PROJECT_SPEC_FILE = '.framepack/project.json';
const DEFAULT_SKILL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../director-assets/skills');

export async function initProject(projectDir: string, input: { title: string; aspectRatio: AspectRatio; durationSeconds: number }): Promise<string> {
  const dimensions = dimensionsForAspect(input.aspectRatio);
  const spec = ProjectSpecSchema.parse({ ...input, ...dimensions, audioNeeded: false, subtitleNeeded: false, bgmNeeded: false });
  await Promise.all([
    mkdir(join(projectDir, '.framepack', 'preview-snapshots'), { recursive: true }),
    mkdir(join(projectDir, '.hyperframes'), { recursive: true }),
    mkdir(join(projectDir, 'public', 'assets'), { recursive: true }),
    mkdir(join(projectDir, 'public', 'fonts'), { recursive: true }),
    mkdir(join(projectDir, 'public', 'vendor'), { recursive: true }),
  ]);
  await writeFile(join(projectDir, PROJECT_SPEC_FILE), `${JSON.stringify(spec, null, 2)}\n`);
  await writeFile(join(projectDir, 'frame.md'), `# ${spec.title}\n\n- aspect_ratio: ${spec.aspectRatio}\n- motion: deliberate, layered, seek-safe\n- avoid: empty PPT cards and external runtime dependencies\n`);
  await writeFile(join(projectDir, PROJECT_FILES.assetIntake), renderAssetIntakeMarkdown(spec.title));
  await writeFile(join(projectDir, PROJECT_FILES.storyboard), renderStoryboardMarkdown({ title: spec.title, scenes: ['Hook', 'Proof', 'CTA'] }));
  const feedback: string[] = [];
  const direction = chooseDirection({ goal: spec.title, feedback });
  const storyboard = generateStoryboard({ title: spec.title, durationSeconds: spec.durationSeconds, corePromise: spec.title, benefits: ['呈现真实价值'], cta: '了解更多', assetIds: [] }, direction);
  const assets = AssetLedgerSchema.parse({ version: '1.0', summary: 'available', assets: [], inspectedAt: new Date().toISOString() });
  await loadSkills({ projectDir, skillRoot: DEFAULT_SKILL_ROOT, intent: 'general-video', assets: [] });
  const { createdAt: _createdAt, ...semanticStoryboard } = storyboard;
  const weaponPlan = { version: '1.0', storyboardId: storyboard.id, inputHash: createHash('sha256').update(stableStringify(semanticStoryboard)).digest('hex'), selected: [], candidates: [], fallbacks: [] };
  await Promise.all([
    writeFile(join(projectDir, '.framepack', 'asset-ledger.json'), JSON.stringify(assets, null, 2) + '\n'),
    writeFile(join(projectDir, '.framepack', 'direction.json'), JSON.stringify(direction, null, 2) + '\n'),
    writeFile(join(projectDir, '.framepack', 'storyboard.json'), JSON.stringify(storyboard, null, 2) + '\n'),
    writeFile(join(projectDir, '.framepack', 'weapon-load-plan.json'), JSON.stringify(weaponPlan, null, 2) + '\n'),
    writeFile(join(projectDir, '.framepack', 'feedback.json'), JSON.stringify(feedback, null, 2) + '\n'),
  ]);
  return projectDir;
}

export async function buildProject(projectDir: string): Promise<{ inspection: ReturnType<typeof inspectPreviewHtml>; buildId: string }> {
  const spec = await readProjectSpec(projectDir);
  const readJson = async (name: string): Promise<unknown> => JSON.parse(await readFile(join(projectDir, '.framepack', name), 'utf8'));
  const [assets, direction, storyboard, skillReceipt, weaponPlan, feedback] = await Promise.all([
    readJson('asset-ledger.json'), readJson('direction.json'), readJson('storyboard.json'), readJson('skill-load-receipt.json'), readJson('weapon-load-plan.json'), readJson('feedback.json'),
  ]);
  return composePreview({ projectDir, spec, assets: assets as never, direction: direction as never, storyboard: storyboard as never, skillReceipt: skillReceipt as SkillLoadReceipt, weaponPlan: weaponPlan as never, feedback: feedback as string[] });
}

export async function snapshotProject(projectDir: string, options: { runner?: (args: string[]) => Promise<void> } = {}): Promise<{ frames: Array<{ label: string; timeSeconds: number }> }> {
  const spec = await readProjectSpec(projectDir);
  const third = spec.durationSeconds / 3;
  const frames = [
    { label: 'scene-1-settled', timeSeconds: third * 0.6 },
    { label: 'transition-1-midpoint', timeSeconds: third },
    { label: 'scene-2-settled', timeSeconds: third * 1.6 },
    { label: 'transition-2-midpoint', timeSeconds: third * 2 },
    { label: 'scene-3-settled', timeSeconds: third * 2.6 },
    { label: 'final-hold', timeSeconds: Math.max(0, spec.durationSeconds - 0.25) },
  ];
  const rows = frames.map((frame) => `| ${frame.timeSeconds.toFixed(2)} | ${frame.label} | pending snapshot capture | pending |`).join('\n');
  await writeFile(join(projectDir, PROJECT_FILES.previewReport), `${renderPreviewReportMarkdown()}\n${rows}\n`);
  await writeFile(join(projectDir, '.framepack', 'preview-snapshots', 'snapshot-plan.json'), `${JSON.stringify({ frames }, null, 2)}\n`);
  const args = ['--no-install', 'hyperframes', 'snapshot', projectDir, '--output', join(projectDir, '.framepack', 'preview-snapshots'), '--at', frames.map((frame) => frame.timeSeconds.toFixed(2)).join(','), '--no-end'];
  if (options.runner) await options.runner(['snapshot', projectDir, '--output', join(projectDir, '.framepack', 'preview-snapshots'), '--at', frames.map((frame) => frame.timeSeconds.toFixed(2)).join(','), '--no-end']);
  else await runNpx(args);
  return { frames };
}

export async function readProjectSpec(projectDir: string): Promise<ProjectSpec> {
  const path = join(projectDir, PROJECT_SPEC_FILE);
  if (!existsSync(path)) throw new Error(`director project is not initialized: ${projectDir}`);
  return ProjectSpecSchema.parse(JSON.parse(await readFile(path, 'utf8')));
}

function runNpx(args: string[]): Promise<void> {
  return new Promise((resolveRun, rejectRun) => {
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
    child.once('error', rejectRun);
    child.once('exit', (code) => code === 0 ? resolveRun() : rejectRun(new Error(`hyperframes snapshot failed with exit code ${code}`)));
  });
}
export { composePreview, type ComposePreviewInput, type PreviewBuild } from './preview-composer.js';
