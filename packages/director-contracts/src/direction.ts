import { z } from 'zod';

export const BriefSchema = z.object({
  goal: z.string().min(1),
  audience: z.string().min(1),
  constraints: z.array(z.string().min(1)).default([]),
});

export const DirectionProposalSchema = z.object({
  version: z.literal('1.0'),
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  visualStyleId: z.string().min(1),
  rhythm: z.string().min(1),
  assetIds: z.array(z.string().min(1)),
});

export type Brief = z.infer<typeof BriefSchema>;
export type DirectionProposal = z.infer<typeof DirectionProposalSchema>;
