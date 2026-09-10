import type { ActorContext } from '../../../shared/authorization/types.js';
import type { SignatureEvidence } from '../../e-signatures/domain/signature-evidence.js';
import type {
  ReleaseCandidateIdentity,
  ReleaseGateEvidence,
  ResidualRiskEntry,
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
  gitSha: string;
  buildId: string;
  applicationVersion: string;
  migrationHead: string;
  uatCycleId: string;
  gates: ReleaseGateEvidence;
  risks: readonly ResidualRiskEntry[];
  uatStatus: string;
  residualRiskStatus: string;
  reauthenticationSecret: string;
  requestId: string;
}

export interface ReleaseGovernanceRepository {
  getCandidate(releaseId: string): Promise<ReleaseCandidateRecord | undefined>;
  approve(input: {
    actor: ActorContext;
    candidate: ReleaseCandidateRecord;
    expectedVersion: bigint;
    gitSha: string;
    buildId: string;
    applicationVersion: string;
    migrationHead: string;
    uatStatus: string;
    residualRiskStatus: string;
    gateSnapshot: ReleaseGateEvidence;
    riskSnapshot: readonly ResidualRiskEntry[];
    signature: SignatureEvidence;
    requestId: string;
  }): Promise<ReleaseApprovalRecord>;
}
