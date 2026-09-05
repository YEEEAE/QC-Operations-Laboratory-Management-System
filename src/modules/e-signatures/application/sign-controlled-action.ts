import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext, EntityContext } from '../../../shared/authorization/types.js';
import { createSignatureEvidence, type SignatureEvidence } from '../domain/signature-evidence.js';
import type { ReauthenticationVerifier, SignatureEvidenceRepository } from '../ports/repository.js';
import type { ApprovalSubjectType } from '../../approvals/domain/approval.js';

export interface SignControlledActionInput {
  actor: ActorContext;
  subjectType: ApprovalSubjectType;
  subjectId: string;
  subjectVersion: bigint;
  currentState?: string;
  action: string;
  meaning: string;
  snapshotHash: string;
  reason?: string;
  reauthenticationSecret: string;
  requestId: string;
  persist?: boolean;
}

export class SignControlledActionUseCase {
  constructor(
    private readonly repository: SignatureEvidenceRepository,
    private readonly verifier: ReauthenticationVerifier,
    private readonly now = () => new Date(),
  ) {}

  async execute(input: SignControlledActionInput): Promise<SignatureEvidence> {
    if (!input.reauthenticationSecret?.trim())
      throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });
    const valid = await this.verifier.verify({
      actorId: input.actor.id,
      secret: input.reauthenticationSecret,
      requestId: input.requestId,
    });
    if (!valid) throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });
    const entity: EntityContext = {
      type: input.subjectType,
      id: input.subjectId,
      state: input.currentState ?? 'IN_REVIEW',
    };
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-ESIG-SIGN',
        action: 'SIGN',
        entity,
        scope: {},
        currentVersion: input.subjectVersion,
        expectedVersion: input.subjectVersion,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    const evidence = createSignatureEvidence({
      id: undefined,
      actorId: input.actor.id,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      subjectVersion: input.subjectVersion,
      action: input.action,
      meaning: input.meaning,
      signedAt: this.now(),
      snapshotHash: input.snapshotHash,
      reason: input.reason,
      reauthMethod: 'PASSWORD',
      requestId: input.requestId,
    });
    return input.persist === false ? evidence : this.repository.create(evidence);
  }
}
