import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { Inspection } from '../domain/inspection.js';
import type { InspectionRepository } from '../ports/repository.js';
import { isP05Authority } from '../../../../shared/authorization/p05-authority.js';

export interface InspectionApprovalPolicy {
  canApprove(input: { inspection: Inspection; actor: ActorContext }): boolean | Promise<boolean>;
}
const p05ApprovalPolicy: InspectionApprovalPolicy = { canApprove: () => true };

export class ApproveInspectionUseCase {
  constructor(
    private readonly repository: InspectionRepository,
    private readonly policy: InspectionApprovalPolicy = p05ApprovalPolicy,
  ) {}
  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    requestId: string;
  }) {
    const inspection = await this.repository.get(input.id, input.actor);
    if (!inspection) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!isP05Authority(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
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
    authorize(
      { ...common, permission: 'PERM-APR-APPROVE', action: 'APPROVE' },
      { throwOnDeny: true },
    );
    return this.repository.transition({
      id: input.id,
      expectedVersion: input.expectedVersion,
      actor: input.actor,
      action: 'APPROVE',
      requestId: input.requestId,
    });
  }
}
