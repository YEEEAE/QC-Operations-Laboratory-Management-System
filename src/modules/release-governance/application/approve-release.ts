import { createHash } from 'node:crypto';
import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { stableJson } from '../../../shared/json/stable-stringify.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import {
  createSignatureEvidence,
  type SignatureEvidence,
} from '../../e-signatures/domain/signature-evidence.js';
import type { ReauthenticationVerifier } from '../../e-signatures/ports/repository.js';
import {
  assertAllGatesPass,
  deriveReleaseEvidence,
  assertReleaseAuthority,
  assertResidualRisksAcceptable,
} from '../domain/release-approval.js';
import type {
  ApproveReleaseInput,
  ReleaseApprovalRecord,
  ReleaseGovernanceRepository,
} from '../ports/repository.js';

export interface ReleaseSignatureService {
  create(input: Omit<SignatureEvidence, 'id' | 'signedAt'>): SignatureEvidence;
}

export class ApproveReleaseUseCase {
  constructor(
    private readonly repository: ReleaseGovernanceRepository,
    private readonly verifier: ReauthenticationVerifier,
    private readonly now: () => Date = () => new Date(),
    private readonly signatureService: ReleaseSignatureService = {
      create: (input) => createSignatureEvidence({ ...input, signedAt: new Date() }),
    },
  ) {}

  async execute(input: ApproveReleaseInput): Promise<ReleaseApprovalRecord> {
    if (!input.requestId?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (!input.releaseId?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (!input.reauthenticationSecret?.trim()) {
      throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });
    }
    const authority = assertReleaseAuthority(input.actor);
    void authority;
    const candidate = await this.repository.getCandidate(input.releaseId.trim());
    if (!candidate) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });

    // Idempotent replay must be resolved before any state, version, or
    // authority evaluation: a retried command whose approval already committed
    // is not an invalid transition, and the repository is the owner of that
    // decision. A reused request id with different command content still fails
    // closed with CONFLICT_DUPLICATE_COMMAND.
    const replayed = await this.repository.resolveReplay({
      candidate,
      requestId: input.requestId.trim(),
      expectedVersion: input.expectedVersion,
      actor: input.actor,
    });
    if (replayed) return replayed;

    if (candidate.state !== 'PENDING')
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });

    const trusted = await this.repository.getEvidence(candidate.releaseId);
    const evidence = deriveReleaseEvidence(
      candidate,
      trusted.gateRecords,
      trusted.riskRecords,
      this.now(),
    );
    // Defense in depth: the UI capability is not an authorization boundary.
    if (!(await this.repository.hasReconciledProductionGateDecision(candidate.releaseId))) {
      throw new AppError('AUTHZ_DENIED', {
        userSafe: true,
        messageKey: 'release.productionGateRegisterNotReconciled',
      });
    }
    assertAllGatesPass(evidence.gates);
    assertResidualRisksAcceptable(evidence.risks);

    authorize(
      {
        actor: input.actor,
        permission: 'PERM-APR-APPROVE',
        action: 'APPROVE',
        entity: { type: 'RELEASE_CANDIDATE', id: candidate.releaseId, state: candidate.state },
        scope: {},
        currentVersion: candidate.version,
        expectedVersion: input.expectedVersion,
        businessCondition: candidate.version === input.expectedVersion,
      },
      { throwOnDeny: true },
    );

    const valid = await this.verifier.verify({
      actorId: input.actor.id,
      secret: input.reauthenticationSecret,
      requestId: input.requestId,
    });
    if (!valid) throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });

    const gateSnapshot = { ...evidence.gates };
    const riskSnapshot = evidence.risks.map((risk) => ({ ...risk }));
    const snapshotHash = createHash('sha256')
      .update(
        stableJson({
          releaseId: candidate.releaseId,
          gitSha: candidate.gitSha.toLowerCase(),
          buildId: candidate.buildId,
          applicationVersion: candidate.applicationVersion,
          migrationHead: candidate.migrationHead,
          uatCycleId: candidate.uatCycleId,
          gates: gateSnapshot,
          risks: riskSnapshot,
          uatStatus: candidate.uatStatus,
          residualRiskStatus: candidate.residualRiskStatus,
        }),
      )
      .digest('hex');
    const signature = this.signatureService.create({
      actorId: input.actor.id,
      subjectType: 'RELEASE_CANDIDATE',
      subjectId: candidate.releaseId,
      subjectVersion: candidate.version,
      action: 'RELEASE_APPROVE',
      meaning: `Approve production release ${candidate.releaseId} at ${candidate.gitSha.toLowerCase()} build ${candidate.buildId}`,
      snapshotHash,
      reauthMethod: 'PASSWORD',
      requestId: input.requestId,
    });

    return this.repository.approve({
      actor: input.actor as ActorContext,
      candidate,
      expectedVersion: input.expectedVersion,
      evidence,
      uatStatus: candidate.uatStatus,
      residualRiskStatus: candidate.residualRiskStatus,
      gateSnapshot,
      riskSnapshot,
      signature,
      requestId: input.requestId.trim(),
    });
  }
}
