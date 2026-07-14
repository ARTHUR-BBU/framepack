import { z } from 'zod';

export const WeaponMaturitySchema = z.enum(['candidate', 'compatible', 'proven', 'deprecated']);
export const WeaponIdSchema = z.enum(['text-split-enter', 'caption-clip-wipe', 'number-count-up']);

const PortablePathSchema = z.string().regex(
  /^(?![A-Za-z][A-Za-z0-9+.-]*:)(?!\/)(?!.*\/\/)(?!.*(?:^|\/)\.\.?(?:\/|$))[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/,
  'path must be a canonical portable project-relative path without a URI scheme',
);

export const WeaponManifestSchema = z.object({
  version: z.literal('1.0'),
  id: WeaponIdSchema,
  chineseName: z.string().min(1),
  maturity: WeaponMaturitySchema,
  functionName: z.string().regex(/^[A-Za-z_$][\w$]*$/),
  entry: PortablePathSchema,
  engine: z.literal('gsap'),
  purposes: z.array(z.enum(['hook', 'proof', 'experience', 'cta'])).min(1),
  signals: z.array(z.string().min(1)).min(1),
  source: z.object({
    asset: PortablePathSchema,
    commit: z.string().regex(/^[a-f0-9]{40}$/),
    license: z.string().min(1),
  }),
});

export const TextSplitEnterParametersSchema = z.object({
  splitMode: z.enum(['horizontal', 'vertical', 'char']).default('horizontal'),
  direction: z.enum(['inward', 'outward']).default('inward'),
  travelDistance: z.number().positive().max(500).default(40),
  staggerPerChar: z.number().nonnegative().max(1).default(0.03),
  duration: z.number().positive().max(10).default(0.5),
}).strict();

export const CaptionClipWipeParametersSchema = z.object({
  direction: z.enum(['left-to-right', 'right-to-left', 'top-to-bottom', 'center-out']).default('left-to-right'),
  staggerPerWord: z.number().nonnegative().max(2).default(0.1),
  durationPerWord: z.number().positive().max(10).default(0.4),
}).strict();

export const NumberCountUpParametersSchema = z.object({
  targetValue: z.number().finite(),
  prefix: z.string().max(20).default(''),
  suffix: z.string().max(20).default(''),
  decimals: z.number().int().min(0).max(6).default(0),
  duration: z.number().positive().max(30).default(1.5),
  ease: z.string().min(1).default('power2.out'),
}).strict();

export const WeaponCandidateSchema = z.object({
  sceneId: z.string().min(1),
  weaponId: WeaponIdSchema,
  reason: z.string().min(1),
  maturity: WeaponMaturitySchema,
});

const HashSchema = z.string().regex(/^[a-f0-9]{64}$/);
const SelectionEvidenceShape = {
  sceneId: z.string().min(1),
  entryHash: HashSchema,
};

export const WeaponSelectionSchema = z.discriminatedUnion('weaponId', [
  z.object({ ...SelectionEvidenceShape, weaponId: z.literal('text-split-enter'), functionName: z.literal('textSplitEnter'), entry: z.literal('text-split-enter/index.js'), params: TextSplitEnterParametersSchema }),
  z.object({ ...SelectionEvidenceShape, weaponId: z.literal('caption-clip-wipe'), functionName: z.literal('captionClipWipe'), entry: z.literal('caption-clip-wipe/index.js'), params: CaptionClipWipeParametersSchema }),
  z.object({ ...SelectionEvidenceShape, weaponId: z.literal('number-count-up'), functionName: z.literal('numberCountUp'), entry: z.literal('number-count-up/index.js'), params: NumberCountUpParametersSchema }),
]);

export const WeaponLoadPlanSchema = z.object({
  version: z.literal('1.0'),
  storyboardId: z.string().min(1),
  inputHash: HashSchema,
  selected: z.array(WeaponSelectionSchema),
  candidates: z.array(WeaponCandidateSchema),
  fallbacks: z.array(z.object({
    sceneId: z.string().min(1),
    checkedSources: z.array(z.string().min(1)).min(1),
    rejectedCandidates: z.array(z.string().min(1)),
    reason: z.string().min(1),
  })),
});

export const WeaponCallSchema = z.object({
  sceneId: z.string().min(1),
  weaponId: WeaponIdSchema,
  functionName: z.string().min(1),
  params: z.record(z.string(), z.unknown()),
  inputHash: HashSchema,
});

export type WeaponManifest = z.infer<typeof WeaponManifestSchema>;
export type WeaponLoadPlan = z.infer<typeof WeaponLoadPlanSchema>;
export type WeaponCall = z.infer<typeof WeaponCallSchema>;
