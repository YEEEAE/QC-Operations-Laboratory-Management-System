import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import {
  isFinalApprovalAuthority,
  isNamedSystemOwner,
} from '../../../shared/authorization/p05-authority.js';
import { decideApprovalPath } from '../../approvals/application/owner-approval-policy.js';
import type { FinalApprovalCeremony } from '../../e-signatures/application/final-approval-ceremony.js';
import { transitionLab } from '../domain/lab-state.js';
import type { LabRepository } from '../ports/repository.js';
import { authorizeLab } from './lab-authorization.js';

/**
 * QC-100-FINAL-004 — final (QCM) approval of a laboratory test.
 *
 * The single transition that makes a lab test APPROVED and locked. Requires
 * the final-approval authority (QCM = `MANAGER`, or the named
 * `yazeed/SYSTEM_OWNER` — never Supervisor alone), the `PERM-APR-APPROVE`
 * ceremony grant on PENDING_QCM_APPROVAL, SoD against the author, and the
 * binding electronic signature.
 */
export class FinalApproveLabTestUseCase {
  constructor(
    private readonly repository: LabRepository,
    private readonly ceremony: FinalApprovalCeremony,
    private readonly now = () => new Date(),
  ) {}

  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    reauthenticationSecret?: string;
    requestId: string;
  }): Promise<{ signatureId?: string }> {
    const test = await this.repository.get(input.id, input.actor);
    if (!test) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!isFinalApprovalAuthority(input.actor))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    // Do not let an internal owner click bypass the scientific evaluation stage.
    if (test.state !== 'PENDING_QCM_APPROVAL')
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (test.scientificResult !== 'PASS')
      throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
    const qualificationPolicy = test.context.qualificationPolicy;
    const qualifiedRoles = qualificationPolicy.qualifiedOwnerRoles;
    if (!Array.isArray(qualifiedRoles) || !qualifiedRoles.length || !input.actor.roles.some((role) => qualifiedRoles.includes(role)))
      throw new AppError('METHOD_SOURCE_REQUIRED', { userSafe: true });
    authorizeLab(
      input.actor,
      test,
      'PERM-APR-APPROVE',
      'APPROVE',
      input.expectedVersion,
      true,
    );
    const signatureEvidence = isNamedSystemOwner(input.actor)
      ? undefined
      : await this.ceremony.createFinalApprovalEvidence({
      actor: input.actor,
      subjectType: 'LAB_TEST',
      subjectId: test.id,
      subjectVersion: test.version,
      currentState: test.state,
      meaning: 'FINAL_APPROVE',
      snapshotHash: `lab-test:${test.id}:v${test.version}:final-approval`,
      reauthenticationSecret: input.reauthenticationSecret,
      requestId: input.requestId,
      });
    const at = this.now().toISOString();
    await this.repository.save(
      test,
      {
        ...test,
        state: transitionLab(test.state, 'FINAL_APPROVE'),
        version: test.version + 1n,
        updatedAt: at,
        approvedAt: at,
      },
      {
        actor: input.actor,
        requestId: input.requestId,
        action: 'FINAL_APPROVE',
        ...(signatureEvidence ? { signatureEvidence } : {}),
        approvalDecisionEvent: decideApprovalPath({
          actor: input.actor,
          subjectType: 'LAB_TEST',
          subjectId: test.id,
          subjectVersion: test.version,
          decision: 'FINAL_APPROVE',
          reauthenticationVerified: Boolean(signatureEvidence),
        }),
      },
    );
    return signatureEvidence ? { signatureId: signatureEvidence.id } : {};
  }
}
