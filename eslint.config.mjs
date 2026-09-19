import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      '.astro/**',
      'node_modules/**',
      '.agents/**',
      '.claude/**',
      '.clinerules/**',
      '.opencode/**',
      '.playwright-mcp/**',
      'Documents/**',
      // Local, gitignored scratch tooling (`.tmp/` also stays out of the Git
      // index). Prettier already skips it through `.gitignore`; the lint scope
      // is aligned here so ad-hoc probe scripts cannot fail the code gate.
      '.tmp/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
