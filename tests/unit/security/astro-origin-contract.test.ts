import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('Astro cookie-authenticated action origin protection', () => {
  it('keeps the framework Origin check enabled', () => {
    const config = readFileSync(
      fileURLToPath(new URL('../../../astro.config.mjs', import.meta.url)),
      'utf8',
    );
    expect(config).toMatch(/security\s*:\s*\{[^}]*checkOrigin\s*:\s*true/s);
  });
});
