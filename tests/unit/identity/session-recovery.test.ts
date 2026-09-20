import { describe, expect, it } from 'vitest';
import {
  sessionRecoveryCopy,
  sessionRecoveryNotice,
} from '../../../src/shared/identity/session-recovery.js';
import { safeReturnTo } from '../../../src/shared/http/safe-return-to.js';

describe('session recovery UX', () => {
  it('shows a reauthentication path after expiry/revocation without replaying the prior action', () => {
    const notice = sessionRecoveryNotice('SESSION_ENDED');
    expect(notice).toBe('SESSION_ENDED');
    expect(sessionRecoveryCopy(notice!)).toContain('The previous action was not resubmitted.');
  });

  it('keeps disabled accounts out of the ordinary reauthentication promise', () => {
    expect(sessionRecoveryCopy(sessionRecoveryNotice('ACCOUNT_UNAVAILABLE')!)).toContain(
      'Contact the system owner',
    );
  });

  it('ignores unrecognized notice values and constrains the eventual return destination', () => {
    expect(sessionRecoveryNotice('anything')).toBeUndefined();
    expect(safeReturnTo('//attacker.example')).toBe('/dashboard');
    expect(safeReturnTo('/tasks?due=today')).toBe('/tasks?due=today');
  });
});
