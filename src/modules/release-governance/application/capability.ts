import type { ActorContext } from '../../../shared/authorization/types.js';
import { getRuntimeConfig } from '../../../config/runtime.js';
import {
  deriveReleaseEvidence,
  getReleaseApprovalCapability,
  isReleaseAuthority,
  RELEASE_GATE_KEYS,
} from '../domain/release-approval.js';
export { RELEASE_GATE_KEYS };
import type { ReleaseCandidateRecord, ReleaseGovernanceRepository } from '../ports/repository.js';
import { releaseGovernanceReadDependencies } from './dependencies.js';
import { isCurrentRuntimeIdentityForCandidate } from './runtime-identity-check.js';

type ReleasePageRepository = Pick<
  ReleaseGovernanceRepository,
  'getCandidate' | 'getEvidence' | 'hasReconciledProductionGateDecision'
>;

export async function getReleaseApprovalPageModel(
  input: { actor: ActorContext; releaseId: string },
  repositoryOverride?: ReleasePageRepository,
): Promise<{
  candidate?: ReleaseCandidateRecord;
  candidateReadUnavailable: boolean;
  evidenceReadUnavailable: boolean;
  authorized: boolean;
  approvable: boolean;
  evidence?: ReturnType<typeof deriveReleaseEvidence>;
  disabledReasons: string[];
}> {
  const authorized = isReleaseAuthority(input.actor);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.releaseId)) {
    return {
      authorized,
      approvable: false,
      candidateReadUnavailable: false,
      evidenceReadUnavailable: false,
      disabledReasons: ['RELEASE_NOT_FOUND'],
    };
  }

  const repository = repositoryOverride ?? releaseGovernanceReadDependencies().repository;
  let candidate: ReleaseCandidateRecord | undefined;
  try {
    candidate = await repository.getCandidate(input.releaseId);
  } catch {
    return {
      authorized,
      approvable: false,
      candidateReadUnavailable: true,
      evidenceReadUnavailable: false,
      disabledReasons: ['CANDIDATE_PROVIDER_UNAVAILABLE'],
    };
  }
  if (!candidate) {
    return {
      authorized,
      approvable: false,
      candidateReadUnavailable: false,
      evidenceReadUnavailable: false,
      disabledReasons: ['RELEASE_NOT_FOUND'],
    };
  }

  let raw: Awaited<ReturnType<ReleasePageRepository['getEvidence']>>;
  let evidenceReadUnavailable = false;
  try {
    raw = await repository.getEvidence(candidate.releaseId);
  } catch {
    evidenceReadUnavailable = true;
    raw = { gateRecords: [], riskRecords: [] };
  }
  const evidence = deriveReleaseEvidence(candidate, raw.gateRecords, raw.riskRecords, new Date());
  const runtimeIdentityMatches = isCurrentRuntimeIdentityForCandidate(
    getRuntimeConfig().release,
    candidate,
  );
  const capability = getReleaseApprovalCapability({
    actor: input.actor,
    gates: evidence.gates,
    risks: evidence.risks,
    productionGateDecisionReconciled: evidenceReadUnavailable
      ? false
      : await repository
          .hasReconciledProductionGateDecision(candidate.releaseId)
          .catch(() => false),
  });
  return {
    candidate,
    candidateReadUnavailable: false,
    evidenceReadUnavailable,
    authorized,
    approvable:
      !evidenceReadUnavailable &&
      candidate.state === 'PENDING' &&
      capability.canApprove &&
      runtimeIdentityMatches,
    evidence,
    disabledReasons:
      candidate.state !== 'PENDING'
        ? ['STATE_NOT_PENDING']
        : [
            ...(evidenceReadUnavailable ? ['EVIDENCE_PROVIDER_UNAVAILABLE'] : []),
            ...(!runtimeIdentityMatches ? ['IDENTITY_NOT_VERIFIED'] : []),
            ...capability.disabledReasons,
          ],
  };
}
