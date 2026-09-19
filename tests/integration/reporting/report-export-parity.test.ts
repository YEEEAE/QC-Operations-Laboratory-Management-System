import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Kysely, PostgresDialect } from 'kysely';

import { migrate } from '../../../scripts/db/migrate.js';
import { seedFoundationData } from '../../../db/seeds/common.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { PostgresReportQuery } from '../../../src/modules/reporting/infrastructure/postgres-report-query.js';
import { ExportReportUseCase } from '../../../src/modules/reporting/application/export-report.js';
import { RunReportUseCase } from '../../../src/modules/reporting/application/run-report.js';
import { ReportRegistry } from '../../../src/modules/reporting/application/report-registry.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const LARGE_ROW_COUNT = 260;

const ownerId = '01900000-0000-7000-8000-000000000a11';
const otherId = '01900000-0000-7000-8000-000000000a22';

const actor = (id: string, permissions: ActorContext['permissions']): ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions,
});

const reportActor = (id: string) =>
  actor(id, [
    { code: 'PERM-RPT-VIEW', scopes: ['OWN'] },
    { code: 'PERM-RPT-RUN', scopes: ['OWN'] },
    { code: 'PERM-RPT-EXPORT', scopes: ['OWN'] },
    { code: 'PERM-RPT-EXPORT-CSV', scopes: ['OWN'] },
    { code: 'PERM-RPT-EXPORT-XLSX', scopes: ['OWN'] },
  ]);

const viewOnlyActor = (id: string) =>
  actor(id, [
    { code: 'PERM-RPT-VIEW', scopes: ['OWN'] },
    { code: 'PERM-RPT-RUN', scopes: ['OWN'] },
    { code: 'PERM-RPT-EXPORT', scopes: ['OWN'] },
  ]);

async function insertReceiving(
  pool: ReturnType<typeof createPool>,
  values: {
    id: string;
    receivingNo: string;
    description: string;
    itemCode: string;
    createdBy: string;
    receivingDate: string;
  },
): Promise<void> {
  await pool.query(
    `INSERT INTO qc.receiving_items
       (id, receiving_no, doc_no, item_code, description, lot, qty, receiving_date, workflow_state, inspection_result, release_system, created_by)
     VALUES ($1, $2, $2, $3, $4, $5, 10, $6::date, 'PENDING', 'NOT_STARTED', FALSE, $7)
     ON CONFLICT (receiving_no) DO NOTHING`,
    [
      values.id,
      values.receivingNo,
      values.itemCode,
      values.description,
      `LOT-${values.receivingNo}`,
      values.receivingDate,
      values.createdBy,
    ],
  );
}

const csvRows = (csv: string): string[] => {
  const lines = csv.split('\r\n').filter((line) => line.length > 0);
  return lines.slice(1);
};

describe('Report screen/export parity and export privacy (PostgreSQL)', () => {
  let pool: ReturnType<typeof createPool> | undefined;
  let database: Kysely<DatabaseSchema>;
  let runReport: RunReportUseCase;
  let exportReport: ExportReportUseCase;

  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer({ tls: true })),
      max: 2,
    });
    await migrate({ pool: pool! });
    await seedFoundationData(pool);
    for (const [id, identity] of [
      [ownerId, 'report-parity-owner'],
      [otherId, 'report-parity-other'],
    ] as const) {
      await pool!.query(
        `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
         VALUES ($1, $2, 'Report parity user', 'test-hash')
         ON CONFLICT (id) DO NOTHING`,
        [id, identity],
      );
    }
    for (let index = 1; index <= LARGE_ROW_COUNT; index++) {
      const suffix = String(index).padStart(4, '0');
      await insertReceiving(pool!, {
        id: `01900000-0000-7000-8000-${suffix}0000b001`,
        receivingNo: `RPT-PARITY-A-${suffix}`,
        description:
          index === 1 ? '=SUM(A1:A2)' : index === 2 ? '+cmd|/c' : `Parity item ${suffix}`,
        itemCode: index === 3 ? '@dangerous' : `ITEM-${suffix}`,
        createdBy: ownerId,
        receivingDate: '2026-03-15',
      });
    }
    await insertReceiving(pool!, {
      id: '01900000-0000-7000-8000-000000000b99',
      receivingNo: 'RPT-PARITY-A-9999',
      description: '=cmd, "quoted"',
      itemCode: 'ITEM-9999',
      createdBy: ownerId,
      receivingDate: '2026-03-15',
    });
    for (let index = 1; index <= 3; index++) {
      await insertReceiving(pool!, {
        id: `01900000-0000-7000-8000-000000000c0${index}`,
        receivingNo: `RPT-PARITY-B-000${index}`,
        description: `Other user item ${index}`,
        itemCode: `ITEM-B-000${index}`,
        createdBy: otherId,
        receivingDate: '2026-03-15',
      });
    }
    database = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool: pool! }) });
    const query = new PostgresReportQuery(database);
    runReport = new RunReportUseCase(new ReportRegistry(), query);
    exportReport = new ExportReportUseCase(new ReportRegistry(), query);
  });

  afterAll(async () => {
    await pool?.end();
    await stopPostgresContainer();
  });

  it('uses the identical server query for the screen dataset and both spreadsheet exports', async () => {
    const screen = await runReport.execute(reportActor(ownerId), 'quarantine-aging', {});
    const csv = await exportReport.execute(reportActor(ownerId), 'quarantine-aging', 'CSV', {});
    const xlsx = await exportReport.execute(reportActor(ownerId), 'quarantine-aging', 'XLSX', {});
    expect(screen.rows).toHaveLength(LARGE_ROW_COUNT + 1);
    expect(csv.rowCount).toBe(screen.rows.length);
    expect(xlsx.rowCount).toBe(screen.rows.length);
    const screenNumbers = screen.rows.map((row) => row.receivingNo);
    const exportNumbers = csvRows(csv.bytes.toString('utf8')).map((line) => line.split(',')[0]);
    expect(exportNumbers).toEqual(screenNumbers);
  });

  it('neutralizes formula-like data and preserves CSV quoting from populated rows', async () => {
    const csv = await exportReport.execute(reportActor(ownerId), 'quarantine-aging', 'CSV', {});
    const text = csv.bytes.toString('utf8');
    expect(text).toContain(`'${'=SUM(A1:A2)'}`);
    expect(text).toContain(`'${'+cmd|/c'}`);
    expect(text).toContain(`'${'@dangerous'}`);
    expect(text).toContain('"\'=cmd, ""quoted"""');
  });

  it('exports stay scoped to the authorized owner and never disclose other users rows', async () => {
    const ownerCsv = await exportReport.execute(
      reportActor(ownerId),
      'quarantine-aging',
      'CSV',
      {},
    );
    const otherCsv = await exportReport.execute(
      reportActor(otherId),
      'quarantine-aging',
      'CSV',
      {},
    );
    expect(otherCsv.rowCount).toBe(3);
    expect(ownerCsv.bytes.toString('utf8')).not.toContain('RPT-PARITY-B');
    expect(otherCsv.bytes.toString('utf8')).not.toContain('RPT-PARITY-A');
  });

  it('returns a header-only export and an empty screen dataset for authorized empty results', async () => {
    const screen = await runReport.execute(reportActor(ownerId), 'quarantine-aging', {
      lot: 'NO-SUCH-LOT',
    });
    expect(screen.rows).toHaveLength(0);
    const csv = await exportReport.execute(reportActor(ownerId), 'quarantine-aging', 'CSV', {
      lot: 'NO-SUCH-LOT',
    });
    expect(csv.rowCount).toBe(0);
    expect(csvRows(csv.bytes.toString('utf8'))).toHaveLength(0);
    expect(csv.bytes.toString('utf8')).toContain('Receiving number');
  });

  it('keeps the date filters inclusive on both boundaries across screen and export', async () => {
    const screen = await runReport.execute(reportActor(ownerId), 'quarantine-aging', {
      from: '2026-03-15',
      to: '2026-03-15',
    });
    expect(screen.rows).toHaveLength(LARGE_ROW_COUNT + 1);
    const csv = await exportReport.execute(reportActor(ownerId), 'quarantine-aging', 'CSV', {
      from: '2026-03-15',
      to: '2026-03-15',
    });
    expect(csv.rowCount).toBe(screen.rows.length);
    const excluded = await runReport.execute(reportActor(ownerId), 'quarantine-aging', {
      from: '2026-03-16',
    });
    expect(excluded.rows).toHaveLength(0);
  });

  it('produces deterministic output for repeated large exports', async () => {
    const first = await exportReport.execute(reportActor(ownerId), 'quarantine-aging', 'CSV', {});
    const second = await exportReport.execute(reportActor(ownerId), 'quarantine-aging', 'CSV', {});
    expect(second.bytes.equals(first.bytes)).toBe(true);
    const xlsx = await exportReport.execute(reportActor(ownerId), 'quarantine-aging', 'XLSX', {});
    expect(xlsx.bytes.subarray(0, 2).toString()).toBe('PK');
    expect(xlsx.rowCount).toBe(LARGE_ROW_COUNT + 1);
  });

  it('treats LIKE wildcards inside lot/itemCode filters as literal data on screen and export', async () => {
    await insertReceiving(pool!, {
      id: '01900000-0000-7000-8000-000000000d11',
      receivingNo: 'RPT-PARITY-A-WILD',
      description: 'Literal wildcard item',
      itemCode: 'ITEM-WILD',
      createdBy: ownerId,
      receivingDate: '2026-03-15',
    });
    await pool!.query(
      `UPDATE qc.receiving_items SET lot = 'LOT-100' WHERE receiving_no = 'RPT-PARITY-A-WILD'`,
    );
    // '%' is literal business data, not a pattern: LOT-% matches no row, and
    // LOT-1_0 matches no row because '_' must not stand in for the '0'.
    const wildcardScreen = await runReport.execute(reportActor(ownerId), 'quarantine-aging', {
      lot: 'LOT-%',
    });
    expect(wildcardScreen.rows).toHaveLength(0);
    expect(
      (await runReport.execute(reportActor(ownerId), 'quarantine-aging', { lot: 'LOT-1_0' })).rows,
    ).toHaveLength(0);
    // The same literal prefix still matches its own row, on screen and export.
    const literalScreen = await runReport.execute(reportActor(ownerId), 'quarantine-aging', {
      lot: 'LOT-100',
    });
    expect(literalScreen.rows).toHaveLength(1);
    expect(literalScreen.rows[0]).toMatchObject({ receivingNo: 'RPT-PARITY-A-WILD' });
    const literalCsv = await exportReport.execute(reportActor(ownerId), 'quarantine-aging', 'CSV', {
      lot: 'LOT-100',
    });
    expect(literalCsv.rowCount).toBe(1);
    expect(literalCsv.bytes.toString('utf8')).toContain('RPT-PARITY-A-WILD');
  });

  it('denies exports without the format-specific export permission', async () => {
    await expect(
      exportReport.execute(viewOnlyActor(ownerId), 'quarantine-aging', 'CSV', {}),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    // Viewing is not exporting: a view-only actor keeps the on-screen report
    // (including another owner's authorized rows) while the export is refused.
    const screen = await runReport.execute(viewOnlyActor(otherId), 'quarantine-aging', {});
    expect(screen.rows).toHaveLength(3);
  });
});
