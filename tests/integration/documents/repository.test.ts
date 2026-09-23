import { describe, expect, it } from 'vitest';
import { createDraftDocumentVersion } from '../../../src/modules/documents/domain/document-version.js';
import { transitionDocumentVersion } from '../../../src/modules/documents/domain/document-state.js';

describe('controlled document repository contracts', () => {
  it('models a revision as a new technical record and preserves the previous state', () => {
    const first = createDraftDocumentVersion({ id: '01900000-0000-7000-8000-000000000041', documentId: '01900000-0000-7000-8000-000000000040', revision: '1', contentHash: 'hash-1', createdBy: '01900000-0000-7000-8000-000000000042', now: new Date('2026-01-01T00:00:00Z') });
    const submitted = transitionDocumentVersion(first, 'SUBMIT', new Date('2026-01-02T00:00:00Z'));
    const approved = transitionDocumentVersion(submitted, 'APPROVE', new Date('2026-01-03T00:00:00Z'));
    expect(approved.id).toBe(first.id);
    expect(approved.version).toBe(3n);
    expect(first.state).toBe('DRAFT');
    expect(approved.state).toBe('APPROVED');
  });

  it('walks a revision through review, approval, effective, and superseded while retaining prior snapshot fields', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const first = createDraftDocumentVersion({ id: '01900000-0000-7000-8000-000000000071', documentId: '01900000-0000-7000-8000-000000000070', revision: '1', contentHash: 'content-sha-1', createdBy: '01900000-0000-7000-8000-000000000072', now });
    const withAttachment = { ...first, files: [{ id: '01900000-0000-7000-8000-000000000073', documentVersionId: first.id, fileId: '01900000-0000-7000-8000-000000000074', fileRole: 'SOURCE', linkedAt: now, linkedBy: first.createdBy }] };
    const inReview = transitionDocumentVersion(withAttachment, 'SUBMIT', new Date('2026-01-02T00:00:00Z'));
    const approved = transitionDocumentVersion(inReview, 'APPROVE', new Date('2026-01-03T00:00:00Z'));
    const effective = transitionDocumentVersion(approved, 'MAKE_EFFECTIVE', new Date('2026-01-04T00:00:00Z'));
    const superseded = transitionDocumentVersion(effective, 'SUPERSEDE', new Date('2026-02-01T00:00:00Z'));

    expect([inReview.state, approved.state, effective.state, superseded.state]).toEqual([
      'IN_REVIEW', 'APPROVED', 'EFFECTIVE', 'SUPERSEDED',
    ]);
    expect(superseded).toMatchObject({ contentHash: 'content-sha-1', files: withAttachment.files });
    expect(withAttachment).toMatchObject({ state: 'DRAFT', contentHash: 'content-sha-1', files: withAttachment.files });
  });

  it('keeps transition validation in the domain before persistence is called', () => {
    const first = createDraftDocumentVersion({ id: '01900000-0000-7000-8000-000000000051', documentId: '01900000-0000-7000-8000-000000000050', revision: '1', createdBy: '01900000-0000-7000-8000-000000000052', now: new Date() });
    const submitted = transitionDocumentVersion(first, 'SUBMIT', new Date());
    expect(() => transitionDocumentVersion(submitted, 'SUBMIT', new Date())).toThrow();
  });
});
