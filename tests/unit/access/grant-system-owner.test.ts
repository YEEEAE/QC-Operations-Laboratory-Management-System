import { describe, expect, it } from 'vitest';

import {
  parseSystemOwnerGrantConfig,
  SYSTEM_OWNER_ROLE_CODE,
} from '../../../scripts/access/grant-system-owner';

describe('exclusive system-owner grant configuration', () => {
  it('requires a database URL and an explicit login identity', () => {
    expect(() => parseSystemOwnerGrantConfig({})).toThrow('DATABASE_URL is required.');
    expect(() => parseSystemOwnerGrantConfig({ DATABASE_URL: 'postgresql://db.test/qc' })).toThrow(
      'SYSTEM_OWNER_LOGIN_IDENTITY is required.',
    );
  });

  it('targets the explicitly supplied account through a non-system role', () => {
    expect(
      parseSystemOwnerGrantConfig({
        DATABASE_URL: 'postgresql://db.test/qc',
        SYSTEM_OWNER_LOGIN_IDENTITY: ' yazeed ',
      }),
    ).toEqual({ databaseUrl: 'postgresql://db.test/qc', loginIdentity: 'yazeed' });
    expect(SYSTEM_OWNER_ROLE_CODE).toBe('SYSTEM_OWNER');
  });
});
