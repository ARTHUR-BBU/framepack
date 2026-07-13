import { createHash } from 'node:crypto';

export type ContentFingerprint = {
  brief: unknown;
  assetHashes: Record<string, string>;
  direction: unknown;
  storyboard: unknown;
  skillLoadPlan: unknown;
  loadedSkillHashes: Record<string, string>;
  weaponLoadPlan: unknown;
  loadedWeaponHashes: Record<string, string>;
  hyperframesVersion: string;
  fontHashes: Record<string, string>;
  vendorHashes: Record<string, string>;
  composerConfig: unknown;
  composerVersion: string;
};

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('content fingerprint cannot contain a non-finite number');
    return value;
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
        .map(([key, item]) => {
          if (item === undefined) throw new Error(`content fingerprint cannot contain undefined at ${key}`);
          return [key, canonicalize(item)];
        }),
    );
  }
  throw new Error(`content fingerprint cannot contain ${typeof value}`);
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function contentHash(input: ContentFingerprint): string {
  return createHash('sha256').update(stableStringify(input)).digest('hex');
}
