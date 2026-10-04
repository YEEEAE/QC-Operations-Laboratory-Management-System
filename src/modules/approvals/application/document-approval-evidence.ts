import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../shared/database/database.js';

export interface DocumentApprovalEvidence {
  decisionId: string;
  actorId: string;
  actorName: string;
  decision: string;
  subjectVersion: bigint;
  decidedAt: Date;
  assignedRoleRequirement?: string;
  signatureId?: string;
  signatureMeaning?: string;
  signedAt?: Date;
  source: 'WORKFLOW_DECISION' | 'DOCUMENT_TRANSITION';
}

/** Call only after the owning document use case has authorized this actor to read the version. */
export async function getDocumentApprovalEvidence(
  database: Kysely<DatabaseSchema>,
  versionId: string,
): Promise<readonly DocumentApprovalEvidence[]> {
  try {
    const rows = await database
      .selectFrom('approval_decisions as decision')
      .innerJoin('approval_cases as approval', 'approval.id', 'decision.approval_case_id')
      .innerJoin('users as actor', 'actor.id', 'decision.actor_id')
      .leftJoin('approval_work_items as work', 'work.id', 'decision.work_item_id')
      .leftJoin('electronic_signatures as signature', 'signature.id', 'decision.signature_id')
      .select([
        'decision.id as decision_id',
        'decision.actor_id',
        'actor.display_name',
        'decision.decision',
        'decision.subject_version',
        'decision.decided_at',
        'decision.request_id',
        'work.assigned_role_requirement',
        'decision.signature_id',
        'signature.actor_id as signature_actor_id',
        'signature.subject_type as signature_subject_type',
        'signature.subject_id as signature_subject_id',
        'signature.subject_version as signature_subject_version',
        'signature.action as signature_action',
        'signature.meaning as signature_meaning',
        'signature.signed_at as signature_signed_at',
      ])
      .where('approval.subject_type', '=', 'DOCUMENT_VERSION')
      .where('approval.subject_id', '=', versionId)
      .orderBy('decision.decided_at', 'asc')
      .orderBy('decision.id', 'asc')
      .execute();
    const decisions = rows.map((row) => {
      const signatureMatches = Boolean(
        row.signature_id &&
        row.signature_actor_id === row.actor_id &&
        row.signature_subject_type === 'DOCUMENT_VERSION' &&
        row.signature_subject_id === versionId &&
        row.signature_subject_version === row.subject_version &&
        row.signature_action === row.decision,
      );
      return {
        decisionId: row.decision_id,
        actorId: row.actor_id,
        actorName: row.display_name,
        decision: row.decision,
        subjectVersion: BigInt(row.subject_version),
        decidedAt: row.decided_at,
        source: 'WORKFLOW_DECISION' as const,
        ...(row.assigned_role_requirement
          ? { assignedRoleRequirement: row.assigned_role_requirement }
          : {}),
        ...(signatureMatches && row.signature_id && row.signature_meaning && row.signature_signed_at
          ? {
              signatureId: row.signature_id,
              signatureMeaning: row.signature_meaning,
              signedAt: row.signature_signed_at,
            }
          : {}),
      };
    });
    const transitions = await database
      .selectFrom('audit_events as audit')
      .innerJoin('users as actor', 'actor.id', 'audit.actor_id')
      .select([
        'audit.id',
        'audit.actor_id',
        'actor.display_name',
        'audit.occurred_at',
        'audit.request_id',
      ])
      .where('audit.subject_type', '=', 'DOCUMENT_VERSION')
      .where('audit.subject_id', '=', versionId)
      .where('audit.action', '=', 'APPROVE')
      .orderBy('audit.occurred_at', 'asc')
      .execute();
    const workflowRequests = new Set(rows.map((row) => row.request_id));
    const directApprovals: DocumentApprovalEvidence[] = transitions
      .filter((row) => !workflowRequests.has(row.request_id))
      .map((row) => ({
        decisionId: row.id,
        actorId: row.actor_id!,
        actorName: row.display_name,
        decision: 'APPROVE',
        subjectVersion: 0n,
        decidedAt: row.occurred_at,
        source: 'DOCUMENT_TRANSITION',
      }));
    return [...decisions, ...directApprovals].sort(
      (a, b) => a.decidedAt.getTime() - b.decidedAt.getTime(),
    );
  } catch (error) {
    throw translateDatabaseError(error);
  }
}
