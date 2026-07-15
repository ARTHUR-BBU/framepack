import { z } from 'zod';

const HashSchema = z.string().regex(/^[a-f0-9]{64}$/i);
const BuildRootSchema = z.string().regex(/^\.framepack\/builds\/[A-Za-z0-9_-]+$/, 'build root must be a canonical Framepack build directory');

function buildPath(root: string, path: string, ctx: z.RefinementCtx, field: string): void {
  if (!path.startsWith(`${root}/`)) ctx.addIssue({ code: 'custom', path: [field], message: `${field} must stay inside the immutable build root` });
}

export const BuildManifestSchema = z.object({
  version: z.literal('1.0'),
  buildId: z.string().min(1),
  contentHash: HashSchema,
  root: BuildRootSchema,
  htmlEntry: z.string().min(1),
  storyboard: z.string().min(1),
  weaponReceipt: z.string().min(1),
  snapshots: z.string().min(1),
  audit: z.string().min(1),
  approval: z.string().min(1),
  createdAt: z.string().datetime(),
}).superRefine((build, ctx) => {
  for (const field of ['htmlEntry', 'storyboard', 'weaponReceipt', 'snapshots', 'audit', 'approval'] as const) buildPath(build.root, build[field], ctx, field);
});

export type BuildManifest = z.infer<typeof BuildManifestSchema>;

export const CurrentBuildPointerSchema = z.object({
  version: z.literal('1.0'),
  buildId: z.string().min(1),
  contentHash: HashSchema,
  manifest: z.string().min(1),
  updatedAt: z.string().datetime(),
});

export const SkillRoleSchema = z.enum(['director', 'producer', 'motion', 'review', 'adapter']);
export const SkillDecisionLedgerSchema = z.object({
  version: z.literal('1.0'),
  inputHash: HashSchema,
  decisions: z.array(z.object({
    skillId: z.string().min(1),
    role: SkillRoleSchema,
    outputPaths: z.array(z.string().min(1)).min(1),
    outputHashes: z.record(z.string().min(1), HashSchema),
  })).min(1),
});

export const MotionCoverageSchema = z.object({
  version: z.literal('1.0'),
  buildId: z.string().min(1),
  scenes: z.array(z.object({
    sceneId: z.string().min(1),
    activeSeconds: z.number().nonnegative(),
    coverageRatio: z.number().min(0).max(1),
    quietGaps: z.array(z.object({ startSeconds: z.number().nonnegative(), durationSeconds: z.number().positive() })),
    status: z.enum(['pass', 'motion-density-low']),
  })).min(1),
  status: z.enum(['pass', 'needs_review']),
});

export type SkillRole = z.infer<typeof SkillRoleSchema>;
export type SkillDecisionLedger = z.infer<typeof SkillDecisionLedgerSchema>;
export type MotionCoverage = z.infer<typeof MotionCoverageSchema>;
