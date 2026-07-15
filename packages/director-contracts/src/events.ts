import { z } from 'zod';
import { ApprovalSchema } from './approval.js';
import { BriefSchema } from './direction.js';

const BaseEvent = z.object({
  version: z.literal('1.0'),
  id: z.string().min(1),
  at: z.string().datetime(),
});

export const DirectorEventSchema = z.discriminatedUnion('type', [
  BaseEvent.extend({ type: z.literal('brief.updated'), payload: BriefSchema }),
  BaseEvent.extend({
    type: z.literal('assets.changed'),
    payload: z.object({ assetIds: z.array(z.string().min(1)) }),
  }),
  BaseEvent.extend({
    type: z.literal('direction.confirmed'),
    payload: z.object({ directionId: z.string().min(1) }),
  }),
  BaseEvent.extend({
    type: z.literal('feedback.added'),
    payload: z.object({ text: z.string().min(1) }),
  }),
  BaseEvent.extend({ type: z.literal('decision.recorded'), payload: ApprovalSchema }),
]);

export type DirectorEvent = z.infer<typeof DirectorEventSchema>;
