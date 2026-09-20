import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import {
  isFinalApprovalAuthority,
  isNamedSystemOwner,
} from '../../../../shared/authorization/p05-authority.js';
import type { FinalApprovalCeremony } from '../../../e-signatures/application/final-approval-ceremony.js';
import type { InspectionRepository } from '../ports/repository.js';

/**
 * QC-100-FINAL-004 — final (QCM) approval.
 *
 * This is the only transition that makes an inspection report APPROVED and
 * therefore locked. It requires the final-approval authority (QCM = `MANAGER`
 * role, or the named `yazeed/SYSTEM_OWNER` — never Supervisor alone), the
 * `PERM-APR-APPROVE` ceremony grant, SoD against author/executor, and the
 * binding electronic signature produced by the ceremony.
 */
export class FinalApproveInspectionUseCase {
  constructor(
    private readonly repository: InspectionRepository,
    private readonly ceremony: FinalApprovalCeremony,
  ) {}

  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    reauthenticationSecret: string;
    requestId: string;
  }): Promise<{ signatureId: string }> {
    const inspection = await this.repository.get(input.id, input.actor);
    if (!inspection) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!isFinalApprovalAuthority(input.actor))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const authorizeFinal = (action: 'APPROVE' | 'REOPEN') =>
      authorize(
        {
          actor: input.actor,
          permission: 'PERM-APR-APPROVE',
          action,
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
          // The named owner may override stage order; every other final
          // approver must act on a record already approved by Supervisor.
          sod: isNamedSystemOwner(input.actor)
            ? undefined
            : {
                actorId: input.actor.id,
                authorId: inspection.authorId,
                executorId: inspection.authorId,
              },
          businessCondition:
            inspection.state === 'PENDING_QCM_APPROVAL' || isNamedSystemOwner(input.actor),
        },
        { throwOnDeny: true },
      );
    authorizeFinal('APPROVE');
    const signatureEvidence = await this.ceremony.createFinalApprovalEvidence({
      actor: input.actor,
      subjectType: 'INSPECTION_REPORT',
      subjectId: inspection.id,
      subjectVersion: inspection.version,
      currentState: inspection.state,
      meaning: 'FINAL_APPROVE',
      snapshotHash: `inspection:${inspection.id}:v${inspection.version}:final-approval`,
      reauthenticationSecret: input.reauthenticationSecret,
      requestId: input.requestId,
    });
    await this.repository.transition({
      id: input.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      action: 'FINAL_APPROVE',
      signatureEvidence,
      requestId: input.requestId,
    });
    return { signatureId: signatureEvidence.id };
  }
}
