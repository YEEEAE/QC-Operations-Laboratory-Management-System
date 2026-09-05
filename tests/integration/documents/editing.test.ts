import { describe, expect, it } from 'vitest';
import { CreateDocumentUseCase } from '../../../src/modules/documents/application/create-document.js';
import { CreateVersionUseCase } from '../../../src/modules/documents/application/create-version.js';
import { UpdateVersionDraftUseCase } from '../../../src/modules/documents/application/update-version-draft.js';
import type { DocumentRepository } from '../../../src/modules/documents/ports/repository.js';
import type { DocumentIdentity } from '../../../src/modules/documents/domain/document.js';
import type { DocumentVersion } from '../../../src/modules/documents/domain/document-version.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const author: ActorContext = {
  id: '01900000-0000-7000-8000-000000000001', accountState: 'ACTIVE', roles: ['EMPLOYEE'],
  permissions: [
    { code: 'PERM-DOC-CREATE', scopes: ['OWN'] }, { code: 'PERM-DOC-VIEW', scopes: ['OWN'] },
    { code: 'PERM-DOC-EDIT-DRAFT', scopes: ['OWN'] },
  ],
};

function repository(): DocumentRepository & { documents: DocumentIdentity[]; versions: DocumentVersion[] } {
  const state = { documents: [] as DocumentIdentity[], versions: [] as DocumentVersion[] };
  return {
    ...state,
    async createDocument(input) { state.documents.push(input.document); return input.document; },
    async getDocument(id) { return state.documents.find((item) => item.id === id); },
    async listDocuments() { return state.documents; },
    async createVersion(input) { state.versions.push(input.version); return input.version; },
    async getVersion(id) { return state.versions.find((item) => item.id === id); },
    async listVersions(documentId) { return state.versions.filter((item) => item.documentId === documentId); },
    async updateDraft(input) {
      const current = state.versions.find((item) => item.id === input.id);
      if (!current || current.version !== input.expectedVersion || current.state !== 'DRAFT') throw new Error('stale or immutable');
      const updated = { ...current, revision: input.revision, changeSummary: input.changeSummary, contentHash: input.contentHash, version: current.version + 1n, updatedAt: input.now };
      state.versions.splice(state.versions.indexOf(current), 1, updated);
      return updated;
    },
    async recordReview(input) { throw new Error('not used'); },
    async transition(input) {
      const current = state.versions.find((item) => item.id === input.id)!;
      const updated = { ...current, state: input.toState, version: current.version + 1n } as DocumentVersion;
      state.versions.splice(state.versions.indexOf(current), 1, updated);
      return updated;
    },
    async supersede() { throw new Error('not used'); },
  };
}

describe('controlled document draft editing', () => {
  it('keeps identity separate and permits editing only on a Draft version', async () => {
    const repo = repository();
    const document = await new CreateDocumentUseCase(repo, () => new Date('2026-01-01T00:00:00Z')).execute({ actor: author, documentNo: 'WI-001', documentType: 'WI', title: 'Sampling work instruction', requestId: 'req-1' });
    const draft = await new CreateVersionUseCase(repo, () => new Date('2026-01-01T00:00:00Z')).execute({ actor: author, documentId: document.id, revision: '1', changeSummary: 'Initial draft', requestId: 'req-2' });
    expect(draft.documentId).toBe(document.id);
    const edited = await new UpdateVersionDraftUseCase(repo, () => new Date('2026-01-02T00:00:00Z')).execute({ actor: author, versionId: draft.id, expectedVersion: 1n, revision: '1', changeSummary: 'Clarified scope', contentHash: 'hash-1', requestId: 'req-3' });
    expect(edited.version).toBe(2n);
    expect(edited.state).toBe('DRAFT');
  });

  it('denies editing after the version is approved', async () => {
    const repo = repository();
    const document = await new CreateDocumentUseCase(repo).execute({ actor: author, documentNo: 'WI-002', documentType: 'WI', title: 'Approved instruction', requestId: 'req-4' });
    const draft = await new CreateVersionUseCase(repo).execute({ actor: author, documentId: document.id, revision: '1', requestId: 'req-5' });
    await repo.transition({ id: draft.id, expectedVersion: 1n, actor: author, toState: 'APPROVED', action: 'APPROVE', now: new Date('2026-01-03T00:00:00Z'), requestId: 'req-6' });
    await expect(new UpdateVersionDraftUseCase(repo).execute({ actor: author, versionId: draft.id, expectedVersion: 2n, revision: '2', requestId: 'req-7' })).rejects.toThrow();
  });
});
