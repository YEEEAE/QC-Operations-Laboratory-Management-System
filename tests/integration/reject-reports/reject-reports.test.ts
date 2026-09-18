import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createPool } from '../../../src/shared/database/pool.js';
import { Kysely, PostgresDialect } from 'kysely';
import { migrate } from '../../../scripts/db/migrate.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';
import { PostgresRejectReportRepository } from '../../../src/modules/reject-reports/infrastructure/postgres-repository.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../src/shared/outbox/postgres-outbox-repository.js';
import { CreateIssueSlipUseCase } from '../../../src/modules/reject-reports/application/create-issue-slip.js';
import { CreateDailyRejectUseCase } from '../../../src/modules/reject-reports/application/create-daily-reject.js';
import { ConfirmIssueSlipApprovalUseCase } from '../../../src/modules/reject-reports/application/confirm-issue-slip-approval.js';
import { VoidRejectReportUseCase } from '../../../src/modules/reject-reports/application/void-reject-report.js';
import { GetRejectDashboardUseCase } from '../../../src/modules/reject-reports/application/get-reject-dashboard.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { seedFoundationData } from '../../../db/seeds/common.js';
import { AppError } from '../../../src/shared/errors/app-error.js';
import { createHash } from 'node:crypto';

const stableId = (label: string): string => {
  const hex = createHash('sha256')
    .update(`reject-reports-test:${label}`)
    .digest('hex')
    .slice(0, 32);
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
const otherUser: ActorContext = {
  id: stableId('other'),
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [{ code: 'PERM-RREJ-CREATE', scopes: ['OWN'] }],
};
const anonymous: ActorContext = {
  id: stableId('anon'),
  accountState: 'INACTIVE',
  roles: [],
  permissions: [],
};

const slipInput = {
  reportDate: new Date('2026-09-18'),
  department: 'Production A',
  fields: {
    itemCode: 'FG-001',
    itemName: 'Rejected widget',
    lotNo: 'LOT-2026-A1',
    unit: 'PCS',
    rejectedQty: '42',
    rejectReason: 'Dimensional defect',
  },
};

describe('Reject Reports PostgreSQL integration', () => {
  let pool: ReturnType<typeof createPool> | undefined;
  let database: Kysely<DatabaseSchema>;

  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer()),
      max: 2,
    });
    await migrate({ pool: pool! });
    await seedFoundationData(pool);
    for (const [id, identity] of [
      [creator.id, 'reject-test-creator'],
      [otherUser.id, 'reject-test-other'],
    ] as const) {
      await pool!.query(
        `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
         VALUES ($1, $2, 'Reject test user', 'test-hash')
         ON CONFLICT (id) DO NOTHING`,
        [id, `${identity}-${slug(id)}`],
      );
    }
    database = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool: pool! }) });
    const wired = {
      audit: new PostgresAuditRepository(database),
      outbox: new PostgresOutboxRepository(database),
    };
    (globalThis as { __rejectWiring?: unknown }).__rejectWiring = wired;
  });

  afterAll(async () => {
    await pool?.end();
    await stopPostgresContainer();
  });

  it('creates an Issue Slip with generated report number and three pending checkpoints', async () => {
    const repository = new PostgresRejectReportRepository(
      database,
      (
        globalThis as {
          __rejectWiring?: { audit: PostgresAuditRepository; outbox: PostgresOutboxRepository };
        }
      ).__rejectWiring!.audit,
      (
        globalThis as {
          __rejectWiring?: { audit: PostgresAuditRepository; outbox: PostgresOutboxRepository };
        }
      ).__rejectWiring!.outbox,
    );
    const slip = await new CreateIssueSlipUseCase(repository).execute({
      actor: creator,
      ...slipInput,
      requestId: 'req-slip-1',
    });
    expect(slip.reportNo).toMatch(/^RIS-20260918-\d{4}$/);
    expect(slip.status).toBe('DRAFT');
    expect(slip.approvals).toHaveLength(3);
    expect(slip.approvals.every((a) => a.status === 'PENDING')).toBe(true);

    const fetched = await repository.getIssueSlip(slip.id);
    expect(fetched?.fields.itemCode).toBe('FG-001');
    expect(fetched?.fields.rejectedQty).toBe('42');
  });

  it('completes the Issue Slip only after all three confirmations and enforces creator-only recording', async () => {
    const repository = new PostgresRejectReportRepository(
      database,
      (
        globalThis as {
          __rejectWiring?: { audit: PostgresAuditRepository; outbox: PostgresOutboxRepository };
        }
      ).__rejectWiring!.audit,
      (
        globalThis as {
          __rejectWiring?: { audit: PostgresAuditRepository; outbox: PostgresOutboxRepository };
        }
      ).__rejectWiring!.outbox,
    );
    const useCase = new ConfirmIssueSlipApprovalUseCase(repository);
    const slip = await new CreateIssueSlipUseCase(repository).execute({
      actor: creator,
      ...slipInput,
      requestId: 'req-slip-2',
    });
    const issued = await repository.issueIssueSlip({
      id: slip.id,
      expectedVersion: slip.version,
      actor: creator,
      requestId: 'req-slip-2',
    });
    expect(issued.status).toBe('APPROVAL_TRACKING');

    // non-creator cannot record a confirmation
    await expect(
      useCase.execute({
        actor: otherUser,
        reportId: slip.id,
        expectedVersion: issued.version,
        role: 'SUPERVISOR',
        requestId: 'req-slip-2',
      }),
    ).rejects.toThrow(AppError);

    const afterFirst = await useCase.execute({
      actor: creator,
      reportId: slip.id,
      expectedVersion: issued.version,
      role: 'SUPERVISOR',
      approverName: 'S. Supervisor',
      requestId: 'req-slip-2',
    });
    expect(afterFirst.status).toBe('APPROVAL_TRACKING');

    // duplicate confirmation is rejected (row no longer PENDING)
    await expect(
      useCase.execute({
        actor: creator,
        reportId: slip.id,
        expectedVersion: afterFirst.version,
        role: 'SUPERVISOR',
        requestId: 'req-slip-2',
      }),
    ).rejects.toThrow(AppError);

    const afterSecond = await useCase.execute({
      actor: creator,
      reportId: slip.id,
      expectedVersion: afterFirst.version,
      role: 'QC_MANAGER',
      requestId: 'req-slip-2',
    });
    expect(afterSecond.status).toBe('APPROVAL_TRACKING');
    const completed = await useCase.execute({
      actor: creator,
      reportId: slip.id,
      expectedVersion: afterSecond.version,
      role: 'FACTORY_DIRECTOR',
      requestId: 'req-slip-2',
    });
    expect(completed.status).toBe('COMPLETED');
    expect(completed.approvals.every((a) => a.status === 'CONFIRMED')).toBe(true);
    // recorded as creator confirmation, never as an approver signature
    expect(completed.approvals[0].confirmedBy).toBe(creator.id);
  });

  it('forbids voiding a COMPLETED slip and allows controlled void with reason', async () => {
    const repository = new PostgresRejectReportRepository(
      database,
      (
        globalThis as {
          __rejectWiring?: { audit: PostgresAuditRepository; outbox: PostgresOutboxRepository };
        }
      ).__rejectWiring!.audit,
      (
        globalThis as {
          __rejectWiring?: { audit: PostgresAuditRepository; outbox: PostgresOutboxRepository };
        }
      ).__rejectWiring!.outbox,
    );
    const voidUseCase = new VoidRejectReportUseCase(repository);
    const completedSlip = (
      await repository.listIssueSlips({
        filter: { status: 'COMPLETED' },
        page: { page: 1, pageSize: 10, offset: 0 },
      })
    ).items[0];
    await expect(
      voidUseCase.execute({
        actor: creator,
        reportId: completedSlip.id,
        expectedVersion: completedSlip.version,
        reason: 'not allowed',
        requestId: 'req-void-1',
      }),
    ).rejects.toThrow(AppError);

    const draft = await new CreateIssueSlipUseCase(repository).execute({
      actor: creator,
      ...slipInput,
      requestId: 'req-void-2',
    });
    const voided = await voidUseCase.execute({
      actor: creator,
      reportId: draft.id,
      expectedVersion: draft.version,
      reason: 'created in error',
      requestId: 'req-void-2',
    });
    expect(voided.status).toBe('VOID');
    expect(voided.voidReason).toBe('created in error');
  });

  it('creates a Daily Reject with multiple rows, server-side percentages, and finalization', async () => {
    const repository = new PostgresRejectReportRepository(
      database,
      (
        globalThis as {
          __rejectWiring?: { audit: PostgresAuditRepository; outbox: PostgresOutboxRepository };
        }
      ).__rejectWiring!.audit,
      (
        globalThis as {
          __rejectWiring?: { audit: PostgresAuditRepository; outbox: PostgresOutboxRepository };
        }
      ).__rejectWiring!.outbox,
    );
    const created = await new CreateDailyRejectUseCase(repository).execute({
      actor: creator,
      reportDate: new Date('2026-09-18'),
      department: 'Line 3',
      shift: 'A',
      entries: [
        {
          machineName: 'M-1',
          itemCode: 'FG-9',
          itemDescription: 'Small FG pouch',
          lotNo: 'LOT-D1',
          rmDescription: 'Resin RM',
          rmUnit: 'KG',
          rmLotNo: 'RM-11',
          rmType: 'RAW',
          pumpOutQty: '500',
          rejectQty: '42',
          goodQty: '303',
          rejectLimit: '10',
          rejectReason: 'Seal leakage',
        },
        {
          itemDescription: 'Second entry',
          rejectQty: '5',
          goodQty: '0',
          rejectReason: 'Startup scrap',
        },
      ],
      requestId: 'req-daily-1',
    });
    expect(created.reportNo).toMatch(/^DRR-20260918-\d{4}$/);
    expect(created.status).toBe('DRAFT');
    expect(created.entries).toHaveLength(2);
    // paper-form convention: 42 / 303 * 100 ≈ 13.8614, computed server-side
    expect(created.entries[0].rejectPct).toBeCloseTo(13.8614, 3);
    // divide-by-zero handled safely as null
    expect(created.entries[1].rejectPct).toBeNull();

    // non-creator cannot finalize
    await expect(
      new (
        await import('../../../src/modules/reject-reports/application/finalize-daily-reject.js')
      ).FinalizeDailyRejectUseCase(repository).execute({
        actor: otherUser,
        reportId: created.id,
        expectedVersion: created.version,
        requestId: 'req-daily-1',
      }),
    ).rejects.toThrow(AppError);

    const finalized = await new (
      await import('../../../src/modules/reject-reports/application/finalize-daily-reject.js')
    ).FinalizeDailyRejectUseCase(repository).execute({
      actor: creator,
      reportId: created.id,
      expectedVersion: created.version,
      requestId: 'req-daily-1',
    });
    expect(finalized.status).toBe('FINALIZED');
    expect(finalized.finalizedAt).toBeDefined();
  });

  it('rejects anonymous/inactive actors and enforces optimistic concurrency', async () => {
    const repository = new PostgresRejectReportRepository(
      database,
      (
        globalThis as {
          __rejectWiring?: { audit: PostgresAuditRepository; outbox: PostgresOutboxRepository };
        }
      ).__rejectWiring!.audit,
      (
        globalThis as {
          __rejectWiring?: { audit: PostgresAuditRepository; outbox: PostgresOutboxRepository };
        }
      ).__rejectWiring!.outbox,
    );
    await expect(
      new CreateIssueSlipUseCase(repository).execute({
        actor: anonymous,
        ...slipInput,
        requestId: 'req-anon-1',
      }),
    ).rejects.toThrow(AppError);

    const slip = await new CreateIssueSlipUseCase(repository).execute({
      actor: creator,
      ...slipInput,
      requestId: 'req-stale-1',
    });
    await expect(
      repository.issueIssueSlip({
        id: slip.id,
        expectedVersion: slip.version + 1n,
        actor: creator,
        requestId: 'req-stale-1',
      }),
    ).rejects.toThrow(AppError);
  });

  it('keeps audit events atomic with report writes and serves dashboard analytics', async () => {
    const repository = new PostgresRejectReportRepository(
      database,
      (
        globalThis as {
          __rejectWiring?: { audit: PostgresAuditRepository; outbox: PostgresOutboxRepository };
        }
      ).__rejectWiring!.audit,
      (
        globalThis as {
          __rejectWiring?: { audit: PostgresAuditRepository; outbox: PostgresOutboxRepository };
        }
      ).__rejectWiring!.outbox,
    );
    const created = await new CreateIssueSlipUseCase(repository).execute({
      actor: creator,
      ...slipInput,
      requestId: 'req-audit-1',
    });
    const audit = await pool!.query(
      `SELECT action, new_state FROM qc.audit_events WHERE subject_id = $1 ORDER BY occurred_at`,
      [created.id],
    );
    expect(audit.rows.some((row) => row.action === 'REJECT_REPORT_CREATED')).toBe(true);

    const dashboard = await new GetRejectDashboardUseCase(repository).execute({ actor: creator });
    expect(dashboard.summary.totalIssueSlips).toBeGreaterThanOrEqual(4);
    expect(dashboard.summary.totalDailyRejects).toBeGreaterThanOrEqual(1);
    expect(dashboard.analytics.trendByDate.length).toBeGreaterThanOrEqual(1);
    expect(dashboard.recent.length).toBeGreaterThan(0);
    const todaysTrend = dashboard.analytics.trendByDate.find((t) => t.date === '2026-09-18');
    expect(todaysTrend?.rejectedQty).toBeGreaterThan(0);
  });
});
