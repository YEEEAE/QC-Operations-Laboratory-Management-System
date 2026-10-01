import { describe, expect, it } from 'vitest';
import { createDraftDocumentVersion } from '../../../src/modules/documents/domain/document-version.js';
import { transitionDocumentVersion } from '../../../src/modules/documents/domain/document-state.js';
import { documentContentDigest } from '../../../src/modules/documents/domain/document-content-digest.js';

describe('controlled document repository contracts', () => {
  it('models a revision as a new technical record and preserves the previous state', () => {
    const first = createDraftDocumentVersion({ id: '01900000-0000-7000-8000-000000000041', documentId: '01900000-0000-7000-8000-000000000040', revision: '1', createdBy: '01900000-0000-7000-8000-000000000042', now: new Date('2026-01-01T00:00:00Z') });
    const file = { id: '01900000-0000-7000-8000-000000000073', documentVersionId: first.id, fileId: '01900000-0000-7000-8000-000000000074', fileRole: 'SOURCE', originalFilename: 'source.pdf', sizeBytes: 10, sha256: 'a'.repeat(64), state: 'ACTIVE', linkedAt: first.createdAt, linkedBy: first.createdBy };
    const bound = { ...first, sourceBindingVerified: true, files: [file], contentHash: documentContentDigest({ documentId: first.documentId, revision: first.revision, files: [file] }) };
    const submitted = transitionDocumentVersion(bound, 'SUBMIT', new Date('2026-01-02T00:00:00Z'));
    const approved = transitionDocumentVersion(submitted, 'APPROVE', new Date('2026-01-03T00:00:00Z'));
    expect(approved.id).toBe(first.id);
    expect(approved.version).toBe(3n);
    expect(first.state).toBe('DRAFT');
    expect(approved.state).toBe('APPROVED');
  });

  it('walks a revision through review, approval, effective, and superseded while retaining prior snapshot fields', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const first = createDraftDocumentVersion({ id: '01900000-0000-7000-8000-000000000071', documentId: '01900000-0000-7000-8000-000000000070', revision: '1', createdBy: '01900000-0000-7000-8000-000000000072', now });
    const files = [{ id: '01900000-0000-7000-8000-000000000073', documentVersionId: first.id, fileId: '01900000-0000-7000-8000-000000000074', fileRole: 'SOURCE', originalFilename: 'source.pdf', sizeBytes: 10, sha256: 'b'.repeat(64), state: 'ACTIVE', linkedAt: now, linkedBy: first.createdBy }];
    const withAttachment = { ...first, sourceBindingVerified: true, files, contentHash: documentContentDigest({ documentId: first.documentId, revision: first.revision, files }) };
    const inReview = transitionDocumentVersion(withAttachment, 'SUBMIT', new Date('2026-01-02T00:00:00Z'));
    const approved = transitionDocumentVersion(inReview, 'APPROVE', new Date('2026-01-03T00:00:00Z'));
    const effective = transitionDocumentVersion(approved, 'MAKE_EFFECTIVE', new Date('2026-01-04T00:00:00Z'));
    const superseded = transitionDocumentVersion(effective, 'SUPERSEDE', new Date('2026-02-01T00:00:00Z'));

    expect([inReview.state, approved.state, effective.state, superseded.state]).toEqual([
      'IN_REVIEW', 'APPROVED', 'EFFECTIVE', 'SUPERSEDED',
    ]);
    expect(superseded).toMatchObject({ contentHash: withAttachment.contentHash, files: withAttachment.files });
    expect(withAttachment).toMatchObject({ state: 'DRAFT', contentHash: withAttachment.contentHash, files: withAttachment.files });
  });

  it('denies submission when a draft has no bound source file', () => {
    const first = createDraftDocumentVersion({ id: '01900000-0000-7000-8000-000000000051', documentId: '01900000-0000-7000-8000-000000000050', revision: '1', createdBy: '01900000-0000-7000-8000-000000000052', now: new Date() });
    expect(() => transitionDocumentVersion(first, 'SUBMIT', new Date())).toThrow();
  });
});
