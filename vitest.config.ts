import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    setupFiles: ['./tests/setup/unit.ts'],
    hookTimeout: 120_000,
    testTimeout: 120_000,
  },
});
