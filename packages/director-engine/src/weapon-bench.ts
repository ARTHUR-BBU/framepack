import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  WeaponBenchEvidenceSchema,
  WeaponScorecardSchema,
  type WeaponBenchEvidence,
  type WeaponScorecard,
  type WeaponManifest,
} from '@framepack/director-contracts';

const require = createRequire(import.meta.url);
const WEAPON_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../director-assets/weapons');
const FONT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../director-assets/fonts/noto-sans-sc');

export function classifyWeaponBench(evidenceInput: WeaponBenchEvidence, scorecardInput: WeaponScorecard | null): 'candidate' | 'compatible' | 'proven' {
  const evidence = WeaponBenchEvidenceSchema.parse(evidenceInput);
  if (!scorecardInput) return 'compatible';
  try { promoteWeapon(evidence, scorecardInput); return 'proven'; } catch { return 'candidate'; }
}

export function promoteWeapon(evidenceInput: WeaponBenchEvidence, scorecardInput: WeaponScorecard | null): { maturity: 'proven'; evidence: WeaponBenchEvidence; scorecard: WeaponScorecard } {
  const evidence = WeaponBenchEvidenceSchema.parse(evidenceInput);
  if (!scorecardInput) throw new Error('identified reviewer scorecard is required');
  const scorecard = WeaponScorecardSchema.parse(scorecardInput);
  if (scorecard.weaponId !== evidence.weaponId) throw new Error('reviewer scorecard weapon mismatch');
  const checkedBuilds = new Set(evidence.ratios.map((ratio) => ratio.buildHash));
  if (new Set(scorecard.buildHashes).size !== checkedBuilds.size || scorecard.buildHashes.some((hash) => !checkedBuilds.has(hash))) {
    throw new Error('reviewer scorecard build hashes do not match checked bench builds');
  }
  const evidenceFrames = new Set(evidence.ratios.flatMap((ratio) => ratio.snapshots.map((snapshot) => snapshot.path)));
  if (scorecard.citedFrames.some((path) => !evidenceFrames.has(path))) throw new Error('reviewer cited frame is not part of checked bench evidence');
  for (const ratio of evidence.ratios) {
    if (!scorecard.citedFrames.some((path) => ratio.snapshots.some((snapshot) => snapshot.path === path))) {
      throw new Error(`reviewer scorecard does not cite the ${ratio.ratio} bench`);
    }
  }
  return { maturity: 'proven', evidence, scorecard };
}

export async function verifyWeaponProofFiles(repoRoot: string, evidenceInput: WeaponBenchEvidence): Promise<void> {
  const evidence = WeaponBenchEvidenceSchema.parse(evidenceInput);
  for (const ratio of evidence.ratios) {
    for (const artifact of [...ratio.buildFiles, ...ratio.snapshots]) await verifyFileHash(repoRoot, artifact.path, artifact.hash);
    const recomputedBuildHash = sha256(JSON.stringify(ratio.buildFiles));
    if (recomputedBuildHash !== ratio.buildHash) throw new Error(`build manifest hash mismatch for ${evidence.weaponId} ${ratio.ratio}`);
    for (const name of ['lint', 'check', 'snapshot'] as const) {
      const receiptPath = `${ratio.projectPath}/command-output/${name}.json`;
      await verifyFileHash(repoRoot, receiptPath, ratio.commandOutputHashes[name]);
      const receipt = JSON.parse(await readFile(resolve(repoRoot, ...receiptPath.split('/')), 'utf8')) as CommandResult & { command: string[]; cwd: string };
      const expectedArgs = name === 'snapshot' ? ['hyperframes', 'snapshot', '.', '--at', '0.3,1.3,3.5', '--json'] : ['hyperframes', name, '.', '--json'];
      if (JSON.stringify(receipt.command) !== JSON.stringify(['npx', ...expectedArgs]) || receipt.cwd !== ratio.projectPath) throw new Error(`${name} receipt command identity mismatch`);
      if (receipt.exitCode !== 0) throw new Error(`${name} receipt failed for ${evidence.weaponId} ${ratio.ratio}`);
      if (name !== 'snapshot') {
        const payload = JSON.parse(receipt.stdout) as { ok?: boolean; _meta?: { version?: string } };
        if (payload.ok !== true || payload._meta?.version !== ratio.hyperframesVersion) throw new Error(`${name} receipt is not ok or has a different HyperFrames version`);
      } else if (!receipt.stdout.includes(`${ratio.snapshots.length - 1} snapshots saved`) || !receipt.stdout.includes('contact-sheet.jpg')) {
        throw new Error(`snapshot receipt does not match captured frames for ${evidence.weaponId} ${ratio.ratio}`);
      }
    }
  }
}

type CommandResult = { exitCode: number; stdout: string; stderr: string };
type CommandRunner = (command: string, args: string[], cwd: string) => Promise<CommandResult>;

export async function runWeaponBenchEvidence(options: {
  repoRoot: string;
  evidenceRoot: string;
  weaponId: WeaponManifest['id'];
  commandRunner?: CommandRunner;
}): Promise<WeaponBenchEvidence> {
  const commandRunner = options.commandRunner ?? runCommand;
  const ratios: WeaponBenchEvidence['ratios'] = [];
  let entryHash = '';
  for (const ratio of ['16:9', '9:16'] as const) {
    const bench = await generateWeaponBench(options.evidenceRoot, options.weaponId, ratio);
    entryHash ||= bench.entryHash;
    if (entryHash !== bench.entryHash) throw new Error(`entry hash changed while generating ${options.weaponId}`);
    const commandOutputDir = join(bench.projectDir, 'command-output');
    await mkdir(commandOutputDir, { recursive: true });
    const hashes = {} as Record<'lint' | 'check' | 'snapshot', string>;
    let hyperframesVersion = '';
    const commands: Array<{ name: 'lint' | 'check' | 'snapshot'; args: string[] }> = [
      { name: 'lint', args: ['hyperframes', 'lint', '.', '--json'] },
      { name: 'check', args: ['hyperframes', 'check', '.', '--json'] },
      { name: 'snapshot', args: ['hyperframes', 'snapshot', '.', '--at', '0.3,1.3,3.5', '--json'] },
    ];
    for (const command of commands) {
      const result = await commandRunner('npx', command.args, bench.projectDir);
      const receipt = `${JSON.stringify({ command: ['npx', ...command.args], cwd: portable(relative(options.repoRoot, bench.projectDir)), ...result }, null, 2)}\n`;
      await writeFile(join(commandOutputDir, `${command.name}.json`), receipt, 'utf8');
      hashes[command.name] = sha256(receipt);
      if (result.exitCode !== 0) throw new Error(`${command.name} command failed for ${options.weaponId} ${ratio}: ${result.stderr || result.stdout}`);
      if (command.name === 'lint') hyperframesVersion = String((JSON.parse(result.stdout) as { _meta?: { version?: string } })._meta?.version ?? '');
    }
    const snapshotDir = join(bench.projectDir, 'snapshots');
    const snapshotNames = (await readdir(snapshotDir)).filter((name) => /\.(?:png|jpe?g)$/i.test(name)).sort();
    if (snapshotNames.length === 0) throw new Error(`snapshot command produced no frames for ${options.weaponId} ${ratio}`);
    const buildPaths = (await listFiles(bench.projectDir))
      .filter((path) => !path.includes('/command-output/') && !path.includes('/snapshots/'))
      .sort();
    const buildFiles = await Promise.all(buildPaths.map(async (path) => ({ path: portable(relative(options.repoRoot, path)), hash: sha256(await readFile(path)) })));
    const snapshots = await Promise.all(snapshotNames.map(async (name) => {
      const path = join(snapshotDir, name);
      return { path: portable(relative(options.repoRoot, path)), hash: sha256(await readFile(path)) };
    }));
    ratios.push({
      ratio,
      projectPath: portable(relative(options.repoRoot, bench.projectDir)),
      hyperframesVersion,
      buildHash: sha256(JSON.stringify(buildFiles)),
      buildFiles,
      lint: 'pass',
      check: 'pass',
      snapshots,
      commandOutputHashes: { lint: hashes.lint, check: hashes.check, snapshot: hashes.snapshot },
    });
  }
  const evidence = WeaponBenchEvidenceSchema.parse({ version: '1.0', weaponId: options.weaponId, entryHash, ratios, generatedAt: new Date().toISOString() });
  await writeFile(join(options.evidenceRoot, options.weaponId, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  return evidence;
}

export async function generateWeaponBench(root: string, weaponId: WeaponManifest['id'], ratio: '16:9' | '9:16'): Promise<{ projectDir: string; width: number; height: number; entryHash: string }> {
  const { width, height, slug } = ratio === '16:9' ? { width: 1920, height: 1080, slug: '16x9' } : { width: 1080, height: 1920, slug: '9x16' };
  const projectDir = resolve(root, weaponId, slug);
  const vendorDir = join(projectDir, 'vendor');
  await rm(projectDir, { recursive: true, force: true });
  await mkdir(vendorDir, { recursive: true });
  const entry = await readFile(join(WEAPON_ROOT, weaponId, 'index.js'), 'utf8');
  const runtimeEntry = entry.replace(/^export\s+/m, '');
  await installBenchFont(projectDir, weaponId);
  await Promise.all([
    cp(require.resolve('gsap/dist/gsap.min.js'), join(vendorDir, 'gsap.min.js')),
    writeFile(join(vendorDir, 'weapon.js'), runtimeEntry, 'utf8'),
    writeFile(join(projectDir, 'frame.md'), `# ${weaponId} 武器试片\n\n- ratio: ${ratio}\n- purpose: dual-ratio proof bench\n`, 'utf8'),
    writeFile(join(projectDir, 'index.html'), benchHtml(weaponId, width, height), 'utf8'),
  ]);
  return { projectDir, width, height, entryHash: sha256(entry) };
}

function benchHtml(weaponId: WeaponManifest['id'], width: number, height: number): string {
  const portrait = height > width;
  const demo = demoMarkup(weaponId);
  const invocation = demoInvocation(weaponId);
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=${width},height=${height}">
<title>${weaponId} 武器试片</title><link rel="stylesheet" href="./fonts/wght.css"><script src="./vendor/gsap.min.js"></script><script src="./vendor/weapon.js"></script>
<style>@font-face{font-family:'Noto Sans SC Variable';src:url('./fonts/files/noto-sans-sc-4-wght-normal.woff2') format('woff2-variations');font-weight:100 900;unicode-range:U+1F300}*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#090b10;color:#f5f0e8;font-family:"Noto Sans SC Variable",sans-serif}#root{position:relative;width:${width}px;height:${height}px;overflow:hidden}.clip{position:absolute;inset:0}.scene-inner{position:absolute;inset:0;display:grid;place-items:center;padding:${portrait ? 96 : 120}px;background:radial-gradient(circle at 70% 22%,rgba(227,76,45,.22),transparent 34%),linear-gradient(135deg,#10131b,#07080c)}.scene-inner:before{content:"";position:absolute;inset:5%;border:1px solid rgba(245,240,232,.13)}.kicker{position:absolute;top:7%;left:7%;font-size:${portrait ? 28 : 24}px;letter-spacing:.18em;color:#e34c2d}.demo{position:relative;width:100%;display:grid;place-items:center;text-align:center}.split{position:relative;font-size:${portrait ? 104 : 132}px;font-weight:900;letter-spacing:-.05em;line-height:.95}.split-left,.split-right{display:block}.split-left{clip-path:inset(0 50% 0 0)}.split-right{position:absolute;inset:0;clip-path:inset(0 0 0 50%)}.caption{display:flex;flex-wrap:wrap;justify-content:center;gap:.22em;max-width:${portrait ? 760 : 1250}px;font-size:${portrait ? 72 : 92}px;font-weight:800;line-height:1.15}.word{display:inline-block}.metric{font-size:${portrait ? 210 : 250}px;font-weight:900;letter-spacing:-.07em;color:#ff6847}.proof{margin-top:32px;font-size:${portrait ? 34 : 30}px;color:rgba(245,240,232,.65)}</style></head>
<body><div id="root" data-composition-id="weapon-bench" data-start="0" data-width="${width}" data-height="${height}" data-duration="5">
<section id="weapon-scene" class="clip" data-start="0" data-duration="5" data-track-index="0"><div class="scene-inner"><div class="kicker">FRAMEPACK / WEAPON PROOF</div><div class="demo">${demo}</div></div></section></div>
<script>window.__timelines=window.__timelines||{};window.__framepackTimeline=gsap.timeline({paused:true});const tl=window.__framepackTimeline;${invocation}window.__timelines['weapon-bench']=tl;</script></body></html>`;
}

function demoMarkup(id: WeaponManifest['id']): string {
  if (id === 'text-split-enter') return '<div id="target" class="split" data-layout-allow-overlap><span class="split-left" data-layout-allow-overlap>让想法发生</span><span class="split-right" data-layout-allow-overlap>让想法发生</span></div><div class="proof">标题分裂入场 · 左右动因合拢</div>';
  if (id === 'caption-clip-wipe') return '<div id="target" class="caption"><span class="word">真实</span><span class="word">产品</span><span class="word">值得</span><span class="word">被看见</span></div><div class="proof">逐词裁切 · 信息按阅读节奏展开</div>';
  return '<div id="target" class="metric">0%</div><div class="proof">真实指标 · 数字递增形成证据重音</div>';
}

function demoInvocation(id: WeaponManifest['id']): string {
  if (id === 'text-split-enter') return "textSplitEnter(tl,document.querySelector('#target'),{duration:.8,travelDistance:120},.45);";
  if (id === 'caption-clip-wipe') return "captionClipWipe(tl,document.querySelector('#target'),{durationPerWord:.55,staggerPerWord:.12},.45);";
  return "numberCountUp(tl,document.querySelector('#target'),{targetValue:87,suffix:'%',duration:2.2},.45);";
}

function sha256(value: string | Buffer): string { return createHash('sha256').update(value).digest('hex'); }

function portable(value: string): string { return value.replaceAll('\\', '/'); }

async function installBenchFont(projectDir: string, weaponId: WeaponManifest['id']): Promise<void> {
  const css = await readFile(join(FONT_ROOT, 'wght.css'), 'utf8');
  const text = `FRAMEPACK WEAPON PROOF ${weaponId} 标题分裂入场左右动因合拢让想法发生逐词裁切信息按阅读节奏展开真实产品值得被看见数字递增形成证据重音指标0123456789%·/ 🌀`;
  const codePoints = [...text].map((char) => char.codePointAt(0)!);
  const blocks = [...css.matchAll(/@font-face\s*\{[\s\S]*?\}/g)].map((match) => match[0]);
  const selected = blocks.filter((block) => {
    const ranges = block.match(/unicode-range:\s*([^;]+)/)?.[1] ?? '';
    return codePoints.some((point) => unicodeRangeContains(ranges, point));
  });
  const files = [...new Set(selected.flatMap((block) => [...block.matchAll(/url\(\.\/files\/([^)]+)\)/g)].map((match) => match[1])))];
  const targetRoot = join(projectDir, 'fonts');
  const targetFiles = join(targetRoot, 'files');
  await mkdir(targetFiles, { recursive: true });
  await Promise.all([
    writeFile(join(targetRoot, 'wght.css'), `${selected.join('\n\n')}\n`, 'utf8'),
    ...files.map((file) => cp(join(FONT_ROOT, 'files', file), join(targetFiles, file))),
  ]);
}

function unicodeRangeContains(value: string, point: number): boolean {
  return value.split(',').some((token) => {
    const normalized = token.trim().replace(/^U\+/i, '');
    if (!normalized) return false;
    if (normalized.includes('?')) {
      const start = Number.parseInt(normalized.replaceAll('?', '0'), 16);
      const end = Number.parseInt(normalized.replaceAll('?', 'f'), 16);
      return point >= start && point <= end;
    }
    const [startText, endText = startText] = normalized.split('-');
    return point >= Number.parseInt(startText, 16) && point <= Number.parseInt(endText, 16);
  });
}

async function listFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return nested.flat();
}

async function verifyFileHash(repoRoot: string, portablePath: string, expected: string): Promise<void> {
  let content: Buffer;
  try { content = await readFile(resolve(repoRoot, ...portablePath.split('/'))); }
  catch { throw new Error(`proof file missing: ${portablePath}`); }
  if (sha256(content) !== expected) throw new Error(`proof file hash mismatch: ${portablePath}`);
}

function runCommand(command: string, args: string[], cwd: string): Promise<CommandResult> {
  return new Promise((resolveResult, reject) => {
    const executable = process.platform === 'win32' && command === 'npx' ? process.execPath : command;
    const executableArgs = process.platform === 'win32' && command === 'npx'
      ? [join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js'), ...args]
      : args;
    const child = spawn(executable, executableArgs, {
      cwd,
      windowsHide: true,
      env: { ...process.env, HYPERFRAMES_RUN_ID: `weapon-bench-${Date.now()}` },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += String(chunk); });
    child.stderr.on('data', (chunk) => { stderr += String(chunk); });
    child.on('error', reject);
    child.on('close', (code) => resolveResult({ exitCode: code ?? 1, stdout, stderr }));
  });
}
