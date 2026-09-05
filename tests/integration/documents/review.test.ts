import { describe, expect, it } from 'vitest';
import { ApproveVersionUseCase } from '../../../src/modules/documents/application/approve-version.js';
import { ReviewVersionUseCase } from '../../../src/modules/documents/application/review-version.js';
import { SubmitVersionUseCase } from '../../../src/modules/documents/application/submit-version.js';
import { SupersedeVersionUseCase } from '../../../src/modules/documents/application/supersede-version.js';
import type { DocumentRepository } from '../../../src/modules/documents/ports/repository.js';
import type { DocumentVersion } from '../../../src/modules/documents/domain/document-version.js';
import type { DocumentIdentity } from '../../../src/modules/documents/domain/document.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const authorId = '01900000-0000-7000-8000-000000000011';
const reviewerId = '01900000-0000-7000-8000-000000000012';
const makeActor = (id: string, permissions: ActorContext['permissions']): ActorContext => ({ id, accountState: 'ACTIVE', roles: ['SUPERVISOR'], permissions });
const reviewer = makeActor(reviewerId, [
  { code: 'PERM-DOC-VIEW', scopes: ['GLOBAL'] }, { code: 'PERM-DOC-SUBMIT', scopes: ['GLOBAL'] },
  { code: 'PERM-DOC-REVIEW', scopes: ['GLOBAL'] }, { code: 'PERM-APR-REVIEW', scopes: ['GLOBAL'] },
  { code: 'PERM-DOC-APPROVE', scopes: ['GLOBAL'] }, { code: 'PERM-APR-APPROVE', scopes: ['GLOBAL'] },
]);

function repository(initial: DocumentVersion): DocumentRepository {
  let version = initial;
  const document: DocumentIdentity = { id: initial.documentId, documentNo: 'WI-REVIEW', documentType: 'WI', title: 'Reviewable instruction', active: true, createdBy: authorId, createdAt: new Date('2026-01-01T00:00:00Z'), updatedAt: new Date('2026-01-01T00:00:00Z'), version: 1n };
  return {
    async createDocument() { throw new Error('not used'); }, async getDocument() { return document; }, async listDocuments() { return []; },
    async createVersion() { throw new Error('not used'); }, async getVersion() { return version; }, async listVersions() { return [version]; }, async updateDraft() { throw new Error('not used'); }, async recordReview(input) { version = { ...version, version: version.version + 1n }; return version; },
    async transition(input) { version = { ...version, state: input.toState, version: version.version + 1n, approvedBy: input.toState === 'APPROVED' ? input.actor.id : version.approvedBy, approvedAt: input.toState === 'APPROVED' ? new Date() : version.approvedAt }; return version; },
    async supersede() { throw new Error('not used'); },
  };
}

const draft = (): DocumentVersion => ({ id: '01900000-0000-7000-8000-000000000021', documentId: '01900000-0000-7000-8000-000000000020', revision: '1', state: 'DRAFT', contentHash: 'hash-1', createdBy: authorId, createdAt: new Date('2026-01-01T00:00:00Z'), version: 1n, files: [] });

describe('controlled document review and approval', () => {
  it('submits then reviews without granting approval', async () => {
    const repo = repository(draft());
    const submitted = await new SubmitVersionUseCase(repo).execute({ actor: reviewer, versionId: draft().id, expectedVersion: 1n, requestId: 'req-10' });
    expect(submitted.state).toBe('IN_REVIEW');
    const reviewed = await new ReviewVersionUseCase(repo).execute({ actor: reviewer, versionId: draft().id, expectedVersion: 2n, requestId: 'req-11' });
    expect(reviewed.state).toBe('IN_REVIEW');
    expect(reviewed.approvedAt).toBeUndefined();
  });

  it('requires both document approval and shared approval permission plus SoD', async () => {
    const repo = repository({ ...draft(), state: 'IN_REVIEW', version: 3n });
    await expect(new ApproveVersionUseCase(repo).execute({ actor: makeActor(authorId, reviewer.permissions), versionId: draft().id, expectedVersion: 3n, requestId: 'req-12' })).rejects.toThrow();
    const approved = await new ApproveVersionUseCase(repo).execute({ actor: reviewer, versionId: draft().id, expectedVersion: 3n, requestId: 'req-13' });
    expect(approved.state).toBe('APPROVED');
  });

  it('retains the old version when a policy-approved supersession occurs', async () => {
    const current: DocumentVersion = { ...draft(), id: '01900000-0000-7000-8000-000000000061', state: 'EFFECTIVE', version: 4n, effectiveAt: new Date('2026-01-01T00:00:00Z') };
    const replacement: DocumentVersion = { ...draft(), id: '01900000-0000-7000-8000-000000000062', state: 'APPROVED', version: 2n, contentHash: 'hash-2' };
    const document: DocumentIdentity = { id: current.documentId, documentNo: 'WI-SUPERSEDE', documentType: 'WI', title: 'Superseded instruction', active: true, createdBy: authorId, createdAt: new Date(), updatedAt: new Date(), version: 1n };
    const versions = new Map([[current.id, current], [replacement.id, replacement]]);
    const repo: DocumentRepository = { async createDocument() { throw new Error('not used'); }, async getDocument() { return document; }, async listDocuments() { return []; }, async createVersion() { throw new Error('not used'); }, async getVersion(id) { return versions.get(id); }, async listVersions() { return [...versions.values()]; }, async updateDraft() { throw new Error('not used'); }, async recordReview() { throw new Error('not used'); }, async transition() { throw new Error('not used'); }, async supersede(input) { const old = { ...versions.get(input.currentId)!, state: 'SUPERSEDED' as const, version: input.currentExpectedVersion + 1n }; const next = { ...versions.get(input.replacementId)!, state: 'EFFECTIVE' as const, version: input.replacementExpectedVersion + 1n, effectiveAt: input.effectiveAt }; versions.set(input.currentId, old); versions.set(input.replacementId, next); return { current: old, replacement: next }; } };
    const superseded = await new SupersedeVersionUseCase(repo, { isApproved: () => true }).execute({ actor: { ...reviewer, permissions: [...reviewer.permissions, { code: 'PERM-DOC-SUPERSEDE', scopes: ['GLOBAL'] }] }, currentVersionId: current.id, currentExpectedVersion: 4n, replacementVersionId: replacement.id, replacementExpectedVersion: 2n, effectiveAt: new Date('2026-02-01T00:00:00Z'), requestId: 'req-14' });
    expect(superseded.current.state).toBe('SUPERSEDED');
    expect(superseded.replacement.state).toBe('EFFECTIVE');
    expect(versions.has(current.id)).toBe(true);
  });
});
