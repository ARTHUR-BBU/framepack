import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const plugin = join(root, 'plugins', 'framepack-director');
const skill = join(plugin, 'skills', 'framepack-director');
const assets = join(plugin, 'assets', 'runtime');
const directorAssets = assets;

await Promise.all([rm(join(skill, 'public'), { recursive:true, force:true }), rm(join(plugin, 'skills', 'director-assets'), { recursive:true, force:true }), rm(join(plugin, 'docs'), { recursive:true, force:true }), rm(join(plugin, 'node_modules'), { recursive:true, force:true }), rm(assets, { recursive:true, force:true })]);
await Promise.all([mkdir(join(skill, 'scripts'), { recursive:true }), mkdir(join(directorAssets, 'vendor'), { recursive:true }), mkdir(join(assets, 'fonts'), { recursive:true })]);

await build({
  entryPoints:[join(root, 'packages', 'director-engine', 'src', 'cli.ts')],
  outfile:join(skill, 'scripts', 'framepack-director.mjs'),
  bundle:true,
  platform:'node',
  format:'esm',
  target:'node20',
  packages:'bundle',
  banner:{ js:'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);' },
  legalComments:'none',
  sourcemap:false,
  charset:'utf8',
});

await Promise.all([
  cp(join(root, 'apps', 'director-workbench', 'public'), join(skill, 'public'), { recursive:true }),
  cp(join(root, 'packages', 'director-assets', 'skills'), join(directorAssets, 'skills'), { recursive:true }),
  cp(join(root, 'packages', 'director-assets', 'styles'), join(directorAssets, 'styles'), { recursive:true }),
  cp(join(root, 'packages', 'director-assets', 'weapons'), join(directorAssets, 'weapons'), { recursive:true }),
  cp(join(root, 'packages', 'director-assets', 'fonts'), join(directorAssets, 'fonts'), { recursive:true }),
  cp(join(root, 'docs', 'evidence', 'weapons'), join(plugin, 'docs', 'evidence', 'weapons'), { recursive:true }),
  cp(join(root, 'node_modules', '@img'), join(plugin, 'node_modules', '@img'), { recursive:true }),
  cp(require.resolve('gsap/dist/gsap.min.js'), join(directorAssets, 'vendor', 'gsap.min.js')),
  cp(join(root, 'node_modules', '@fontsource', 'noto-sans-sc', 'files', 'noto-sans-sc-chinese-simplified-400-normal.woff2'), join(assets, 'fonts', 'NotoSansSC-Regular.woff2')),
  cp(join(root, 'node_modules', '@fontsource', 'noto-sans-sc', 'LICENSE'), join(assets, 'fonts', 'OFL-1.1.txt')),
]);

console.log(`Built ${join(skill, 'scripts', 'framepack-director.mjs')}`);
