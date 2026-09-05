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

  it('keeps transition validation in the domain before persistence is called', () => {
    const first = createDraftDocumentVersion({ id: '01900000-0000-7000-8000-000000000051', documentId: '01900000-0000-7000-8000-000000000050', revision: '1', createdBy: '01900000-0000-7000-8000-000000000052', now: new Date() });
    const submitted = transitionDocumentVersion(first, 'SUBMIT', new Date());
    expect(() => transitionDocumentVersion(submitted, 'SUBMIT', new Date())).toThrow();
  });
});
