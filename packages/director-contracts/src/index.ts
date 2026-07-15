import { z } from 'zod';

export * from './markdown.js';
export * from './approval.js';
export * from './arsenal.js';
export * from './assets.js';
export * from './build.js';
export * from './direction.js';
export * from './events.js';
export * from './project.js';
export * from './review.js';
export * from './storyboard.js';

export const AspectRatioSchema = z.enum(['16:9', '9:16']);
export type AspectRatio = z.infer<typeof AspectRatioSchema>;

export const TasteGateSchema = z.enum(['pass', 'fail', 'needs_review']);

export const ProjectSpecSchema = z.object({
  title: z.string().min(1),
  aspectRatio: AspectRatioSchema,
  durationSeconds: z.number().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  audioNeeded: z.boolean().default(false),
  subtitleNeeded: z.boolean().default(false),
  bgmNeeded: z.boolean().default(false),
});
export type ProjectSpec = z.infer<typeof ProjectSpecSchema>;

export const HandoffManifestSchema = z.object({
  handoffVersion: z.literal('1.0'),
  source: z.literal('framepack-director-preview'),
  aspectRatio: AspectRatioSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  durationSeconds: z.number().positive(),
  htmlEntry: z.string().min(1),
  previewApproved: z.boolean(),
  tasteGate: TasteGateSchema,
  audioNeeded: z.boolean(),
  subtitleNeeded: z.boolean(),
  bgmNeeded: z.boolean(),
  hyperframesActions: z.array(z.string()).min(1),
  knownRisks: z.array(z.string()),
  renderNotes: z.string(),
}).superRefine((manifest, ctx) => {
  const expected = dimensionsForAspect(manifest.aspectRatio);
  if (manifest.width !== expected.width || manifest.height !== expected.height) {
    ctx.addIssue({ code: 'custom', path: ['width'], message: 'dimensions must match aspect ratio' });
  }
});
export type HandoffManifest = z.infer<typeof HandoffManifestSchema>;

export function dimensionsForAspect(aspectRatio: AspectRatio): { width: number; height: number } {
  return aspectRatio === '16:9' ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };
}

export const PROJECT_FILES = {
  buildsRoot: '.framepack/builds',
  currentBuild: '.framepack/current-build.json',
  assetIntake: '.framepack/asset-intake.md',
  storyboard: '.framepack/storyboard.md',
  buildReport: '.framepack/html-build-report.md',
  previewReport: '.framepack/preview-report.md',
  tasteAudit: '.framepack/taste-audit.md',
  approval: '.framepack/approval.json',
  handoffManifest: '.framepack/handoff-manifest.json',
  renderPlan: '.hyperframes/render-plan.md',
} as const;
