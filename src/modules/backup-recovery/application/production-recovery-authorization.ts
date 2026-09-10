import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';

export interface ProductionRecoveryAuthorizationInput {
  actor: ActorContext;
  reauthenticated: boolean;
  signatureEvidenceId?: string;
  artifactId: string;
  artifactSha256: string;
  releaseId: string;
  gitSha: string;
  buildId: string;
  migrationHead: string;
  expectedVersion: bigint;
  currentVersion: bigint;
  reason: string;
  requestId: string;
}

/** Production recovery is deliberately stricter than drill intent. */
export function authorizeProductionRecovery(input: ProductionRecoveryAuthorizationInput): void {
  if (input.actor.id !== 'yazeed' || !input.actor.roles.includes('SYSTEM_OWNER'))
    throw new AppError('AUTHZ_DENIED', { userSafe: true });
  if (!input.reauthenticated) throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });
  if (!input.signatureEvidenceId?.trim()) throw new AppError('AUTHZ_DENIED', { userSafe: true });
  if (!input.artifactId.trim() || !input.artifactSha256.trim() || !input.releaseId.trim() || !input.gitSha.trim() || !input.buildId.trim() || !input.migrationHead.trim())
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (!input.reason.trim() || !input.requestId.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
  if (input.expectedVersion !== input.currentVersion)
    throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
}
