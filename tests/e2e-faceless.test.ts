import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { initProject, runProjectProposal } from '../packages/director-engine/src/index.js';
import { resolveNpxInvocation } from '../packages/hyperframes-bridge/src/index.js';

test('faceless explainer completes a truthful revision loop without invented footage', async () => {
  const project = mkdtempSync(join(tmpdir(), 'e2e-faceless-'));
  await initProject(project, { title:'把复杂概念讲清楚', aspectRatio:'16:9', durationSeconds:12 });
  const proposal = { version:'1.0' as const, id:'faceless-1', title:'把复杂概念讲清楚', summary:'用事实、路径和对比解释一个复杂概念', visualStyleId:'soft-signal', rhythm:'question-context-proof-synthesis', assetIds:[] };
  const first = await runProjectProposal({ projectDir:project, brief:{ goal:'解释一个复杂概念', audience:'新手', constraints:[] }, proposal });
  const revised = await runProjectProposal({ projectDir:project, brief:{ goal:'解释一个复杂概念', audience:'新手', constraints:[] }, feedback:'减少段落感，让证据关系更明显', proposal:{ ...proposal, id:'faceless-2', summary:'用证据关系和空间路径解释复杂概念' } });
  const storyboard = JSON.parse(readFileSync(join(project,'.framepack','storyboard.json'),'utf8'));
  const receipt = JSON.parse(readFileSync(join(project,'.framepack','feedback.json'),'utf8'));
  const html = readFileSync(join(currentBuildRoot(project),'index.html'),'utf8');
  const lint = runGate('lint', currentBuildRoot(project));
  const check = runGate('check', currentBuildRoot(project));
  expect(revised.buildId).not.toBe(first.buildId);
  expect(storyboard.revisionOf).toBeTruthy();
  expect(storyboard.revisionReason).toBe('减少段落感，让证据关系更明显');
  expect(receipt).toContain('减少段落感，让证据关系更明显');
  expect(html).not.toMatch(/<video|https?:\/\//);
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
