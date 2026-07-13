import { z } from 'zod';
import { DirectionSelectionSchema } from './direction.js';

export const StoryboardBriefSchema = z.object({
  title: z.string().min(1),
  durationSeconds: z.number().positive(),
  corePromise: z.string().min(1),
  benefits: z.array(z.string().min(1)).min(1),
  cta: z.string().min(1),
  assetIds: z.array(z.string().min(1)).default([]),
  scenePurposes: z.array(z.enum(['hook', 'proof', 'experience', 'cta'])).min(1).optional(),
}).superRefine((brief, ctx) => {
  const sceneCount = brief.scenePurposes?.length ?? 3;
  if (brief.durationSeconds < sceneCount * 0.001) {
    ctx.addIssue({ code: 'custom', path: ['durationSeconds'], message: 'duration is too short for the requested scene count' });
  }
});

export const StoryboardSceneSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  purpose: z.enum(['hook', 'proof', 'experience', 'cta']),
  startSeconds: z.number().nonnegative(),
  durationSeconds: z.number().positive(),
  narrativeBeat: z.string().min(1),
  visualFocus: z.string().min(1),
  layers: z.object({
    background: z.array(z.string().min(1)).min(1),
    midground: z.array(z.string().min(1)).min(1),
    foreground: z.array(z.string().min(1)).min(1),
  }),
  assetIds: z.array(z.string().min(1)),
  motionGrammar: z.enum(['cause-reveal', 'echo-transform', 'mask-portal', 'tension-release', 'scatter-assemble', 'follow-through', 'breath-punch-silence']),
  transitionSeed: z.string().min(1),
  audioIntent: z.string().min(1),
  negativeConstraints: z.array(z.string().min(1)).min(1),
  revisionOf: z.string().min(1).nullable(),
  revisionReason: z.string().min(1).nullable(),
}).superRefine((scene, ctx) => {
  if ((scene.revisionOf === null) !== (scene.revisionReason === null)) {
    ctx.addIssue({ code: 'custom', path: ['revisionReason'], message: 'scene revision lineage requires both source and reason' });
  }
});

export const StoryboardSchema = z.object({
  version: z.literal('1.0'),
  id: z.string().min(1),
  title: z.string().min(1),
  durationSeconds: z.number().positive(),
  direction: DirectionSelectionSchema,
  sourceBrief: StoryboardBriefSchema,
  revisionOf: z.string().min(1).nullable(),
  revisionReason: z.string().min(1).nullable(),
  createdAt: z.string().datetime(),
  scenes: z.array(StoryboardSceneSchema).min(1),
}).superRefine((storyboard, ctx) => {
  let cursor = 0;
  const ids = new Set<string>();
  for (const [index, scene] of storyboard.scenes.entries()) {
    if (Math.abs(scene.startSeconds - cursor) > 0.001) {
      ctx.addIssue({ code: 'custom', path: ['scenes', index, 'startSeconds'], message: 'scene windows must be contiguous and non-overlapping' });
    }
    cursor += scene.durationSeconds;
    if (ids.has(scene.id)) ctx.addIssue({ code: 'custom', path: ['scenes', index, 'id'], message: 'scene IDs must be unique' });
    ids.add(scene.id);
  }
  if (Math.abs(cursor - storyboard.durationSeconds) > 0.001) {
    ctx.addIssue({ code: 'custom', path: ['durationSeconds'], message: 'scene windows must fill the storyboard duration' });
  }
  if ((storyboard.revisionOf === null) !== (storyboard.revisionReason === null)) {
    ctx.addIssue({ code: 'custom', path: ['revisionReason'], message: 'revision lineage requires both source and reason' });
  }
});

export type StoryboardBrief = z.infer<typeof StoryboardBriefSchema>;
export type Storyboard = z.infer<typeof StoryboardSchema>;
export type StoryboardScene = z.infer<typeof StoryboardSceneSchema>;
