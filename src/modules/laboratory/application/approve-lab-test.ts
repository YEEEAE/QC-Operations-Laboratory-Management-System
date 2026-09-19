import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { isStageOneApprovalAuthority } from '../../../shared/authorization/p05-authority.js';
import { transitionLab } from '../domain/lab-state.js';
import type { ControlledLabSources, LabApprovalPolicy } from '../ports/controlled-sources.js';
import type { LabRepository } from '../ports/repository.js';
import { authorizeLab } from './lab-authorization.js';
/**
 * P-05 (PD-09, CLOSED) supplies the approved authority decision for lab test
 * stage approval: Supervisor, Manager, or named yazeed/SYSTEM_OWNER with the
 * explicit permission. The injected hook remains for additional controlled
 * policy; the default adds nothing beyond P-05.
 */
const p05ApprovalPolicy: LabApprovalPolicy = { authorize: async () => undefined };
/**
 * QC-100-FINAL-004 stage-1 (Supervisor) approval.
 *
 * Owner-approved policy: this is NOT the final approval and carries no formal
 * e-signature. It validates the provider-evaluated scientific result and moves
 * the test UNDER_REVIEW → PENDING_QCM_APPROVAL. Only
 * `FinalApproveLabTestUseCase` (QCM / named owner + binding e-signature) can
 * reach APPROVED and lock the record.
 */
export class ApproveLabTestUseCase {
  constructor(
    private readonly repository: LabRepository,
    private readonly sources: ControlledLabSources,
    private readonly policy: LabApprovalPolicy = p05ApprovalPolicy,
    private readonly now = () => new Date(),
  ) {}
  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    requestId: string;
  }) {
    const test = await this.repository.get(input.id, input.actor);
    if (!test) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!isStageOneApprovalAuthority(input.actor))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    authorizeLab(input.actor, test, 'PERM-LAB-APPROVE', 'APPROVE', input.expectedVersion, true);
    await this.policy.authorize({
      test,
      actor: input.actor,
      expectedVersion: input.expectedVersion,
    });
    const evaluation = await this.sources.evaluate(test);
    if (
      evaluation.sourceReference !== test.context.sourceReference ||
      evaluation.contentHash !== test.context.contentHash
    )
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const at = this.now().toISOString();
    return this.repository.save(
      test,
      {
        ...test,
        state: transitionLab(test.state, 'APPROVE'),
        scientificResult: evaluation.result,
        version: test.version + 1n,
        updatedAt: at,
      },
      { actor: input.actor, requestId: input.requestId, action: 'APPROVE' },
    );
  }
}
