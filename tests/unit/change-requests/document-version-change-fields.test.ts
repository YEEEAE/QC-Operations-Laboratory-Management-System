import { describe, expect, it } from 'vitest';
import {
  DOCUMENT_VERSION_CHANGE_DATA_TYPES,
  DOCUMENT_VERSION_CHANGE_FIELDS,
  DOCUMENT_VERSION_CHANGE_LABELS,
  assertDocumentVersionChangeField,
  isDocumentVersionChangeField,
} from '../../../src/modules/change-requests/application/document-version-change-fields.js';

describe('DOCUMENT_VERSION change field allowlist (Prompt 2)', () => {
  it('allows exactly revision, changeSummary, and contentHash', () => {
    expect([...DOCUMENT_VERSION_CHANGE_FIELDS]).toEqual([
      'revision',
      'changeSummary',
      'contentHash',
    ]);
  });

  it('accepts the revision field', () => {
    expect(isDocumentVersionChangeField('revision')).toBe(true);
    expect(() => assertDocumentVersionChangeField('revision')).not.toThrow();
  });

  it('accepts the changeSummary field', () => {
    expect(isDocumentVersionChangeField('changeSummary')).toBe(true);
    expect(() => assertDocumentVersionChangeField('changeSummary')).not.toThrow();
  });

  it('accepts the contentHash field', () => {
    expect(isDocumentVersionChangeField('contentHash')).toBe(true);
    expect(() => assertDocumentVersionChangeField('contentHash')).not.toThrow();
  });

  it('rejects any other field with a safe validation error', () => {
    expect(isDocumentVersionChangeField('title')).toBe(false);
    try {
      assertDocumentVersionChangeField('title');
      expect.unreachable('arbitrary field paths must be rejected');
    } catch (error) {
      expect(error).toMatchObject({ code: 'VALIDATION_FAILED' });
    }
  });

  it('renders human labels and storage data types without storage-model leakage', () => {
    for (const field of DOCUMENT_VERSION_CHANGE_FIELDS) {
      expect(DOCUMENT_VERSION_CHANGE_LABELS[field]).toMatch(/./);
      expect(DOCUMENT_VERSION_CHANGE_LABELS[field]).not.toMatch(/uuid|json|snapshot|field_path/i);
      expect(DOCUMENT_VERSION_CHANGE_DATA_TYPES[field]).toBe('text');
    }
  });
});
