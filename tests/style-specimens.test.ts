import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { loadStyleCatalog } from '../packages/director-engine/src/style-catalog.js';

test('each Chinese style has a local, seek-safe visible specimen', () => {
  for (const style of loadStyleCatalog().styles) {
    const root = `packages/director-assets/specimens/styles/${style.id}`;
    const html = `${root}/index.html`;
    expect(existsSync(html)).toBe(true);
    const source = readFileSync(html, 'utf8');
    expect(source).toContain(style.chineseName);
    expect(source).toContain('window.__timelines');
    expect(source).toContain('Noto Sans SC Variable');
    expect(source).toContain('./fonts/wght.css');
    expect(source).not.toContain("noto-sans-sc-4-wght-normal.woff2') format");
    expect(source).not.toMatch(/https?:\/\//);
    expect(existsSync(`${root}/fonts/wght.css`)).toBe(true);
    expect(existsSync(`${root}/vendor/gsap.min.js`)).toBe(true);
    expect(existsSync(`${root}/snapshots/contact-sheet.jpg`)).toBe(true);
    expect(existsSync(`${root}/snapshots/frame-00-at-0.3s.png`)).toBe(true);
    expect(existsSync(`${root}/snapshots/frame-01-at-1.5s.png`)).toBe(true);
    expect(existsSync(`${root}/snapshots/frame-02-at-3.5s.png`)).toBe(true);
  }
});
