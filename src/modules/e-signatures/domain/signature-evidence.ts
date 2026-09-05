import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import {
  assertApprovalSubjectType,
  type ApprovalSubjectType,
} from '../../approvals/domain/approval.js';

export interface SignatureEvidence {
  id: string;
  actorId: string;
  subjectType: ApprovalSubjectType;
  subjectId: string;
  subjectVersion: bigint;
  action: string;
  meaning: string;
  signedAt: Date;
  snapshotHash: string;
  reason?: string;
  reauthMethod: 'PASSWORD' | 'OTHER_APPROVED_METHOD';
  requestId: string;
}

export function createSignatureEvidence(
  input: Omit<SignatureEvidence, 'id'> & { id?: string },
): SignatureEvidence {
  if (
    input.subjectVersion <= 0n ||
    !input.action.trim() ||
    !input.meaning.trim() ||
    !input.snapshotHash.trim() ||
    !input.requestId.trim()
  )
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  assertApprovalSubjectType(input.subjectType);
  return {
    ...input,
    id: input.id ?? uuidv7(),
    action: input.action.trim(),
    meaning: input.meaning.trim(),
    snapshotHash: input.snapshotHash.trim(),
    ...(input.reason?.trim() ? { reason: input.reason.trim() } : {}),
  };
}
