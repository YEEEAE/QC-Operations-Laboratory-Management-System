import type { ObjectStore, StoredObject } from './object-store';

export interface S3CompatibleClient {
  putObject(input: {
    bucket: string;
    key: string;
    body: Uint8Array;
    contentType: string;
    acl: 'private';
  }): Promise<void>;
  getObject(input: { bucket: string; key: string }): Promise<StoredObject | undefined>;
}

export class S3ObjectStore implements ObjectStore {
  constructor(
    private readonly client: S3CompatibleClient,
    private readonly bucket: string,
  ) {}
  put(key: string, object: StoredObject): Promise<void> {
    return this.client.putObject({
      bucket: this.bucket,
      key,
      body: object.bytes,
      contentType: object.contentType,
      acl: 'private',
    });
  }
  get(key: string): Promise<StoredObject | undefined> {
    return this.client.getObject({ bucket: this.bucket, key });
  }
}
