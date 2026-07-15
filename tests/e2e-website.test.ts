import { cpSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, test } from 'vitest';
import { confirmAssetAssignment, initProject, inspectAssets, runProjectProposal } from '../packages/director-engine/src/index.js';
import { resolveNpxInvocation } from '../packages/hyperframes-bridge/src/index.js';

test('website-to-video keeps URL provenance and completes one tour revision', async () => {
  const project = mkdtempSync(join(tmpdir(), 'e2e-website-'));
  await initProject(project, { title:'真实网站导览', aspectRatio:'16:9', durationSeconds:12 });
  mkdirSync(join(project,'captured'), { recursive:true });
  cpSync(resolve('tests/fixtures/product-launch/product.png'), join(project,'captured','home.png'));
  const ledger = await inspectAssets(project, { urlCaptures:[{ url:'https://example.com', localPath:'captured/home.png' }] });
  const captured = ledger.assets.find((asset) => asset.source === 'captured')!;
  const proposal = { version:'1.0' as const, id:'website-1', title:'真实网站导览', summary:'按真实页面顺序安排一次产品导览', visualStyleId:'swiss-pulse', rhythm:'capture-orient-tour-cta', assetIds:[] };
  const first = await runProjectProposal({ projectDir:project, brief:{ goal:'展示 https://example.com 的真实页面', audience:'新用户', constraints:[] }, proposal });
  const initialStoryboard = JSON.parse(readFileSync(join(project,'.framepack','storyboard.json'),'utf8'));
  await confirmAssetAssignment(project, captured.id, initialStoryboard.scenes.map((scene:{id:string}) => scene.id));
  const revised = await runProjectProposal({ projectDir:project, brief:{ goal:'展示 https://example.com 的真实页面', audience:'新用户', constraints:[] }, feedback:'先展示首页，再进入核心功能', proposal:{ ...proposal, id:'website-2', summary:'先首页定位，再进入核心功能导览', assetIds:[captured.id] } });
  const saved = JSON.parse(await readFile(join(project,'.framepack','asset-ledger.json'),'utf8'));
  const storyboard = JSON.parse(readFileSync(join(project,'.framepack','storyboard.json'),'utf8'));
  const html = readFileSync(join(currentBuildRoot(project),'index.html'),'utf8');
  const lint = runGate('lint', currentBuildRoot(project));
  const check = runGate('check', currentBuildRoot(project));
  expect(revised.buildId).not.toBe(first.buildId);
  expect(saved.assets.find((asset:{id:string}) => asset.id === captured.id)).toMatchObject({ source:'captured', sourceUrl:'https://example.com', confirmed:true });
  expect(storyboard.scenes.some((scene:{assetIds:string[]}) => scene.assetIds.includes(captured.id))).toBe(true);
  expect(html).toContain('captured/home.png');
  expect(lint).toMatchObject({ ok:true, errorCount:0 });
  expect(check).toMatchObject({ ok:true, runtime:{ ok:true }, layout:{ ok:true } });
}, 120_000);

function runGate(command:'lint'|'check', project:string) {
  const invocation = resolveNpxInvocation(['--no-install','hyperframes',command,project,'--json']);
  const result = spawnSync(invocation.executable, invocation.args, { encoding:'utf8', shell:invocation.shell });
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout);
}

function currentBuildRoot(project:string) {
  const pointer = JSON.parse(readFileSync(join(project,'.framepack','current-build.json'),'utf8')) as { buildId:string };
  return join(project,'.framepack','builds',pointer.buildId);
}
