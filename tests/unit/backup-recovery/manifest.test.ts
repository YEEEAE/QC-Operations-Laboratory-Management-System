import { describe, expect, it } from 'vitest';
import { createBackupManifest, toPublicBackupManifest } from '../../../src/modules/backup-recovery/domain/backup-manifest.js';

const base = {
  catalogId: '01999999-9999-7999-8999-999999999999',
  artifactType: 'LOGICAL_EXPORT' as const,
  postgresVersion: '18.6',
  gitSha: 'a'.repeat(40),
  buildId: 'build-1',
  releaseId: 'rel-1',
  migrationHead: '0019_backup_catalog_identity',
  createdAt: new Date('2026-09-10T00:00:00Z'),
  startedAt: new Date('2026-09-10T00:00:00Z'),
  completedAt: new Date('2026-09-10T00:01:00Z'),
  byteSize: 12n,
  checksum: 'b'.repeat(64),
  retentionExpiresAt: new Date('2026-10-10T00:01:00Z'),
};

describe('backup manifest', () => {
  it('binds immutable identity and exposes only safe fields', () => {
    const manifest = createBackupManifest(base);
    const view = toPublicBackupManifest(manifest, true, ['RESTORE_NOT_VERIFIED']);
    expect(manifest.manifestSha256).toHaveLength(64);
    expect(view).toMatchObject({ catalogId: base.catalogId, releaseId: 'rel-1', byteSize: '12', artifactVerified: true });
    expect(view).not.toHaveProperty('checksum');
    expect(view).not.toHaveProperty('manifestSha256');
  });
  it('rejects invalid checksum and Git SHA', () => {
    expect(() => createBackupManifest({ ...base, checksum: 'bad' })).toThrow();
    expect(() => createBackupManifest({ ...base, gitSha: 'bad' })).toThrow();
  });
});
