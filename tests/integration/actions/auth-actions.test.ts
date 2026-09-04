import { describe, expect, it } from 'vitest';
import { safeReturnTo } from '../../../src/shared/http/safe-return-to.js';
describe('auth action contracts', () => { it('never accepts an external return target', () => { expect(safeReturnTo('https://evil.example')).toBe('/dashboard'); expect(safeReturnTo('//evil.example')).toBe('/dashboard'); }); });
