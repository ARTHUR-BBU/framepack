import { expect, test } from 'vitest';
import { createResponsesTasteEvaluator } from '../packages/director-engine/src/taste-evaluator.js';

test('uses an explicitly configured Responses evaluator and parses its structured verdict', async () => {
  const evaluator = createResponsesTasteEvaluator({ apiKey: 'test-key', model: 'test-model', fetch: async () => new Response(JSON.stringify({ output_text: '{"gate":"pass","motionQuality":"strong","note":"real material is visible"}' })) });
  await expect(evaluator.evaluate('C:/preview')).resolves.toEqual({ gate: 'pass', motionQuality: 'strong', note: 'real material is visible' });
});

test('does not create a model evaluator without explicit credentials', () => {
  expect(createResponsesTasteEvaluator({ apiKey: '', model: '' })).toBeUndefined();
});
