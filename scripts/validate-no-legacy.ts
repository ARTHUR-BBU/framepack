import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const readableExtensions = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
]);
const forbiddenPatterns = [
  /\bframepack-plugin\b/i,
  /\bframepack-e2e-test\b/i,
  /Hermes_windows/i,
  /ctx\.inject_message/,
];

function filesBelow(root: string): string[] {
  if (!existsSync(root)) return [];
  if (!statSync(root).isDirectory()) return [root];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) return filesBelow(path);
    return entry.isFile() ? [path] : [];
  });
}

export function scanLegacyReferences(roots: string[]): string[] {
  return roots
    .flatMap((root) => filesBelow(resolve(root)))
    .filter((file) => readableExtensions.has(extname(file)))
    .filter((file) => forbiddenPatterns.some((pattern) => pattern.test(readFileSync(file, 'utf8'))))
    .sort();
}

export function scanAllTrackedFiles(repoRoot = resolve('.')): string[] {
  const allow = new Set([
    'docs/migration/legacy-inheritance.md',
    'docs/superpowers/specs/2026-07-13-framepack-chinese-director-workbench-redesign.md',
    'docs/superpowers/plans/2026-07-13-framepack-codex-director-v1.md',
    'scripts/validate-no-legacy.ts',
    'tests/legacy-retirement.test.ts',
    'CHANGELOG.md',
    'TEST_TEAM_AUTOTEST_v0.11.0.md',
    'docs/departments/taste-intelligence.md',
    'docs/migration/migrated-assets.json',
    'tests/legacy-boundary.test.ts',
    'tests/plugin.test.ts',
    'docs/codex-deployment.zh-CN.md',
  ]);
  const files = execFileSync('git', ['ls-files'], { cwd:repoRoot, encoding:'utf8' }).trim().split(/\r?\n/).filter(Boolean);
  return files.filter((file) => {
    const absolute = resolve(repoRoot, file);
    const isConfigFile = file === '.gitignore' || file.endsWith('.env.example');
    return !allow.has(file) && existsSync(absolute) && (isConfigFile || readableExtensions.has(extname(file))) && forbiddenPatterns.some((pattern) => pattern.test(readFileSync(absolute, 'utf8')));
  });
}

async function main(): Promise<void> {
  const offenders = [...scanLegacyReferences(['apps', 'packages', 'plugins']), ...scanAllTrackedFiles()];
  if (offenders.length) {
    process.stderr.write(`Archived Hermes runtime references found:\n${offenders.join('\n')}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
