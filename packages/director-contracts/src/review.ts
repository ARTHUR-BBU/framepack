import { z } from 'zod';

const ScoreSchema = z.number().int().min(1).max(5);
const ScoreReasonSchema = z.string().min(1);

export const ReviewDimensionsSchema = z.object({
  intentClarity: ScoreSchema,
  productFocus: ScoreSchema,
  visualHierarchy: ScoreSchema,
  materialQuality: ScoreSchema,
  motionChoreography: ScoreSchema,
  rhythm: ScoreSchema,
  restraint: ScoreSchema,
});

export const ReviewReasonsSchema = z.object({
  intentClarity: ScoreReasonSchema,
  productFocus: ScoreReasonSchema,
  visualHierarchy: ScoreReasonSchema,
  materialQuality: ScoreReasonSchema,
  motionChoreography: ScoreReasonSchema,
  rhythm: ScoreReasonSchema,
  restraint: ScoreReasonSchema,
});

export const ReviewScorecardSchema = z.object({
  version: z.literal('1.0'),
  buildId: z.string().min(1),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/i),
  source: z.enum(['codex', 'independent_model', 'human']),
  reviewer: z.string().min(1),
  reviewedAt: z.string().datetime(),
  scores: ReviewDimensionsSchema,
  reasons: ReviewReasonsSchema,
  evidenceFrames: z.array(z.string().min(1)).min(1),
  average: z.number().min(1).max(5),
  verdict: z.enum(['pass', 'fail', 'needs_review']),
}).superRefine((scorecard, ctx) => {
  const values = Object.values(scorecard.scores);
  const expectedAverage = Math.round((values.reduce((sum, score) => sum + score, 0) / values.length) * 100) / 100;
  if (scorecard.average !== expectedAverage) {
    ctx.addIssue({
      code: 'custom',
      path: ['average'],
      message: `average must equal the seven-score mean rounded to two decimals (${expectedAverage})`,
    });
  }
});

export type ReviewScorecard = z.infer<typeof ReviewScorecardSchema>;

export const DeterministicReviewEvidenceSchema = z.object({
  material: z.object({ status: z.enum(['missing', 'available']), files: z.array(z.string().min(1)).min(1) }),
  contrast: z.object({ status: z.enum(['pass', 'fail', 'needs_review']), files: z.array(z.string().min(1)).min(1) }),
  safeArea: z.object({ status: z.enum(['pass', 'fail', 'needs_review']), files: z.array(z.string().min(1)).min(1), frameTimes: z.array(z.number().nonnegative()).min(1) }),
});

export const SubjectiveReviewEvidenceSchema = z.object({
  status: z.enum(['needs_review', 'reviewed']),
  scorecard: ReviewScorecardSchema.optional(),
}).superRefine((value, ctx) => {
  if (value.status === 'reviewed' && !value.scorecard) ctx.addIssue({ code: 'custom', path: ['scorecard'], message: 'reviewed evidence requires an identified scorecard' });
  if (value.status === 'needs_review' && value.scorecard) ctx.addIssue({ code: 'custom', path: ['scorecard'], message: 'needs_review cannot claim a scorecard' });
});

export type DeterministicReviewEvidence = z.infer<typeof DeterministicReviewEvidenceSchema>;
export type SubjectiveReviewEvidence = z.infer<typeof SubjectiveReviewEvidenceSchema>;
