import { AppError } from '../../../shared/errors/app-error.js';

/**
 * Allowlisted change fields for target type DOCUMENT_VERSION (Prompt 2).
 *
 * Only operator-editable document-version metadata may be proposed through a
 * change request. Every other field path is rejected server-side with a safe
 * validation error. Labels and data types below are storage/display
 * conventions only — no scientific limits, formulas, or policies are defined
 * here.
 */
export const DOCUMENT_VERSION_CHANGE_FIELDS = ['revision', 'changeSummary'] as const;
export type DocumentVersionChangeField = (typeof DOCUMENT_VERSION_CHANGE_FIELDS)[number];

export const DOCUMENT_VERSION_CHANGE_LABELS: Record<DocumentVersionChangeField, string> = {
  revision: 'Revision reference',
  changeSummary: 'Change summary',
};

/** Storage convention for the operator-editable text-backed attributes. */
export const DOCUMENT_VERSION_CHANGE_DATA_TYPES: Record<DocumentVersionChangeField, string> = {
  revision: 'text',
  changeSummary: 'text',
};

export function isDocumentVersionChangeField(value: string): value is DocumentVersionChangeField {
  return (DOCUMENT_VERSION_CHANGE_FIELDS as readonly string[]).includes(value);
}

export function assertDocumentVersionChangeField(
  fieldPath: string,
): asserts fieldPath is DocumentVersionChangeField {
  if (!isDocumentVersionChangeField(fieldPath)) {
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { changeField: ['not an allowed change field for document versions'] },
    });
  }
}
