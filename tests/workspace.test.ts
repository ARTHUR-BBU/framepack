import { expect, test } from 'vitest';
import { PROJECT_FILES } from '@framepack/director-contracts';

test('exposes the handoff contract path', () => {
  expect(PROJECT_FILES.handoffManifest).toBe('.framepack/handoff-manifest.json');
});
