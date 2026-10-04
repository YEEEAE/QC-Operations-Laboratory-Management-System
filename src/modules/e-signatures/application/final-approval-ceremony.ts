import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { ApprovalSubjectType } from '../../approvals/domain/approval.js';
import { createSignatureEvidence } from '../domain/signature-evidence.js';
import type { SignatureEvidence } from '../domain/signature-evidence.js';
import type { ReauthenticationVerifier } from '../ports/repository.js';

/** Each approval stage reauthenticates independently. Evidence is persisted only
 * inside the owning domain transaction, never by the ceremony itself. */
export interface FinalApprovalCeremony {
  createFinalApprovalEvidence(input: {
    actor: ActorContext;
    subjectType: Extract<ApprovalSubjectType, 'INSPECTION_REPORT' | 'LAB_TEST'>;
    subjectId: string;
    subjectVersion: bigint;
    currentState: string;
    action?: 'STAGE1_APPROVE' | 'FINAL_APPROVE';
    meaning: string;
    snapshotHash: string;
    reason?: string;
    reauthenticationSecret: string;
    requestId: string;
  }): Promise<SignatureEvidence>;
}

export function createFinalApprovalCeremony(
  verifier: ReauthenticationVerifier,
): FinalApprovalCeremony {
  return {
    async createFinalApprovalEvidence(input) {
      if (!input.reauthenticationSecret?.trim())
        throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });
      const valid = await verifier.verify({
        actorId: input.actor.id,
        secret: input.reauthenticationSecret,
        requestId: input.requestId,
      });
      if (!valid) throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });
      authorize(
        {
          actor: input.actor,
          permission: 'PERM-ESIG-SIGN',
          action: 'SIGN',
          entity: {
            type: input.subjectType,
            id: input.subjectId,
            state: input.currentState,
          },
          scope: {},
          currentVersion: input.subjectVersion,
          expectedVersion: input.subjectVersion,
          businessCondition: true,
        },
        { throwOnDeny: true },
      );
      const evidence = createSignatureEvidence({
        actorId: input.actor.id,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        subjectVersion: input.subjectVersion,
        action: input.action ?? 'FINAL_APPROVE',
        meaning: input.action ?? 'FINAL_APPROVE',
        signedAt: new Date(),
        snapshotHash: input.snapshotHash,
        ...(input.reason?.trim() ? { reason: input.reason.trim() } : {}),
        reauthMethod: 'PASSWORD',
        requestId: input.requestId,
      });
      // Persist only inside the owning domain transaction: signature evidence
      // represents a committed transition, never an attempted one.
      return evidence;
    },
  };
}
