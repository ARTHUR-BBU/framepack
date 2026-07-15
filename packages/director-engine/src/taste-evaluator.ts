import type { TasteEvaluator } from './audit.js';

type Fetch = typeof fetch;
type Options = { apiKey: string; model: string; fetch?: Fetch };

export function createResponsesTasteEvaluator(options: Options): TasteEvaluator | undefined {
  if (!options.apiKey || !options.model) return undefined;
  const request = options.fetch ?? fetch;
  return {
    async evaluate(projectDir: string) {
      const response = await request('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { authorization: `Bearer ${options.apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model: options.model, input: `Audit director preview at ${projectDir}. Return only JSON with gate (pass|fail|needs_review), motionQuality (poor|acceptable|strong), and note.`, temperature: 0 }),
      });
      if (!response.ok) throw new Error(`taste evaluator failed: ${response.status}`);
      const payload = await response.json() as { output_text?: string };
      const verdict = JSON.parse(payload.output_text ?? '{}') as { gate: 'pass' | 'fail' | 'needs_review'; motionQuality: 'poor' | 'acceptable' | 'strong'; note: string };
      if (!verdict.gate || !verdict.motionQuality || !verdict.note) throw new Error('taste evaluator returned an incomplete verdict');
      return verdict;
    },
  };
}
