import { existsSync } from 'node:fs';
import { expect, test } from 'vitest';
import { scanAllTrackedFiles } from '../scripts/validate-no-legacy.js';

test('archived Hermes runtime is absent from the Codex branch', () => {
  expect(existsSync('framepack-plugin')).toBe(false);
  expect(existsSync('framepack-e2e-test')).toBe(false);
  expect(existsSync('.hermes')).toBe(false);
  expect(existsSync('.framepack')).toBe(false);
  expect(scanAllTrackedFiles()).toEqual([]);
});
