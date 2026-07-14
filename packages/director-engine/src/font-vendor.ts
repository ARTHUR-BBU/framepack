import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runtimeAssetRoot } from './runtime-assets.js';

const SOURCE_ROOT = resolve(runtimeAssetRoot, 'fonts', 'noto-sans-sc');

export async function vendorNotoSansSc(targetRoot: string, text: string): Promise<string[]> {
  const css = await readFile(join(SOURCE_ROOT, 'wght.css'), 'utf8');
  // Font subsetting depends on which characters occur, not how often they occur.
  // Deduplication keeps large briefs linear instead of rescanning every Unicode block
  // for tens of thousands of repeated Chinese characters.
  const codePoints = [...new Set([...`${text} 🌀`].map((char) => char.codePointAt(0)!))];
  const blocks = [...css.matchAll(/@font-face\s*\{[\s\S]*?\}/g)].map((match) => match[0]);
  const selected = blocks.filter((block) => {
    const ranges = block.match(/unicode-range:\s*([^;]+)/)?.[1] ?? '';
    return codePoints.some((point) => containsCodePoint(ranges, point));
  });
  const files = [...new Set(selected.flatMap((block) => [...block.matchAll(/url\(\.\/files\/([^)]+)\)/g)].map((match) => match[1])))].sort();
  const targetFiles = join(targetRoot, 'files');
  await mkdir(targetFiles, { recursive: true });
  await Promise.all([
    writeFile(join(targetRoot, 'wght.css'), `${selected.join('\n\n')}\n`, 'utf8'),
    ...files.map((file) => cp(join(SOURCE_ROOT, 'files', file), join(targetFiles, file))),
  ]);
  return files;
}

function containsCodePoint(value: string, point: number): boolean {
  return value.split(',').some((token) => {
    const normalized = token.trim().replace(/^U\+/i, '');
    if (!normalized) return false;
    if (normalized.includes('?')) {
      return point >= Number.parseInt(normalized.replaceAll('?', '0'), 16)
        && point <= Number.parseInt(normalized.replaceAll('?', 'f'), 16);
    }
    const [startText, endText = startText] = normalized.split('-');
    return point >= Number.parseInt(startText, 16) && point <= Number.parseInt(endText, 16);
  });
}
