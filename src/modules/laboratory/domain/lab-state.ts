import { AppError } from '../../../shared/errors/app-error.js';
export const labStates = ['DRAFT','SUBMITTED','UNDER_REVIEW','RETURNED','APPROVED','REJECTED','VOID'] as const;
export type LabState = typeof labStates[number];
export type LabAction = 'SAVE' | 'SUBMIT' | 'REVIEW' | 'RETURN' | 'RESUME' | 'APPROVE';
const transitions: Record<LabAction, Partial<Record<LabState, LabState>>> = {
  SAVE: {DRAFT:'DRAFT'}, SUBMIT:{DRAFT:'SUBMITTED'}, REVIEW:{SUBMITTED:'UNDER_REVIEW'},
  RETURN:{SUBMITTED:'RETURNED',UNDER_REVIEW:'RETURNED'}, RESUME:{RETURNED:'DRAFT'}, APPROVE:{UNDER_REVIEW:'APPROVED'},
};
export function transitionLab(state: LabState, action: LabAction): LabState {
  const next = transitions[action]?.[state];
  if (!next) throw new AppError('AUTHZ_DENIED');
  return next;
}
