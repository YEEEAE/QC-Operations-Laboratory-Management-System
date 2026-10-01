import { describe, expect, it } from 'vitest';
import { CreateDocumentUseCase } from '../../../src/modules/documents/application/create-document.js';
import { CreateVersionUseCase } from '../../../src/modules/documents/application/create-version.js';
import { GetDocumentUseCase } from '../../../src/modules/documents/application/get-document.js';
import { UpdateVersionDraftUseCase } from '../../../src/modules/documents/application/update-version-draft.js';
import type { DocumentRepository } from '../../../src/modules/documents/ports/repository.js';
import type { DocumentIdentity } from '../../../src/modules/documents/domain/document.js';
import type { DocumentVersion } from '../../../src/modules/documents/domain/document-version.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { documentContentDigest } from '../../../src/modules/documents/domain/document-content-digest.js';
import { expectedPredecessorOf } from '../../../src/modules/documents/domain/revision-creation.js';
const sourceFileId = '01900000-0000-7000-8000-000000000099';
const sourceFile = { id: sourceFileId, originalFilename: 'approved-instruction.pdf', sizeBytes: 120, uploadedAt: new Date('2026-01-01T00:00:00Z'), sha256: 'a'.repeat(64), state: 'ACTIVE' as const };

const author: ActorContext = {
  id: '01900000-0000-7000-8000-000000000001', accountState: 'ACTIVE', roles: ['EMPLOYEE'],
  permissions: [
    { code: 'PERM-DOC-CREATE', scopes: ['OWN'] }, { code: 'PERM-DOC-VIEW', scopes: ['OWN'] },
    { code: 'PERM-DOC-EDIT-DRAFT', scopes: ['OWN'] },
    { code: 'PERM-DOC-REVISE', scopes: ['OWN'] },
  ],
};

function repository(): DocumentRepository & { documents: DocumentIdentity[]; versions: DocumentVersion[] } {
  const state = { documents: [] as DocumentIdentity[], versions: [] as DocumentVersion[] };
  return {
    ...state,
    async createDocument(input) { state.documents.push(input.document); return input.document; },
    async getDocument(id) { return state.documents.find((item) => item.id === id); },
    async listSourceFiles() { return [sourceFile]; },
    async listDocuments() { return state.documents; },
    async createVersion(input) {
      const files = input.sourceFiles.map((source) => ({ id: '01900000-0000-7000-8000-000000000098', documentVersionId: input.version.id, fileId: source.fileId, fileRole: source.fileRole, originalFilename: sourceFile.originalFilename, sizeBytes: sourceFile.sizeBytes, sha256: sourceFile.sha256, state: sourceFile.state, linkedAt: input.version.createdAt, linkedBy: input.actor.id }));
      const version = { ...input.version, sourceBindingVerified: true, files, contentHash: documentContentDigest({ documentId: input.version.documentId, revision: input.version.revision, files }) };
      state.versions.push(version); return version;
    },
    async getVersion(id) { return state.versions.find((item) => item.id === id); },
    async listVersions(documentId) { return state.versions.filter((item) => item.documentId === documentId).sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime() || right.id.localeCompare(left.id)); },
    async updateDraft(input) {
      const current = state.versions.find((item) => item.id === input.id);
      if (!current || current.version !== input.expectedVersion || current.state !== 'DRAFT') throw new Error('stale or immutable');
      const updated = { ...current, revision: input.revision, changeSummary: input.changeSummary, sourceBindingVerified: true, contentHash: documentContentDigest({ documentId: current.documentId, revision: input.revision, files: current.files }), version: current.version + 1n, updatedAt: input.now };
      state.versions.splice(state.versions.indexOf(current), 1, updated);
      return updated;
    },
    async recordReview() { throw new Error('not used'); },
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
    const draft = await new CreateVersionUseCase(repo, () => new Date('2026-01-01T00:00:00Z')).execute({ actor: author, documentId: document.id, revision: '1', changeSummary: 'Initial draft', fileIds: [sourceFileId], expectedDocumentVersion: document.version, expectedPredecessor: null, requestId: 'req-2' });
    expect(draft.documentId).toBe(document.id);
    const edited = await new UpdateVersionDraftUseCase(repo, () => new Date('2026-01-02T00:00:00Z')).execute({ actor: author, versionId: draft.id, expectedVersion: 1n, revision: '1', changeSummary: 'Clarified scope', requestId: 'req-3' });
    expect(edited.version).toBe(2n);
    expect(edited.state).toBe('DRAFT');
  });

  it('denies editing after the version is approved', async () => {
    const repo = repository();
    const document = await new CreateDocumentUseCase(repo).execute({ actor: author, documentNo: 'WI-002', documentType: 'WI', title: 'Approved instruction', requestId: 'req-4' });
    const draft = await new CreateVersionUseCase(repo).execute({ actor: author, documentId: document.id, revision: '1', fileIds: [sourceFileId], expectedDocumentVersion: document.version, expectedPredecessor: null, requestId: 'req-5' });
    await repo.transition({ id: draft.id, expectedVersion: 1n, actor: author, toState: 'APPROVED', action: 'APPROVE', now: new Date('2026-01-03T00:00:00Z'), requestId: 'req-6' });
    await expect(new UpdateVersionDraftUseCase(repo).execute({ actor: author, versionId: draft.id, expectedVersion: 2n, revision: '2', requestId: 'req-7' })).rejects.toThrow();
  });

  it('selects the newest returned version and does not fall back to an older approved predecessor', async () => {
    const repo = repository();
    const document = await new CreateDocumentUseCase(repo).execute({ actor: author, documentNo: 'WI-003', documentType: 'WI', title: 'Revision order fixture', requestId: 'req-8' });
    const older = {
      id: '01900000-0000-7000-8000-000000000081', documentId: document.id, revision: '1', state: 'APPROVED' as const,
      createdBy: author.id, createdAt: new Date('2026-01-01T00:00:00Z'), version: 2n, files: [],
    };
    const latest = {
      id: '01900000-0000-7000-8000-000000000082', documentId: document.id, revision: '2', state: 'RETURNED' as const,
      createdBy: author.id, createdAt: new Date('2026-02-01T00:00:00Z'), version: 3n, files: [],
    };
    repo.versions.push(older, latest);

    await expect(new CreateVersionUseCase(repo).execute({
      actor: author, documentId: document.id, revision: '3', fileIds: [sourceFileId],
      expectedDocumentVersion: document.version, expectedPredecessor: expectedPredecessorOf([latest, older]), requestId: 'req-9',
    })).rejects.toMatchObject({ code: 'DOMAIN_INVALID_TRANSITION' });
    expect(repo.versions).toHaveLength(2);
  });

  it('permits only one open revision and requires an explicit EFFECTIVE predecessor', async () => {
    const repo = repository();
    const document = await new CreateDocumentUseCase(repo).execute({ actor: author, documentNo: 'WI-004', documentType: 'WI', title: 'One draft fixture', requestId: 'req-10' });
    const first = await new CreateVersionUseCase(repo).execute({
      actor: author, documentId: document.id, revision: '1', fileIds: [sourceFileId],
      expectedDocumentVersion: document.version, expectedPredecessor: null, requestId: 'req-11',
    });
    await expect(new CreateVersionUseCase(repo).execute({
      actor: author, documentId: document.id, revision: '2', fileIds: [sourceFileId],
      expectedDocumentVersion: document.version, expectedPredecessor: expectedPredecessorOf([first]), requestId: 'req-12',
    })).rejects.toMatchObject({ code: 'DOMAIN_INVALID_TRANSITION' });

    const approved = { ...first, state: 'APPROVED' as const, version: 2n };
    repo.versions.splice(repo.versions.indexOf(first), 1, approved);
    await expect(new CreateVersionUseCase(repo).execute({
      actor: author, documentId: document.id, revision: '2', fileIds: [sourceFileId],
      expectedDocumentVersion: document.version, expectedPredecessor: expectedPredecessorOf([approved]), requestId: 'req-13',
    })).rejects.toMatchObject({ code: 'DOMAIN_INVALID_TRANSITION' });

    const effectiveAt = new Date('2026-01-10T00:00:00Z');
    const effective = { ...approved, state: 'EFFECTIVE' as const, version: 3n, effectiveAt };
    repo.versions.splice(repo.versions.indexOf(approved), 1, effective);
    const next = await new CreateVersionUseCase(repo).execute({
      actor: author, documentId: document.id, revision: '2', fileIds: [sourceFileId],
      expectedDocumentVersion: document.version, expectedPredecessor: expectedPredecessorOf([effective]), requestId: 'req-14',
    });
    expect(next.state).toBe('DRAFT');
    expect(effective.state).toBe('EFFECTIVE');
    expect(effective.effectiveAt).toEqual(effectiveAt);
  });

  it('keeps a valid document readable while denying revision creation without its permission', async () => {
    const repo = repository();
    const document = await new CreateDocumentUseCase(repo).execute({ actor: author, documentNo: 'WI-005', documentType: 'WI', title: 'Read control fixture', requestId: 'req-15' });
    const effective = {
      id: '01900000-0000-7000-8000-000000000091', documentId: document.id, revision: '1', state: 'EFFECTIVE' as const,
      createdBy: author.id, createdAt: new Date('2026-01-01T00:00:00Z'), effectiveAt: new Date('2026-01-02T00:00:00Z'), version: 2n, files: [],
    };
    repo.versions.push(effective);
    const readOnlyActor: ActorContext = { ...author, permissions: author.permissions.filter((permission) => permission.code !== 'PERM-DOC-REVISE') };

    await expect(new GetDocumentUseCase(repo).execute({ actor: readOnlyActor, documentId: document.id })).resolves.toMatchObject({ id: document.id, versions: [{ state: 'EFFECTIVE' }] });
    await expect(new CreateVersionUseCase(repo).execute({
      actor: readOnlyActor, documentId: document.id, revision: '2', fileIds: [sourceFileId],
      expectedDocumentVersion: document.version, expectedPredecessor: expectedPredecessorOf([effective]), requestId: 'req-16',
    })).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    expect(repo.versions).toEqual([effective]);
  });

  it('rejects stale parent and predecessor snapshots without changing history', async () => {
    const repo = repository();
    const document = await new CreateDocumentUseCase(repo).execute({ actor: author, documentNo: 'WI-006', documentType: 'WI', title: 'Stale history fixture', requestId: 'req-17' });
    const effective = {
      id: '01900000-0000-7000-8000-000000000092', documentId: document.id, revision: '1', state: 'EFFECTIVE' as const,
      createdBy: author.id, createdAt: new Date('2026-01-01T00:00:00Z'), effectiveAt: new Date('2026-01-02T00:00:00Z'), version: 2n, files: [],
    };
    repo.versions.push(effective);

    await expect(new CreateVersionUseCase(repo).execute({
      actor: author, documentId: document.id, revision: '2', fileIds: [sourceFileId],
      expectedDocumentVersion: document.version + 1n, expectedPredecessor: expectedPredecessorOf([effective]), requestId: 'req-18',
    })).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    await expect(new CreateVersionUseCase(repo).execute({
      actor: author, documentId: document.id, revision: '2', fileIds: [sourceFileId],
      expectedDocumentVersion: document.version, expectedPredecessor: { id: effective.id, state: effective.state, version: 1n }, requestId: 'req-19',
    })).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    expect(repo.versions).toEqual([effective]);
  });
});
