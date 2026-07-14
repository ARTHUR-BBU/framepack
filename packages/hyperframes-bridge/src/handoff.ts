export type HandoffManifestInput = { buildId: string; contentHash: string; hyperframesVersion: string };
export function createHandoffManifest(input: HandoffManifestInput) { return { version: '1.0' as const, ...input }; }
