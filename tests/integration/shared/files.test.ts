import { describe, expect, it } from 'vitest';
import { FileService } from '../../../src/shared/files/file-service';
import type { EvidenceLink, FileRecord } from '../../../src/shared/files/file-record';
import type { FileRepository } from '../../../src/shared/files/file-repository';
import type { ObjectStore, StoredObject } from '../../../src/shared/files/object-store';

class MemoryFiles implements FileRepository {
  files = new Map<string, FileRecord>();
  links = new Map<string, EvidenceLink>();
  async create(row: FileRecord) {
    this.files.set(row.id, row);
    return row;
  }
  async linkEvidence(row: EvidenceLink) {
    this.links.set(row.id, row);
    return row;
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
  async put(key: string, object: StoredObject) {
    this.objects.set(key, object);
  }
  async get(key: string) {
    return this.objects.get(key);
  }
}

describe('files and evidence', () => {
  it('hashes actual bytes and rejects a tampered object', async () => {
    const repository = new MemoryFiles();
    const store = new MemoryStore();
    const service = new FileService(repository, store, async ({ actorId }) => {
      if (actorId !== 'u1') throw new Error('denied');
    });
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
    await expect(service.download('u1', result.evidence)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
  });

  it('authorizes before metadata/object access and preserves evidence linkage', async () => {
    const repository = new MemoryFiles();
    const store = new MemoryStore();
    let calls = 0;
    const service = new FileService(repository, store, async ({ actorId }) => {
      calls += 1;
      if (actorId !== 'u1') throw new Error('denied');
    });
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
});
