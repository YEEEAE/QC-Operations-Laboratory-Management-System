import { describe, expect, it } from 'vitest';
import { assertP05Ceremony } from '../../../src/shared/authorization/p05-ceremony.js';

const base = {
  actor: { id: 'u-1', accountState: 'ACTIVE' as const, roles: ['MANAGER'], permissions: [] },
  operation: 'APPROVE' as const,
  meaning: 'APPROVE',
  reason: 'verified evidence',
  reauthenticationSecret: 'secret',
  requestId: 'req-1',
  snapshotHash: 'hash-1',
  requireReason: true,
};

describe('P-05 ceremony', () => {
  it('accepts an exact ceremony', () => {
    expect(() => assertP05Ceremony(base)).not.toThrow();
  });
  it('rejects mismatched meaning, missing reason, missing reauth, and missing request', () => {
    expect(() => assertP05Ceremony({ ...base, meaning: 'RELEASE' })).toThrowError();
    expect(() => assertP05Ceremony({ ...base, reason: '  ' })).toThrowError();
    expect(() => assertP05Ceremony({ ...base, reauthenticationSecret: '' })).toThrowError();
    expect(() => assertP05Ceremony({ ...base, requestId: ' ' })).toThrowError();
    expect(() =>
      assertP05Ceremony({
        ...base,
        actor: { ...base.actor, accountState: 'INACTIVE' },
      }),
    ).toThrowError();
  });
});
