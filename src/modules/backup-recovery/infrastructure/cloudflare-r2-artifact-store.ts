import { createHash, createHmac } from 'node:crypto';
import type {
  ArtifactMetadata,
  BackupArtifactStore,
  StoredArtifact,
} from '../ports/artifact-store.js';

interface R2Config {
  endpoint: URL;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

const safeBucket = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;

function hmac(key: Uint8Array | string, value: string): Buffer {
  return createHmac('sha256', key).update(value).digest();
}
function hash(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}
function encodePath(value: string): string {
  return value.split('/').map((part) => encodeURIComponent(part)).join('/');
}
function publicSafeError(): Error {
  return new Error('BACKUP_STORAGE_UNAVAILABLE');
}

export function parseR2Config(input: Record<string, string | undefined>): R2Config {
  const endpointValue = input.R2_ENDPOINT?.trim();
  const accessKeyId = input.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = input.R2_SECRET_ACCESS_KEY;
  const bucket = input.R2_BUCKET?.trim();
  if (!endpointValue || !accessKeyId || !secretAccessKey || !bucket || !safeBucket.test(bucket))
    throw new Error('R2 configuration is incomplete.');
  let endpoint: URL;
  try {
    endpoint = new URL(endpointValue);
  } catch {
    throw new Error('R2 configuration is invalid.');
  }
  if (endpoint.protocol !== 'https:') throw new Error('R2 endpoint must use HTTPS.');
  return { endpoint, accessKeyId, secretAccessKey, bucket };
}

export class CloudflareR2ArtifactStore implements BackupArtifactStore {
  constructor(private readonly config: R2Config) {}

  private async request(method: string, reference: string, body?: Uint8Array, headers = {}) {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').replace('Z', 'Z');
    const date = amzDate.slice(0, 8);
    const path = `/${encodePath(this.config.bucket)}/${encodePath(reference)}`;
    const payloadHash = body ? hash(body) : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const signedHeaders = { host: this.config.endpoint.host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate, ...headers };
    const names = Object.keys(signedHeaders).map((name) => name.toLowerCase()).sort();
    const canonicalHeaders = names.map((name) => `${name}:${String(signedHeaders[name as keyof typeof signedHeaders]).trim()}\n`).join('');
    const canonicalRequest = [method, path, '', canonicalHeaders, names.join(';'), payloadHash].join('\n');
    const credentialScope = `${date}/auto/s3/aws4_request`;
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, hash(canonicalRequest)].join('\n');
    const signingKey = hmac(hmac(hmac(hmac(`AWS4${this.config.secretAccessKey}`, date), 'auto'), 's3'), 'aws4_request');
    const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');
    const authorization = `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${credentialScope}, SignedHeaders=${names.join(';')}, Signature=${signature}`;
    try {
      return await fetch(new URL(path, this.config.endpoint), {
        method,
        headers: { ...signedHeaders, authorization, ...headers },
        body: body ? Buffer.from(body) : undefined,
      });
    } catch {
      throw publicSafeError();
    }
  }

  async put(input: {
    reference: string;
    bytes: Uint8Array;
    contentType: string;
    metadata: ArtifactMetadata;
  }): Promise<StoredArtifact> {
    const response = await this.request('PUT', input.reference, input.bytes, {
      'content-type': input.contentType,
      'x-amz-meta-sha256': input.metadata.checksum,
    });
    if (!response.ok) throw publicSafeError();
    return { reference: input.reference, ...input.metadata };
  }

  async get(reference: string): Promise<Uint8Array> {
    const response = await this.request('GET', reference);
    if (!response.ok) throw publicSafeError();
    return new Uint8Array(await response.arrayBuffer());
  }

  async head(reference: string): Promise<ArtifactMetadata> {
    const response = await this.request('HEAD', reference);
    if (!response.ok) throw publicSafeError();
    const size = response.headers.get('content-length');
    const checksum = response.headers.get('x-amz-meta-sha256');
    if (!size || !checksum) throw publicSafeError();
    return { sizeBytes: BigInt(size), checksum };
  }

  async delete(reference: string): Promise<void> {
    const response = await this.request('DELETE', reference);
    if (!response.ok && response.status !== 404) throw publicSafeError();
  }

  async list(): Promise<readonly { reference: string; createdAt: Date; metadata: ArtifactMetadata }[]> {
    throw new Error('R2 listing is not available through this restricted adapter.');
  }
}
