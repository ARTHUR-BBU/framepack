import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { expect, test } from 'vitest';

const plugin = 'plugins/framepack-director';

test('plugin manifest, executable skill, runtime assets, and repo marketplace resolve', () => {
  const manifest = JSON.parse(readFileSync(`${plugin}/.codex-plugin/plugin.json`, 'utf8'));
  expect(manifest).toMatchObject({ name:'framepack-director', version:'0.1.0', skills:'./skills/', interface:{ displayName:'Framepack 导演台', category:'Productivity', capabilities:['Interactive','Write'] } });
  expect(existsSync(`${plugin}/skills/framepack-director/SKILL.md`)).toBe(true);
  expect(existsSync(`${plugin}/skills/framepack-director/scripts/framepack-director.mjs`)).toBe(true);
  expect(existsSync(`${plugin}/assets/runtime/fonts/NotoSansSC-Regular.woff2`)).toBe(true);
  expect(existsSync(`${plugin}/assets/runtime/fonts/OFL-1.1.txt`)).toBe(true);
  const gsapRegistry = JSON.parse(readFileSync(`${plugin}/assets/runtime/skills/greensock-gsap-skills.json`, 'utf8'));
  expect(gsapRegistry.modules).toHaveLength(8);
  for (const skill of gsapRegistry.modules) {
    const snapshot = `${plugin}/assets/runtime/${skill.snapshotPath}`;
    expect(existsSync(snapshot), `${skill.id} snapshot should be packaged`).toBe(true);
    expect(createHash('sha256').update(readFileSync(snapshot)).digest('hex')).toBe(skill.sha256);
  }
  const marketplace = JSON.parse(readFileSync('.agents/plugins/marketplace.json', 'utf8'));
  expect(marketplace.plugins.find((item: { name: string }) => item.name === 'framepack-director').source.path).toBe('./plugins/framepack-director');
});

test('bundled entry initializes and builds outside the source repository', () => {
  const root = mkdtempSync(join(tmpdir(), 'framepack-plugin-smoke-'));
  const copiedPlugin = join(root, 'framepack-director');
  cpSync(resolve(plugin), copiedPlugin, { recursive:true });
  const entry = join(copiedPlugin, 'skills/framepack-director/scripts/framepack-director.mjs');
  const project = join(root, 'project');
  execFileSync(process.execPath, [entry,'init',project,'--title','插件样片','--aspect','16:9','--duration','12'], { cwd:root, stdio:'pipe' });
  execFileSync(process.execPath, [entry,'build',project], { cwd:root, stdio:'pipe' });
  expect(existsSync(join(project, 'index.html'))).toBe(true);
  expect(existsSync(join(project, 'public/vendor/gsap.min.js'))).toBe(true);
  const proposal = join(root, 'proposal.json');
  writeFileSync(proposal, JSON.stringify({ version:'1.0', id:'proposal-1', title:'插件导演方案', summary:'为产品制作一支清晰的发布视频', visualStyleId:'velvet-standard', rhythm:'hook-proof-cta', assetIds:[] }));
  execFileSync(process.execPath, [entry,'direct',project,'--proposal-file',proposal], { cwd:root, stdio:'pipe' });
  expect(existsSync(join(project, '.framepack/weapon-load-plan.json'))).toBe(true);
  const image = join(root, 'pixel.png');
  cpSync(resolve('docs/evidence/weapons/text-split-enter/16x9/snapshots/frame-00-at-0.3s.png'), image);
  execFileSync(process.execPath, [entry,'assets',project,'add',image], { cwd:root, stdio:'pipe' });
  expect(JSON.parse(readFileSync(join(project, '.framepack/asset-ledger.json'), 'utf8')).assets[0]).toMatchObject({ status:'available', kind:'image' });
}, 30_000);

test('built plugin is repository-independent and deterministic', () => {
  const entry = `${plugin}/skills/framepack-director/scripts/framepack-director.mjs`;
  const first = createHash('sha256').update(readFileSync(entry)).digest('hex');
  execFileSync(process.execPath, ['--import','tsx','scripts/build-plugin.ts'], { stdio:'pipe' });
  const second = createHash('sha256').update(readFileSync(entry)).digest('hex');
  expect(second).toBe(first);
  const bundle = readFileSync(entry, 'utf8');
  expect(bundle).toContain('import.meta.url');
  expect(bundle).not.toContain('F:\\hyperframes');
}, 30_000);
