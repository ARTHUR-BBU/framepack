import { expect, test } from 'vitest';
import { assessMotionCoverage } from '../packages/director-engine/src/motion-coverage.js';

const storyboard = {
  scenes: [{ id: 'scene-1', startSeconds: 0, durationSeconds: 8 }],
} as never;

test('flags a scene that only moves at the opening', () => {
  const result = assessMotionCoverage('build-1', storyboard, [{ sceneId: 'scene-1', atSeconds: 0.2, durationSeconds: 0.6 }]);
  expect(result.scenes[0].status).toBe('motion-density-low');
  expect(result.scenes[0].quietGaps.some((gap) => gap.durationSeconds > 1.5)).toBe(true);
});

test('passes layered actions that keep a scene alive without continuous noise', () => {
  const result = assessMotionCoverage('build-1', storyboard, [
    { sceneId: 'scene-1', atSeconds: 0.2, durationSeconds: 1.4 },
    { sceneId: 'scene-1', atSeconds: 2.1, durationSeconds: 1.6 },
    { sceneId: 'scene-1', atSeconds: 4.6, durationSeconds: 1.5 },
    { sceneId: 'scene-1', atSeconds: 6.6, durationSeconds: 1.1 },
  ]);
  expect(result.status).toBe('pass');
  expect(result.scenes[0].coverageRatio).toBeGreaterThan(0.65);
});
