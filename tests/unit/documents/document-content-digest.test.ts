import { describe, expect, it } from 'vitest';
import { assertApprovalEvidence } from '../../../src/modules/documents/domain/document-version.js';
import { documentContentDigest } from '../../../src/modules/documents/domain/document-content-digest.js';

const file = {
  id: 'link-1', documentVersionId: 'version-1', fileId: 'file-1', fileRole: 'SOURCE',
  originalFilename: 'work-instruction.pdf', sizeBytes: 123, sha256: 'a'.repeat(64),
  state: 'ACTIVE', linkedAt: new Date('2026-01-01T00:00:00Z'), linkedBy: 'author-1',
};

function version(revision = '1') {
  const base = { id: 'version-1', documentId: 'document-1', revision, state: 'IN_REVIEW' as const, sourceBindingVerified: true, createdBy: 'author-1', createdAt: new Date('2026-01-01T00:00:00Z'), version: 2n, files: [file] };
  return { ...base, contentHash: documentContentDigest({ documentId: base.documentId, revision, files: base.files }) };
}

describe('controlled document source digest', () => {
  it('binds approval evidence to the exact document, revision, and active file digest', () => {
    expect(() => assertApprovalEvidence(version())).not.toThrow();
    expect(() => assertApprovalEvidence({ ...version(), revision: '2' })).toThrow();
    expect(() => assertApprovalEvidence({ ...version(), documentId: 'document-2' })).toThrow();
    expect(() => assertApprovalEvidence({ ...version(), contentHash: 'b'.repeat(64) })).toThrow();
    expect(() => assertApprovalEvidence({ ...version(), sourceBindingVerified: false })).toThrow();
  });

  it('rejects missing and inactive files', () => {
    expect(() => assertApprovalEvidence({ ...version(), files: [] })).toThrow();
    expect(() => assertApprovalEvidence({ ...version(), files: [{ ...file, state: 'QUARANTINED' }] })).toThrow();
  });
});
