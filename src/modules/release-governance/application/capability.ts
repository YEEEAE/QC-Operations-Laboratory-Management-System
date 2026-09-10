import type { ActorContext } from '../../../shared/authorization/types.js';
import { isReleaseAuthority } from '../domain/release-approval.js';
import type { ReleaseCandidateRecord } from '../ports/repository.js';
import { releaseGovernanceReadDependencies } from './dependencies.js';

export async function getReleaseApprovalPageModel(input: {
  actor: ActorContext;
  releaseId: string;
}): Promise<{ candidate?: ReleaseCandidateRecord; authorized: boolean; approvable: boolean }> {
  const authorized = isReleaseAuthority(input.actor);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.releaseId)) {
    return { authorized, approvable: false };
  }
  const candidate = await releaseGovernanceReadDependencies()
    .repository.getCandidate(input.releaseId)
    .catch(() => undefined);
  return {
    candidate,
    authorized,
    approvable: Boolean(candidate && candidate.state === 'PENDING' && authorized),
  };
}
