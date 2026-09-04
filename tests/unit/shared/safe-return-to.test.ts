import { describe, expect, it } from 'vitest';
import { safeReturnTo } from '../../../src/shared/http/safe-return-to';

describe('safeReturnTo', () => {
  it('allows local relative paths only', () => {
    expect(safeReturnTo('/dashboard')).toBe('/dashboard');
    expect(safeReturnTo('https://evil.example')).toBe('/dashboard');
    expect(safeReturnTo('//evil.example')).toBe('/dashboard');
    expect(safeReturnTo('javascript:alert(1)')).toBe('/dashboard');
    expect(safeReturnTo('/dashboard?next=https://evil.example')).toBe(
      '/dashboard?next=https://evil.example',
    );
  });
});
