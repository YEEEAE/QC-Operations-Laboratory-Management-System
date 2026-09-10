import { describe, expect, it } from 'vitest';
import { LocalArtifactStore } from '../../../src/modules/backup-recovery/infrastructure/local-artifact-store.js';
import { parseR2Config } from '../../../src/modules/backup-recovery/infrastructure/cloudflare-r2-artifact-store.js';
import { checksum } from '../../../src/modules/backup-recovery/infrastructure/postgres-logical-backup-executor.js';

describe('backup artifact adapters', () => {
  it('round-trips exact bytes and metadata in the local test store', async () => {
    const store = new LocalArtifactStore();
    const bytes = new Uint8Array([1, 2, 3]);
    const metadata = { sizeBytes: 3n, checksum: checksum(bytes) };
    await store.put({ reference: 'test/artifact', bytes, contentType: 'application/octet-stream', metadata });
    expect(await store.get('test/artifact')).toEqual(bytes);
    expect(await store.head('test/artifact')).toEqual(metadata);
  });
  it('requires complete HTTPS R2 configuration without exposing values', () => {
    expect(() => parseR2Config({ R2_ENDPOINT: 'http://r2.invalid' })).toThrow();
    expect(() => parseR2Config({ R2_ENDPOINT: 'https://r2.invalid', R2_ACCESS_KEY_ID: 'a', R2_SECRET_ACCESS_KEY: 'b', R2_BUCKET: 'qc-backups' })).not.toThrow();
  });
});
