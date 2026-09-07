import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Action tests must exercise the real server-side Astro Actions runtime
  // (defineAction input parsing, API-context guard, ActionError mapping).
  // `astro:actions` / `astro:schema` are Vite virtual modules in the app, so
  // tests resolve them to the installed Astro SSR runtime and its zod
  // re-export — the same code the production server executes.
  resolve: {
    alias: [
      { find: /^astro:actions$/, replacement: 'astro/actions/runtime/virtual/server.js' },
      { find: /^astro:schema$/, replacement: 'astro/zod' },
    ],
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    setupFiles: ['./tests/setup/unit.ts'],
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 120_000,
  },
});
