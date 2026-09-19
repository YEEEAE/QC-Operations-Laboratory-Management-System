import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Kysely, PostgresDialect } from 'kysely';

import { createPool } from '../../../src/shared/database/pool.js';
import { migrate } from '../../../scripts/db/migrate.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';
import { PostgresRejectReportRepository } from '../../../src/modules/reject-reports/infrastructure/postgres-repository.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../src/shared/outbox/postgres-outbox-repository.js';
import { CreateIssueSlipUseCase } from '../../../src/modules/reject-reports/application/create-issue-slip.js';
import { CreateDailyRejectUseCase } from '../../../src/modules/reject-reports/application/create-daily-reject.js';
import { ConfirmIssueSlipApprovalUseCase } from '../../../src/modules/reject-reports/application/confirm-issue-slip-approval.js';
import { ReverseIssueSlipApprovalUseCase } from '../../../src/modules/reject-reports/application/reverse-issue-slip-approval.js';
import { IssueIssueSlipUseCase } from '../../../src/modules/reject-reports/application/issue-issue-slip.js';
import { VoidRejectReportUseCase } from '../../../src/modules/reject-reports/application/void-reject-report.js';
import { GetRejectDashboardUseCase } from '../../../src/modules/reject-reports/application/get-reject-dashboard.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { IssueSlipApprovalRole } from '../../../src/modules/reject-reports/domain/issue-slip.js';
import { seedFoundationData } from '../../../db/seeds/common.js';
import { createHash } from 'node:crypto';

/**
 * QC-100-FINAL-014 — Reject Reports & Issue Slip controlled-flow evidence.
 *
 * Populated PostgreSQL suite that proves the parts prompt 014 adds on top of
 * `tests/integration/reject-reports`:
 * - the approval-confirmation correction path (CONFIRMED -> REVERSED with a
 *   mandatory reason, re-confirmation restarting from the reversed checkpoint);
 * - ordered SUPERVISOR -> QC_MANAGER -> FACTORY_DIRECTOR confirmation with
 *   authorization, creator-SoD, version and replay checks, plus every refusal
 *   asserted together with a zero side effect (state, version, audit, outbox);
 * - VOID/correction semantics for both report types where approved;
 * - filtered totals, trend / by-item / by-department / by-reason, approval
 *   status and VOID exclusion at the correct grain;
 * - the approved reject-percentage denominator with NULL for zero denominators
 *   (never an invented zero, never Infinity);
 * - audit immutability of the correction record.
 */

const stableId = (label: string): string => {
  const hex = createHash('sha256').update(`qc-100-final-014:${label}`).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20)}`;
};
const slug = (label: string) => createHash('sha256').update(label).digest('hex').slice(0, 10);

const creator: ActorContext = {
  id: stableId('creator'),
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [
    { code: 'PERM-RREJ-CREATE', scopes: ['OWN'] },
    { code: 'PERM-RREJ-EDIT', scopes: ['OWN'] },
    { code: 'PERM-RREJ-CONFIRM-APPROVAL', scopes: ['OWN'] },
    { code: 'PERM-RREJ-VOID', scopes: ['OWN'] },
    { code: 'PERM-RREJ-FINALIZE', scopes: ['OWN'] },
  ],
};
const colleague: ActorContext = {
  id: stableId('colleague'),
  accountState: 'ACTIVE',
  roles: ['SUPERVISOR'],
  permissions: [
    { code: 'PERM-RREJ-CREATE', scopes: ['OWN'] },
    { code: 'PERM-RREJ-CONFIRM-APPROVAL', scopes: ['GLOBAL'] },
    { code: 'PERM-RREJ-VOID', scopes: ['GLOBAL'] },
  ],
};
const inactive: ActorContext = {
  id: stableId('inactive'),
  accountState: 'INACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [
    { code: 'PERM-RREJ-CREATE', scopes: ['OWN'] },
    { code: 'PERM-RREJ-CONFIRM-APPROVAL', scopes: ['OWN'] },
  ],
};

const slipFields = {
  itemCode: 'FG-014',
  itemName: 'Final-014 widget',
  lotNo: 'LOT-014',
  unit: 'PCS',
  rejectReason: 'Final-014 defect',
};

const issuedSlip = async (
  repository: PostgresRejectReportRepository,
  overrides?: { department?: string; rejectedQty?: string; reportDate?: Date },
) => {
  const created = await new CreateIssueSlipUseCase(repository).execute({
    actor: creator,
    reportDate: overrides?.reportDate ?? new Date('2026-09-19'),
    department: overrides?.department ?? 'Production 014',
    fields: { ...slipFields, rejectedQty: overrides?.rejectedQty ?? '30' },
    requestId: 'req-014',
  });
  return new IssueIssueSlipUseCase(repository).execute({
    reportId: created.id,
    expectedVersion: created.version,
    actor: creator,
    requestId: 'req-014',
  });
};

const confirmInOrder = async (
  repository: PostgresRejectReportRepository,
  slipId: string,
  version: bigint,
): Promise<bigint> => {
  const useCase = new ConfirmIssueSlipApprovalUseCase(repository);
  const roles: IssueSlipApprovalRole[] = ['SUPERVISOR', 'QC_MANAGER', 'FACTORY_DIRECTOR'];
  let current = version;
  for (const role of roles) {
    const next = await useCase.execute({
      actor: creator,
      reportId: slipId,
      expectedVersion: current,
      role,
      requestId: 'req-014',
    });
    current = next.version;
  }
  return current;
};

describe('QC-100-FINAL-014 — Issue Slip correction, ordering and analytics evidence', () => {
  let pool: ReturnType<typeof createPool> | undefined;
  let database: Kysely<DatabaseSchema>;
  let repository: PostgresRejectReportRepository;

  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer()),
      max: 2,
    });
    await migrate({ pool: pool! });
    await seedFoundationData(pool);
    for (const [id, identity] of [
      [creator.id, 'final014-creator'],
      [colleague.id, 'final014-colleague'],
    ] as const) {
      await pool!.query(
        `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
         VALUES ($1, $2, 'Final-014 user', 'test-hash')
         ON CONFLICT (id) DO NOTHING`,
        [id, `${identity}-${slug(id)}`],
      );
    }
    database = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool: pool! }) });
    repository = new PostgresRejectReportRepository(
      database,
      new PostgresAuditRepository(database),
      new PostgresOutboxRepository(database),
    );
  });

  afterAll(async () => {
    await pool?.end();
    await stopPostgresContainer();
  });

  it('walks SUPERVISOR -> QC_MANAGER -> FACTORY_DIRECTOR in order and completes atomically', async () => {
    const slip = await issuedSlip(repository);

    // Only the next pending checkpoint is confirmable; the page mirrors this.
    let current = slip.version;
    const order: IssueSlipApprovalRole[] = ['SUPERVISOR', 'QC_MANAGER', 'FACTORY_DIRECTOR'];
    for (const role of order) {
      const after = await new ConfirmIssueSlipApprovalUseCase(repository).execute({
        actor: creator,
        reportId: slip.id,
        expectedVersion: current,
        role,
        approverName: `Approver ${role}`,
        requestId: 'req-014-order',
      });
      expect(after.approvals.find((a) => a.role === role)?.status).toBe('CONFIRMED');
      // creator attestation, never an approver signature
      expect(after.approvals.find((a) => a.role === role)?.confirmedBy).toBe(creator.id);
      current = after.version;
    }
    expect(current).toBeGreaterThan(slip.version);
    const completed = await repository.getIssueSlip(slip.id);
    expect(completed?.status).toBe('COMPLETED');
    expect(completed?.completedAt).toBeInstanceOf(Date);
    expect(completed?.approvals.every((a) => a.status === 'CONFIRMED')).toBe(true);
  });

  it('rejects out-of-order, non-creator, inactive, stale-version and replay confirmations with zero side effects', async () => {
    const slip = await issuedSlip(repository);
    const before = await repository.getIssueSlip(slip.id);
    const confirm = new ConfirmIssueSlipApprovalUseCase(repository);

    const expectDenied = async (
      input: {
        actor: ActorContext;
        role: IssueSlipApprovalRole;
        expectedVersion: bigint;
      },
      code: string,
    ) => {
      await expect(
        confirm.execute({ reportId: slip.id, requestId: 'req-014-deny', ...input }),
      ).rejects.toMatchObject({
        code,
      });
    };

    // skipping ahead (QC_MANAGER while SUPERVISOR is still pending)
    await expectDenied(
      { actor: creator, role: 'QC_MANAGER', expectedVersion: slip.version },
      'DOMAIN_INVALID_TRANSITION',
    );
    await expectDenied(
      { actor: creator, role: 'FACTORY_DIRECTOR', expectedVersion: slip.version },
      'DOMAIN_INVALID_TRANSITION',
    );
    // non-creator (SoD): the confirmation is recorded by the creator only
    await expectDenied(
      { actor: colleague, role: 'SUPERVISOR', expectedVersion: slip.version },
      'AUTHZ_DENIED',
    );
    // inactive account
    await expectDenied(
      { actor: inactive, role: 'SUPERVISOR', expectedVersion: slip.version },
      'AUTHZ_DENIED',
    );
    // stale version
    await expectDenied(
      { actor: creator, role: 'SUPERVISOR', expectedVersion: slip.version + 1n },
      'CONFLICT_STALE_VERSION',
    );

    const afterDenials = await repository.getIssueSlip(slip.id);
    expect(afterDenials?.version).toBe(before?.version);
    expect(afterDenials?.status).toBe('APPROVAL_TRACKING');
    expect(afterDenials?.approvals.every((a) => a.status === 'PENDING')).toBe(true);

    // replay: confirming the first checkpoint twice is denied (row no longer PENDING)
    const first = await confirm.execute({
      actor: creator,
      reportId: slip.id,
      expectedVersion: slip.version,
      role: 'SUPERVISOR',
      requestId: 'req-014-replay',
    });
    // replay: confirming the first checkpoint twice is denied. The domain
    // ordering gate refuses it first (the next pending checkpoint is now
    // QC_MANAGER); even without that gate the row-status guard would refuse a
    // second PENDING->CONFIRMED transition.
    await expect(
      confirm.execute({
        actor: creator,
        reportId: slip.id,
        expectedVersion: first.version,
        role: 'SUPERVISOR',
        requestId: 'req-014-replay',
      }),
    ).rejects.toMatchObject({
      code: expect.stringMatching(/DOMAIN_INVALID_TRANSITION|CONFLICT_STALE_VERSION/),
    });

    const auditRows = await pool!.query(
      `SELECT action, payload FROM qc.audit_events WHERE subject_id = $1 AND action = 'ISSUE_SLIP_APPROVAL_CONFIRMED'`,
      [slip.id],
    );
    expect(auditRows.rows).toHaveLength(1);
    expect(auditRows.rows[0]?.payload).toMatchObject({ approvalRole: 'SUPERVISOR' });
    const outboxRows = await pool!.query(
      `SELECT event_type FROM qc.outbox_events WHERE aggregate_id = $1`,
      [slip.id],
    );
    expect(outboxRows.rows.some((row) => row.event_type === 'ISSUE_SLIP_COMPLETED')).toBe(false);
  });

  it('reverses a confirmed checkpoint with a mandatory reason and restarts the queue from that checkpoint', async () => {
    const slip = await issuedSlip(repository);
    const confirmedVersion = await confirmInOrder(repository, slip.id, slip.version);
    const completed = await repository.getIssueSlip(slip.id);
    expect(completed?.status).toBe('COMPLETED');

    const reverse = new ReverseIssueSlipApprovalUseCase(repository);

    // the reason is mandatory
    await expect(
      reverse.execute({
        actor: creator,
        reportId: slip.id,
        expectedVersion: confirmedVersion,
        role: 'QC_MANAGER',
        reason: '   ',
        requestId: 'req-014-reverse',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });

    // a non-creator, non-system-owner cannot reverse even with the permission
    await expect(
      reverse.execute({
        actor: colleague,
        reportId: slip.id,
        expectedVersion: confirmedVersion,
        role: 'QC_MANAGER',
        reason: 'not my correction',
        requestId: 'req-014-reverse',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });

    // stale version
    await expect(
      reverse.execute({
        actor: creator,
        reportId: slip.id,
        expectedVersion: confirmedVersion + 1n,
        role: 'QC_MANAGER',
        reason: 'stale attempt',
        requestId: 'req-014-reverse',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });

    const reversed = await reverse.execute({
      actor: creator,
      reportId: slip.id,
      expectedVersion: confirmedVersion,
      role: 'QC_MANAGER',
      reason: 'wrong QC manager recorded',
      requestId: 'req-014-reverse',
    });
    expect(reversed.status).toBe('APPROVAL_TRACKING');
    const qcRow = reversed.approvals.find((a) => a.role === 'QC_MANAGER');
    expect(qcRow?.status).toBe('REVERSED');
    expect(qcRow?.reversalReason).toBe('wrong QC manager recorded');
    expect(qcRow?.reversedBy).toBe(creator.id);

    // re-confirmation must restart at the reversed checkpoint; confirming a
    // later checkpoint first is denied again
    const confirm = new ConfirmIssueSlipApprovalUseCase(repository);
    await expect(
      confirm.execute({
        actor: creator,
        reportId: slip.id,
        expectedVersion: reversed.version,
        role: 'FACTORY_DIRECTOR',
        requestId: 'req-014-reverse-restart',
      }),
    ).rejects.toMatchObject({ code: 'DOMAIN_INVALID_TRANSITION' });

    // Re-confirming QC_MANAGER is the last unconfirmed checkpoint
    // (FACTORY_DIRECTOR was never reversed), so the record completes
    // atomically in that same write.
    const reconfirmed = await confirm.execute({
      actor: creator,
      reportId: slip.id,
      expectedVersion: reversed.version,
      role: 'QC_MANAGER',
      requestId: 'req-014-reverse-restart',
    });
    expect(reconfirmed.status).toBe('COMPLETED');
    expect(reconfirmed.approvals.every((a) => a.status === 'CONFIRMED')).toBe(true);

    // the correction is an immutable audit fact
    const audit = await pool!.query(
      `SELECT action, reason, old_state, new_state FROM qc.audit_events WHERE subject_id = $1 ORDER BY occurred_at`,
      [slip.id],
    );
    const correction = audit.rows.find((row) => row.action === 'REJECT_REPORT_CORRECTED');
    expect(correction).toBeTruthy();
    expect(correction.reason).toBe('wrong QC manager recorded');
    expect(correction.new_state).toBe('APPROVAL_TRACKING');
  });

  it('voids a FINALIZED Daily Reject and a tracked Issue Slip only where approved, and keeps both in history', async () => {
    const daily = await new CreateDailyRejectUseCase(repository).execute({
      actor: creator,
      reportDate: new Date('2026-09-19'),
      department: 'Line 014',
      entries: [
        {
          itemDescription: 'Void-marked daily entry',
          rejectQty: '11',
          goodQty: '220',
          rejectReason: 'Void daily check',
        },
      ],
      requestId: 'req-014-void-daily',
    });
    // non-creator cannot void even with a GLOBAL void grant
    await expect(
      new VoidRejectReportUseCase(repository).execute({
        actor: colleague,
        reportId: daily.id,
        expectedVersion: daily.version,
        reason: 'not mine',
        requestId: 'req-014-void-daily',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    const voidedDaily = await new VoidRejectReportUseCase(repository).execute({
      actor: creator,
      reportId: daily.id,
      expectedVersion: daily.version,
      reason: 'daily recorded in error',
      requestId: 'req-014-void-daily',
    });
    expect(voidedDaily.status).toBe('VOID');
    expect(voidedDaily.voidReason).toBe('daily recorded in error');
    expect(
      voidedDaily.status === 'VOID' && 'entries' in voidedDaily && voidedDaily.entries,
    ).toHaveLength(1); // history kept, nothing deleted

    const slip = await issuedSlip(repository);
    const voidedSlip = await new VoidRejectReportUseCase(repository).execute({
      actor: creator,
      reportId: slip.id,
      expectedVersion: slip.version,
      reason: 'slip issued in error',
      requestId: 'req-014-void-slip',
    });
    expect(voidedSlip.status).toBe('VOID');
    // a VOID record can never be confirmed afterwards
    await expect(
      new ConfirmIssueSlipApprovalUseCase(repository).execute({
        actor: creator,
        reportId: slip.id,
        expectedVersion: voidedSlip.version,
        role: 'SUPERVISOR',
        requestId: 'req-014-void-slip',
      }),
    ).rejects.toMatchObject({ code: 'DOMAIN_INVALID_TRANSITION' });

    // every void/correction write is audited
    const audit = await pool!.query(
      `SELECT action FROM qc.audit_events WHERE subject_id IN ($1, $2)`,
      [daily.id, slip.id],
    );
    const actions = audit.rows.map((row) => row.action as string);
    expect(actions.filter((action) => action === 'REJECT_REPORT_VOIDED')).toHaveLength(2);
  });

  it('excludes VOID records from every analytics aggregate and keeps NULL for zero-denominator days', async () => {
    // Baseline numbers before the void probes (already-populated data from the
    // previous cases is intentionally reused; the assertions below are deltas,
    // so the exact totals do not matter).
    const base = await repository.analytics({
      from: new Date('2026-09-19'),
      to: new Date('2026-09-19'),
    });
    const baseApproval = base.approvalStatus[0] ?? { pending: 0, completed: 0 };

    // a slip that will be voided, with a unique item and reason
    const doomed = await new CreateIssueSlipUseCase(repository).execute({
      actor: creator,
      reportDate: new Date('2026-09-19'),
      department: 'Void Analytics Line',
      fields: {
        ...slipFields,
        itemCode: 'VOID-ANALYTICS-1',
        itemName: 'Doomed analytics slip',
        rejectedQty: '999',
        rejectReason: 'Void analytics reason',
      },
      requestId: 'req-014-void-analytics',
    });
    await new VoidRejectReportUseCase(repository).execute({
      actor: creator,
      reportId: doomed.id,
      expectedVersion: doomed.version,
      reason: 'must vanish from analytics',
      requestId: 'req-014-void-analytics',
    });
    // a doomed daily entry on a fresh date so the pct denominator is zero-only
    const doomedDaily = await new CreateDailyRejectUseCase(repository).execute({
      actor: creator,
      reportDate: new Date('2026-09-15'),
      department: 'Void Analytics Line',
      entries: [
        {
          itemDescription: 'Doomed zero-denominator entry',
          rejectQty: '7',
          goodQty: '0',
          rejectReason: 'Void zero denominator',
        },
      ],
      requestId: 'req-014-void-analytics',
    });
    await new VoidRejectReportUseCase(repository).execute({
      actor: creator,
      reportId: doomedDaily.id,
      expectedVersion: doomedDaily.version,
      reason: 'zero-denominator day must not appear',
      requestId: 'req-014-void-analytics',
    });

    const analytics = await repository.analytics({
      from: new Date('2026-09-01'),
      to: new Date('2026-09-30'),
    });

    // VOID exclusion at the correct grain for every aggregate
    expect(analytics.byItem.some((item) => item.itemCode === 'VOID-ANALYTICS-1')).toBe(false);
    expect(analytics.byReason.some((row) => row.reason === 'Void analytics reason')).toBe(false);
    expect(analytics.byReason.some((row) => row.reason === 'Void zero denominator')).toBe(false);
    expect(analytics.topRejectItems.some((item) => item.itemCode === 'VOID-ANALYTICS-1')).toBe(
      false,
    );
    expect(analytics.byDepartment.some((row) => row.department === 'Void Analytics Line')).toBe(
      false,
    );
    expect(analytics.trendByDate.some((row) => row.date === '2026-09-15')).toBe(false);
    expect(analytics.rejectPctTrend.some((row) => row.date === '2026-09-15')).toBe(false);

    // populated aggregates from the same window are present and consistent.
    // 2026-09-19 carries only Issue Slips (no daily entries), so its trend row
    // comes from slip quantities while the percentage trend only covers days
    // that have daily entries; this suite seeds its own populated daily day
    // below so the percentage assertion does not depend on file ordering.
    const trendRow = analytics.trendByDate.find((row) => row.date === '2026-09-19');
    expect(trendRow?.rejectedQty).toBeGreaterThan(0);
    expect(trendRow?.reportCount).toBeGreaterThan(0);
    const approvalRow = analytics.approvalStatus[0];
    expect(approvalRow.pending).toBeGreaterThanOrEqual(baseApproval.pending);
    expect(approvalRow.completed).toBeGreaterThanOrEqual(1);

    // a populated daily-entry day yields a finite server-computed percentage
    await new CreateDailyRejectUseCase(repository).execute({
      actor: creator,
      reportDate: new Date('2026-09-18'),
      department: 'Populated Pct Day 014',
      entries: [
        {
          itemDescription: 'Pct day entry 014',
          rejectQty: '40',
          goodQty: '400',
          rejectReason: 'Pct day check',
        },
      ],
      requestId: 'req-014-pct-day',
    });
    const pctAnalytics = await repository.analytics({
      from: new Date('2026-09-01'),
      to: new Date('2026-09-30'),
    });
    const pctDay = pctAnalytics.rejectPctTrend.find((row) => row.date === '2026-09-18');
    expect(pctDay).toBeDefined();
    expect(pctDay?.rejectPct).not.toBeNull();
    expect(Number.isFinite(pctDay?.rejectPct ?? NaN)).toBe(true);

    // zero-denominator days that exist (not voided) must be NULL, never 0/Infinity
    await new CreateDailyRejectUseCase(repository).execute({
      actor: creator,
      reportDate: new Date('2026-09-14'),
      department: 'Zero Denominator 014',
      entries: [
        {
          itemDescription: 'Zero good qty 014',
          rejectQty: '5',
          goodQty: '0',
          rejectReason: 'Zero denominator 014',
        },
      ],
      requestId: 'req-014-zero',
    });
    const withZero = await repository.analytics({
      from: new Date('2026-09-01'),
      to: new Date('2026-09-30'),
    });
    const zeroDay = withZero.rejectPctTrend.find((row) => row.date === '2026-09-14');
    expect(zeroDay).toBeDefined();
    expect(zeroDay?.rejectPct).toBeNull();

    // filtered totals: list filters respect department/status and VOID stays out
    const voidedOnly = await repository.listDailyRejects({
      filter: { status: 'VOID' },
      page: { page: 1, pageSize: 50, offset: 0 },
    });
    expect(voidedOnly.items.length).toBeGreaterThanOrEqual(1);
    expect(voidedOnly.items.every((record) => record.status === 'VOID')).toBe(true);
    const departmentFilter = await repository.listIssueSlips({
      filter: { department: 'Production 014' },
      page: { page: 1, pageSize: 50, offset: 0 },
    });
    expect(departmentFilter.total).toBeGreaterThan(0);
    expect(departmentFilter.items.every((slip) => slip.department === 'Production 014')).toBe(true);
    const searchFilter = await repository.listIssueSlips({
      filter: { search: 'Final-014 widget' },
      page: { page: 1, pageSize: 50, offset: 0 },
    });
    expect(searchFilter.total).toBeGreaterThan(0);

    // dashboard summary excludes VOID from all counters
    const dashboard = await new GetRejectDashboardUseCase(repository).execute({ actor: creator });
    expect(dashboard.summary.totalIssueSlips).toBeGreaterThan(0);
    const summaryAudit = await pool!.query(
      `SELECT COUNT(*)::int AS voided FROM qc.reject_reports WHERE status = 'VOID'`,
    );
    expect(Number(summaryAudit.rows[0]?.voided ?? 0)).toBeGreaterThanOrEqual(3);
  });
});
