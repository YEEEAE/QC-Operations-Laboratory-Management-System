import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LocalObjectStore } from '../../../src/shared/files/local-object-store';
import { S3ObjectStore, type S3CompatibleClient } from '../../../src/shared/files/s3-object-store';

describe('object stores', () => {
  it('round-trips local bytes, preserves content type, and blocks traversal/production', async () => {
    const root = await mkdtemp(join(tmpdir(), 'qc-object-store-'));
    try {
      const store = new LocalObjectStore(root, 'test');
      await store.put('files/a', {
        bytes: new TextEncoder().encode('evidence'),
        contentType: 'text/plain',
      });
      await expect(store.get('files/a')).resolves.toMatchObject({ contentType: 'text/plain' });
      await expect(store.get('../outside')).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
      expect(() => new LocalObjectStore(root, 'production')).toThrowError(
        /errors.system_configuration_invalid/,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('keeps the S3-compatible contract private', async () => {
    const calls: unknown[] = [];
    const client: S3CompatibleClient = {
      putObject: async (input) => {
        calls.push(input);
      },
      getObject: async () => undefined,
    };
    await new S3ObjectStore(client, 'private-bucket').put('files/a', {
      bytes: new Uint8Array([1]),
      contentType: 'application/octet-stream',
    });
    expect(calls[0]).toMatchObject({ bucket: 'private-bucket', key: 'files/a', acl: 'private' });
  });
});
