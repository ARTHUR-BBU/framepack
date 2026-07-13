import { z } from 'zod';

export const AssetKindSchema = z.enum(['image', 'video', 'audio', 'font', 'document', 'other']);
export const AssetSourceSchema = z.enum(['user', 'captured', 'generated', 'builtin']);

export const AssetRecordSchema = z.object({
  version: z.literal('1.0'),
  id: z.string().min(1),
  kind: AssetKindSchema,
  source: AssetSourceSchema,
  sourcePath: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i),
  bytes: z.number().int().nonnegative(),
  assignedSceneIds: z.array(z.string().min(1)),
  confirmed: z.boolean(),
});

export type AssetRecord = z.infer<typeof AssetRecordSchema>;
