import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
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

async function main(): Promise<void> {
  const offenders = scanLegacyReferences(['apps', 'packages', 'plugins']);
  if (offenders.length) {
    process.stderr.write(`Archived Hermes runtime references found:\n${offenders.join('\n')}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
