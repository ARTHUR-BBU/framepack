import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

type MigrationEntry = {
  currentPath: string;
  legacySource: string;
  sourceCommit: string;
  license: string;
};

type MigrationManifest = { version: '1.0'; entries: MigrationEntry[] };

export async function validateMigrationLedger(options: {
  repoRoot: string;
  manifestPath?: string;
  ledgerPath?: string;
}): Promise<{ entries: number; errors: string[] }> {
  const repoRoot = resolve(options.repoRoot);
  const manifestPath = options.manifestPath ?? joinFromRoot(repoRoot, 'docs/migration/migrated-assets.json');
  const ledgerPath = options.ledgerPath ?? joinFromRoot(repoRoot, 'docs/migration/legacy-inheritance.md');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as MigrationManifest;
  const ledger = await readFile(ledgerPath, 'utf8');
  const errors: string[] = [];
  if (manifest.version !== '1.0') errors.push('migration manifest version must be 1.0');

  for (const entry of manifest.entries) {
    const current = resolve(repoRoot, entry.currentPath);
    const inside = relative(repoRoot, current);
    if (!entry.currentPath || inside.startsWith('..') || isAbsolute(inside)) errors.push(`invalid currentPath: ${entry.currentPath}`);
    else if (!existsSync(current)) errors.push(`missing migrated asset: ${entry.currentPath}`);
    if (!entry.legacySource) errors.push(`missing legacySource: ${entry.currentPath}`);
    if (!/^[a-f0-9]{40}$/.test(entry.sourceCommit)) errors.push(`invalid sourceCommit: ${entry.currentPath}`);
    if (!entry.license) errors.push(`missing license: ${entry.currentPath}`);
    for (const value of [entry.currentPath, entry.legacySource, entry.sourceCommit, entry.license]) {
      if (!ledger.includes(value)) errors.push(`inheritance ledger missing ${entry.currentPath}: ${value}`);
    }
  }
  return { entries: manifest.entries.length, errors };
}

function joinFromRoot(root: string, portablePath: string): string {
  return resolve(root, ...portablePath.split('/'));
}

async function main(): Promise<void> {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const result = await validateMigrationLedger({ repoRoot });
  if (result.errors.length) {
    process.stderr.write(`${result.errors.join('\n')}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`Migration ledger valid: ${result.entries} entries\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
