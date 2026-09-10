import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type {
  ReauthenticationVerifier,
  SignatureEvidenceRepository,
} from '../../../e-signatures/ports/repository.js';
import { createSignatureEvidence } from '../../../e-signatures/domain/signature-evidence.js';
import { uuidv7 } from '../../../../shared/id/uuid.js';

export interface TemplateCeremony {
  verifySignature(input: {
    actor: ActorContext;
    subjectId: string;
    subjectVersion: bigint;
    action: string;
    meaning: string;
    snapshotHash: string;
    reason?: string;
    reauthenticationSecret?: string;
    requestId: string;
  }): Promise<string>;
}

export function createTemplateCeremony(
  signatures: SignatureEvidenceRepository,
  verifier: ReauthenticationVerifier,
): TemplateCeremony {
  return {
    async verifySignature(input) {
      if (!input.reauthenticationSecret?.trim()) {
        throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });
      }
      const valid = await verifier.verify({
        actorId: input.actor.id,
        secret: input.reauthenticationSecret,
        requestId: input.requestId,
      });
      if (!valid) throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });
      const esigGrant = input.actor.permissions.find((p) => p.code === 'PERM-ESIG-SIGN');
      if (!esigGrant) throw new AppError('AUTHZ_PERMISSION_MISSING', { userSafe: true });
      const evidence = createSignatureEvidence({
        id: uuidv7(),
        actorId: input.actor.id,
        subjectType: 'INSPECTION_TEMPLATE_VERSION',
        subjectId: input.subjectId,
        subjectVersion: input.subjectVersion,
        action: input.action,
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
