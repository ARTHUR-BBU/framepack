import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import {
  ApprovalSchema,
  DeterministicReviewEvidenceSchema,
  HandoffManifestSchema,
  MotionCoverageSchema,
  PROJECT_FILES,
  ReviewScorecardSchema,
  SubjectiveReviewEvidenceSchema,
  renderRenderPlanMarkdown,
  renderTasteAuditMarkdown,
  type Approval,
  type DeterministicReviewEvidence,
  type HandoffManifest,
  type ReviewScorecard,
  type SubjectiveReviewEvidence,
} from '@framepack/director-contracts';
import { inspectPreviewHtml } from '../../hyperframes-bridge/src/index.js';
import { assertApprovalCurrent, readCurrentBuildEvidence, readCurrentBuildRoot } from './approval.js';
import { readProjectSpec } from './index.js';
import { createResponsesTasteEvaluator } from './taste-evaluator.js';

const AUDIT_FILE = '.framepack/taste-audit.json';

export type AuditResult = {
  technical: { status: 'pass' | 'fail'; issues: string[] };
  materialUsage: 'missing' | 'available';
  deterministic: DeterministicReviewEvidence;
  subjective: SubjectiveReviewEvidence;
  motionCoverage: ReturnType<typeof MotionCoverageSchema.parse>;
  taste: { gate: 'pass' | 'fail' | 'needs_review'; pptFeel: 'low' | 'medium' | 'high'; motionQuality: 'poor' | 'acceptable' | 'strong'; visualDensity: 'sparse' | 'balanced' | 'cluttered'; materialUsage: 'weak' | 'acceptable' | 'strong'; recommendation: boolean; revisionNotes: string[] };
};

export type TasteEvaluator = { evaluate(projectDir: string): Promise<{ gate: 'pass' | 'fail' | 'needs_review'; motionQuality: 'poor' | 'acceptable' | 'strong'; note: string }> };

export async function auditProject(projectDir: string, options: { evaluator?: TasteEvaluator; scorecard?: ReviewScorecard } = {}): Promise<AuditResult> {
  const buildRoot = await readCurrentBuildRoot(projectDir);
  const htmlPath = join(buildRoot, 'index.html');
  const cssPath = join(buildRoot, 'public', 'preview.css');
  const previewPlanPath = join(buildRoot, 'preview-snapshots', 'snapshot-plan.json');
  const assetLedgerPath = join(projectDir, '.framepack', 'asset-ledger.json');
  const issues: string[] = [];
  if (!existsSync(htmlPath)) issues.push('index.html is missing');
  if (!existsSync(previewPlanPath)) issues.push('preview snapshot plan is missing');
  if (existsSync(htmlPath)) {
    const [html, css] = await Promise.all([readFile(htmlPath, 'utf8'), existsSync(cssPath) ? readFile(cssPath, 'utf8') : Promise.resolve('')]);
    issues.push(...inspectPreviewHtml(html, css).codes);
  }
  const technical = { status: issues.length ? 'fail' as const : 'pass' as const, issues };
  const assetLedger = existsSync(assetLedgerPath) ? JSON.parse(await readFile(assetLedgerPath, 'utf8')) as { assets?: Array<{ status?: string; confirmed?: boolean }> } : { assets: [] };
  const hasMedia = (assetLedger.assets ?? []).some((asset) => asset.status === 'available' && asset.confirmed === true);
  const materialUsage = hasMedia ? 'available' as const : 'missing' as const;
  const snapshotPlan = existsSync(previewPlanPath) ? JSON.parse(await readFile(previewPlanPath, 'utf8')) as { frames?: Array<{ timeSeconds?: number }> } : { frames: [] };
  const frameTimes = (snapshotPlan.frames ?? []).map((frame) => frame.timeSeconds).filter((time): time is number => typeof time === 'number');
  const css = existsSync(cssPath) ? await readFile(cssPath, 'utf8') : '';
  const motionCoverage = MotionCoverageSchema.parse(JSON.parse(await readFile(join(buildRoot, 'motion-coverage.json'), 'utf8')));
  const deterministic = DeterministicReviewEvidenceSchema.parse({
    material: { status: materialUsage, files: ['.framepack/asset-ledger.json'] },
    contrast: { status: deterministicContrastStatus(css), files: ['public/preview.css'] },
    safeArea: { status: deterministicSafeAreaStatus(css), files: ['public/preview.css', '.framepack/preview-snapshots/snapshot-plan.json'], frameTimes: frameTimes.length ? frameTimes : [0] },
  });
  let subjective: SubjectiveReviewEvidence = SubjectiveReviewEvidenceSchema.parse({ status: 'needs_review' });
  if (options.scorecard) {
    const scorecard = ReviewScorecardSchema.parse(options.scorecard);
    const current = await readCurrentBuildEvidence(projectDir);
    if (scorecard.buildId !== current.buildId || scorecard.contentHash !== current.contentHash) throw new Error('review scorecard is stale for the current build');
    const root = resolve(projectDir);
    for (const frame of scorecard.evidenceFrames) {
      const evidencePath = resolve(root, frame);
      if (!evidencePath.startsWith(`${root}${sep}`) || !existsSync(evidencePath)) throw new Error(`review evidence frame is missing or outside the project: ${frame}`);
    }
    subjective = SubjectiveReviewEvidenceSchema.parse({ status: 'reviewed', scorecard });
  }
  const taste: AuditResult['taste'] = {
    gate: technical.status === 'fail' ? 'fail' : 'needs_review',
    pptFeel: 'medium',
    motionQuality: technical.status === 'pass' ? 'acceptable' : 'poor',
    visualDensity: technical.status === 'pass' ? 'balanced' : 'sparse',
    materialUsage: hasMedia ? 'strong' : 'weak',
    recommendation: false,
    revisionNotes: hasMedia ? ['Confirm material crop and visibility in rendered snapshots.'] : ['Attach a real product asset before final render.'],
  };
  const evaluator = options.evaluator ?? createResponsesTasteEvaluator({ apiKey: process.env.FRAMEPACK_TASTE_API_KEY ?? '', model: process.env.FRAMEPACK_TASTE_MODEL ?? '' });
  const evaluation = technical.status === 'pass' && evaluator ? await evaluator.evaluate(projectDir) : undefined;
  if (evaluation) {
    taste.gate = evaluation.gate;
    taste.motionQuality = evaluation.motionQuality;
    taste.revisionNotes = [evaluation.note];
  }
  if (subjective.status === 'reviewed' && subjective.scorecard) {
    taste.gate = subjective.scorecard.verdict;
  }
  if (motionCoverage.status === 'needs_review') {
    taste.gate = 'fail';
    taste.motionQuality = 'poor';
    taste.revisionNotes = [...taste.revisionNotes, 'Motion coverage is too sparse; add beats or explicitly waive this taste risk.'];
  }
  taste.recommendation = technical.status === 'pass' && subjective.status === 'reviewed' && taste.gate !== 'fail';
  const result: AuditResult = { technical, materialUsage, deterministic, subjective, motionCoverage, taste };
  await writeFile(join(buildRoot, 'taste-audit.json'), `${JSON.stringify(result, null, 2)}\n`);
  await writeFile(join(buildRoot, 'taste-audit.md'), `${renderTasteAuditMarkdown()}\n\n- commercial_quality: ${taste.gate}\n- ppt_feel: ${taste.pptFeel}\n- motion_quality: ${taste.motionQuality}\n- visual_density: ${taste.visualDensity}\n- material_usage: ${materialUsage}\n- subjective_review: ${subjective.status}\n- recommend_handoff_to_hyperframes: ${taste.recommendation}\n\n## Revision notes\n${taste.revisionNotes.map((note) => `- ${note}`).join('\n')}\n`);
  return result;
}

export async function approveProject(projectDir: string, reason: string): Promise<Approval> {
  if (!existsSync(join(projectDir, PROJECT_FILES.currentBuild))) throw new Error('technical audit must pass before approval');
  const audit = await loadAudit(projectDir);
  if (audit.technical.status !== 'pass') throw new Error('technical audit must pass before approval');
  if (audit.taste.gate === 'fail') throw new Error('taste failure requires an explicit waiver');
  return writeApproval(projectDir, 'approved', reason);
}

export async function waiveProject(projectDir: string, reason: string): Promise<Approval> {
  if (!existsSync(join(projectDir, PROJECT_FILES.currentBuild))) throw new Error('technical audit must pass before a waiver');
  const audit = await loadAudit(projectDir);
  if (audit.technical.status !== 'pass') throw new Error('technical audit must pass before a waiver');
  return writeApproval(projectDir, 'waived', reason);
}

export async function handoffProject(projectDir: string): Promise<HandoffManifest> {
  const buildRoot = await readCurrentBuildRoot(projectDir);
  const approvalPath = join(buildRoot, 'approval.json');
  if (!existsSync(approvalPath)) throw new Error('approval required before handoff');
  const approval = await assertApprovalCurrent(projectDir, JSON.parse(await readFile(approvalPath, 'utf8')));
  const audit = await loadAudit(projectDir);
  if (audit.technical.status !== 'pass') throw new Error('technical audit must pass before handoff');
  const spec = await readProjectSpec(projectDir);
  const manifest = HandoffManifestSchema.parse({
    handoffVersion: '1.0', source: 'framepack-director-preview', aspectRatio: spec.aspectRatio,
    width: spec.width, height: spec.height, durationSeconds: spec.durationSeconds, htmlEntry: `.framepack/builds/${approval.previewBuildId}/index.html`,
    previewApproved: true, tasteGate: audit.taste.gate, audioNeeded: spec.audioNeeded,
    subtitleNeeded: spec.subtitleNeeded, bgmNeeded: spec.bgmNeeded,
    hyperframesActions: ['lint', 'check', 'render', 'ffprobe', 'snapshot-review'],
    knownRisks: approval.state === 'waived' ? audit.taste.revisionNotes : [],
    renderNotes: 'Render at 30fps, SDR, high quality. Preserve HTML timing windows.',
  });
  await writeFile(join(projectDir, PROJECT_FILES.handoffManifest), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(join(projectDir, PROJECT_FILES.renderPlan), `${renderRenderPlanMarkdown()}\n`);
  return manifest;
}

async function loadAudit(projectDir: string): Promise<AuditResult> {
  const path = join(await readCurrentBuildRoot(projectDir), 'taste-audit.json');
  if (!existsSync(path)) return auditProject(projectDir);
  return JSON.parse(await readFile(path, 'utf8')) as AuditResult;
}

async function writeApproval(projectDir: string, state: Approval['state'], reason: string): Promise<Approval> {
  const current = await readCurrentBuildEvidence(projectDir);
  const approval = ApprovalSchema.parse({ state, reason, previewBuildId: current.buildId, contentHash: current.contentHash, decidedAt: new Date().toISOString() });
  await writeFile(join(await readCurrentBuildRoot(projectDir), 'approval.json'), `${JSON.stringify(approval, null, 2)}\n`);
  return approval;
}
function deterministicContrastStatus(css: string): 'pass' | 'fail' | 'needs_review' {
  const rule = css.match(/html,body\{([^}]*)\}/)?.[1] ?? '';
  const background = rule.match(/background:\s*(#[0-9a-f]{6})/i)?.[1];
  const foreground = rule.match(/color:\s*(#[0-9a-f]{6})/i)?.[1];
  if (!background || !foreground) return 'needs_review';
  return contrastRatio(background, foreground) >= 4.5 ? 'pass' : 'fail';
}

function deterministicSafeAreaStatus(css: string): 'pass' | 'fail' | 'needs_review' {
  const padding = css.match(/\.scene-inner\{[^}]*padding:\s*([0-9.]+)%/i)?.[1];
  if (!padding) return 'needs_review';
  return Number(padding) >= 5 ? 'pass' : 'fail';
}

function contrastRatio(left: string, right: string): number {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255).map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const [bright, dark] = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return (bright + 0.05) / (dark + 0.05);
}
