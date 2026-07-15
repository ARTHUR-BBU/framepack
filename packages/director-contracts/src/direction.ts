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

export const VisualStyleIdSchema = z.enum([
  'swiss-pulse',
  'velvet-standard',
  'deconstructed',
  'maximalist-type',
  'data-drift',
  'soft-signal',
  'folk-frequency',
  'shadow-cut',
]);

export const TasteMoveIdSchema = z.enum([
  'object-worship',
  'editorial-punch',
  'silence-before-drop',
  'motif-reincarnation',
  'interface-ballet',
  'data-cathedral',
  'liquid-brand',
  'cold-open',
  'kinetic-typography-attack',
  'product-reveal-ritual',
  'system-awakening',
  'human-imperfection',
]);

export const SurpriseOperatorIdSchema = z.enum([
  'silence-cut',
  'motif-reversal',
  'spatial-reframe',
  'scale-betrayal',
]);

const HexColorSchema = z.string().regex(/^#[a-f0-9]{6}$/i);
const PortableAssetPathSchema = z.string().min(1).refine(
  (path) => !path.includes('\\')
    && !path.startsWith('/')
    && !/^[a-z]:/i.test(path)
    && path.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..'),
  'asset path must be portable and project-relative',
);

export const VisualStyleSchema = z.object({
  id: VisualStyleIdSchema,
  chineseName: z.string().min(1),
  palette: z.object({
    background: HexColorSchema,
    surface: HexColorSchema,
    primary: HexColorSchema,
    accent: HexColorSchema,
  }),
  fontFamily: z.string().min(1).refine((family) => !/https?:\/\//i.test(family), 'font family cannot be a remote URL'),
  fontAsset: PortableAssetPathSchema,
  fontLicenseAsset: PortableAssetPathSchema,
  motionEnergy: z.enum(['calm', 'moderate', 'high']),
  atmosphere: z.array(z.string().min(1)).min(1),
  suitableIntents: z.array(z.string().min(1)).min(1),
  avoid: z.array(z.string().min(1)),
  provenance: z.object({
    sourceAsset: z.string().min(1),
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
    license: z.string().min(1),
  }),
});

export const StyleCatalogSchema = z.object({
  version: z.literal('1.0'),
  styles: z.array(VisualStyleSchema).length(8).refine(
    (styles) => new Set(styles.map((style) => style.id)).size === styles.length,
    'style IDs must be unique',
  ),
});

export const DirectionSelectionSchema = z.object({
  version: z.literal('1.0'),
  primaryStyle: VisualStyleIdSchema,
  supportingStyle: VisualStyleIdSchema,
  tasteMoves: z.array(TasteMoveIdSchema).min(1).max(3).refine((items) => new Set(items).size === items.length),
  surpriseOperators: z.array(SurpriseOperatorIdSchema).max(2).refine((items) => new Set(items).size === items.length),
  avoid: z.array(z.string().min(1)),
  rationale: z.string().min(1),
}).refine(
  (selection) => selection.supportingStyle !== selection.primaryStyle,
  { path: ['supportingStyle'], message: 'supporting style must differ from primary style' },
);

export type Brief = z.infer<typeof BriefSchema>;
export type DirectionProposal = z.infer<typeof DirectionProposalSchema>;
export type DirectionSelection = z.infer<typeof DirectionSelectionSchema>;
export type StyleCatalog = z.infer<typeof StyleCatalogSchema>;
export type VisualStyle = z.infer<typeof VisualStyleSchema>;
