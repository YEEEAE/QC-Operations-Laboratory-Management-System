import { AppError } from '../../../shared/errors/app-error.js';
import type { DocumentVersion, DocumentVersionState } from './document-version.js';

export type DocumentVersionAction = 'SUBMIT' | 'RETURN' | 'RESUME' | 'APPROVE' | 'MAKE_EFFECTIVE' | 'SUPERSEDE' | 'ARCHIVE' | 'VOID';

const transitions: Record<DocumentVersionAction, readonly [DocumentVersionState, DocumentVersionState][]> = {
  SUBMIT: [['DRAFT', 'IN_REVIEW']],
  RETURN: [['IN_REVIEW', 'RETURNED']],
  RESUME: [['RETURNED', 'DRAFT']],
  APPROVE: [['IN_REVIEW', 'APPROVED']],
  MAKE_EFFECTIVE: [['APPROVED', 'EFFECTIVE']],
  SUPERSEDE: [['EFFECTIVE', 'SUPERSEDED']],
  ARCHIVE: [['SUPERSEDED', 'ARCHIVED']],
  VOID: [['DRAFT', 'VOID'], ['IN_REVIEW', 'VOID'], ['RETURNED', 'VOID'], ['APPROVED', 'VOID'], ['EFFECTIVE', 'VOID'], ['SUPERSEDED', 'VOID']],
};

export function nextDocumentVersionState(state: DocumentVersionState, action: DocumentVersionAction): DocumentVersionState {
  const transition = transitions[action].find(([from]) => from === state);
  if (!transition) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  return transition[1];
}

export function transitionDocumentVersion(version: DocumentVersion, action: DocumentVersionAction, now: Date, reason?: string): DocumentVersion {
  const nextState = nextDocumentVersionState(version.state, action);
  if (['RETURN', 'VOID'].includes(action) && !reason?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { reason: ['required'] } });
  if (action === 'APPROVE' && !version.contentHash?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { contentHash: ['required before approval'] } });
  return {
    ...version,
    state: nextState,
    updatedAt: now,
    version: version.version + 1n,
    ...(action === 'APPROVE' ? { approvedAt: now } : {}),
    ...(action === 'MAKE_EFFECTIVE' ? { effectiveAt: now } : {}),
    ...(action === 'SUPERSEDE' ? { supersededAt: now } : {}),
    ...(action === 'ARCHIVE' ? { archivedAt: now } : {}),
    ...(action === 'VOID' ? { voidedAt: now, voidReason: reason?.trim() } : {}),
  };
}
