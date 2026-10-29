import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { applyFocusComplianceTransition } from '../domain/focus-compliance.js';

export class FocusComplianceService {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}

  async listQueue(input: {
    actor: ActorContext;
    from?: string;
    to?: string;
    department?: string;
    shift?: string;
  }) {
    if (input.actor.accountState !== 'ACTIVE' || !input.actor.roles.includes('QC_COMPLIANCE') || !input.actor.permissions.some((grant) => grant.code === 'PERM-RREJ-VIEW' && grant.active !== false))
      throw new AppError('AUTHZ_DENIED');
    let filters = sql`TRUE`;
    if (input.from) filters = sql`${filters} AND r.report_date >= ${input.from}::date`;
    if (input.to) filters = sql`${filters} AND r.report_date <= ${input.to}::date`;
    if (input.department) filters = sql`${filters} AND r.department = ${input.department}`;
    if (input.shift) filters = sql`${filters} AND r.shift = ${input.shift}`;
    const result = await sql<{
      entry_id: string | null; report_id: string; owner_id: string; report_type: string; report_no: string; report_date: string;
      department: string; shift: string | null; report_status: string; report_revision: string | null;
      focus_status: string | null; version: string | null; focus_entry_at: Date | null; external_reference: string | null;
      item_code: string | null; item_name: string | null; lot_no: string | null; rejected_qty: string | null; unit: string | null;
    }>`
      SELECT f.id AS entry_id, r.id AS report_id, r.created_by AS owner_id, r.report_type, r.report_no,
        r.report_date::text AS report_date, r.department, r.shift, r.status AS report_status,
        f.report_revision::text, f.status AS focus_status, f.version::text, f.focus_entry_at,
        f.external_reference,
        s.item_code, s.item_name, s.lot_no, s.rejected_qty::text, s.unit
      FROM qc.reject_reports r
      LEFT JOIN qc.focus_compliance_entries f ON f.report_id = r.id
      LEFT JOIN qc.reject_issue_slips s ON s.report_id = r.id
      WHERE ${filters}
        AND r.status <> 'VOID'
        AND ((r.report_type = 'ISSUE_SLIP' AND r.status IN ('ISSUED','APPROVAL_TRACKING','COMPLETED'))
          OR (r.report_type = 'DAILY_REJECT' AND r.status IN ('SUBMITTED_FOR_QC','QC_REVIEWED','SUPERVISOR_APPROVED')))
      ORDER BY r.report_date, r.shift NULLS FIRST, r.department, r.report_no
      LIMIT 2000
    `.execute(this.database);
    return result.rows.filter((row) => authorize({
      actor: input.actor,
      permission: 'PERM-RREJ-VIEW',
      action: 'VIEW',
      entity: { type: 'REJECT_REPORT', id: row.report_id, state: row.report_status,
        ownerId: row.owner_id, departmentId: row.department, shiftId: row.shift ?? undefined },
      scope: { ownerId: row.owner_id, departmentId: row.department, shiftId: row.shift ?? undefined },
      currentVersion: 1n,
      expectedVersion: 1n,
      businessCondition: true,
    }).allowed);
  }

  async recordEntered(input: {
    actor: ActorContext;
    reportId: string;
    expectedVersion: bigint;
    evidenceNote?: string;
    evidenceFileId?: string;
    focusEntryAt: Date;
    externalReference?: string;
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
    focusEntryAt?: Date;
    externalReference?: string;
    requestId: string;
  }) {
    return this.transition({ ...input, kind: 'VERIFIED' });
  }

  async reconcile(input: {
    actor: ActorContext; reportId: string; expectedVersion: bigint; reportedQty: string;
    reportedLot?: string; reportedReportNumber: string; evidenceNote: string;
    evidenceFileId?: string; requestId: string;
  }) {
    if (input.actor.accountState !== 'ACTIVE' || !input.actor.roles.includes('QC_COMPLIANCE'))
      throw new AppError('AUTHZ_DENIED');
    if (!input.evidenceNote.trim() && !input.evidenceFileId)
      throw new AppError('VALIDATION_FAILED');
    if (!/^\d+(?:\.\d+)?$/.test(input.reportedQty) || !input.reportedReportNumber.trim())
      throw new AppError('VALIDATION_FAILED');
    return this.database.transaction().execute(async (tx) => {
      const row = await sql<{
        id: string; source_event_id: string; report_id: string; status: string; version: bigint;
        report_revision: bigint | null; report_type: string; report_no: string; report_status: string; created_by: string;
        department: string; shift: string | null; expected_qty: string | null; expected_lot: string | null;
      }>`
        SELECT f.id, f.source_event_id, f.report_id, f.status, f.version, f.report_revision,
          r.report_type, r.report_no, r.status AS report_status, r.created_by, r.department, r.shift,
          CASE WHEN r.report_type = 'ISSUE_SLIP' THEN s.rejected_qty::text
            ELSE (SELECT CASE WHEN COUNT(*) > 0 AND COUNT(DISTINCT coalesce(NULLIF(btrim(e.rm_unit), ''), '')) = 1
              AND MIN(NULLIF(btrim(e.rm_unit), '')) IS NOT NULL THEN SUM(e.reject_qty)::text END
              FROM qc.daily_reject_entries e WHERE e.report_id = r.id) END AS expected_qty,
          CASE WHEN r.report_type = 'ISSUE_SLIP' THEN s.lot_no
            ELSE (SELECT CASE WHEN COUNT(DISTINCT e.lot_no) = 1 THEN MIN(e.lot_no) END
              FROM qc.daily_reject_entries e WHERE e.report_id = r.id) END AS expected_lot
        FROM qc.focus_compliance_entries f JOIN qc.reject_reports r ON r.id = f.report_id
        LEFT JOIN qc.reject_issue_slips s ON s.report_id = r.id
        WHERE r.id = ${input.reportId} FOR UPDATE OF f, r
      `.execute(tx).then((result) => result.rows[0]);
      if (!row) throw new AppError('RESOURCE_NOT_FOUND');
      if (BigInt(row.version) !== input.expectedVersion) throw new AppError('CONFLICT_STALE_VERSION');
      const wasMismatch = row.status === 'FAILED_OR_REQUIRES_REVIEW';
      const correcting = wasMismatch;
      const expectedPermission = correcting ? 'PERM-RREJ-ADMIN-CORRECT' : 'PERM-RREJ-EDIT';
      const decision = authorize({ actor: input.actor, permission: expectedPermission,
        action: correcting ? 'CORRECT_FOCUS_ENTRY' : 'RECONCILE_FOCUS_ENTRY',
        entity: { type: 'FOCUS_COMPLIANCE_ENTRY', id: row.id, state: row.status, ownerId: row.created_by },
        scope: { ownerId: row.created_by }, currentVersion: BigInt(row.version), expectedVersion: input.expectedVersion,
        businessCondition: row.report_status !== 'VOID' && row.report_revision !== null && BigInt(row.report_revision) > 0n,
      }, { throwOnDeny: true });
      void decision;
      if (input.evidenceFileId) await this.assertEvidenceFile(tx, input.evidenceFileId, row.report_id, input.actor.id);
      const normalize = (value: string) => {
        const [whole, fraction = ''] = value.split('.');
        return `${whole.replace(/^0+(?=\d)/, '')}.${fraction.replace(/0+$/, '')}`.replace(/\.$/, '');
      };
      const matches = row.expected_qty !== null && normalize(row.expected_qty) === normalize(input.reportedQty)
        && row.report_no === input.reportedReportNumber.trim()
        && row.expected_lot !== null && (row.expected_lot ?? '') === (input.reportedLot?.trim() ?? '');
      const reconciliationState = matches ? (correcting ? 'CORRECTED' : 'MATCHED') : 'MISMATCH_REQUIRES_REVIEW';
      const status = matches ? (correcting ? 'CORRECTED' : row.status) : 'FAILED_OR_REQUIRES_REVIEW';
      const now = new Date();
      const updated = await tx.updateTable('focus_compliance_entries').set({
        status, reconciliation_state: reconciliationState,
        reported_qty: input.reportedQty, reported_lot: input.reportedLot?.trim() || null,
        reported_report_number: input.reportedReportNumber.trim(), reconciliation_note: input.evidenceNote.trim(),
        ...(matches ? {} : { verified_by: null, verified_at: null, verification_evidence_note: null, verification_evidence_file_id: null }),
        version: input.expectedVersion + 1n,
      }).where('id', '=', row.id).where('version', '=', input.expectedVersion).returning('id').executeTakeFirst();
      if (!updated) throw new AppError('CONFLICT_STALE_VERSION');
      await tx.insertInto('focus_reconciliation_events').values({
        entry_id: row.id, report_id: row.report_id, report_revision: BigInt(row.report_revision!),
        action: matches ? (correcting ? 'CORRECTION_RECORDED' : 'MATCH_CONFIRMED') : 'MISMATCH_RECORDED',
        expected_qty: row.expected_qty, reported_qty: input.reportedQty,
        expected_lot: row.expected_lot, reported_lot: input.reportedLot?.trim() ?? null,
        expected_report_number: row.report_no, reported_report_number: input.reportedReportNumber.trim(),
        evidence_note: input.evidenceNote.trim() || 'Supporting file reference recorded.', evidence_file_id: input.evidenceFileId ?? null,
        actor_id: input.actor.id, request_id: input.requestId,
      }).execute();
      await new PostgresAuditRepository(tx).append({ actorType: 'USER', actorId: input.actor.id,
        subjectType: 'FOCUS_COMPLIANCE_ENTRY', subjectId: row.id, action: `FOCUS_${reconciliationState}`,
        oldState: row.status, newState: status, requestId: input.requestId,
        payload: { reportId: row.report_id, reportRevision: String(row.report_revision), expectedQty: row.expected_qty,
          reportedQty: input.reportedQty, expectedLot: row.expected_lot, reportedLot: input.reportedLot ?? null,
          expectedReportNumber: row.report_no, reportedReportNumber: input.reportedReportNumber.trim() },
      });
      return { status, reconciliationState, matches };
    });
  }

  private async transition(input: {
    actor: ActorContext;
    reportId: string;
    expectedVersion: bigint;
    evidenceNote?: string;
    evidenceFileId?: string;
    requestId: string;
    focusEntryAt?: Date;
    externalReference?: string;
    kind: 'ENTERED_IN_FOCUS' | 'VERIFIED';
  }) {
    if (input.actor.accountState !== 'ACTIVE' || !input.actor.roles.includes('QC_COMPLIANCE')) throw new AppError('AUTHZ_DENIED');
    if (!input.evidenceFileId && !input.evidenceNote?.trim())
      throw new AppError('VALIDATION_FAILED');

    return this.database.transaction().execute(async (tx) => {
      const row = await tx
        .selectFrom('focus_compliance_entries')
        .innerJoin('reject_reports', 'reject_reports.id', 'focus_compliance_entries.report_id')
        .selectAll('focus_compliance_entries')
        .select(['reject_reports.created_by', 'reject_reports.status as report_status'])
        .where('focus_compliance_entries.report_id', '=', input.reportId)
        .where((eb) => eb.or([
          eb.and([eb('reject_reports.report_type', '=', 'ISSUE_SLIP'), eb('reject_reports.status', 'in', ['ISSUED', 'APPROVAL_TRACKING', 'COMPLETED'])]),
          eb.and([eb('reject_reports.report_type', '=', 'DAILY_REJECT'), eb('reject_reports.status', '=', 'SUPERVISOR_APPROVED')]),
        ]))
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
          businessCondition: row.report_revision !== null && (['ISSUED', 'APPROVAL_TRACKING', 'COMPLETED'].includes(row.report_status)
            || row.report_status === 'SUPERVISOR_APPROVED'),
        },
        { throwOnDeny: true },
      );
      if (input.evidenceFileId) await this.assertEvidenceFile(tx, input.evidenceFileId, row.report_id, input.actor.id);

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
        reportRevision: row.report_revision === null ? undefined : BigInt(row.report_revision),
        focusEntryAt: row.focus_entry_at ?? undefined,
        focusEntryDate: row.focus_entry_date ?? undefined,
        externalReference: row.external_reference ?? undefined,
        reconciliationState: row.reconciliation_state,
        reportedQty: row.reported_qty ?? undefined,
        reportedLot: row.reported_lot ?? undefined,
        reportedReportNumber: row.reported_report_number ?? undefined,
      };
      const next = applyFocusComplianceTransition(current, {
        kind: input.kind,
        actorId: input.actor.id,
        evidenceNote: input.evidenceNote,
        evidenceFileId: input.evidenceFileId,
        ...(input.kind === 'ENTERED_IN_FOCUS' ? { focusEntryAt: input.focusEntryAt!, externalReference: input.externalReference } : {}),
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
          focus_entry_at: next.focusEntryAt ?? row.focus_entry_at,
          focus_entry_date: next.focusEntryDate ?? row.focus_entry_date,
          external_reference: next.externalReference ?? row.external_reference,
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
          status: 'PENDING',
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

  private async assertEvidenceFile(tx: Kysely<DatabaseSchema>, fileId: string, reportId: string, actorId: string) {
    const file = await sql<{ id: string }>`
      SELECT file.id
      FROM qc.files file
      WHERE file.id = ${fileId}::uuid
        AND file.state = 'ACTIVE'
        AND (
          file.uploaded_by = ${actorId}::uuid
          OR EXISTS (
            SELECT 1 FROM qc.evidence_links link
            WHERE link.file_id = file.id
              AND link.subject_type = 'REJECT_REPORT'
              AND link.subject_id = ${reportId}::uuid
              AND link.removed_at IS NULL
          )
        )
    `.execute(tx).then((result) => result.rows[0]);
    if (!file) throw new AppError('VALIDATION_FAILED');
  }
}
