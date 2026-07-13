import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import {
  dimensionsForAspect,
  PROJECT_FILES,
  ProjectSpecSchema,
  renderAssetIntakeMarkdown,
  renderPreviewReportMarkdown,
  renderStoryboardMarkdown,
  type AspectRatio,
  type ProjectSpec,
} from '@framepack/director-contracts';
import { generatePreviewHtml, inspectPreviewHtml } from '../../hyperframes-bridge/src/index.js';

const require = createRequire(import.meta.url);
const PROJECT_SPEC_FILE = '.framepack/project.json';

export async function initProject(projectDir: string, input: { title: string; aspectRatio: AspectRatio; durationSeconds: number }): Promise<string> {
  const dimensions = dimensionsForAspect(input.aspectRatio);
  const spec = ProjectSpecSchema.parse({ ...input, ...dimensions, audioNeeded: false, subtitleNeeded: false, bgmNeeded: false });
  await Promise.all([
    mkdir(join(projectDir, '.framepack', 'preview-snapshots'), { recursive: true }),
    mkdir(join(projectDir, '.hyperframes'), { recursive: true }),
    mkdir(join(projectDir, 'public', 'assets'), { recursive: true }),
    mkdir(join(projectDir, 'public', 'fonts'), { recursive: true }),
    mkdir(join(projectDir, 'public', 'vendor'), { recursive: true }),
  ]);
  await writeFile(join(projectDir, PROJECT_SPEC_FILE), `${JSON.stringify(spec, null, 2)}\n`);
  await writeFile(join(projectDir, 'frame.md'), `# ${spec.title}\n\n- aspect_ratio: ${spec.aspectRatio}\n- motion: deliberate, layered, seek-safe\n- avoid: empty PPT cards and external runtime dependencies\n`);
  await writeFile(join(projectDir, PROJECT_FILES.assetIntake), renderAssetIntakeMarkdown(spec.title));
  await writeFile(join(projectDir, PROJECT_FILES.storyboard), renderStoryboardMarkdown({ title: spec.title, scenes: ['Hook', 'Proof', 'CTA'] }));
  return projectDir;
}

export async function buildProject(projectDir: string): Promise<{ inspection: ReturnType<typeof inspectPreviewHtml>; buildId: string }> {
  const spec = await readProjectSpec(projectDir);
  const html = generatePreviewHtml(spec);
  const inspection = inspectPreviewHtml(html);
  if (inspection.codes.length) throw new Error(`preview HTML violates HyperFrames contract: ${inspection.codes.join(', ')}`);
  await cp(require.resolve('gsap/dist/gsap.min.js'), join(projectDir, 'public', 'vendor', 'gsap.min.js'));
  await writeFile(join(projectDir, 'index.html'), html);
  const buildId = `${spec.aspectRatio}-${spec.durationSeconds}s`;
  await writeFile(join(projectDir, PROJECT_FILES.buildReport), `# HTML Build Report\n\n- build_id: ${buildId}\n- structural_contract: pass\n- local_gsap: public/vendor/gsap.min.js\n`);
  return { inspection, buildId };
}

export async function snapshotProject(projectDir: string): Promise<{ frames: Array<{ label: string; timeSeconds: number }> }> {
  const spec = await readProjectSpec(projectDir);
  const third = spec.durationSeconds / 3;
  const frames = [
    { label: 'scene-1-settled', timeSeconds: third * 0.6 },
    { label: 'transition-1-midpoint', timeSeconds: third },
    { label: 'scene-2-settled', timeSeconds: third * 1.6 },
    { label: 'transition-2-midpoint', timeSeconds: third * 2 },
    { label: 'scene-3-settled', timeSeconds: third * 2.6 },
    { label: 'final-hold', timeSeconds: Math.max(0, spec.durationSeconds - 0.25) },
  ];
  const rows = frames.map((frame) => `| ${frame.timeSeconds.toFixed(2)} | ${frame.label} | pending snapshot capture | pending |`).join('\n');
  await writeFile(join(projectDir, PROJECT_FILES.previewReport), `${renderPreviewReportMarkdown()}\n${rows}\n`);
  await writeFile(join(projectDir, '.framepack', 'preview-snapshots', 'snapshot-plan.json'), `${JSON.stringify({ frames }, null, 2)}\n`);
  return { frames };
}

export async function readProjectSpec(projectDir: string): Promise<ProjectSpec> {
  const path = join(projectDir, PROJECT_SPEC_FILE);
  if (!existsSync(path)) throw new Error(`director project is not initialized: ${projectDir}`);
  return ProjectSpecSchema.parse(JSON.parse(await readFile(path, 'utf8')));
}
