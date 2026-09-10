import { AppError } from '../errors/app-error.js';
import type { ActorContext } from './types.js';

export type P05Operation =
  | 'APPROVE'
  | 'RELEASE'
  | 'AUTHORIZE_RETEST'
  | 'VOID';

export interface P05CeremonyInput {
  actor: ActorContext;
  operation: P05Operation;
  meaning: string;
  reason?: string;
  reauthenticationSecret?: string;
  requestId: string;
  snapshotHash: string;
  requireReason: boolean;
}

export function assertP05Ceremony(input: P05CeremonyInput): void {
  if (!input.requestId?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (!input.snapshotHash?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (input.meaning !== input.operation)
    throw new AppError('DOMAIN_SIGNATURE_REQUIRED', { userSafe: true });
  if (input.requireReason && !input.reason?.trim())
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (!input.reauthenticationSecret?.trim())
    throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });
  if (input.actor.accountState !== 'ACTIVE')
    throw new AppError('AUTHZ_DENIED', { userSafe: true });
}
