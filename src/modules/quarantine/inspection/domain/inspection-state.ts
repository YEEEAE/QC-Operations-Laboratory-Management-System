import { AppError } from '../../../../shared/errors/app-error.js';
export const INSPECTION_STATES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'PENDING_QCM_APPROVAL',
  'RETURNED',
  'APPROVED',
  'REJECTED',
  'VOID',
] as const;
export type InspectionState = (typeof INSPECTION_STATES)[number];
export type InspectionAction =
  | 'SUBMIT'
  | 'BEGIN_REVIEW'
  | 'RETURN'
  | 'RESUME'
  | 'APPROVE'
  | 'FINAL_APPROVE'
  | 'REJECT'
  | 'REOPEN'
  | 'VOID';
// QC-100-FINAL-004: two-stage approval — Supervisor stage approval moves
// UNDER_REVIEW → PENDING_QCM_APPROVAL; only the QCM (MANAGER) or the named
// owner final-approves PENDING_QCM_APPROVAL → APPROVED (locked). RETURN is
// allowed from both review stages back to the author; REOPEN is the audited
// controlled path out of APPROVED.
const transitions: Record<InspectionState, Partial<Record<InspectionAction, InspectionState>>> = {
  DRAFT: { SUBMIT: 'SUBMITTED' },
  SUBMITTED: { BEGIN_REVIEW: 'UNDER_REVIEW', RETURN: 'RETURNED' },
  UNDER_REVIEW: { RETURN: 'RETURNED', APPROVE: 'PENDING_QCM_APPROVAL', REJECT: 'REJECTED' },
  // QC-100-FINAL-004: the QCM stage may return to the author or reject at its
  // own checkpoint, but only FINAL_APPROVE unlocks the record.
  PENDING_QCM_APPROVAL: {
    RETURN: 'RETURNED',
    REJECT: 'REJECTED',
    FINAL_APPROVE: 'APPROVED',
  },
  RETURNED: { RESUME: 'DRAFT' },
  APPROVED: { REOPEN: 'UNDER_REVIEW', VOID: 'VOID' },
  REJECTED: { VOID: 'VOID' },
  VOID: {},
};
export function transitionInspection(s: InspectionState, a: InspectionAction) {
  const n = transitions[s][a];
  if (!n) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  return n;
}
export function requireReason(reason?: string) {
  if (!reason?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
}
