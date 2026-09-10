import { describe, expect, it } from 'vitest';
import { LocalArtifactStore } from '../../../src/modules/backup-recovery/infrastructure/local-artifact-store.js';
import { expireBackupArtifacts } from '../../../src/modules/backup-recovery/application/retention.js';
import { checksum } from '../../../src/modules/backup-recovery/infrastructure/postgres-logical-backup-executor.js';

describe('backup retention', () => {
  it('does not delete the last eligible artifact', async () => {
    const store = new LocalArtifactStore();
    const metadata = { sizeBytes: 1n, checksum: checksum(new Uint8Array([1])) };
    await store.put({ reference: 'old', bytes: new Uint8Array([1]), contentType: 'application/octet-stream', metadata });
    const result = await expireBackupArtifacts({ store, now: new Date('2026-10-11T00:00:00Z'), eligibleReferences: new Set(['old']) });
    expect(result.protected).toEqual(['old']);
    expect(await store.get('old')).toEqual(new Uint8Array([1]));
  });
});
