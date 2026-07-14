import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { auditGsapSource, gsapCapabilityFingerprintInput, loadGsapCapabilities, persistGsapCapabilityReceipt, routeGsapCapabilities } from '../packages/director-engine/src/gsap-capabilities.js';

test('official GreenSock snapshots are hash-pinned and all eight modules are registered', async () => {
  const registry = await loadGsapCapabilities();
  expect(registry.modules).toHaveLength(8);
  expect(registry.modules.every((item) => item.verified)).toBe(true);
});

test('offline video routing loads production knowledge but excludes scroll and framework hosts', async () => {
  const registry = await loadGsapCapabilities();
  const route = routeGsapCapabilities(registry, { target: 'offline-video', needsPlugins: false });
  expect(route.required).toEqual(['gsap-core', 'gsap-timeline', 'gsap-utils', 'gsap-performance']);
  expect(route.excluded).toEqual(expect.arrayContaining(['gsap-scrolltrigger', 'gsap-react', 'gsap-frameworks']));
});

test('a persisted receipt binds the selected official skill hashes', async () => {
  const project = await mkdtemp(join(tmpdir(), 'framepack-gsap-receipt-'));
  const registry = await loadGsapCapabilities();
  const receipt = await persistGsapCapabilityReceipt(project, routeGsapCapabilities(registry, { target: 'offline-video', needsPlugins: true }));
  expect(receipt.loaded.map((item) => item.id)).toContain('gsap-plugins');
  expect(JSON.parse(await readFile(join(project, '.framepack', 'gsap-capability-receipt.json'), 'utf8'))).toEqual(receipt);
});

test('official production rules reject non-seek-safe or layout-heavy weapon source', () => {
  expect(auditGsapSource(`ScrollTrigger.create({}); gsap.to(el,{left:20,repeat:-1});`)).toEqual(expect.arrayContaining(['scrolltrigger-offline', 'layout-property:left', 'infinite-repeat']));
  expect(auditGsapSource(`tl.fromTo(el,{autoAlpha:0,x:20},{autoAlpha:1,x:0,duration:.5},0);`)).toEqual([]);
});

test('snapshot paths cannot escape the pinned official directory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'framepack-gsap-escape-'));
  await cp('packages/director-assets/skills', join(root, 'skills'), { recursive:true });
  const escape = Buffer.from('not an official snapshot');
  await writeFile(join(root, 'skills', 'escape.md'), escape);
  const registryPath = join(root, 'skills', 'greensock-gsap-skills.json');
  const registry = JSON.parse(await readFile(registryPath, 'utf8'));
  registry.modules[0].snapshotPath = 'skills/escape.md';
  registry.modules[0].sha256 = createHash('sha256').update(escape).digest('hex');
  await writeFile(registryPath, JSON.stringify(registry));
  await expect(loadGsapCapabilities(root)).rejects.toThrow('escapes snapshot root');
});

test('registry requires all eight unique module identities', async () => {
  const root = await mkdtemp(join(tmpdir(), 'framepack-gsap-ids-'));
  await cp('packages/director-assets/skills', join(root, 'skills'), { recursive:true });
  const registryPath = join(root, 'skills', 'greensock-gsap-skills.json');
  const registry = JSON.parse(await readFile(registryPath, 'utf8'));
  registry.modules[7].id = registry.modules[0].id;
  await writeFile(registryPath, JSON.stringify(registry));
  await expect(loadGsapCapabilities(root)).rejects.toThrow('each supported module exactly once');
});

test('fingerprint covers policy, provenance and excluded routing', async () => {
  const registry = await loadGsapCapabilities();
  const route = routeGsapCapabilities(registry, { target:'offline-video', needsPlugins:false });
  expect(gsapCapabilityFingerprintInput(registry, route)).toMatchObject({
    registry:{ commit:registry.commit, hyperframesOverrides:registry.hyperframesOverrides },
    route:{ target:'offline-video', excluded:route.excluded },
  });
});
