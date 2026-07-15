import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';

test('new runtime detects archived Hermes references', async () => {
  const validator = await import('../scripts/validate-no-legacy.js').catch(() => null);
  expect(validator).not.toBeNull();

  const fixture = mkdtempSync(join(tmpdir(), 'framepack-legacy-boundary-'));
  try {
    mkdirSync(join(fixture, 'nested'));
    writeFileSync(join(fixture, 'runtime.ts'), "export const path = 'framepack-plugin/hooks';\n", 'utf8');
    writeFileSync(join(fixture, 'nested', 'legacy.html'), '<p>framepack-e2e-test</p>\n', 'utf8');
    writeFileSync(join(fixture, 'styles.css'), '/* Hermes_windows */\n', 'utf8');
    writeFileSync(join(fixture, 'component.tsx'), 'const inject = "ctx.inject_message";\n', 'utf8');
    writeFileSync(join(fixture, 'clean.yaml'), 'name: director-workbench\n', 'utf8');

    expect(validator?.scanLegacyReferences([fixture])).toEqual([
      join(fixture, 'component.tsx'),
      join(fixture, 'nested', 'legacy.html'),
      join(fixture, 'runtime.ts'),
      join(fixture, 'styles.css'),
    ].sort());
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
