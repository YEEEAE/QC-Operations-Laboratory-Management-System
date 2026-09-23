import { describe, expect, it } from 'vitest';
import { FileService, type FileSecurityPolicy } from '../../../src/shared/files/file-service';
import type { EvidenceLink, FileRecord } from '../../../src/shared/files/file-record';
import type { FileRepository } from '../../../src/shared/files/file-repository';
import type { ObjectStore, StoredObject } from '../../../src/shared/files/object-store';

class MemoryFiles implements FileRepository {
  files = new Map<string, FileRecord>();
  links = new Map<string, EvidenceLink>();
  failCreateWithEvidence = false;
  async createWithEvidence(row: FileRecord, link: EvidenceLink) {
    if (this.failCreateWithEvidence) throw new Error('database failure');
    this.files.set(row.id, row);
    this.links.set(link.id, link);
  }
  async findById(id: string) {
    return this.files.get(id);
  }
  async findEvidence(id: string) {
    return this.links.get(id);
  }
}
class MemoryStore implements ObjectStore {
  objects = new Map<string, StoredObject>();
  failDelete = false;
  failPut = false;
  async put(key: string, object: StoredObject) {
    if (this.failPut) throw new Error('storage failure');
    this.objects.set(key, object);
  }
  async get(key: string) {
    return this.objects.get(key);
  }
  async delete(key: string) {
    if (this.failDelete) throw new Error('storage failure');
    this.objects.delete(key);
  }
}

// Test-only policy; this does not represent an approved production policy.
const testPolicy: FileSecurityPolicy = {
  allowedMimeTypes: ['application/pdf', 'text/plain'],
  maxSizeBytes: 1024,
  scan: async () => 'CLEAN',
};

describe('files and evidence', () => {
  it('fails closed without an approved MIME, size, and scanner policy', async () => {
    const repository = new MemoryFiles();
    const store = new MemoryStore();
    const service = new FileService(repository, store, async () => undefined);
    await expect(
      service.upload({
        originalFilename: 'evidence.txt',
        mimeType: 'text/plain',
        bytes: new TextEncoder().encode('synthetic fixture'),
        uploadedBy: 'u1',
        subjectType: 'LAB_TEST',
        subjectId: 'test-1',
      }),
    ).rejects.toMatchObject({ code: 'POLICY_SOURCE_REQUIRED' });
    expect(repository.files.size).toBe(0);
    expect(store.objects.size).toBe(0);
  });

  it('rejects a malicious scan verdict and scanner failure before storage', async () => {
    const repository = new MemoryFiles();
    const store = new MemoryStore();
    const input = {
      originalFilename: 'evidence.txt',
      mimeType: 'text/plain',
      bytes: new TextEncoder().encode('synthetic fixture'),
      uploadedBy: 'u1',
      subjectType: 'LAB_TEST',
      subjectId: 'test-1',
    };
    const malicious = new FileService(repository, store, async () => undefined, {
      ...testPolicy,
      scan: async () => 'MALICIOUS',
    });
    await expect(malicious.upload(input)).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    const unavailable = new FileService(repository, store, async () => undefined, {
      ...testPolicy,
      scan: async () => {
        throw new Error('scanner unavailable');
      },
    });
    await expect(unavailable.upload(input)).rejects.toThrow('scanner unavailable');
    expect(repository.files.size).toBe(0);
    expect(store.objects.size).toBe(0);
  });

  it('does not create metadata when private object storage fails first', async () => {
    const repository = new MemoryFiles();
    const store = new MemoryStore();
    store.failPut = true;
    const service = new FileService(repository, store, async () => undefined, testPolicy);
    await expect(
      service.upload({
        originalFilename: 'evidence.txt',
        mimeType: 'text/plain',
        bytes: new TextEncoder().encode('synthetic fixture'),
        uploadedBy: 'u1',
        subjectType: 'LAB_TEST',
        subjectId: 'test-1',
      }),
    ).rejects.toThrow('storage failure');
    expect(repository.files.size).toBe(0);
    expect(repository.links.size).toBe(0);
  });

  it('rejects unsafe names, executable content, and declared type mismatches', async () => {
    const repository = new MemoryFiles();
    const store = new MemoryStore();
    const service = new FileService(repository, store, async () => undefined, testPolicy);
    const upload = (overrides: Partial<Parameters<FileService['upload']>[0]> = {}) =>
      service.upload({
        originalFilename: 'evidence.pdf',
        mimeType: 'application/pdf',
        bytes: new TextEncoder().encode('%PDF-1.7\ncontrolled evidence'),
        uploadedBy: 'u1',
        subjectType: 'LAB_TEST',
        subjectId: 'test-1',
        ...overrides,
      });

    await expect(upload({ originalFilename: '../evidence.pdf' })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    await expect(upload({ originalFilename: 'evidence.exe' })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    await expect(
      upload({ bytes: new Uint8Array([0x4d, 0x5a]), mimeType: 'text/plain' }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    await expect(upload({ bytes: new TextEncoder().encode('not a PDF') })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    expect(repository.files.size).toBe(0);
    expect(store.objects.size).toBe(0);
  });

  it('rejects oversized payloads and inconsistent or unsafe extensions before storage', async () => {
    const repository = new MemoryFiles();
    const store = new MemoryStore();
    const service = new FileService(repository, store, async () => undefined, testPolicy);
    const base = {
      originalFilename: 'evidence.pdf',
      mimeType: 'application/pdf',
      bytes: new TextEncoder().encode('%PDF-1.7\ncontrolled evidence'),
      uploadedBy: 'u1',
      subjectType: 'LAB_TEST',
      subjectId: 'test-1',
    } as const;

    await expect(service.upload({ ...base, extension: 'exe' })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    await expect(service.upload({ ...base, extension: 'txt' })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    await expect(
      service.upload({ ...base, bytes: new Uint8Array(testPolicy.maxSizeBytes + 1) }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(repository.files.size).toBe(0);
    expect(store.objects.size).toBe(0);
  });

  it('hashes actual bytes and rejects a tampered object', async () => {
    const repository = new MemoryFiles();
    const store = new MemoryStore();
    const service = new FileService(
      repository,
      store,
      async ({ actorId }) => {
        if (actorId !== 'u1') throw new Error('denied');
      },
      testPolicy,
    );
    const result = await service.upload({
      originalFilename: 'result.txt',
      mimeType: 'text/plain',
      bytes: new TextEncoder().encode('raw bytes'),
      uploadedBy: 'u1',
      subjectType: 'LAB_TEST',
      subjectId: 'test-1',
    });
    expect(result.file.sha256).toBe(
      '9ab366ad455508d5f47b0128d7d243a2c0e4f5ce399b5f85cd10b343e745a4dc',
    );
    store.objects.set(result.file.storageKey, {
      bytes: new TextEncoder().encode('tampered'),
      contentType: 'text/plain',
    });
    await expect(service.downloadByEvidenceId('u1', result.evidence.id)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
  });

  it('authorizes before metadata/object access and preserves evidence linkage', async () => {
    const repository = new MemoryFiles();
    const store = new MemoryStore();
    let calls = 0;
    const service = new FileService(
      repository,
      store,
      async ({ actorId }) => {
        calls += 1;
        if (actorId !== 'u1') throw new Error('denied');
      },
      testPolicy,
    );
    await expect(
      service.upload({
        originalFilename: 'x',
        mimeType: 'text/plain',
        bytes: new Uint8Array([1]),
        uploadedBy: 'u2',
        subjectType: 'TASK',
        subjectId: 't1',
      }),
    ).rejects.toThrow('denied');
    expect(repository.files.size).toBe(0);
    expect(calls).toBe(1);
  });

  it('resolves the canonical evidence link before download to resist link substitution', async () => {
    const repository = new MemoryFiles();
    const store = new MemoryStore();
    const service = new FileService(
      repository,
      store,
      async ({ subjectId }) => {
        if (subjectId !== 'subject-1') throw new Error('denied');
      },
      testPolicy,
    );
    const uploaded = await service.upload({
      originalFilename: 'private.txt',
      mimeType: 'text/plain',
      bytes: new TextEncoder().encode('private'),
      uploadedBy: 'u1',
      subjectType: 'LAB_TEST',
      subjectId: 'subject-1',
    });
    expect([...repository.links.keys()]).toContain(uploaded.evidence.id);

    await expect(service.downloadByEvidenceId('u1', uploaded.evidence.id)).resolves.toMatchObject({
      file: { id: uploaded.file.id },
    });
    await expect(service.downloadByEvidenceId('u1', 'missing-evidence')).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
  });

  it('denies an out-of-scope download before reading private object bytes', async () => {
    const repository = new MemoryFiles();
    const store = new MemoryStore();
    let reads = 0;
    const originalGet = store.get.bind(store);
    store.get = async (key) => {
      reads += 1;
      return originalGet(key);
    };
    const service = new FileService(
      repository,
      store,
      async ({ action, subjectId }) => {
        if (action === 'DOWNLOAD' && subjectId !== 'allowed-subject') throw new Error('denied');
      },
      testPolicy,
    );
    const uploaded = await service.upload({
      originalFilename: 'private.txt',
      mimeType: 'text/plain',
      bytes: new TextEncoder().encode('synthetic fixture'),
      uploadedBy: 'u1',
      subjectType: 'TASK',
      subjectId: 'outside-scope',
    });
    await expect(service.downloadByEvidenceId('u2', uploaded.evidence.id)).rejects.toThrow(
      'denied',
    );
    expect(reads).toBe(0);
  });

  it('compensates the private object when atomic metadata and evidence persistence fails', async () => {
    const repository = new MemoryFiles();
    repository.failCreateWithEvidence = true;
    const store = new MemoryStore();
    const service = new FileService(repository, store, async () => undefined, testPolicy);

    await expect(
      service.upload({
        originalFilename: 'evidence.txt',
        mimeType: 'text/plain',
        bytes: new TextEncoder().encode('evidence'),
        uploadedBy: 'u1',
        subjectType: 'LAB_TEST',
        subjectId: 'test-1',
      }),
    ).rejects.toThrow('database failure');
    expect(store.objects.size).toBe(0);
    expect(repository.files.size).toBe(0);
    expect(repository.links.size).toBe(0);
  });

  it('surfaces failed object compensation without replacing it with a false rollback result', async () => {
    const repository = new MemoryFiles();
    repository.failCreateWithEvidence = true;
    const store = new MemoryStore();
    store.failDelete = true;
    const service = new FileService(repository, store, async () => undefined, testPolicy);

    await expect(
      service.upload({
        originalFilename: 'evidence.txt',
        mimeType: 'text/plain',
        bytes: new TextEncoder().encode('evidence'),
        uploadedBy: 'u1',
        subjectType: 'LAB_TEST',
        subjectId: 'test-1',
      }),
    ).rejects.toBeInstanceOf(AggregateError);
    expect(repository.files.size).toBe(0);
    expect(repository.links.size).toBe(0);
  });
});
