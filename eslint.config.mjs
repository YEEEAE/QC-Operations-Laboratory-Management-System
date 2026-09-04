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
      'Documents/**',
      'docs/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
