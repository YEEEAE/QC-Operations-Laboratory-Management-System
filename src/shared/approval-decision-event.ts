import type { Transaction } from 'kysely';
import type { DatabaseSchema } from './database/db-types.js';
import { uuidv7 } from './id/uuid.js';
import { AppError } from './errors/app-error.js';

export type ApprovalPath = 'OWNER_INTERNAL_APPROVAL' | 'STANDARD_WORKFLOW';
export interface ApprovalDecisionEvent {
  approvalPath: ApprovalPath;
  actorId: string;
  actorLoginIdentity?: string;
  subjectType: string;
  subjectId: string;
  subjectVersion: bigint;
  decision: string;
  reason?: string;
  policyRevision: string;
  /** True only when the owner decision explicitly uses the deferred ceremony. */
  signatureDeferred: boolean;
  /** Null means reauthentication is not part of the selected policy path. */
  reauthenticationStatus: 'VERIFIED' | null;
}

/** Store the domain decision beside its real audit row in the same transaction. */
export async function persistApprovalDecisionEvent(
  tx: Transaction<DatabaseSchema>,
  event: ApprovalDecisionEvent,
  auditEventId: string,
  requestId: string,
  decidedAt: Date,
): Promise<void> {
  const existing = await tx
    .selectFrom('approval_decision_events')
    .selectAll()
    .where('subject_type', '=', event.subjectType)
    .where('subject_id', '=', event.subjectId)
    .where('request_id', '=', requestId)
    .executeTakeFirst();
  if (existing) {
    if (
      existing.actor_id !== event.actorId ||
      existing.approval_path !== event.approvalPath ||
      BigInt(existing.subject_version) !== event.subjectVersion ||
      existing.decision !== event.decision ||
      existing.decision_reason !== (event.reason ?? null) ||
      existing.policy_revision !== event.policyRevision ||
      existing.signature_deferred !== event.signatureDeferred ||
      existing.reauthentication_status !== event.reauthenticationStatus
    ) {
      throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
    }
    return;
  }
  await tx
    .insertInto('approval_decision_events')
    .values({
      id: uuidv7(),
      approval_path: event.approvalPath,
      actor_id: event.actorId,
      actor_login_identity: event.actorLoginIdentity ?? null,
      subject_type: event.subjectType,
      subject_id: event.subjectId,
      subject_version: event.subjectVersion,
      decision: event.decision,
      decision_reason: event.reason ?? null,
      policy_revision: event.policyRevision,
      signature_deferred: event.signatureDeferred,
      reauthentication_status: event.reauthenticationStatus,
      audit_event_id: auditEventId,
      request_id: requestId,
      decided_at: decidedAt,
    })
    .execute();
}
