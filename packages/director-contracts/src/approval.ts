import { z } from 'zod';

export const ApprovalSchema = z.object({
  state: z.enum(['approved', 'waived']),
  reason: z.string().min(1),
  previewBuildId: z.string().min(1),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/i),
  decidedAt: z.string().datetime(),
});

export type Approval = z.infer<typeof ApprovalSchema>;
