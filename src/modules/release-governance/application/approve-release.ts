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
  assertReleaseAuthority,
  assertReleaseIdentityShape,
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
    if (!input.uatStatus?.trim() || !input.residualRiskStatus?.trim()) {
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    }
    assertReleaseIdentityShape({
      releaseId: input.releaseId,
      gitSha: input.gitSha,
      buildId: input.buildId,
      applicationVersion: input.applicationVersion,
      migrationHead: input.migrationHead,
      uatCycleId: input.uatCycleId,
    });
    const authority = assertReleaseAuthority(input.actor);
    void authority;
    // Fail closed: every gate must be PASS for this exact release candidate.
    assertAllGatesPass(input.gates);
    assertResidualRisksAcceptable(input.risks);

    const candidate = await this.repository.getCandidate(input.releaseId.trim());
    if (!candidate) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (candidate.state !== 'PENDING') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    // Build identity must match the exact same release candidate.
    if (
      candidate.gitSha.toLowerCase() !== input.gitSha.trim().toLowerCase() ||
      candidate.buildId !== input.buildId.trim() ||
      candidate.releaseId !== input.releaseId.trim() ||
      candidate.applicationVersion !== input.applicationVersion.trim() ||
      candidate.migrationHead !== input.migrationHead.trim()
    ) {
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    }

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

    const gateSnapshot = { ...input.gates };
    const riskSnapshot = input.risks.map((risk) => ({ ...risk }));
    const snapshotHash = createHash('sha256')
      .update(
        stableJson({
          releaseId: candidate.releaseId,
          gitSha: input.gitSha.trim().toLowerCase(),
          buildId: input.buildId.trim(),
          applicationVersion: input.applicationVersion.trim(),
          migrationHead: input.migrationHead.trim(),
          uatCycleId: input.uatCycleId.trim(),
          gates: gateSnapshot,
          risks: riskSnapshot,
          uatStatus: input.uatStatus.trim(),
          residualRiskStatus: input.residualRiskStatus.trim(),
        }),
      )
      .digest('hex');
    const signature = this.signatureService.create({
      actorId: input.actor.id,
      subjectType: 'RELEASE_CANDIDATE',
      subjectId: candidate.releaseId,
      subjectVersion: candidate.version,
      action: 'RELEASE_APPROVE',
      meaning: `Approve production release ${candidate.releaseId} at ${input.gitSha.trim().toLowerCase()} build ${input.buildId.trim()}`,
      snapshotHash,
      reauthMethod: 'PASSWORD',
      requestId: input.requestId,
    });

    return this.repository.approve({
      actor: input.actor as ActorContext,
      candidate,
      expectedVersion: input.expectedVersion,
      gitSha: input.gitSha.trim().toLowerCase(),
      buildId: input.buildId.trim(),
      applicationVersion: input.applicationVersion.trim(),
      migrationHead: input.migrationHead.trim(),
      uatStatus: input.uatStatus.trim(),
      residualRiskStatus: input.residualRiskStatus.trim(),
      gateSnapshot,
      riskSnapshot,
      signature,
      requestId: input.requestId.trim(),
    });
  }
}
