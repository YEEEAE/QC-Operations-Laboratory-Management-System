import { AppError } from '../errors/app-error';
export interface AuditEventInput {
  actorType: 'USER' | 'SYSTEM' | 'SERVICE';
  actorId?: string;
  subjectType: string;
  subjectId: string;
  action: string;
  transitionId?: string;
  oldState?: string;
  newState?: string;
  reason?: string;
  requestId: string;
  signatureId?: string;
  payload?: Record<string, unknown>;
}
const forbidden = /password|token|secret|cookie|authorization/i;
export function assertSafeAuditPayload(payload: Record<string, unknown> | undefined): void {
  if (payload && Object.keys(payload).some((key) => forbidden.test(key)))
    throw new AppError('VALIDATION_FAILED');
}
