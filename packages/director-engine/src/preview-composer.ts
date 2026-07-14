import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AssetLedgerSchema, DirectionSelectionSchema, ProjectSpecSchema, StoryboardSchema, WeaponLoadPlanSchema,
  dimensionsForAspect,
  type AssetLedger, type DirectionSelection, type ProjectSpec, type Storyboard, type WeaponLoadPlan,
} from '@framepack/director-contracts';
import { inspectPreviewHtml } from '../../hyperframes-bridge/src/index.js';
import { stableStringify } from './content-hash.js';
import { vendorNotoSansSc } from './font-vendor.js';
import { SkillLoadReceiptSchema, type SkillLoadReceipt } from './skill-runtime.js';
import { runtimeAssetRoot } from './runtime-assets.js';
import { loadStyleCatalog } from './style-catalog.js';
import { persistWeaponEvidence, renderWeaponInvocation, verifyWeaponCalls } from './weapon-runtime.js';
import { auditGsapSource, gsapCapabilityFingerprintInput, loadGsapCapabilities, persistGsapCapabilityReceipt, routeGsapCapabilities } from './gsap-capabilities.js';

const require = createRequire(import.meta.url);
const DEFAULT_WEAPON_ROOT = resolve(runtimeAssetRoot, 'weapons');
const BUNDLED_GSAP = resolve(runtimeAssetRoot, 'vendor', 'gsap.min.js');

export type ComposePreviewInput = {
  projectDir: string;
  spec: ProjectSpec;
  assets: AssetLedger;
  direction: DirectionSelection;
  storyboard: Storyboard;
  skillReceipt: SkillLoadReceipt;
  weaponPlan: WeaponLoadPlan;
  feedback: string[];
  weaponRoot?: string;
};

export type PreviewBuild = { buildId: string; html: string; inspection: ReturnType<typeof inspectPreviewHtml> };

export async function composePreview(input: ComposePreviewInput): Promise<PreviewBuild> {
  const projectDir = resolve(input.projectDir);
  const spec = ProjectSpecSchema.parse(input.spec);
  const assets = AssetLedgerSchema.parse(input.assets);
  const direction = DirectionSelectionSchema.parse(input.direction);
  const storyboard = StoryboardSchema.parse(input.storyboard);
  const weaponPlan = WeaponLoadPlanSchema.parse(input.weaponPlan);
  const skillReceiptResult = SkillLoadReceiptSchema.safeParse(input.skillReceipt);
  if (!skillReceiptResult.success) throw new Error(`invalid skill load receipt: ${skillReceiptResult.error.message}`);
  const skillReceipt = skillReceiptResult.data;
  const dimensions = dimensionsForAspect(spec.aspectRatio);
  if (spec.width !== dimensions.width || spec.height !== dimensions.height) throw new Error('preview dimensions do not match aspect ratio');
  if (storyboard.durationSeconds !== spec.durationSeconds) throw new Error('storyboard duration does not match project spec');
  if (stableStringify(storyboard.direction) !== stableStringify(direction)) throw new Error('storyboard direction is stale');
  for (const loaded of skillReceipt.loaded) {
    let content: Buffer;
    try { content = await readFile(loaded.resolvedSource); }
    catch { throw new Error(`skill unavailable after receipt: ${loaded.id}`); }
    if (sha256(content) !== loaded.sha256.toLowerCase()) throw new Error(`skill hash changed after receipt: ${loaded.id}`);
  }
  if (weaponPlan.storyboardId !== storyboard.id || weaponPlan.inputHash !== storyboardInputHash(storyboard)) throw new Error('weapon plan is stale');

  const assetById = new Map(assets.assets.map((asset) => [asset.id, asset]));
  const referencedScenes = new Map<string, string[]>();
  for (const scene of storyboard.scenes) for (const assetId of scene.assetIds) referencedScenes.set(assetId, [...(referencedScenes.get(assetId) ?? []), scene.id]);
  for (const asset of assets.assets) {
    const actual = [...(referencedScenes.get(asset.id) ?? [])].sort();
    const recorded = [...asset.assignedSceneIds].sort();
    if (stableStringify(actual) !== stableStringify(recorded)) throw new Error(`asset assignment is stale: ${asset.id}`);
  }
  const storyboardSceneIds = new Set(storyboard.scenes.map((scene) => scene.id));
  for (const selection of weaponPlan.selected) if (!storyboardSceneIds.has(selection.sceneId)) throw new Error(`weapon plan targets missing scene: ${selection.sceneId}`);
  for (const scene of storyboard.scenes) {
    for (const assetId of scene.assetIds) {
      const asset = assetById.get(assetId);
      if (!asset || asset.status !== 'available' || !asset.confirmed) throw new Error(`assigned asset missing: ${assetId}`);
      let content: Buffer;
      try { content = await readFile(resolve(projectDir, ...asset.sourcePath.split('/'))); }
      catch { throw new Error(`assigned asset missing: ${assetId}`); }
      if (sha256(content) !== asset.sha256.toLowerCase()) throw new Error(`assigned asset hash mismatch: ${assetId}`);
    }
  }

  const weaponRoot = resolve(input.weaponRoot ?? DEFAULT_WEAPON_ROOT);
  const weaponSources = new Map<string, string>();
  for (const selection of weaponPlan.selected) {
    let content: Buffer;
    try { content = await readFile(resolve(weaponRoot, ...selection.entry.split('/'))); }
    catch { throw new Error(`planned weapon unavailable: ${selection.weaponId}`); }
    if (sha256(content) !== selection.entryHash) throw new Error(`planned weapon hash mismatch: ${selection.weaponId}`);
    const source = content.toString('utf8');
    const gsapIssues = auditGsapSource(source);
    if (gsapIssues.length) throw new Error(`planned weapon violates official GSAP production rules: ${selection.weaponId}:${gsapIssues.join(',')}`);
    weaponSources.set(selection.entry, source);
  }
  const gsapRegistry = await loadGsapCapabilities();
  const gsapRoute = routeGsapCapabilities(gsapRegistry, { target: 'offline-video', needsPlugins: [...weaponSources.values()].some((source) => /\b(?:SplitText|MorphSVG|Flip|Draggable)\b/.test(source)) });

  const style = loadStyleCatalog().styles.find((item) => item.id === direction.primaryStyle);
  if (!style) throw new Error(`selected style unavailable: ${direction.primaryStyle}`);
  const sceneText = storyboard.scenes.flatMap((scene) => [scene.title, scene.narrativeBeat, scene.visualFocus]).join(' ');
  const css = previewCss(style.palette, style.fontFamily, spec.aspectRatio);
  const html = previewHtml({ spec, assets, direction, storyboard, weaponPlan, weaponSources, feedback: input.feedback, styleName: style.chineseName });
  const weaponErrors = verifyWeaponCalls(weaponPlan, html);
  if (weaponErrors.length) throw new Error(`planned weapon verification failed: ${weaponErrors.join(', ')}`);
  const inspection = inspectPreviewHtml(html, css);
  if (inspection.codes.length) throw new Error(`preview HTML violates HyperFrames contract: ${inspection.codes.join(', ')}`);

  await Promise.all([
    mkdir(join(projectDir, 'public', 'vendor'), { recursive: true }),
    mkdir(join(projectDir, 'public', 'fonts', 'noto-sans-sc'), { recursive: true }),
    mkdir(join(projectDir, '.framepack'), { recursive: true }),
  ]);
  await Promise.all([
    cp(existsSync(BUNDLED_GSAP) ? BUNDLED_GSAP : require.resolve('gsap/dist/gsap.min.js'), join(projectDir, 'public', 'vendor', 'gsap.min.js')),
    vendorNotoSansSc(join(projectDir, 'public', 'fonts', 'noto-sans-sc'), `${spec.title} ${sceneText} ${style.chineseName} ${input.feedback.join(' ')}`),
    ...weaponPlan.selected.map(async (selection) => {
      const target = join(projectDir, ...selection.entry.split('/'));
      await mkdir(dirname(target), { recursive: true });
      await cp(resolve(weaponRoot, ...selection.entry.split('/')), target);
    }),
  ]);
  const { createdAt: _createdAt, ...semanticStoryboard } = storyboard;
  const buildId = sha256(stableStringify({
    spec, assets: assets.assets.map(({ id, sha256: hash, sourcePath }) => ({ id, hash, sourcePath })), direction,
    storyboard: semanticStoryboard, skills: skillReceipt.loaded.map(({ id, sha256: hash }) => ({ id, hash })), gsapSkills: gsapCapabilityFingerprintInput(gsapRegistry, gsapRoute), weaponPlan, feedback: input.feedback, html, css,
  }));
  await Promise.all([
    writeFile(join(projectDir, 'index.html'), html, 'utf8'),
    writeFile(join(projectDir, 'public', 'preview.css'), css, 'utf8'),
    writeFile(join(projectDir, '.framepack', 'html-build-report.md'), `# HTML Build Report\n\n- build_id: ${buildId}\n- content_source: validated_storyboard\n- style: ${style.chineseName}\n- scenes: ${storyboard.scenes.length}\n- weapons: ${weaponPlan.selected.map((item) => item.weaponId).join(', ') || 'HANDWRITE'}\n- structural_contract: pass\n`, 'utf8'),
  ]);
  await persistWeaponEvidence(projectDir, weaponPlan, html);
  await persistGsapCapabilityReceipt(projectDir, gsapRoute);
  return { buildId, html, inspection };
}

function previewHtml(input: { spec: ProjectSpec; assets: AssetLedger; direction: DirectionSelection; storyboard: Storyboard; weaponPlan: WeaponLoadPlan; weaponSources: Map<string, string>; feedback: string[]; styleName: string }): string {
  const assetById = new Map(input.assets.assets.map((asset) => [asset.id, asset]));
  const selectedByScene = new Map(input.weaponPlan.selected.map((selection) => [selection.sceneId, selection]));
  const scenes = input.storyboard.scenes.map((scene, index) => {
    const selection = selectedByScene.get(scene.id);
    const media = scene.assetIds.map((id) => assetById.get(id)).filter((asset) => asset?.kind === 'image')
      .map((asset) => `<img class="product-asset" src="${escapeAttribute(asset!.sourcePath)}" alt="${escapeAttribute(scene.visualFocus)}">`).join('');
    return `<div id="${escapeAttribute(scene.id)}" class="clip" data-start="${number(scene.startSeconds)}" data-duration="${number(scene.durationSeconds)}" data-track-index="0"><div class="scene-inner scene-${index + 1}"><div class="signal signal-a"></div><div class="signal signal-b"></div><p class="purpose">${purposeLabel(scene.purpose)} · ${escapeHtml(input.styleName)}</p><div class="scene-copy" data-framepack-weapon-target="${escapeAttribute(scene.id)}">${weaponMarkup(selection?.weaponId, scene.title)}</div><p class="narrative">${escapeHtml(scene.narrativeBeat)}</p>${media}<p class="direction-note">${escapeHtml(input.feedback.length ? `导演反馈 · ${input.feedback.join(' · ')}` : input.direction.rationale)}</p></div></div>`;
  }).join('');
  const modules = [...new Map(input.weaponPlan.selected.map((selection) => [selection.entry, selection])).values()];
  if (new Set(modules.map((selection) => selection.functionName)).size !== modules.length) throw new Error('planned weapon function names must be unique');
  const moduleReceipts = modules.map((selection) => `/*framepack-weapon-module:${JSON.stringify({ entry: selection.entry, sha256: selection.entryHash })}*/`).join('\n');
  const embeddedWeapons = modules.map((selection) => {
    const source = input.weaponSources.get(selection.entry);
    if (!source) throw new Error(`planned weapon source unavailable: ${selection.weaponId}`);
    return embedWeaponSource(source, selection.functionName, selection.weaponId);
  }).join('\n');
  const animations = input.storyboard.scenes.map((scene) => {
    const selection = selectedByScene.get(scene.id);
    if (selection) return renderWeaponInvocation(selection, input.weaponPlan.inputHash, number(scene.startSeconds + 0.18));
    return `tl.fromTo('#${cssEscape(scene.id)} .scene-copy',{autoAlpha:0,y:54},{autoAlpha:1,y:0,duration:.75,ease:'power3.out'},${number(scene.startSeconds + 0.18)});tl.fromTo('#${cssEscape(scene.id)} .narrative',{autoAlpha:0,y:24},{autoAlpha:1,y:0,duration:.55,ease:'power2.out'},${number(scene.startSeconds + 0.42)});`;
  }).join('');
  const assignedIds = new Set(input.storyboard.scenes.flatMap((scene) => scene.assetIds));
  const rootMedia = input.assets.assets.filter((asset) => assignedIds.has(asset.id) && asset.confirmed && asset.status === 'available' && (asset.kind === 'video' || asset.kind === 'audio')).map((asset) => asset.kind === 'video'
    ? `<video class="media-proof" src="${escapeAttribute(asset.sourcePath)}" data-start="0" data-duration="${number(input.spec.durationSeconds)}" style="z-index:0"></video>`
    : `<audio src="${escapeAttribute(asset.sourcePath)}" data-start="0" data-duration="${number(input.spec.durationSeconds)}"></audio>`).join('');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=${input.spec.width},height=${input.spec.height}"><title>${escapeHtml(input.spec.title)}</title><link rel="stylesheet" href="public/fonts/noto-sans-sc/wght.css"><link rel="stylesheet" href="public/preview.css"></head><body><div id="root" data-composition-id="main" data-start="0" data-duration="${number(input.spec.durationSeconds)}" data-width="${input.spec.width}" data-height="${input.spec.height}">${scenes}</div>${rootMedia}<script src="public/vendor/gsap.min.js"></script><script>${moduleReceipts}${embeddedWeapons}const gsap=window.gsap;window.__timelines=window.__timelines||{};window.__framepackTimeline=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});const tl=window.__framepackTimeline;${animations}window.__timelines['main']=tl;</script></body></html>`;
}

function previewCss(palette: { background: string; surface: string; primary: string; accent: string }, fontFamily: string, aspect: ProjectSpec['aspectRatio']): string {
  const portrait = aspect === '9:16';
  const labelColor = contrastRatio(palette.accent, palette.background) >= 4.5 ? palette.accent : palette.primary;
  return `*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:${palette.background};color:${palette.primary};font-family:"${fontFamily}",sans-serif}#root{position:relative;width:100vw;height:100vh;overflow:hidden}.clip{position:absolute;inset:0;overflow:hidden}.scene-inner{position:absolute;inset:0;overflow:hidden;padding:${portrait ? '10% 8%' : '7% 8%'};display:flex;flex-direction:column;justify-content:center;background:linear-gradient(135deg,${palette.background},${palette.surface})}.scene-inner>*{position:relative;z-index:2}.purpose{font-size:${portrait ? 26 : 22}px;letter-spacing:.16em;color:${labelColor}}.scene-copy{font-size:${portrait ? 88 : 118}px;line-height:.96;letter-spacing:-.055em;font-weight:900;max-width:${portrait ? '9ch' : '12ch'};will-change:transform,opacity;position:relative}.narrative{font-size:${portrait ? 34 : 30}px;line-height:1.45;max-width:26ch}.direction-note{position:absolute;left:8%;bottom:7%;font-size:${portrait ? 24 : 18}px;color:${labelColor}}.product-asset{position:absolute;z-index:1;right:${portrait ? '7%' : '6%'};bottom:${portrait ? '15%' : '10%'};width:${portrait ? '62%' : '42%'};height:${portrait ? '36%' : '64%'};object-fit:contain}.signal{position:absolute;z-index:0;border-radius:50%;background:${palette.accent};filter:blur(80px);will-change:transform,opacity}.signal-a{width:42%;aspect-ratio:1;right:3%;top:4%;opacity:.18}.signal-b{width:28%;aspect-ratio:1;left:4%;bottom:3%;opacity:.1}.split-left,.split-right,.word{display:inline-block}.split-right{position:absolute;inset:0}.metric{color:${palette.accent}}`;
}

function weaponMarkup(weaponId: string | undefined, title: string): string {
  const text = escapeHtml(title);
  if (weaponId === 'text-split-enter') return `<span class="split-left" data-layout-allow-overlap>${text}</span><span class="split-right" data-layout-allow-overlap>${text}</span>`;
  if (weaponId === 'caption-clip-wipe') return title.split(/\s+/).map((word) => `<span class="word">${escapeHtml(word)}</span>`).join(' ');
  if (weaponId === 'number-count-up') return '<span class="metric">0</span>';
  return text;
}

function storyboardInputHash(storyboard: Storyboard): string {
  const { createdAt: _createdAt, ...semantic } = storyboard;
  return sha256(stableStringify(semantic));
}
function sha256(value: string | Buffer): string { return createHash('sha256').update(value).digest('hex'); }
function number(value: number): string { return Number(value.toFixed(3)).toString(); }
function purposeLabel(value: string): string { return ({ hook: '开场', proof: '证据', experience: '体验', cta: '行动' } as Record<string, string>)[value] ?? value; }
function escapeHtml(value: string): string { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
function escapeAttribute(value: string): string { return escapeHtml(value).replaceAll('"', '&quot;'); }
function cssEscape(value: string): string { return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&'); }
function contrastRatio(left: string, right: string): number {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
      .map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const [a, b] = [luminance(left), luminance(right)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}
function embedWeaponSource(source: string, functionName: string, weaponId: string): string {
  if (/<\/script/i.test(source)) throw new Error(`planned weapon contains unsafe script boundary: ${weaponId}`);
  if (/\bimport\s*(?:\(|[\w*{])/m.test(source)) throw new Error(`planned weapon imports are not supported for embedding: ${weaponId}`);
  const exports = [...source.matchAll(/\bexport\s+(?:default\s+)?(?:async\s+)?(function|const|let|var|class)\s+([\w$]+)/g)];
  if (exports.length !== 1 || exports[0][1] !== 'function' || exports[0][2] !== functionName || /\bexport\s*\{/.test(source)) {
    throw new Error(`planned weapon must expose exactly one named function: ${weaponId}`);
  }
  const embedded = source.replace(/\bexport\s+(?=function\s)/, '');
  if (/\b(?:import|export)\b/.test(embedded)) throw new Error(`planned weapon contains unsupported module syntax: ${weaponId}`);
  return embedded;
}
