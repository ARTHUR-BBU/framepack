import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@framepack/director-contracts': fileURLToPath(new URL('./packages/director-contracts/src/index.ts', import.meta.url)),
    },
  },
  test: { include: ['tests/**/*.test.ts'] },
});
