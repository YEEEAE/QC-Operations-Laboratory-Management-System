import type { Kysely } from 'kysely';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { applyFocusComplianceTransition } from '../domain/focus-compliance.js';

export class FocusComplianceService {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}

  async recordEntered(input: {
    actor: ActorContext;
    reportId: string;
    expectedVersion: bigint;
    evidenceNote?: string;
    evidenceFileId?: string;
    requestId: string;
  }) {
    return this.transition({ ...input, kind: 'ENTERED_IN_FOCUS' });
  }

  async verify(input: {
    actor: ActorContext;
    reportId: string;
    expectedVersion: bigint;
    evidenceNote?: string;
    evidenceFileId?: string;
    requestId: string;
  }) {
    return this.transition({ ...input, kind: 'VERIFIED' });
  }

  private async transition(input: {
    actor: ActorContext;
    reportId: string;
    expectedVersion: bigint;
    evidenceNote?: string;
    evidenceFileId?: string;
    requestId: string;
    kind: 'ENTERED_IN_FOCUS' | 'VERIFIED';
  }) {
    if (input.actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED');
    if (!input.evidenceFileId && !input.evidenceNote?.trim())
      throw new AppError('VALIDATION_FAILED');

    return this.database.transaction().execute(async (tx) => {
      const row = await tx
        .selectFrom('focus_compliance_entries')
        .innerJoin('reject_reports', 'reject_reports.id', 'focus_compliance_entries.report_id')
        .selectAll('focus_compliance_entries')
        .select(['reject_reports.created_by', 'reject_reports.status as report_status'])
        .where('focus_compliance_entries.report_id', '=', input.reportId)
        .where('reject_reports.report_type', '=', 'ISSUE_SLIP')
        .forUpdate()
        .executeTakeFirst();
      if (!row) throw new AppError('RESOURCE_NOT_FOUND');
      const action = input.kind === 'ENTERED_IN_FOCUS' ? 'RECORD_FOCUS_ENTRY' : 'VERIFY_FOCUS_ENTRY';
      authorize(
        {
          actor: input.actor,
          permission: input.kind === 'ENTERED_IN_FOCUS'
            ? 'PERM-RREJ-EDIT'
            : 'PERM-RREJ-CONFIRM-APPROVAL',
          action,
          entity: {
            type: 'FOCUS_COMPLIANCE_ENTRY',
            id: row.id,
            state: row.status,
            ownerId: row.created_by,
          },
          scope: { ownerId: row.created_by },
          currentVersion: BigInt(row.version),
          expectedVersion: input.expectedVersion,
          businessCondition: ['APPROVAL_TRACKING', 'COMPLETED'].includes(row.report_status),
        },
        { throwOnDeny: true },
      );

      const current = {
        id: row.id,
        sourceEventId: row.source_event_id,
        reportId: row.report_id,
        status: row.status,
        entryEvidenceNote: row.entry_evidence_note ?? undefined,
        entryEvidenceFileId: row.entry_evidence_file_id ?? undefined,
        enteredBy: row.entered_by ?? undefined,
        enteredAt: row.entered_at ?? undefined,
        verificationEvidenceNote: row.verification_evidence_note ?? undefined,
        verificationEvidenceFileId: row.verification_evidence_file_id ?? undefined,
        verifiedBy: row.verified_by ?? undefined,
        verifiedAt: row.verified_at ?? undefined,
        version: BigInt(row.version),
      };
      const next = applyFocusComplianceTransition(current, {
        kind: input.kind,
        actorId: input.actor.id,
        evidenceNote: input.evidenceNote,
        evidenceFileId: input.evidenceFileId,
        occurredAt: new Date(),
      });
      const updated = await tx
        .updateTable('focus_compliance_entries')
        .set({
          status: next.status,
          entry_evidence_note: next.entryEvidenceNote ?? null,
          entry_evidence_file_id: next.entryEvidenceFileId ?? null,
          entered_by: next.enteredBy ?? null,
          entered_at: next.enteredAt ?? null,
          verification_evidence_note: next.verificationEvidenceNote ?? null,
          verification_evidence_file_id: next.verificationEvidenceFileId ?? null,
          verified_by: next.verifiedBy ?? null,
          verified_at: next.verifiedAt ?? null,
          version: next.version,
        })
        .where('id', '=', row.id)
        .where('version', '=', row.version)
        .returning('id')
        .executeTakeFirst();
      if (!updated) throw new AppError('CONFLICT_STALE_VERSION');

      await new PostgresAuditRepository(tx).append({
        actorType: 'USER',
        actorId: input.actor.id,
        subjectType: 'FOCUS_COMPLIANCE_ENTRY',
        subjectId: row.id,
        action: `FOCUS_${input.kind}`,
        oldState: row.status,
        newState: next.status,
        requestId: input.requestId,
        payload: {
          sourceEventId: row.source_event_id,
          reportId: input.reportId,
          evidenceFileId: input.evidenceFileId ?? null,
          evidenceNote: input.evidenceNote?.trim() ?? null,
        },
      });
      await tx
        .insertInto('event_delivery_statuses')
        .values({
          source_event_id: row.source_event_id,
          delivery_target: 'FOCUS_MANUAL',
          status: input.kind === 'ENTERED_IN_FOCUS' ? 'SENT' : 'CONFIRMED',
          source_event_reference: row.source_event_id,
          evidence_note: input.evidenceNote?.trim() ?? null,
          evidence_file_id: input.evidenceFileId ?? null,
          recorded_by: input.actor.id,
        })
        .onConflict((conflict) =>
          conflict.columns([
            'source_event_id',
            'delivery_target',
            'status',
          ]).doNothing(),
        )
        .execute();
      return next;
    });
  }
}
