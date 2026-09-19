import { describe, expect, it } from 'vitest';
import { assertIsolatedRestoreTarget } from '../../../src/modules/backup-recovery/infrastructure/postgres-logical-backup-executor.js';

describe('isolated logical restore target selection', () => {
  it('allows only a distinct localhost qc_restore database', () => {
    expect(
      assertIsolatedRestoreTarget(
        'postgresql://qc_owner@localhost:55432/qc_restore_dr008?sslmode=verify-full',
        'qc_dr008_src',
      ),
    ).toEqual({ databaseName: 'qc_restore_dr008' });
  });

  it.each([
    ['remote host', 'postgresql://db.example.test/qc_restore_dr008'],
    ['non-restore database', 'postgresql://qc_owner@localhost/qc_disposable'],
    ['source database', 'postgresql://qc_owner@localhost/qc_restore_dr008'],
    ['non-Postgres URL', 'https://example.test/qc_restore_dr008'],
    ['malformed URL', 'not-a-url'],
    ['invalid encoded database name', 'postgresql://qc_owner@localhost/qc_restore_%ZZ'],
  ])('fails closed for %s without echoing connection data', (_case, targetUrl) => {
    expect(() => assertIsolatedRestoreTarget(targetUrl, 'qc_restore_dr008')).toThrow(
      'RESTORE_TARGET_NOT_ISOLATED',
    );
  });

  it('rejects a missing source database identity', () => {
    expect(() =>
      assertIsolatedRestoreTarget('postgresql://qc_owner@localhost/qc_restore_dr008', ''),
    ).toThrow('RESTORE_TARGET_NOT_ISOLATED');
  });
});
