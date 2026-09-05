import { describe, expect, it } from 'vitest';
import { cleanAstroPagePath } from '../../../src/shared/routing/clean-page-path';

describe('cleanAstroPagePath', () => {
  it('removes the source extension from a page URL', () => {
    expect(cleanAstroPagePath('/login.astro')).toBe('/login');
    expect(cleanAstroPagePath('/tasks/new.astro')).toBe('/tasks/new');
  });

  it('maps index pages to their directory route', () => {
    expect(cleanAstroPagePath('/dashboard/index.astro')).toBe('/dashboard');
    expect(cleanAstroPagePath('/')).toBeUndefined();
  });

  it('does not change ordinary public paths', () => {
    expect(cleanAstroPagePath('/tasks')).toBeUndefined();
  });
});
