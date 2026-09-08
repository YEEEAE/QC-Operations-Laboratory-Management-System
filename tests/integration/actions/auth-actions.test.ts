import { describe, expect, it } from 'vitest';
import { isAstroActionError } from '../../../src/shared/errors/action-error.js';
import { safeReturnTo } from '../../../src/shared/http/safe-return-to.js';
describe('auth action contracts', () => {
  it('never accepts an external return target', () => {
    expect(safeReturnTo('https://evil.example')).toBe('/dashboard');
    expect(safeReturnTo('//evil.example')).toBe('/dashboard');
  });

  it('recognizes Astro action errors without depending on a virtual runtime constructor', () => {
    expect(isAstroActionError({ type: 'AstroActionError', code: 'BAD_REQUEST', status: 400 })).toBe(
      true,
    );
    expect(isAstroActionError(new Error('database unavailable'))).toBe(false);
    expect(isAstroActionError({ type: 'AstroActionError', code: 'BAD_REQUEST' })).toBe(false);
  });
});
