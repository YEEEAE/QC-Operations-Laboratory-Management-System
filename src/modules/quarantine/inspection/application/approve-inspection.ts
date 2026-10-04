import { stableJson } from '../../../../shared/json/stable-stringify.js';
import { createHash } from 'node:crypto';
import type { FinalApprovalCeremony } from '../../../e-signatures/application/final-approval-ceremony.js';
import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { Inspection } from '../domain/inspection.js';
import type { InspectionRepository } from '../ports/repository.js';
import { isStageOneApprovalAuthority } from '../../../../shared/authorization/p05-authority.js';
import type { DatabaseTransaction } from '../../../../shared/database/transaction.js';

export interface InspectionApprovalPolicy {
  canApprove(input: { inspection: Inspection; actor: ActorContext }): boolean | Promise<boolean>;
}
const p05ApprovalPolicy: InspectionApprovalPolicy = { canApprove: () => true };

/**
 * QC-100-FINAL-004 stage-1 (Supervisor) approval.
 *
 * Owner-approved policy: this action is NOT the final approval. It records the
 * Supervisor stage approval with a distinct formal e-signature and
 * moves the report UNDER_REVIEW → PENDING_QCM_APPROVAL. The record only becomes
 * APPROVED/locked through `FinalApproveInspectionUseCase`, which requires the
 * QCM (MANAGER) or named owner and produces the binding e-signature.
 */
export class ApproveInspectionUseCase {
  constructor(
    private readonly repository: InspectionRepository,
    private readonly policy: InspectionApprovalPolicy = p05ApprovalPolicy,
    private readonly ceremony?: FinalApprovalCeremony,
  ) {}
  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    reauthenticationSecret?: string;
    requestId: string;
    transaction?: DatabaseTransaction;
  }) {
    const inspection = await this.repository.get(input.id, input.actor);
    if (!inspection) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!isStageOneApprovalAuthority(input.actor))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const policyApproved = await this.policy.canApprove({ inspection, actor: input.actor });
    const common = {
      actor: input.actor,
      entity: {
        type: 'INSPECTION_REPORT',
        id: inspection.id,
        state: inspection.state,
        authorId: inspection.authorId,
        executorId: inspection.authorId,
      },
      scope: {
        ownerId: inspection.authorId,
        assigneeId: inspection.assignedTo ?? inspection.authorId,
      },
      currentVersion: inspection.version,
      expectedVersion: input.expectedVersion,
      sod: {
        actorId: input.actor.id,
        authorId: inspection.authorId,
        executorId: inspection.authorId,
      },
      businessCondition:
        inspection.state === 'UNDER_REVIEW' && Boolean(inspection.finalResult) && policyApproved,
    };
    authorize(
      { ...common, permission: 'PERM-INSP-APPROVE', action: 'APPROVE' },
      { throwOnDeny: true },
    );
    if (!this.ceremony) throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });
    const signatureEvidence = await this.ceremony.createFinalApprovalEvidence({
      actor: input.actor,
      subjectType: 'INSPECTION_REPORT',
      subjectId: inspection.id,
      subjectVersion: inspection.version,
      currentState: inspection.state,
      action: 'STAGE1_APPROVE',
      meaning: 'STAGE1_APPROVE',
      snapshotHash: createHash('sha256').update(stableJson(inspection)).digest('hex'),
      reauthenticationSecret: input.reauthenticationSecret ?? '',
      requestId: input.requestId,
    });
    return this.repository.transition({
      id: input.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      action: 'APPROVE',
      signatureEvidence,
      requestId: input.requestId,
      transaction: input.transaction,
    });
  }
}
