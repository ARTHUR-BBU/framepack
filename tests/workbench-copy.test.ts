import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const html = readFileSync('apps/director-workbench/public/index.html', 'utf8');
const script = readFileSync('apps/director-workbench/public/main.js', 'utf8');
const css = readFileSync('apps/director-workbench/public/style.css', 'utf8');

test('the workbench primary interface is Chinese and has no developer action copy', () => {
  expect(html).toContain('今天想做一支什么样的片子？');
  expect(html).toContain('请在当前 Codex 对话中告诉我');
  expect(html).not.toMatch(/Build preview|Extract proof|Run taste audit|Handoff|Approve|Waive/);
});

test('the browser is a director cockpit instead of a fake Codex chat', () => {
  expect(html).not.toContain('id="director-chat-input"');
  expect(html).toContain('导演上下文');
  expect(html).toContain('主预览舞台');
  expect(html).toContain('导演判断');
  expect(html).toContain('分镜时间线');
});

test('all nine Chinese production phases are represented', () => {
  for (const label of ['素材待补', '方向共创', '分镜编排', '武器匹配', '预览生成', '证据抽取', '导演审片', '决策确认', '已交接']) {
    expect(`${html}\n${script}`).toContain(label);
  }
});

test('the cockpit exposes provenance, stale evidence, comparison, connection loss, and deterministic controls', () => {
  for (const copy of ['技能与武器依据', '证据已过期', '与上一版比较', '连接已断开', '取消任务', '批准当前版本', '风险放行']) {
    expect(`${html}\n${script}`).toContain(copy);
  }
  expect(script).toContain('/api/events');
  expect(script).toContain('/api/decision');
  expect(script).toContain('/cancel');
});

test('hidden state always wins over component display styles', () => {
  expect(`${html}\n${css}`).toMatch(/\[hidden\]\s*\{\s*display:\s*none\s*!important/);
});

test('preview toolbar targets meet the forty-pixel minimum', () => {
  expect(`${html}\n${css}`).toMatch(/\.stage-tools button,\.stage-tools a\{[^}]*min-height:40px/);
});

test('one state selects only one primary action', () => {
  expect(script).toContain('function setPrimaryAction');
  expect(script).toContain("document.querySelectorAll('.primary').forEach");
});

test('small eyebrow copy uses the accessible warm-gray token', () => {
  expect(`${html}\n${css}`).toMatch(/\.eyebrow\{[^}]*color:#89847e/);
});

test('stateful requirements use real project data instead of placeholders', () => {
  expect(html).toContain('素材与缺口');
  expect(script).toContain('function renderAssets');
  expect(script).toContain('function renderProvenance');
  expect(script).toContain('hasStaleEvidence');
  expect(script).toContain('function compareBuilds');
  expect(script).not.toContain('下一阶段接入视觉并排模式');
  expect(script).not.toContain('导演工作台批准当前版本');
});

test('all nine phases are reachable from real state fixtures', async () => {
  const path = '../apps/director-workbench/public/phase-state.js';
  if (!existsSync('apps/director-workbench/public/phase-state.js')) { expect.fail('phase-state module is missing'); return; }
  const { resolvePhase } = await import(path);
  const base = { project:{files:{built:false,handedOff:false},decision:null,provenance:{weapons:null}}, assets:{assets:[]}, direction:null, storyboard:null, review:null, activeJobName:null };
  const fixtures = [
    base,
    { ...base, assets:{assets:[{status:'available',confirmed:true}]} },
    { ...base, assets:{assets:[{status:'available',confirmed:true}]}, direction:{} },
    { ...base, assets:{assets:[{status:'available',confirmed:true}]}, direction:{}, storyboard:{scenes:[{}]}, project:{...base.project,provenance:{weapons:{selected:[]}}} },
    { ...base, activeJobName:'build' }, { ...base, activeJobName:'snapshot' }, { ...base, activeJobName:'audit' },
    { ...base, project:{...base.project,decision:{} } }, { ...base, project:{...base.project,files:{built:true,handedOff:true}} },
  ];
  expect(fixtures.map(resolvePhase)).toEqual([0,1,2,3,4,5,6,7,8]);
});

test('stale evidence reports any obsolete decision or scorecard', async () => {
  const path = '../apps/director-workbench/public/phase-state.js';
  if (!existsSync('apps/director-workbench/public/phase-state.js')) { expect.fail('phase-state module is missing'); return; }
  const { hasStaleEvidence } = await import(path);
  const current = { buildId:'new', contentHash:'b'.repeat(64) };
  expect(hasStaleEvidence(current, { previewBuildId:'new', contentHash:'b'.repeat(64) }, { buildId:'old', contentHash:'a'.repeat(64) })).toBe(true);
});
