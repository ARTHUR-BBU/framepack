import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  chooseDirection,
  loadStyleCatalog,
} from '../packages/director-engine/src/index.js';
import { DirectionSelectionSchema, VisualStyleSchema } from '../packages/director-contracts/src/index.js';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

describe('director style and taste catalog', () => {
  test('contains eight portable styles with complete design tokens and provenance', () => {
    const catalog = loadStyleCatalog();
    expect(catalog.styles).toHaveLength(8);
    expect(new Set(catalog.styles.map((style) => style.id)).size).toBe(8);
    for (const style of catalog.styles) {
      expect(style.chineseName).not.toBe('');
      expect(style.palette).toMatchObject({ background: expect.stringMatching(/^#[a-f0-9]{6}$/i) });
      expect(style.fontFamily).not.toMatch(/https?:\/\//);
      expect(existsSync(join(repoRoot, style.fontAsset))).toBe(true);
      expect(existsSync(join(repoRoot, style.fontLicenseAsset))).toBe(true);
      expect(readFileSync(join(repoRoot, style.fontAsset), 'utf8')).toContain(`font-family: '${style.fontFamily}'`);
      expect(style.atmosphere.length).toBeGreaterThan(0);
      expect(style.suitableIntents.length).toBeGreaterThan(0);
      expect(style.provenance).toMatchObject({ sourceCommit: expect.stringMatching(/^[a-f0-9]{40}$/) });
    }
  });

  test('lower technology feedback changes direction semantics', () => {
    const before = chooseDirection({ goal: 'SaaS 产品发布', feedback: [] });
    const after = chooseDirection({ goal: 'SaaS 产品发布', feedback: ['降低科技感，增加温度'] });

    expect(after.primaryStyle).not.toBe(before.primaryStyle);
    expect(after.primaryStyle).toBe('soft-signal');
    expect(after.supportingStyle).toBe('velvet-standard');
    expect(after.avoid).toContain('neon-interface-cliches');
    expect(after.tasteMoves).toContain('human-imperfection');
  });

  test('one primary, at most one support, one to three taste moves, and up to two surprises', () => {
    const direction = chooseDirection({ goal: '高端消费产品发布', feedback: ['更有仪式感'] });
    expect(DirectionSelectionSchema.parse(direction)).toEqual(direction);
    expect(direction.tasteMoves.length).toBeGreaterThanOrEqual(1);
    expect(direction.tasteMoves.length).toBeLessThanOrEqual(3);
    expect(direction.surpriseOperators.length).toBeLessThanOrEqual(2);

    expect(() => DirectionSelectionSchema.parse({ ...direction, tasteMoves: [] })).toThrow();
    expect(() => DirectionSelectionSchema.parse({ ...direction, supportingStyle: null })).toThrow();
    expect(() => DirectionSelectionSchema.parse({
      ...direction,
      surpriseOperators: ['silence-cut', 'motif-reversal', 'spatial-reframe'],
    })).toThrow();
  });

  test('the style contract rejects remote font declarations', () => {
    const catalog = loadStyleCatalog();
    const remote = {
      ...catalog.styles[0],
      fontFamily: 'https://fonts.example/style.css',
    };
    expect(() => VisualStyleSchema.parse(remote)).toThrow();
  });
});
