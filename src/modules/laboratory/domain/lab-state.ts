import { AppError } from '../../../shared/errors/app-error.js';
export const labStates = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'PENDING_QCM_APPROVAL',
  'RETURNED',
  'APPROVED',
  'REJECTED',
  'VOID',
] as const;
export type LabState = (typeof labStates)[number];
export type LabAction =
  | 'SAVE'
  | 'SUBMIT'
  | 'REVIEW'
  | 'RETURN'
  | 'RESUME'
  | 'APPROVE'
  | 'FINAL_APPROVE'
  | 'REJECT'
  | 'REOPEN';
// QC-100-FINAL-004: two-stage approval — Supervisor stage approval moves
// UNDER_REVIEW → PENDING_QCM_APPROVAL; only the QCM (MANAGER) or the named
// owner final-approves PENDING_QCM_APPROVAL → APPROVED (locked).
const transitions: Record<LabAction, Partial<Record<LabState, LabState>>> = {
  SAVE: { DRAFT: 'DRAFT' },
  SUBMIT: { DRAFT: 'SUBMITTED' },
  REVIEW: { SUBMITTED: 'UNDER_REVIEW' },
  RETURN: { SUBMITTED: 'RETURNED', UNDER_REVIEW: 'RETURNED', PENDING_QCM_APPROVAL: 'RETURNED' },
  RESUME: { RETURNED: 'DRAFT' },
  APPROVE: { UNDER_REVIEW: 'PENDING_QCM_APPROVAL' },
  FINAL_APPROVE: { PENDING_QCM_APPROVAL: 'APPROVED' },
  // QC-100-FINAL-004: the QCM stage may reject at its own checkpoint.
  REJECT: { UNDER_REVIEW: 'REJECTED', PENDING_QCM_APPROVAL: 'REJECTED' },
  REOPEN: { APPROVED: 'UNDER_REVIEW' },
};
export function transitionLab(state: LabState, action: LabAction): LabState {
  const next = transitions[action]?.[state];
  if (!next) throw new AppError('AUTHZ_DENIED');
  return next;
}
