import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, test } from 'vitest';
import { approveProject, auditProject, confirmAssetAssignment, handoffProject, initProject, inspectAssets, runProjectProposal, snapshotProject } from '../packages/director-engine/src/index.js';
import { resolveNpxInvocation } from '../packages/hyperframes-bridge/src/index.js';

const fixture = resolve('tests/fixtures/product-launch');
const archivedScorecards = JSON.parse(readFileSync(resolve('docs/evidence/product-launch/review-scorecards.json'), 'utf8'));

for (const aspect of ['16:9', '9:16'] as const) {
  test(`Codex translates feedback into a revised proposal and completes the product-launch handoff (${aspect})`, async () => {
    const project = mkdtempSync(join(tmpdir(), `e2e-product-launch-${aspect.replace(':', '')}-`));
    await initProject(project, { title: '让每一次协作更轻松', aspectRatio: aspect, durationSeconds: 18 });
    mkdirSync(join(project, 'assets'), { recursive: true });
    cpSync(join(fixture, 'product.png'), join(project, 'assets', 'product.png'));
    cpSync(join(fixture, 'brand.md'), join(project, 'assets', 'brand.md'));
    const ledger = await inspectAssets(project);
    const product = ledger.assets.find((asset) => asset.kind === 'image')!;
    await confirmAssetAssignment(project, product.id, ['scene-2-proof']);
    const brief = JSON.parse(readFileSync(join(fixture, 'brief.json'), 'utf8'));
    const first = await runProjectProposal({ projectDir: project, brief, proposal: {
      version: '1.0', id: `launch-${aspect}`, title: '让每一次协作更轻松',
      summary: '把中文想法和真实产品素材变成可审片的动态方案', visualStyleId: 'data-drift',
      rhythm: 'hook-punch-proof-cta', assetIds: [product.id],
    } });
    const beforeStoryboard = JSON.parse(readFileSync(join(project, '.framepack', 'storyboard.json'), 'utf8'));
    const beforeHtml = readFileSync(join(project, 'index.html'), 'utf8');
    await snapshotProject(project);
    const beforeFrames = snapshotHashes(project);
    const acceptedScorecard = reviewScorecard(revisedScorecardId(aspect));
    const staleScorecard = { ...acceptedScorecard, buildId: first.buildId, contentHash: contentHash(project) };
    const revised = await runProjectProposal({ projectDir: project, brief, feedback: '降低科技感、产品再突出', proposal: {
      version: '1.0', id: `launch-${aspect}-warm`, title: '让每一次协作更轻松',
      summary: '减少信号网格，用温暖留白托住真实产品界面', visualStyleId: 'soft-signal',
      rhythm: 'hook-breathe-proof-cta', assetIds: [product.id],
    } });
    const afterStoryboard = JSON.parse(readFileSync(join(project, '.framepack', 'storyboard.json'), 'utf8'));
    const afterHtml = readFileSync(join(project, 'index.html'), 'utf8');
    await snapshotProject(project);
    const afterFrames = snapshotHashes(project);
    const lint = runHyperframesJson('lint', project);
    const check = runHyperframesJson('check', project);
    expect(lint).toMatchObject({ ok: true, errorCount: 0, warningCount: 0 });
    expect(check).toMatchObject({ ok: true, runtime: { ok: true }, layout: { ok: true }, contrast: { ok: true } });
    writeFileSync(join(project, '.framepack', 'hyperframes-lint.json'), JSON.stringify(lint, null, 2));
    writeFileSync(join(project, '.framepack', 'hyperframes-check.json'), JSON.stringify(check, null, 2));
    const audit = await auditProject(project);
    expect(revised.buildId).not.toBe(first.buildId);
    expect(afterStoryboard.direction.primaryStyle).toBe('soft-signal');
    expect(afterStoryboard.revisionReason).toBe('降低科技感、产品再突出');
    expect(afterStoryboard.revisionOf).toBe(beforeStoryboard.id);
    expect(afterStoryboard.scenes[1].visualFocus).toContain('温暖留白');
    expect(afterStoryboard.scenes[1].visualFocus).not.toBe(beforeStoryboard.scenes[1].visualFocus);
    expect(afterHtml).not.toBe(beforeHtml);
    expect(afterHtml).toContain('assets/product.png');
    expect(afterFrames.every((hash, index) => hash !== beforeFrames[index])).toBe(true);
    expect(afterFrames).toHaveLength(6);
    expect(audit.subjective.status).toBe('needs_review');
    expect(audit.taste.recommendation).toBe(false);
    await expect(auditProject(project, { scorecard: staleScorecard })).rejects.toThrow(/stale/i);
    const currentScorecard = reviewScorecard(revised.buildId);
    expect(currentScorecard.contentHash).toBe(contentHash(project));
    const reviewed = await auditProject(project, { scorecard: currentScorecard });
    expect(reviewed.subjective).toMatchObject({ status: 'reviewed', scorecard: { source: 'codex', reviewer: 'codex:gpt-5:/root:2026-07-14', average: 3.71 } });
    expect((await approveProject(project, '具名 Codex 审片已绑定当前构建')).state).toBe('approved');
    expect(await handoffProject(project)).toMatchObject({ previewApproved: true, aspectRatio: aspect, tasteGate: 'pass' });
    writeFileSync(join(project, '.framepack', 'e2e-evidence.json'), JSON.stringify({ aspect, firstBuildId: first.buildId, revisedBuildId: revised.buildId, beforeFrames, afterFrames, lint: 'pass', check: 'pass', staleScorecard: 'rejected', currentScorecard: 'accepted', handoff: 'pass' }, null, 2));
    expect(existsSync(join(project, '.framepack', 'host-run-receipt.json'))).toBe(true);
  }, 180_000);
}

function contentHash(project: string): string {
  return createHash('sha256').update(readFileSync(join(project, 'index.html'))).digest('hex');
}

function runHyperframesJson(command: 'lint' | 'check', project: string): Record<string, any> {
  const invocation = resolveNpxInvocation(['--no-install', 'hyperframes', command, project, '--json']);
  const result = spawnSync(invocation.executable, invocation.args, { encoding: 'utf8', shell: invocation.shell, maxBuffer: 8 * 1024 * 1024 });
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout) as Record<string, any>;
}

function reviewScorecard(buildId: string) {
  const scorecard = archivedScorecards.find((item: { buildId?: string }) => item.buildId === buildId);
  expect(scorecard, `missing archived review scorecard for ${buildId}`).toBeTruthy();
  return structuredClone(scorecard);
}

function revisedScorecardId(aspect: '16:9' | '9:16'): string {
  return aspect === '16:9'
    ? '1d45da44169b4d1d942758f06788a5804d36e3ba8c8e2d0cdbb9e9a6db2180c6'
    : '29270871162f84e39eebb0a450bf84c40d82ffcd8a27433ef69fd786cc07e3e8';
}

function snapshotHashes(project: string): string[] {
  const directory = join(project, '.framepack', 'preview-snapshots');
  return readdirSync(directory).filter((name) => name.endsWith('.png')).sort()
    .map((name) => createHash('sha256').update(readFileSync(join(directory, name))).digest('hex'));
}
