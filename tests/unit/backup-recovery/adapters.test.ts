import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalArtifactStore } from '../../../src/modules/backup-recovery/infrastructure/local-artifact-store.js';
import { CloudflareR2ArtifactStore, parseR2Config } from '../../../src/modules/backup-recovery/infrastructure/cloudflare-r2-artifact-store.js';
import { checksum } from '../../../src/modules/backup-recovery/infrastructure/postgres-logical-backup-executor.js';

describe('backup artifact adapters', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('round-trips exact bytes and metadata in the local test store', async () => {
    const store = new LocalArtifactStore();
    const bytes = new Uint8Array([1, 2, 3]);
    const metadata = { sizeBytes: 3n, checksum: checksum(bytes) };
    await store.put({
      reference: 'test/artifact',
      bytes,
      contentType: 'application/octet-stream',
      metadata,
    });
    expect(await store.get('test/artifact')).toEqual(bytes);
    expect(await store.head('test/artifact')).toEqual(metadata);
  });
  it('signs path-style staging storage requests with the configured S3 region', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const store = new CloudflareR2ArtifactStore(parseR2Config({
      APP_ENVIRONMENT_PROFILE: 'staging',
      STAGING_R2_ENDPOINT: 'https://storage.invalid',
      STAGING_R2_ACCESS_KEY_ID: 'synthetic-access-key',
      STAGING_R2_SECRET_ACCESS_KEY: 'synthetic-secret',
      STAGING_R2_BUCKET: 'qc-staging-artifacts',
      STAGING_R2_REGION: 'us-east-2',
    }));
    const bytes = new Uint8Array([1, 2, 3]);
    await store.put({ reference: 'smoke/check.bin', bytes, contentType: 'application/octet-stream', metadata: { sizeBytes: 3n, checksum: checksum(bytes) } });
    expect(fetch.mock.calls[0][0].pathname).toBe('/qc-staging-artifacts/smoke/check.bin');
    expect(fetch.mock.calls[0][1].headers.authorization).toContain('/us-east-2/s3/aws4_request');
    expect(parseR2Config({ R2_ENDPOINT: 'https://r2.invalid', R2_ACCESS_KEY_ID: 'a', R2_SECRET_ACCESS_KEY: 'b', R2_BUCKET: 'qc-backups' }).region).toBe('auto');
  });
  it('requires complete HTTPS R2 configuration without exposing values', () => {
    expect(() => parseR2Config({ R2_ENDPOINT: 'http://r2.invalid' })).toThrow();
    expect(() =>
      parseR2Config({
        R2_ENDPOINT: 'https://r2.invalid',
        R2_ACCESS_KEY_ID: 'a',
        R2_SECRET_ACCESS_KEY: 'b',
        R2_BUCKET: 'qc-backups',
      }),
    ).not.toThrow();
  });
});
