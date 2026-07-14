import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import type { ZodType } from 'zod';
import {
  CaptionClipWipeParametersSchema,
  NumberCountUpParametersSchema,
  TextSplitEnterParametersSchema,
  WeaponCallSchema,
  WeaponLoadPlanSchema,
  WeaponManifestSchema,
  WeaponBenchEvidenceSchema,
  WeaponScorecardSchema,
  type Storyboard,
  type WeaponCall,
  type WeaponLoadPlan,
  type WeaponManifest,
  type WeaponBenchEvidence,
  type WeaponScorecard,
} from '@framepack/director-contracts';
import { stableStringify } from './content-hash.js';
import { promoteWeapon, verifyWeaponProofFiles } from './weapon-bench.js';
import { runtimeAssetRoot } from './runtime-assets.js';

const DEFAULT_WEAPON_ROOT = resolve(runtimeAssetRoot, 'weapons');
const WEAPON_IDS = ['text-split-enter', 'caption-clip-wipe', 'number-count-up'] as const;

export type RuntimeWeapon = WeaponManifest & { parameters: ZodType; entryHash: string; evidence?: WeaponBenchEvidence; scorecard?: WeaponScorecard };
export type WeaponRegistry = { version: '1.0'; weapons: RuntimeWeapon[] };

const PARAMETER_SCHEMAS: Record<(typeof WEAPON_IDS)[number], ZodType> = {
  'text-split-enter': TextSplitEnterParametersSchema,
  'caption-clip-wipe': CaptionClipWipeParametersSchema,
  'number-count-up': NumberCountUpParametersSchema,
};

export async function loadWeaponRegistry(root = DEFAULT_WEAPON_ROOT, proofRoot = resolve(root, '../../..')): Promise<WeaponRegistry> {
  const weapons = await Promise.all(WEAPON_IDS.map(async (id): Promise<RuntimeWeapon> => {
    const raw = JSON.parse(await readFile(join(root, id, 'manifest.json'), 'utf8'));
    const manifest = WeaponManifestSchema.parse(raw);
    if (manifest.id !== id) throw new Error(`weapon directory and manifest id mismatch: ${id}`);
    const entryContent = await readFile(join(root, ...manifest.entry.split('/')), 'utf8');
    if (manifest.maturity !== 'proven') return { ...manifest, parameters: PARAMETER_SCHEMAS[id], entryHash: sha256(entryContent) };
    const evidence = WeaponBenchEvidenceSchema.parse(JSON.parse(await readFile(join(root, id, ...manifest.proof!.evidence.split('/')), 'utf8')));
    const scorecard = WeaponScorecardSchema.parse(JSON.parse(await readFile(join(root, id, ...manifest.proof!.scorecard.split('/')), 'utf8')));
    if (evidence.weaponId !== manifest.id || scorecard.weaponId !== manifest.id) throw new Error(`weapon proof id mismatch: ${id}`);
    await verifyWeaponProofFiles(proofRoot, evidence);
    promoteWeapon(evidence, scorecard);
    if (evidence.entryHash !== sha256(entryContent)) throw new Error(`proven weapon entry hash mismatch: ${id}`);
    return { ...manifest, parameters: PARAMETER_SCHEMAS[id], entryHash: evidence.entryHash, evidence, scorecard };
  }));
  return { version: '1.0', weapons };
}

export async function resolveWeapons(storyboard: Storyboard, registry: WeaponRegistry): Promise<WeaponLoadPlan> {
  const candidates: WeaponLoadPlan['candidates'] = [];
  const selected: WeaponLoadPlan['selected'] = [];
  const { createdAt: _createdAt, ...semanticStoryboard } = storyboard;
  const inputHash = sha256(stableStringify(semanticStoryboard));
  for (const scene of storyboard.scenes) {
    const text = [scene.title, scene.narrativeBeat, scene.visualFocus, ...scene.layers.midground].join(' ');
    for (const weapon of registry.weapons) {
      if (!matches(weapon, scene.purpose, text)) continue;
      const candidate = { sceneId: scene.id, weaponId: weapon.id, reason: matchReason(weapon.id), maturity: weapon.maturity };
      candidates.push(candidate);
      if (weapon.maturity === 'proven') {
        selected.push(selectionFor(weapon, scene.id, text));
      }
    }
  }
  const unresolvedSceneIds = [...new Set(candidates.filter((item) => !selected.some((selection) => selection.sceneId === item.sceneId)).map((item) => item.sceneId))];
  return WeaponLoadPlanSchema.parse({
    version: '1.0', storyboardId: storyboard.id, inputHash, selected, candidates,
    fallbacks: unresolvedSceneIds.map((sceneId) => {
      const sceneCandidates = candidates.filter((item) => item.sceneId === sceneId);
      return {
      sceneId,
      checkedSources: [...new Set(sceneCandidates.map((item) => item.weaponId))],
      rejectedCandidates: sceneCandidates.filter((item) => item.maturity !== 'proven').map((item) => `${item.weaponId}:${item.maturity}_not_proven`),
      reason: '没有完成双画幅试拍和具名审查的武器；禁止自动注入，保留手写方案等待验证。',
    }; }),
  });
}

export function verifyWeaponCalls(planInput: WeaponLoadPlan, html: string): string[] {
  const plan = WeaponLoadPlanSchema.parse(planInput);
  const calls = extractWeaponCalls(html);
  return plan.selected.flatMap((selection) => {
    const call = calls.find((item) => item.sceneId === selection.sceneId && item.weaponId === selection.weaponId);
    if (!call) return [`weapon_not_invoked:${selection.weaponId}`];
    const errors: string[] = [];
    if (call.functionName !== selection.functionName) errors.push(`weapon_function_missing:${selection.weaponId}`);
    if (!html.includes(selection.entry)) errors.push(`weapon_entry_missing:${selection.weaponId}`);
    const expectedModuleReceipt = `framepack-weapon-module:${JSON.stringify({ entry: selection.entry, sha256: selection.entryHash })}`;
    const legacyEntryTag = `src="${selection.entry}" data-sha256="${selection.entryHash}"`;
    if (!html.includes(expectedModuleReceipt) && !html.includes(legacyEntryTag)) errors.push(`weapon_entry_hash_mismatch:${selection.weaponId}`);
    if (call.inputHash !== plan.inputHash) errors.push(`weapon_stale_input:${selection.weaponId}`);
    if (stableStringify(call.params) !== stableStringify(selection.params)) errors.push(`weapon_params_mismatch:${selection.weaponId}`);
    const expectedInvocation = renderWeaponInvocation(selection, plan.inputHash);
    const positionedPrefix = expectedInvocation.slice(0, -2);
    if (!html.includes(expectedInvocation) && !html.includes(`${positionedPrefix},`)) errors.push(`weapon_invocation_mismatch:${selection.weaponId}`);
    return errors;
  });
}

export function extractWeaponCalls(html: string): WeaponCall[] {
  const calls: WeaponCall[] = [];
  for (const match of html.matchAll(/\/\*framepack-weapon-call:(.*?)\*\//g)) {
    try { calls.push(WeaponCallSchema.parse(JSON.parse(match[1]))); } catch { /* invalid markers are ignored and fail verification */ }
  }
  return calls;
}

export function renderWeaponInvocation(selection: WeaponLoadPlan['selected'][number], inputHash: string, position?: string): string {
  const call = WeaponCallSchema.parse({
    sceneId: selection.sceneId,
    weaponId: selection.weaponId,
    functionName: selection.functionName,
    params: selection.params,
    inputHash,
  });
  const selector = `[data-framepack-weapon-target="${selection.sceneId}"]`;
  const paramExpression = `JSON.parse(${JSON.stringify(JSON.stringify(selection.params))})`;
  return `/*framepack-weapon-call:${JSON.stringify(call)}*/${selection.functionName}(window.__framepackTimeline,document.querySelector(${JSON.stringify(selector)}),${paramExpression}${position === undefined ? '' : `,${position}`});`;
}

export async function persistWeaponEvidence(projectDir: string, planInput: WeaponLoadPlan, html: string): Promise<void> {
  const plan = WeaponLoadPlanSchema.parse(planInput);
  const calls = extractWeaponCalls(html);
  const verificationErrors = verifyWeaponCalls(plan, html);
  const framepackDir = join(projectDir, '.framepack');
  await mkdir(framepackDir, { recursive: true });
  await Promise.all([
    writeFile(join(framepackDir, 'weapon-load-plan.json'), `${JSON.stringify(plan, null, 2)}\n`, 'utf8'),
    writeFile(join(framepackDir, 'weapon-call-receipt.json'), `${JSON.stringify({ version: '1.0', storyboardId: plan.storyboardId, inputHash: plan.inputHash, htmlHash: sha256(html), calls, verificationErrors }, null, 2)}\n`, 'utf8'),
  ]);
}

function matches(weapon: RuntimeWeapon, purpose: Storyboard['scenes'][number]['purpose'], text: string): boolean {
  if (!weapon.purposes.includes(purpose)) return false;
  if (weapon.id === 'number-count-up') return /\d+(?:\.\d+)?\s*(?:%|\+|小时|万|亿|x)/i.test(text) || /(?:数字|数据|指标|提升|节省)[^。；]{0,24}\d+/i.test(text);
  return weapon.signals.some((signal) => text.includes(signal));
}

function matchReason(id: WeaponManifest['id']): string {
  if (id === 'number-count-up') return '场景包含可视化的数字证据';
  if (id === 'caption-clip-wipe') return '场景需要逐词揭示说明或行动文案';
  return '开场核心承诺适合标题分裂入场';
}

function defaultParams(id: WeaponManifest['id'], text: string): Record<string, unknown> {
  if (id === 'number-count-up') return NumberCountUpParametersSchema.parse({ targetValue: Number(text.match(/\d+(?:\.\d+)?/)?.[0] ?? 0) });
  if (id === 'caption-clip-wipe') return CaptionClipWipeParametersSchema.parse({});
  return TextSplitEnterParametersSchema.parse({});
}

function selectionFor(weapon: RuntimeWeapon, sceneId: string, text: string): WeaponLoadPlan['selected'][number] {
  const evidence = { sceneId, entryHash: weapon.entryHash };
  if (weapon.id === 'number-count-up') return { ...evidence, weaponId: weapon.id, functionName: 'numberCountUp', entry: 'number-count-up/index.js', params: NumberCountUpParametersSchema.parse(defaultParams(weapon.id, text)) };
  if (weapon.id === 'caption-clip-wipe') return { ...evidence, weaponId: weapon.id, functionName: 'captionClipWipe', entry: 'caption-clip-wipe/index.js', params: CaptionClipWipeParametersSchema.parse(defaultParams(weapon.id, text)) };
  return { ...evidence, weaponId: weapon.id, functionName: 'textSplitEnter', entry: 'text-split-enter/index.js', params: TextSplitEnterParametersSchema.parse(defaultParams(weapon.id, text)) };
}

function sha256(value: string): string { return createHash('sha256').update(value).digest('hex'); }
