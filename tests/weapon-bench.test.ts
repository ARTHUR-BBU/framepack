import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import {
  classifyWeaponBench,
  generateWeaponBench,
  promoteWeapon,
  runWeaponBenchEvidence,
  verifyWeaponProofFiles,
} from '../packages/director-engine/src/index.js';
import { WeaponBenchEvidenceSchema, WeaponScorecardSchema } from '../packages/director-contracts/src/index.js';

const paths: string[] = [];
afterEach(async () => Promise.all(paths.splice(0).map((path) => rm(path, { recursive: true, force: true }))));

function automatedEvidence() {
  const files = (projectPath: string, hash: string) => [
    'fonts/files/font.woff2', 'fonts/wght.css', 'frame.md', 'index.html', 'vendor/gsap.min.js', 'vendor/weapon.js',
  ].map((path) => ({ path: `${projectPath}/${path}`, hash })).sort((a, b) => a.path.localeCompare(b.path));
  return WeaponBenchEvidenceSchema.parse({
    version: '1.0', weaponId: 'text-split-enter', entryHash: 'a'.repeat(64),
    ratios: [
      { ratio: '16:9', projectPath: 'docs/evidence/weapons/text-split-enter/16x9', hyperframesVersion: '0.7.56', buildHash: '2'.repeat(64), buildFiles: files('docs/evidence/weapons/text-split-enter/16x9', '6'.repeat(64)), lint: 'pass', check: 'pass', snapshots: [{ path: 'docs/evidence/weapons/text-split-enter/16x9/snapshots/snapshot-01.png', hash: '7'.repeat(64) }], commandOutputHashes: { lint: 'b'.repeat(64), check: 'c'.repeat(64), snapshot: 'd'.repeat(64) } },
      { ratio: '9:16', projectPath: 'docs/evidence/weapons/text-split-enter/9x16', hyperframesVersion: '0.7.56', buildHash: '3'.repeat(64), buildFiles: files('docs/evidence/weapons/text-split-enter/9x16', '8'.repeat(64)), lint: 'pass', check: 'pass', snapshots: [{ path: 'docs/evidence/weapons/text-split-enter/9x16/snapshots/snapshot-01.png', hash: '9'.repeat(64) }], commandOutputHashes: { lint: 'e'.repeat(64), check: 'f'.repeat(64), snapshot: '1'.repeat(64) } },
    ],
    generatedAt: new Date().toISOString(),
  });
}

describe('weapon proof benches', () => {
  test('automated dual-ratio evidence promotes only to compatible', () => {
    expect(classifyWeaponBench(automatedEvidence(), null)).toBe('compatible');
  });

  test('a weapon cannot become proven without dual ratios and an identified reviewer', () => {
    expect(() => promoteWeapon(automatedEvidence(), null)).toThrow(/reviewer/i);
    expect(() => WeaponScorecardSchema.parse({
      version: '1.0', weaponId: 'text-split-enter', reviewer: { source: 'codex', id: '' },
      reviewedAt: new Date().toISOString(), buildHashes: ['a'.repeat(64)], citedFrames: ['frame.png'],
      dimensions: [], verdict: 'proven',
    })).toThrow();
  });

  test('scorecards require seven explained dimensions and cited frames', () => {
    const evidence = automatedEvidence();
    expect(() => promoteWeapon(evidence, {
      version: '1.0', weaponId: 'text-split-enter', reviewer: { source: 'codex', id: 'codex:gpt-5' },
      reviewedAt: new Date().toISOString(), buildHashes: [evidence.entryHash], citedFrames: [],
      dimensions: (['clarity', 'composition', 'motion', 'rhythm', 'craft', 'adaptability', 'commercialValue'] as const).map((id) => ({ id, score: 4, reason: '画面清楚且动作有因果' })), verdict: 'proven',
    })).toThrow(/frame/i);
  });

  test('a scorecard cannot prove a different build than the checked bench', () => {
    const evidence = automatedEvidence();
    expect(() => promoteWeapon(evidence, {
      version: '1.0', weaponId: 'text-split-enter', reviewer: { source: 'codex', id: 'codex:gpt-5' },
      reviewedAt: new Date().toISOString(), buildHashes: ['4'.repeat(64), '5'.repeat(64)], citedFrames: ['docs/evidence/weapons/text-split-enter/16x9/snapshots/snapshot-01.png', 'docs/evidence/weapons/text-split-enter/9x16/snapshots/snapshot-01.png'],
      dimensions: (['clarity', 'composition', 'motion', 'rhythm', 'craft', 'adaptability', 'commercialValue'] as const).map((id) => ({ id, score: 4, reason: '双画幅画面清楚且动作有因果' })), verdict: 'proven',
    })).toThrow(/build/i);
  });

  test('duplicate builds or frames cannot impersonate dual-ratio review', () => {
    const evidence = automatedEvidence();
    const dimensions = (['clarity', 'composition', 'motion', 'rhythm', 'craft', 'adaptability', 'commercialValue'] as const).map((id) => ({ id, score: 4, reason: '双画幅画面清楚且动作有因果' }));
    const base = { version: '1.0' as const, weaponId: 'text-split-enter' as const, reviewer: { source: 'codex' as const, id: 'codex:gpt-5' }, reviewedAt: new Date().toISOString(), dimensions, verdict: 'proven' as const };
    expect(() => promoteWeapon(evidence, { ...base, buildHashes: ['2'.repeat(64), '2'.repeat(64)], citedFrames: ['docs/evidence/weapons/text-split-enter/16x9/snapshots/snapshot-01.png', 'docs/evidence/weapons/text-split-enter/9x16/snapshots/snapshot-01.png'] })).toThrow(/build/i);
    expect(() => promoteWeapon(evidence, { ...base, buildHashes: ['2'.repeat(64), '3'.repeat(64)], citedFrames: ['docs/evidence/weapons/text-split-enter/16x9/snapshots/snapshot-01.png', 'docs/evidence/weapons/text-split-enter/16x9/snapshots/snapshot-01.png'] })).toThrow();
  });

  test('disk verification detects changed build, command receipt, or cited frame', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'framepack-proof-'));
    paths.push(repoRoot);
    const project = join(repoRoot, 'docs', 'evidence', 'weapons', 'text-split-enter', '16x9');
    await mkdir(join(project, 'command-output'), { recursive: true });
    await mkdir(join(project, 'snapshots'), { recursive: true });
    const buildPath = join(project, 'index.html');
    const framePath = join(project, 'snapshots', 'frame.png');
    const receiptPath = join(project, 'command-output', 'lint.json');
    await writeFile(buildPath, 'build', 'utf8');
    await writeFile(framePath, 'frame', 'utf8');
    await writeFile(receiptPath, JSON.stringify({ exitCode: 0, stdout: JSON.stringify({ ok: true }), stderr: '' }), 'utf8');
    const evidence = automatedEvidence();
    evidence.ratios[0].buildFiles.find((file) => file.path.endsWith('/index.html'))!.hash = '6'.repeat(64);
    await expect(verifyWeaponProofFiles(repoRoot, evidence)).rejects.toThrow(/missing|hash/i);
  });

  test('generates a local deterministic HyperFrames bench in both ratios', async () => {
    const root = await mkdtemp(join(tmpdir(), 'framepack-bench-'));
    paths.push(root);
    const wide = await generateWeaponBench(root, 'number-count-up', '16:9');
    const tall = await generateWeaponBench(root, 'number-count-up', '9:16');
    const wideHtml = await readFile(join(wide.projectDir, 'index.html'), 'utf8');
    const tallHtml = await readFile(join(tall.projectDir, 'index.html'), 'utf8');
    expect(wideHtml).toContain('data-composition-id="weapon-bench"');
    expect(wideHtml).toContain('data-duration="5"');
    expect(wideHtml).toContain('class="clip"');
    expect(wideHtml).toContain('id="weapon-scene"');
    expect(wideHtml).toContain('<link rel="stylesheet" href="./fonts/wght.css">');
    expect(wideHtml).toContain("@font-face{font-family:'Noto Sans SC Variable'");
    expect(generateWeaponBench).toBeTypeOf('function');
    expect(wideHtml).toContain("window.__timelines['weapon-bench']");
    expect(wideHtml).toContain('./vendor/gsap.min.js');
    expect(wideHtml).not.toMatch(/https?:\/\//);
    expect(wideHtml).not.toBe(tallHtml);
    expect(wide.width).toBe(1920);
    expect(tall.height).toBe(1920);
    expect((await readdir(join(wide.projectDir, 'fonts', 'files'))).length).toBeLessThan(20);
  }, 15_000);

  test('records hashed command receipts and refuses a failed real gate', async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), 'framepack-bench-repo-'));
    paths.push(repoRoot);
    const evidenceRoot = join(repoRoot, 'docs', 'evidence', 'weapons');
    const calls: string[] = [];
    const fakeRunner = async (command: string, args: string[], cwd: string) => {
      calls.push(`${command} ${args.join(' ')}`);
      if (args[1] === 'snapshot') {
        const snapshots = join(cwd, 'snapshots');
        await mkdir(snapshots, { recursive: true });
        await writeFile(join(snapshots, 'frame-01-at-0.3s.png'), 'frame', 'utf8');
        await writeFile(join(snapshots, 'contact-sheet.jpg'), 'sheet', 'utf8');
      }
      return { exitCode: 0, stdout: JSON.stringify({ ok: true, command: args[1], _meta: { version: '0.7.56' } }), stderr: '' };
    };
    const evidence = await runWeaponBenchEvidence({ repoRoot, evidenceRoot, weaponId: 'number-count-up', commandRunner: fakeRunner });
    expect(calls).toHaveLength(6);
    expect(evidence.ratios.map((item) => item.ratio)).toEqual(['16:9', '9:16']);
    expect(evidence.ratios.every((item) => item.snapshots.some(({ path }) => path.endsWith('contact-sheet.jpg')))).toBe(true);
    const receiptPath = join(evidenceRoot, 'number-count-up', '16x9', 'command-output', 'lint.json');
    const receipt = await readFile(receiptPath, 'utf8');
    expect(evidence.ratios[0].commandOutputHashes.lint).toMatch(/^[a-f0-9]{64}$/);
    expect(receipt).toContain('"exitCode": 0');

    await expect(runWeaponBenchEvidence({
      repoRoot,
      evidenceRoot: join(repoRoot, 'failed'),
      weaponId: 'text-split-enter',
      commandRunner: async (_command, args) => ({ exitCode: args[1] === 'check' ? 1 : 0, stdout: JSON.stringify({ ok: true, _meta: { version: '0.7.56' } }), stderr: 'gate failed' }),
    })).rejects.toThrow(/check.*failed/i);
  }, 15_000);
});
