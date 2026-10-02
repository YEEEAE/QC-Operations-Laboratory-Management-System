import { createHash } from 'node:crypto';
import { stableJson } from '../../../shared/json/stable-stringify.js';
import type { BackupRun } from './backup-record.js';

/**
 * Stable optimistic-concurrency token for the backup data shown on the
 * restore-intent form. This is a snapshot check, not an authorization token.
 */
export function backupEligibilityVersion(backup: BackupRun): string {
  return createHash('sha256')
    .update(
      stableJson({
        id: backup.id,
        state: backup.state,
        requestedAt: backup.requestedAt.toISOString(),
        artifactCreatedAt: backup.artifactCreatedAt?.toISOString() ?? null,
        verifiedAt: backup.verifiedAt?.toISOString() ?? null,
        hasChecksum: backup.hasChecksum,
        checksumVersionDigest: backup.checksumVersionDigest ?? null,
        sizeBytes: backup.sizeBytes?.toString() ?? null,
        artifactType: backup.artifactType ?? null,
        objectVersion: backup.objectVersion ?? null,
        gitSha: backup.gitSha ?? null,
        buildId: backup.buildId ?? null,
        releaseId: backup.releaseId ?? null,
        migrationHead: backup.migrationHead ?? null,
        postgresVersion: backup.postgresVersion ?? null,
        retentionExpiresAt: backup.retentionExpiresAt?.toISOString() ?? null,
        manifestSha256: backup.manifestSha256 ?? null,
        knownGaps: backup.knownGaps ?? null,
        databaseSchemaVersion: backup.databaseSchemaVersion ?? null,
      }),
      'utf8',
    )
    .digest('hex');
}
