import { deny, allow } from './decision';
import type { AuthorizationDecision, SodContext } from './types';
export function evaluateSeparationOfDuties(
  input: SodContext & { action: string; entityType: string },
): AuthorizationDecision {
  const self = input.actorId === input.authorId || input.actorId === input.executorId;
  if (self && ['REVIEW', 'APPROVE', 'REJECT', 'RELEASE', 'SIGN'].includes(input.action))
    return deny('AUTHZ_SOD_VIOLATION', 'Self-review or self-approval is denied by default.');
  return allow();
}
