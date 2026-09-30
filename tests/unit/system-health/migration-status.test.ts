import { describe, expect, it } from 'vitest';
import { isKnownLegacyMigrationChecksum } from '../../../src/shared/database/migration-checksum-policy.js';
import { reconcileMigrationStatus } from '../../../src/modules/system-health/infrastructure/postgres-migration-status.js';

const shipped = [
  { version: '0018', name: '0018_rate_limit_windows', checksum: 'a'.repeat(64) },
  { version: '0042', name: '0042_immutable_lab_equipment_usage', checksum: 'b'.repeat(64) },
];

describe('system health migration ledger reconciliation', () => {
  it('reconciles the applied head, pending set, names and exact source checksums', () => {
    const status = reconcileMigrationStatus([{ ...shipped[0] }], shipped);

    expect(status).toEqual({
      appliedHead: '0018',
      buildHead: '0042',
      pending: ['0042'],
      integrityMismatches: [],
      sourceAvailable: true,
    });
  });

  it('reports checksum, name, and unknown-version mismatches without rewriting the ledger', () => {
    const status = reconcileMigrationStatus(
      [
        { ...shipped[0], name: '0018_wrong_name' },
        { ...shipped[1], checksum: '0'.repeat(64) },
        { version: '0099', name: '0099_unknown', checksum: 'c'.repeat(64) },
      ],
      shipped,
    );

    expect(status.integrityMismatches).toEqual(['0018', '0042', '0099']);
    expect(status.pending).toEqual([]);
    expect(status.appliedHead).toBe('0099');
  });

  it('recognizes only the exact historical checksums accepted by the migration runner', () => {
    const legacy = isKnownLegacyMigrationChecksum(
      '0018',
      '1d0ff581e19ff36e19df931c2601d17fb2a14bb7449805bdd049dfb7426bc334',
    );
    expect(legacy).toBe(true);

    const status = reconcileMigrationStatus(
      [
        {
          version: '0018',
          name: '0018_rate_limit_windows',
          checksum: '1d0ff581e19ff36e19df931c2601d17fb2a14bb7449805bdd049dfb7426bc334',
        },
      ],
      [shipped[0]],
    );

    expect(status.integrityMismatches).toEqual([]);
    expect(status.pending).toEqual([]);
  });

  it('keeps an unavailable migration source UNKNOWN instead of treating it as an empty set', () => {
    const status = reconcileMigrationStatus([], undefined);

    expect(status).toMatchObject({
      appliedHead: 'NONE',
      buildHead: 'UNKNOWN',
      pending: [],
      sourceAvailable: false,
    });
  });
});
