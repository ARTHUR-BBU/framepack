import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { runWeaponBenchEvidence } from '../packages/director-engine/src/weapon-bench.js';

const repoRoot = resolve(import.meta.dirname, '..');
const evidenceRoot = resolve(repoRoot, 'docs/evidence/weapons');

const allWeaponIds = ['text-split-enter', 'caption-clip-wipe', 'number-count-up', 'elastic-scale-enter', 'gradient-shift', 'stagger-grid-reveal'] as const;
const requested = process.argv.slice(2);
const weaponIds = requested.length ? allWeaponIds.filter((id) => requested.includes(id)) : allWeaponIds;
for (const weaponId of weaponIds) {
  process.stdout.write(`\n[weapon-bench] ${weaponId}\n`);
  const evidence = await runWeaponBenchEvidence({ repoRoot, evidenceRoot, weaponId });
  await writeFile(resolve(repoRoot, 'packages/director-assets/weapons', weaponId, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  process.stdout.write(`[weapon-bench] ${weaponId}: ${evidence.ratios.length} ratios recorded\n`);
}
