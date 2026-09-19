import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { ApprovalSubjectType } from '../../approvals/domain/approval.js';
import { createSignatureEvidence } from '../domain/signature-evidence.js';
import type { ReauthenticationVerifier, SignatureEvidenceRepository } from '../ports/repository.js';

/**
 * QC-100-FINAL-004 — final (QCM) approval ceremony.
 *
 * Owner-approved policy: the Supervisor stage approval is a workflow event,
 * while the QCM final approval carries the single binding electronic
 * signature. This ceremony is the only place a two-stage record can obtain
 * that signature, so it enforces, in order:
 *
 *   1. a reauthentication secret that the verifier accepts;
 *   2. the explicit `PERM-ESIG-SIGN` grant through `authorize()`;
 *   3. signature evidence bound to the exact subject id/version/snapshot.
 *
 * The stored evidence is what makes the final approval traceable; a caller
 * that skips it cannot reach the APPROVED state.
 */
export interface FinalApprovalCeremony {
  signFinalApproval(input: {
    actor: ActorContext;
    subjectType: Extract<ApprovalSubjectType, 'INSPECTION_REPORT' | 'LAB_TEST'>;
    subjectId: string;
    subjectVersion: bigint;
    currentState: string;
    meaning: string;
    snapshotHash: string;
    reason?: string;
    reauthenticationSecret: string;
    requestId: string;
  }): Promise<string>;
}

export function createFinalApprovalCeremony(
  signatures: SignatureEvidenceRepository,
  verifier: ReauthenticationVerifier,
): FinalApprovalCeremony {
  return {
    async signFinalApproval(input) {
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
        action: 'FINAL_APPROVE',
        meaning: input.meaning,
        signedAt: new Date(),
        snapshotHash: input.snapshotHash,
        ...(input.reason?.trim() ? { reason: input.reason.trim() } : {}),
        reauthMethod: 'PASSWORD',
        requestId: input.requestId,
      });
      const saved = await signatures.create(evidence);
      return saved.id;
    },
  };
}
