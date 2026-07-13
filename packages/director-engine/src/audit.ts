import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ApprovalSchema,
  HandoffManifestSchema,
  PROJECT_FILES,
  renderRenderPlanMarkdown,
  renderTasteAuditMarkdown,
  type Approval,
  type HandoffManifest,
} from '@framepack/director-contracts';
import { inspectPreviewHtml } from '../../hyperframes-bridge/src/index.js';
import { readProjectSpec } from './index.js';
import { createResponsesTasteEvaluator } from './taste-evaluator.js';

const AUDIT_FILE = '.framepack/taste-audit.json';

export type AuditResult = {
  technical: { status: 'pass' | 'fail'; issues: string[] };
  taste: { gate: 'pass' | 'fail' | 'needs_review'; pptFeel: 'low' | 'medium' | 'high'; motionQuality: 'poor' | 'acceptable' | 'strong'; visualDensity: 'sparse' | 'balanced' | 'cluttered'; materialUsage: 'weak' | 'acceptable' | 'strong'; recommendation: boolean; revisionNotes: string[] };
};

export type TasteEvaluator = { evaluate(projectDir: string): Promise<{ gate: 'pass' | 'fail' | 'needs_review'; motionQuality: 'poor' | 'acceptable' | 'strong'; note: string }> };

export async function auditProject(projectDir: string, options: { evaluator?: TasteEvaluator } = {}): Promise<AuditResult> {
  const htmlPath = join(projectDir, 'index.html');
  const previewPlanPath = join(projectDir, '.framepack', 'preview-snapshots', 'snapshot-plan.json');
  const issues: string[] = [];
  if (!existsSync(htmlPath)) issues.push('index.html is missing');
  if (!existsSync(previewPlanPath)) issues.push('preview snapshot plan is missing');
  if (existsSync(htmlPath)) issues.push(...inspectPreviewHtml(await readFile(htmlPath, 'utf8')).codes);
  const technical = { status: issues.length ? 'fail' as const : 'pass' as const, issues };
  const hasMedia = existsSync(join(projectDir, 'public', 'assets')) && (await import('node:fs/promises')).readdir(join(projectDir, 'public', 'assets')).then((items) => items.length > 0);
  const taste: AuditResult['taste'] = {
    gate: technical.status === 'fail' ? 'fail' as const : 'needs_review' as const,
    pptFeel: hasMedia ? 'medium' as const : 'medium' as const,
    motionQuality: technical.status === 'pass' ? 'acceptable' as const : 'poor' as const,
    visualDensity: technical.status === 'pass' ? 'balanced' as const : 'sparse' as const,
    materialUsage: hasMedia ? 'strong' as const : 'weak' as const,
    recommendation: technical.status === 'pass',
    revisionNotes: hasMedia ? ['Confirm material crop and visibility in rendered snapshots.'] : ['Attach a real product asset before final render.'],
  };
  const evaluator = options.evaluator ?? createResponsesTasteEvaluator({ apiKey: process.env.FRAMEPACK_TASTE_API_KEY ?? '', model: process.env.FRAMEPACK_TASTE_MODEL ?? '' });
  const evaluation = technical.status === 'pass' && evaluator ? await evaluator.evaluate(projectDir) : undefined;
  if (evaluation) {
    taste.gate = evaluation.gate;
    taste.motionQuality = evaluation.motionQuality;
    taste.revisionNotes = [evaluation.note];
    taste.recommendation = evaluation.gate !== 'fail';
  }
  const result: AuditResult = { technical, taste };
  await writeFile(join(projectDir, AUDIT_FILE), `${JSON.stringify(result, null, 2)}\n`);
  await writeFile(join(projectDir, PROJECT_FILES.tasteAudit), `${renderTasteAuditMarkdown()}\n\n- commercial_quality: ${taste.gate}\n- ppt_feel: ${taste.pptFeel}\n- motion_quality: ${taste.motionQuality}\n- visual_density: ${taste.visualDensity}\n- material_usage: ${taste.materialUsage}\n- recommend_handoff_to_hyperframes: ${taste.recommendation}\n\n## Revision notes\n${taste.revisionNotes.map((note) => `- ${note}`).join('\n')}\n`);
  return result;
}

export async function approveProject(projectDir: string, reason: string): Promise<Approval> {
  const audit = await loadAudit(projectDir);
  if (audit.technical.status !== 'pass') throw new Error('technical audit must pass before approval');
  if (audit.taste.gate === 'fail') throw new Error('taste failure requires an explicit waiver');
  return writeApproval(projectDir, 'approved', reason);
}

export async function waiveProject(projectDir: string, reason: string): Promise<Approval> {
  const audit = await loadAudit(projectDir);
  if (audit.technical.status !== 'pass') throw new Error('technical audit must pass before a waiver');
  return writeApproval(projectDir, 'waived', reason);
}

export async function handoffProject(projectDir: string): Promise<HandoffManifest> {
  const audit = await loadAudit(projectDir);
  if (audit.technical.status !== 'pass') throw new Error('technical audit must pass before handoff');
  const approvalPath = join(projectDir, PROJECT_FILES.approval);
  if (!existsSync(approvalPath)) throw new Error('approval required before handoff');
  const approval = ApprovalSchema.parse(JSON.parse(await readFile(approvalPath, 'utf8')));
  const spec = await readProjectSpec(projectDir);
  const manifest = HandoffManifestSchema.parse({
    handoffVersion: '1.0', source: 'framepack-director-preview', aspectRatio: spec.aspectRatio,
    width: spec.width, height: spec.height, durationSeconds: spec.durationSeconds, htmlEntry: 'index.html',
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
  const path = join(projectDir, AUDIT_FILE);
  if (!existsSync(path)) return auditProject(projectDir);
  return JSON.parse(await readFile(path, 'utf8')) as AuditResult;
}

async function writeApproval(projectDir: string, state: Approval['state'], reason: string): Promise<Approval> {
  const approval = ApprovalSchema.parse({ state, reason, previewBuildId: 'current', decidedAt: new Date().toISOString() });
  await writeFile(join(projectDir, PROJECT_FILES.approval), `${JSON.stringify(approval, null, 2)}\n`);
  return approval;
}
