import { describe, expect, it } from 'vitest';
import { canAuthenticate } from '../../../src/modules/identity/domain/account-state.js';
import { isSharedAccount } from '../../../src/modules/identity/domain/user.js';
import { isSessionUsable } from '../../../src/modules/identity/domain/session.js';
describe('identity domain invariants', () => {
  it('only ACTIVE accounts authenticate and shared identities are not personal actors', () => {
    expect(canAuthenticate('ACTIVE')).toBe(true);
    expect(canAuthenticate('DISABLED')).toBe(false);
    expect(isSharedAccount({ loginIdentity: 'shared-qc' } as never)).toBe(true);
    expect(isSharedAccount({ loginIdentity: 'amina' } as never)).toBe(false);
  });
  it('rejects revoked and expired sessions', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const base = { id: 's', userId: 'u', tokenHash: 'h', createdAt: now, expiresAt: new Date('2026-01-01T01:00:00Z'), version: 1n };
    expect(isSessionUsable(base, now)).toBe(true);
    expect(isSessionUsable({ ...base, expiresAt: now }, now)).toBe(false);
    expect(isSessionUsable({ ...base, revokedAt: now }, now)).toBe(false);
  });
});
