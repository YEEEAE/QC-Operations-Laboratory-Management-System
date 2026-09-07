import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import { isFoundationSeedEntrypoint } from '../../../scripts/db/seed-foundation.js';

describe('foundation seed CLI entrypoint', () => {
  it('recognizes a relative script path as the real module entrypoint', () => {
    expect(
      isFoundationSeedEntrypoint(
        'scripts/db/seed-foundation.ts',
        pathToFileURL(resolve('scripts/db/seed-foundation.ts')).href,
      ),
    ).toBe(true);
  });

  it('does not treat a different module as the entrypoint', () => {
    expect(
      isFoundationSeedEntrypoint(
        'scripts/db/seed-foundation.ts',
        pathToFileURL(resolve('scripts/db/check-foundation-seed.ts')).href,
      ),
    ).toBe(false);
  });
});
