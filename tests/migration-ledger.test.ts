import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, test } from 'vitest';
import { validateMigrationLedger } from '../scripts/validate-migration-ledger.js';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const temporaryPaths: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

test('every migrated playbook asset has provenance in the inheritance ledger', async () => {
  const result = await validateMigrationLedger({ repoRoot });
  expect(result.entries).toBe(8);
  expect(result.errors).toEqual([]);
});

test('a missing inheritance row is rejected', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'framepack-ledger-'));
  temporaryPaths.push(directory);
  const source = await readFile(join(repoRoot, 'docs', 'migration', 'legacy-inheritance.md'), 'utf8');
  const incompleteLedger = join(directory, 'legacy-inheritance.md');
  await writeFile(incompleteLedger, source.replace('packages/director-assets/skills/framepack-arsenal/SKILL.md', 'missing-current-path'), 'utf8');

  const result = await validateMigrationLedger({ repoRoot, ledgerPath: incompleteLedger });
  expect(result.errors).toContainEqual(expect.stringContaining('framepack-arsenal/SKILL.md'));
});
