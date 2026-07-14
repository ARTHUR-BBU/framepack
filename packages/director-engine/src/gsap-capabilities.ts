import { createHash } from 'node:crypto';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { z } from 'zod';
import { runtimeAssetRoot } from './runtime-assets.js';

const IdSchema = z.enum(['gsap-core', 'gsap-timeline', 'gsap-scrolltrigger', 'gsap-plugins', 'gsap-utils', 'gsap-react', 'gsap-performance', 'gsap-frameworks']);
const ModuleSchema = z.object({ id: IdSchema, scope: z.enum(['production', 'conditional', 'capture-only', 'host-only']), snapshotPath: z.string().min(1), sha256: z.string().regex(/^[a-f0-9]{64}$/), framepackRole: z.string().min(1) });
const ALL_IDS = IdSchema.options;
const RegistryFileSchema = z.object({ version: z.literal('1.0'), upstream: z.string().url(), commit: z.string().regex(/^[a-f0-9]{40}$/), license: z.literal('MIT'), installedFor: z.array(z.literal('codex')), modules: z.array(ModuleSchema).length(8), hyperframesOverrides: z.array(z.string().min(1)).min(1) }).superRefine((registry, context) => {
  const ids = registry.modules.map((item) => item.id);
  if (new Set(ids).size !== ALL_IDS.length || ALL_IDS.some((id) => !ids.includes(id))) context.addIssue({ code:'custom', path:['modules'], message:'official GSAP registry must contain each supported module exactly once' });
});

export type GsapCapabilityId = z.infer<typeof IdSchema>;
type GsapRegistryFile = z.infer<typeof RegistryFileSchema>;
type VerifiedGsapModule = z.infer<typeof ModuleSchema> & { verified: boolean; resolvedPath: string };
export type GsapCapabilityRegistry = Omit<GsapRegistryFile, 'modules'> & { modules: VerifiedGsapModule[] };
export type GsapCapabilityRoute = { target: 'offline-video' | 'website-capture' | 'react-host' | 'framework-host'; required: GsapCapabilityId[]; excluded: GsapCapabilityId[]; modules: GsapCapabilityRegistry['modules'] };

export async function loadGsapCapabilities(root = runtimeAssetRoot): Promise<GsapCapabilityRegistry> {
  const raw = RegistryFileSchema.parse(JSON.parse(await readFile(join(root, 'skills', 'greensock-gsap-skills.json'), 'utf8')));
  const allowedRoot = await realpath(join(root, 'skills', 'greensock-official'));
  const modules = await Promise.all(raw.modules.map(async (item) => {
    if (isAbsolute(item.snapshotPath)) throw new Error(`official GSAP skill path escapes snapshot root: ${item.id}`);
    const resolvedPath = await realpath(resolve(root, ...item.snapshotPath.split('/')));
    const within = relative(allowedRoot, resolvedPath);
    if (within.startsWith('..') || isAbsolute(within)) throw new Error(`official GSAP skill path escapes snapshot root: ${item.id}`);
    const actual = createHash('sha256').update(await readFile(resolvedPath)).digest('hex');
    if (actual !== item.sha256) throw new Error(`official GSAP skill hash mismatch: ${item.id}`);
    return { ...item, verified: true, resolvedPath };
  }));
  return { ...raw, modules };
}

export function gsapCapabilityFingerprintInput(registry: GsapCapabilityRegistry, route: GsapCapabilityRoute) {
  return {
    registry: {
      version: registry.version, upstream: registry.upstream, commit: registry.commit, license: registry.license,
      installedFor: registry.installedFor, hyperframesOverrides: registry.hyperframesOverrides,
      modules: registry.modules.map(({ id, scope, snapshotPath, sha256, framepackRole }) => ({ id, scope, snapshotPath, sha256, framepackRole })),
    },
    route: { target: route.target, required: route.required, excluded: route.excluded },
  };
}

export function routeGsapCapabilities(registry: GsapCapabilityRegistry, input: { target: GsapCapabilityRoute['target']; needsPlugins: boolean }): GsapCapabilityRoute {
  const base: GsapCapabilityId[] = ['gsap-core', 'gsap-timeline', 'gsap-utils', 'gsap-performance'];
  const host = input.target === 'react-host' ? ['gsap-react'] as GsapCapabilityId[] : input.target === 'framework-host' ? ['gsap-frameworks'] as GsapCapabilityId[] : [];
  const capture = input.target === 'website-capture' ? ['gsap-scrolltrigger'] as GsapCapabilityId[] : [];
  const required = [...base, ...(input.needsPlugins ? ['gsap-plugins'] as GsapCapabilityId[] : []), ...capture, ...host];
  const excluded = registry.modules.map((item) => item.id).filter((id) => !required.includes(id));
  return { target: input.target, required, excluded, modules: registry.modules.filter((item) => required.includes(item.id)) };
}

export async function persistGsapCapabilityReceipt(projectDir: string, route: GsapCapabilityRoute) {
  const receipt = {
    version: '1.0' as const, target: route.target,
    loaded: route.modules.map(({ id, sha256, snapshotPath }) => ({ id, sha256, snapshotPath })),
    excluded: route.excluded,
  };
  await mkdir(join(projectDir, '.framepack'), { recursive: true });
  await writeFile(join(projectDir, '.framepack', 'gsap-capability-receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  return receipt;
}

export function auditGsapSource(source: string): string[] {
  const issues: string[] = [];
  if (/ScrollTrigger\s*\.|scrollTrigger\s*:/.test(source)) issues.push('scrolltrigger-offline');
  for (const match of source.matchAll(/\b(width|height|top|left|right|bottom|margin|padding)\s*:/g)) issues.push(`layout-property:${match[1]}`);
  if (/repeat\s*:\s*-1/.test(source)) issues.push('infinite-repeat');
  if (/\btransform\s*:/.test(source)) issues.push('raw-transform');
  return [...new Set(issues)];
}
