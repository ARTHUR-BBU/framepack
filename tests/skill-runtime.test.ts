import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vitest';
import {
  applySkillPlan,
  loadSkills,
} from '../packages/director-engine/src/index.js';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const bundledSkillRoot = join(repoRoot, 'packages', 'director-assets', 'skills');
const temporaryPaths: string[] = [];

async function temporary(prefix: string): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), prefix));
  temporaryPaths.push(path);
  return path;
}

afterEach(async () => {
  await Promise.all(temporaryPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe('Codex skill runtime', () => {
  test('product launch loads the director, workflow, and arsenal playbooks', async () => {
    const projectDir = await temporary('framepack-skill-project-');
    const receipt = await loadSkills({
      projectDir,
      skillRoot: bundledSkillRoot,
      intent: 'product-launch-video',
      assets: ['product.png'],
    });

    expect(receipt.loaded.map((item) => item.id)).toEqual([
      'framepack-director',
      'product-launch-video',
      'framepack-arsenal',
    ]);
    expect(receipt.loaded.every((item) => /^[a-f0-9]{64}$/.test(item.sha256))).toBe(true);
    expect(receipt.loaded.every((item) => item.portablePath.startsWith('skills/'))).toBe(true);
    expect(receipt.loaded.every((item) => item.resolvedSource.startsWith(bundledSkillRoot))).toBe(true);
  });

  test('the load plan exists even when a required playbook cannot be read', async () => {
    const projectDir = await temporary('framepack-skill-plan-');
    const emptySkillRoot = await temporary('framepack-empty-skills-');
    await expect(loadSkills({
      projectDir,
      skillRoot: emptySkillRoot,
      intent: 'product-launch-video',
      assets: [],
    })).rejects.toThrow('framepack-director');

    const plan = JSON.parse(await readFile(join(projectDir, '.framepack', 'skill-load-plan.json'), 'utf8')) as { requested: unknown[] };
    expect(plan.requested).toHaveLength(3);
  });

  test('applying a workflow skill leaves observable output evidence', async () => {
    const projectDir = await temporary('framepack-skill-apply-');
    const result = await applySkillPlan({
      projectDir,
      skillRoot: bundledSkillRoot,
      intent: 'product-launch-video',
      assets: ['asset-product'],
      brief: { goal: '突出产品，降低科技感', audience: '第一次接触产品的人' },
    });

    expect(result.applicationReceipt.applied).toContainEqual(expect.objectContaining({
      skillId: 'product-launch-video',
      outputPaths: ['direction.rhythm', 'storyboard.scenes'],
    }));
    expect(result.storyboard.scenes[0].purpose).toBe('hook');
    expect(result.storyboard.scenes.at(-1)?.purpose).toBe('cta');
    expect(result.direction.rhythm).toBe(result.storyboard.scenes.map((scene) => scene.purpose).join('-'));
    expect(result.direction.assetPolicy).toBe('confirm-before-use');
  });

  test('reference mining changes direction and storyboard with an application receipt', async () => {
    const projectDir = await temporary('framepack-reference-apply-');
    const result = await applySkillPlan({
      projectDir,
      skillRoot: bundledSkillRoot,
      intent: 'reference-video',
      assets: ['reference-film'],
      brief: { goal: '提取参考片的可复用节奏', audience: '品牌团队' },
    });

    expect(result.direction).toMatchObject({
      rhythm: 'observe-extract-adapt',
      referencePolicy: 'extract-grammar-not-expression',
    });
    expect(result.storyboard.scenes.map((scene) => scene.purpose)).toEqual(['observe', 'extract', 'adapt']);
    expect(result.storyboard.scenes.every((scene) => scene.assetIds.includes('reference-film'))).toBe(true);
    expect(result.applicationReceipt.applied).toContainEqual(expect.objectContaining({
      skillId: 'framepack-reference-miner',
      outputPaths: [
        'direction.rhythm',
        'direction.referencePolicy',
        'direction.confidenceLabels',
        'direction.requiredReferenceLayers',
        'storyboard.scenes',
      ],
    }));
  });

  test('changing the loaded workflow changes real outputs and their hashes', async () => {
    const firstProject = await temporary('framepack-skill-first-');
    const secondProject = await temporary('framepack-skill-second-');
    const mutableSkillRoot = await temporary('framepack-skill-copy-');
    await cp(bundledSkillRoot, mutableSkillRoot, { recursive: true });

    const before = await applySkillPlan({
      projectDir: firstProject,
      skillRoot: bundledSkillRoot,
      intent: 'product-launch-video',
      assets: ['asset-product'],
      brief: { goal: '发布一款新产品', audience: '新用户' },
    });
    const workflowPath = join(mutableSkillRoot, 'product-launch-video', 'SKILL.md');
    const workflow = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, workflow.replace('hook-proof-experience-cta', 'hook-breathe-demo-proof-cta'), 'utf8');
    const after = await applySkillPlan({
      projectDir: secondProject,
      skillRoot: mutableSkillRoot,
      intent: 'product-launch-video',
      assets: ['asset-product'],
      brief: { goal: '发布一款新产品', audience: '新用户' },
    });

    expect(after.direction.rhythm).not.toBe(before.direction.rhythm);
    const beforeApplication = before.applicationReceipt.applied.find((item) => item.skillId === 'product-launch-video');
    const afterApplication = after.applicationReceipt.applied.find((item) => item.skillId === 'product-launch-video');
    expect(afterApplication?.valueHashes).not.toEqual(beforeApplication?.valueHashes);
  });

  for (const [intent, workflow, rhythm] of [
    ['faceless-explainer', 'faceless-explainer', 'question-context-proof-synthesis'],
    ['website-to-video', 'website-to-video', 'capture-orient-tour-cta'],
  ] as const) {
    test(`${intent} loads and applies its own observable workflow`, async () => {
      const projectDir = await temporary(`framepack-${intent}-`);
      const result = await applySkillPlan({
        projectDir, skillRoot: bundledSkillRoot, intent, assets: ['asset-1'],
        brief: { goal: intent === 'website-to-video' ? '展示 https://example.com 的真实页面' : '解释一个复杂概念', audience: '新手' },
      });
      expect(result.loadReceipt.loaded.map((item) => item.id)).toContain(workflow);
      expect(result.direction.rhythm).toBe(rhythm);
      expect(result.applicationReceipt.applied).toContainEqual(expect.objectContaining({ skillId: workflow }));
    });
  }
});
