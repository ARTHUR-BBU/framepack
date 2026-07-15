import { z } from 'zod';

export const AssetKindSchema = z.enum(['image', 'video', 'audio', 'font', 'document', 'other']);
export const AssetSourceSchema = z.enum(['user', 'captured', 'generated', 'builtin']);

export const AssetRecordSchema = z.object({
  version: z.literal('1.0'),
  id: z.string().min(1),
  kind: AssetKindSchema,
  mediaType: z.string().min(1),
  status: z.enum(['available', 'invalid', 'oversized']),
  source: AssetSourceSchema,
  sourcePath: z.string().min(1).refine(
    (path) => !path.includes('\\')
      && !path.startsWith('/')
      && !/^[a-z]:/i.test(path)
      && path.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..'),
    'sourcePath must be project-relative',
  ),
  sourceUrl: z.string().url().optional(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i),
  bytes: z.number().int().nonnegative(),
  assignedSceneIds: z.array(z.string().min(1)),
  confirmed: z.boolean(),
}).superRefine((asset, ctx) => {
  if (!asset.confirmed && asset.assignedSceneIds.length) {
    ctx.addIssue({ code: 'custom', path: ['assignedSceneIds'], message: 'unconfirmed assets cannot be assigned to scenes' });
  }
  if (asset.confirmed && !asset.assignedSceneIds.length) {
    ctx.addIssue({ code: 'custom', path: ['assignedSceneIds'], message: 'confirmed assets require at least one scene assignment' });
  }
  if (asset.source === 'captured' && !asset.sourceUrl) {
    ctx.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'captured assets require sourceUrl provenance' });
  }
});

export type AssetRecord = z.infer<typeof AssetRecordSchema>;

export const AssetLedgerSchema = z.object({
  version: z.literal('1.0'),
  summary: z.enum(['missing', 'available']),
  assets: z.array(AssetRecordSchema),
  inspectedAt: z.string().datetime(),
});

export type AssetLedger = z.infer<typeof AssetLedgerSchema>;
