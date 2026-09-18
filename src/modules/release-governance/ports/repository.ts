import type { ActorContext } from '../../../shared/authorization/types.js';
import type { SignatureEvidence } from '../../e-signatures/domain/signature-evidence.js';
import type {
  ReleaseEvidenceSnapshot,
  ReleaseCandidateIdentity,
  ReleaseGateEvidenceRecord,
  ReleaseRiskEvidenceRecord,
  ResidualRiskEntry,
  ReleaseGateEvidence,
} from '../domain/release-approval.js';

export interface ReleaseCandidateRecord extends ReleaseCandidateIdentity {
  state: 'PENDING' | 'RELEASE_APPROVED';
  uatStatus: string;
  residualRiskStatus: string;
  version: bigint;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReleaseApprovalRecord {
  id: string;
  releaseId: string;
  approvedBy: string;
  authority: 'MANAGER' | 'SYSTEM_OWNER';
  gitSha: string;
  buildId: string;
  applicationVersion: string;
  migrationHead: string;
  uatStatus: string;
  residualRiskStatus: string;
  signatureEvidenceId: string;
  approvedAt: Date;
  requestId: string;
}

export interface ApproveReleaseInput {
  actor: ActorContext;
  releaseId: string;
  expectedVersion: bigint;
  reauthenticationSecret: string;
  requestId: string;
}

export interface ReleaseApprovalReplayInput {
  candidate: ReleaseCandidateRecord;
  requestId: string;
  expectedVersion: bigint;
  actor: ActorContext;
}

export interface ReleaseGovernanceRepository {
  getCandidate(releaseId: string): Promise<ReleaseCandidateRecord | undefined>;
  getEvidence(releaseId: string): Promise<{
    gateRecords: ReleaseGateEvidenceRecord[];
    riskRecords: ReleaseRiskEvidenceRecord[];
  }>;
  /**
   * Resolve an already-committed approval for the exact same command.
   *
   * Returns the stored approval when this request id already completed with a
   * matching command fingerprint, `undefined` when the request id is unused,
   * and fails closed with CONFLICT_DUPLICATE_COMMAND when the request id was
   * reused for different command content. Callers must consult this before any
   * state or version evaluation so a retried command replays instead of being
   * rejected as an invalid transition.
   */
  resolveReplay(input: ReleaseApprovalReplayInput): Promise<ReleaseApprovalRecord | undefined>;
  approve(input: {
    actor: ActorContext;
    candidate: ReleaseCandidateRecord;
    expectedVersion: bigint;
    evidence: ReleaseEvidenceSnapshot;
    uatStatus: string;
    residualRiskStatus: string;
    gateSnapshot: ReleaseGateEvidence;
    riskSnapshot: readonly ResidualRiskEntry[];
    signature: SignatureEvidence;
    requestId: string;
  }): Promise<ReleaseApprovalRecord>;
}
