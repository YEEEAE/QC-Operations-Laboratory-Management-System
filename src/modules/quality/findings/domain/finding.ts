import { AppError } from '../../../../shared/errors/app-error.js';

export const FINDING_STATES = ['DRAFT', 'OPEN', 'UNDER_REVIEW', 'CLOSED', 'VOID'] as const;
export type FindingState = (typeof FINDING_STATES)[number];
export interface Finding {
  id: string; findingNo: string; title: string; description: string; state: FindingState;
  severity?: string; sourceContext?: Readonly<Record<string, unknown>>; ownerId?: string;
  openedAt?: Date; closedAt?: Date; createdBy: string; createdAt: Date; updatedAt: Date; version: bigint;
}
export type FindingAction = 'OPEN' | 'SUBMIT_REVIEW' | 'RETURN' | 'CLOSE' | 'VOID';
const blank = (v: string, field: string) => { if (!v.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { [field]: ['required'] } }); return v.trim(); };
export function createFinding(input: Omit<Finding, 'state' | 'version' | 'createdAt' | 'updatedAt'> & { now: Date }): Finding {
  return { ...input, findingNo: blank(input.findingNo, 'findingNo'), title: blank(input.title, 'title'), description: blank(input.description, 'description'), state: 'DRAFT', version: 1n, createdAt: input.now, updatedAt: input.now };
}
export function transitionFinding(f: Finding, action: FindingAction, now: Date, reason?: string): Finding {
  const next: Record<FindingAction, Partial<Record<FindingState, FindingState>>> = { OPEN: { DRAFT: 'OPEN' }, SUBMIT_REVIEW: { OPEN: 'UNDER_REVIEW' }, RETURN: { UNDER_REVIEW: 'OPEN' }, CLOSE: { UNDER_REVIEW: 'CLOSED' }, VOID: { DRAFT: 'VOID', OPEN: 'VOID', UNDER_REVIEW: 'VOID' } };
  const state = next[action][f.state];
  if (!state || (action === 'RETURN' || action === 'VOID') && !reason?.trim()) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
  if (action === 'OPEN' && !f.description.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
  return { ...f, state, openedAt: state === 'OPEN' ? now : f.openedAt, closedAt: state === 'CLOSED' ? now : f.closedAt, updatedAt: now, version: f.version + 1n };
}
