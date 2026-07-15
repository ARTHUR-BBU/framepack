import { z } from 'zod';

export const ProjectPhaseSchema = z.enum([
  'intake',
  'direction',
  'storyboard',
  'compose',
  'review',
  'approved',
  'handoff',
]);

export const ProjectStateSchema = z.object({
  version: z.literal('1.0'),
  projectId: z.string().min(1),
  phase: ProjectPhaseSchema,
  currentBuildId: z.string().min(1).nullable(),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/i).nullable(),
  updatedAt: z.string().datetime(),
});

export type ProjectPhase = z.infer<typeof ProjectPhaseSchema>;
export type ProjectState = z.infer<typeof ProjectStateSchema>;
