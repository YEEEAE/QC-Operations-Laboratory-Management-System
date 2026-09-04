import { describe, expect, it } from 'vitest';
import { safeReturnTo } from '../../../src/shared/http/safe-return-to.js';
describe('auth middleware contracts', () => { it('keeps protected redirects local', () => { expect(safeReturnTo('/account?section=security')).toBe('/account?section=security'); }); });
