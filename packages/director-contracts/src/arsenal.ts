import { z } from 'zod';

export const WeaponMaturitySchema = z.enum(['candidate', 'compatible', 'proven', 'deprecated']);
export const WeaponIdSchema = z.enum(['text-split-enter', 'caption-clip-wipe', 'number-count-up', 'elastic-scale-enter', 'gradient-shift', 'stagger-grid-reveal']);

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
  proof: z.object({ evidence: PortablePathSchema, scorecard: PortablePathSchema }).optional(),
}).superRefine((manifest, ctx) => {
  if (manifest.maturity === 'proven' && !manifest.proof) ctx.addIssue({ code: 'custom', path: ['proof'], message: 'proven weapons require evidence and scorecard paths' });
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

export const ElasticScaleEnterParametersSchema = z.object({ fromScale:z.number().positive().max(2).default(0.6), duration:z.number().positive().max(10).default(0.55), ease:z.string().min(1).default('back.out(1.4)'), fade:z.boolean().default(true) }).strict();
export const GradientShiftParametersSchema = z.object({ fromColors:z.tuple([z.string().min(1),z.string().min(1)]).default(['#667eea','#764ba2']), toColors:z.tuple([z.string().min(1),z.string().min(1)]).default(['#f093fb','#f5576c']), angle:z.number().min(-360).max(360).default(135), duration:z.number().positive().max(30).default(3) }).strict();
export const StaggerGridRevealParametersSchema = z.object({ rows:z.number().int().positive().max(20).default(3), cols:z.number().int().positive().max(20).default(3), from:z.enum(['start','center','end','edges']).default('center'), staggerEach:z.number().nonnegative().max(2).default(0.05), animation:z.enum(['fade-up','scale-in','slide-left']).default('fade-up'), duration:z.number().positive().max(10).default(0.5) }).strict();

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
  stage: z.enum(['entrance', 'emphasis', 'exit']).default('entrance'),
  atSeconds: z.number().nonnegative().default(0.18),
  durationSeconds: z.number().positive().default(0.8),
};

export const WeaponSelectionSchema = z.discriminatedUnion('weaponId', [
  z.object({ ...SelectionEvidenceShape, weaponId: z.literal('text-split-enter'), functionName: z.literal('textSplitEnter'), entry: z.literal('text-split-enter/index.js'), params: TextSplitEnterParametersSchema }),
  z.object({ ...SelectionEvidenceShape, weaponId: z.literal('caption-clip-wipe'), functionName: z.literal('captionClipWipe'), entry: z.literal('caption-clip-wipe/index.js'), params: CaptionClipWipeParametersSchema }),
  z.object({ ...SelectionEvidenceShape, weaponId: z.literal('number-count-up'), functionName: z.literal('numberCountUp'), entry: z.literal('number-count-up/index.js'), params: NumberCountUpParametersSchema }),
  z.object({ ...SelectionEvidenceShape, weaponId: z.literal('elastic-scale-enter'), functionName: z.literal('elasticScaleEnter'), entry: z.literal('elastic-scale-enter/index.js'), params: ElasticScaleEnterParametersSchema }),
  z.object({ ...SelectionEvidenceShape, weaponId: z.literal('gradient-shift'), functionName: z.literal('gradientShift'), entry: z.literal('gradient-shift/index.js'), params: GradientShiftParametersSchema }),
  z.object({ ...SelectionEvidenceShape, weaponId: z.literal('stagger-grid-reveal'), functionName: z.literal('staggerGridReveal'), entry: z.literal('stagger-grid-reveal/index.js'), params: StaggerGridRevealParametersSchema }),
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
  stage: z.enum(['entrance', 'emphasis', 'exit']),
  atSeconds: z.number().nonnegative(),
  durationSeconds: z.number().positive(),
  weaponId: WeaponIdSchema,
  functionName: z.string().min(1),
  params: z.record(z.string(), z.unknown()),
  inputHash: HashSchema,
});

export type WeaponManifest = z.infer<typeof WeaponManifestSchema>;
export type WeaponLoadPlan = z.infer<typeof WeaponLoadPlanSchema>;
export type WeaponCall = z.infer<typeof WeaponCallSchema>;

export const WeaponBenchEvidenceSchema = z.object({
  version: z.literal('1.0'),
  weaponId: WeaponIdSchema,
  entryHash: HashSchema,
  ratios: z.array(z.object({
    ratio: z.enum(['16:9', '9:16']),
    projectPath: PortablePathSchema,
    hyperframesVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    buildHash: HashSchema,
    buildFiles: z.array(z.object({ path: PortablePathSchema, hash: HashSchema })).min(1),
    lint: z.literal('pass'),
    check: z.literal('pass'),
    snapshots: z.array(z.object({ path: PortablePathSchema, hash: HashSchema })).min(1),
    commandOutputHashes: z.object({ lint: HashSchema, check: HashSchema, snapshot: HashSchema }),
  }).superRefine((ratio, ctx) => {
    const prefix = `${ratio.projectPath}/`;
    const paths = ratio.buildFiles.map((file) => file.path);
    if (paths.some((path) => !path.startsWith(prefix))) ctx.addIssue({ code: 'custom', path: ['buildFiles'], message: 'build files must stay inside the ratio project' });
    if (new Set(paths).size !== paths.length || paths.join('\n') !== [...paths].sort().join('\n')) ctx.addIssue({ code: 'custom', path: ['buildFiles'], message: 'build files must be unique and canonically sorted' });
    for (const required of ['index.html', 'frame.md', 'vendor/weapon.js', 'vendor/gsap.min.js', 'fonts/wght.css']) {
      if (!paths.includes(`${prefix}${required}`)) ctx.addIssue({ code: 'custom', path: ['buildFiles'], message: `missing required build file: ${required}` });
    }
    if (!paths.some((path) => path.startsWith(`${prefix}fonts/files/`))) ctx.addIssue({ code: 'custom', path: ['buildFiles'], message: 'missing vendored font files' });
    if (ratio.snapshots.some((snapshot) => !snapshot.path.startsWith(`${prefix}snapshots/`))) ctx.addIssue({ code: 'custom', path: ['snapshots'], message: 'snapshots must stay inside the ratio project' });
  })).length(2).refine((ratios) => new Set(ratios.map((item) => item.ratio)).size === 2, 'both ratios are required'),
  generatedAt: z.string().datetime(),
});

export const WeaponScoreDimensionIdSchema = z.enum(['clarity', 'composition', 'motion', 'rhythm', 'craft', 'adaptability', 'commercialValue']);
export const WeaponScorecardSchema = z.object({
  version: z.literal('1.0'),
  weaponId: WeaponIdSchema,
  reviewer: z.object({ source: z.enum(['codex', 'independent_model', 'human']), id: z.string().min(1) }),
  reviewedAt: z.string().datetime(),
  buildHashes: z.array(HashSchema).min(2).refine((items) => new Set(items).size === items.length, 'build hashes must be unique'),
  citedFrames: z.array(PortablePathSchema).min(2).refine((items) => new Set(items).size === items.length, 'cited frames must be unique'),
  dimensions: z.array(z.object({ id: WeaponScoreDimensionIdSchema, score: z.number().min(1).max(5), reason: z.string().min(8) }))
    .length(7).refine((items) => new Set(items.map((item) => item.id)).size === 7, 'all seven dimensions must be unique'),
  verdict: z.literal('proven'),
});

export type WeaponBenchEvidence = z.infer<typeof WeaponBenchEvidenceSchema>;
export type WeaponScorecard = z.infer<typeof WeaponScorecardSchema>;
