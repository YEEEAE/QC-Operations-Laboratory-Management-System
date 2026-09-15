import type { ActorContext } from '../../../shared/authorization/types.js';
import { deriveReleaseEvidence, getReleaseApprovalCapability, isReleaseAuthority, RELEASE_GATE_KEYS } from '../domain/release-approval.js';
export { RELEASE_GATE_KEYS };
import type { ReleaseCandidateRecord } from '../ports/repository.js';
import { releaseGovernanceReadDependencies } from './dependencies.js';

export async function getReleaseApprovalPageModel(input: {
  actor: ActorContext;
  releaseId: string;
}): Promise<{ candidate?: ReleaseCandidateRecord; authorized: boolean; approvable: boolean; evidence?: ReturnType<typeof deriveReleaseEvidence>; disabledReasons: string[] }> {
  const authorized = isReleaseAuthority(input.actor);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.releaseId)) {
    return { authorized, approvable: false, disabledReasons: ['RELEASE_NOT_FOUND'] };
  }
  const repository = releaseGovernanceReadDependencies().repository;
  const candidate = await repository.getCandidate(input.releaseId).catch(() => undefined);
  if (!candidate) return { authorized, approvable: false, disabledReasons: ['RELEASE_NOT_FOUND'] };
  const raw = await repository.getEvidence(candidate.releaseId).catch(() => ({ gateRecords: [], riskRecords: [] }));
  const evidence = deriveReleaseEvidence(candidate, raw.gateRecords, raw.riskRecords, new Date());
  const capability = getReleaseApprovalCapability({ actor: input.actor, gates: evidence.gates, risks: evidence.risks });
  return {
    candidate,
    authorized,
    approvable: candidate.state === 'PENDING' && capability.canApprove,
    evidence,
    disabledReasons: candidate.state === 'PENDING' ? capability.disabledReasons : ['STATE_NOT_PENDING'],
  };
}
