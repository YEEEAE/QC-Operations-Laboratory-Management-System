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
import { sanitizeSpreadsheetCell } from '../../../src/modules/reporting/infrastructure/csv-exporter.js';

const LARGE_ROW_COUNT = 260;
const OWNER_ROW_COUNT_WITH_SCOPE_FIXTURES = LARGE_ROW_COUNT + 5;

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
    lot?: string;
    workflowState?: string;
    inspectionResult?: string;
    releaseSystem?: boolean;
  },
): Promise<void> {
  await pool.query(
    `INSERT INTO qc.receiving_items
       (id, receiving_no, doc_no, item_code, description, lot, qty, receiving_date, workflow_state, inspection_result, release_system, created_by)
     VALUES ($1, $2, $2, $3, $4, $5, 10, $6::date, $7, $8, $9, $10)
     ON CONFLICT (receiving_no) DO NOTHING`,
    [
      values.id,
      values.receivingNo,
      values.itemCode,
      values.description,
      values.lot ?? `LOT-${values.receivingNo}`,
      values.receivingDate,
      values.workflowState ?? 'PENDING',
      values.inspectionResult ?? 'NOT_STARTED',
      values.releaseSystem ?? false,
      values.createdBy,
    ],
  );
}

const csvRows = (csv: string): string[] => {
  return csv
    .replace(/^\ufeff/, '')
    .split('\r\n')
    .filter((line) => line.startsWith('RPT-'));
};

function parseCsv(text: string): string[][] {
  const source = text.replace(/^\ufeff/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < source.length; index++) {
    const character = source[index]!;
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        value += '"';
        index++;
      } else if (character === '"') quoted = false;
      else value += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(value);
      value = '';
    } else if (character === '\r' || character === '\n') {
      if (character === '\r' && source[index + 1] === '\n') index++;
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else value += character;
  }
  if (row.length || value) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}

function xlsxSheetXml(bytes: Buffer): string {
  let offset = 0;
  while (offset + 30 <= bytes.length && bytes.readUInt32LE(offset) === 0x04034b50) {
    const method = bytes.readUInt16LE(offset + 8);
    const size = bytes.readUInt32LE(offset + 18);
    const nameLength = bytes.readUInt16LE(offset + 26);
    const extraLength = bytes.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = bytes.toString('utf8', nameStart, nameStart + nameLength);
    if (name === 'xl/worksheets/sheet1.xml') {
      if (method !== 0) throw new Error('Expected stored worksheet entry');
      return bytes.toString('utf8', dataStart, dataStart + size);
    }
    offset = dataStart + size;
  }
  throw new Error('Worksheet XML missing from XLSX export');
}

function parseXlsxRows(bytes: Buffer): string[][] {
  const xml = xlsxSheetXml(bytes);
  return [...xml.matchAll(/<row r="\d+">(.*?)<\/row>/g)].map(([, content]) =>
    [...(content ?? '').matchAll(/<t>(.*?)<\/t>/g)].map(([, value]) =>
      (value ?? '')
        .replaceAll('&quot;', '"')
        .replaceAll('&gt;', '>')
        .replaceAll('&lt;', '<')
        .replaceAll('&amp;', '&'),
    ),
  );
}

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
          index === 1
            ? '=SUM(A1:A2)'
            : index === 2
              ? '+cmd|/c'
              : index === 4
                ? '\t=1+1'
                : `Parity item ${suffix}`,
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
    for (const row of [
      {
        id: '01900000-0000-7000-8000-00000000d201',
        receivingNo: 'RPT-SCOPE-BEFORE',
        description: 'Before date boundary',
        receivingDate: '2026-03-14',
        createdBy: ownerId,
        lot: 'LOT-SCOPE-100',
        itemCode: 'ITEM-SCOPE-A',
        workflowState: 'INSPECTION_COMPLETE',
        inspectionResult: 'PASS',
        releaseSystem: true,
      },
      {
        id: '01900000-0000-7000-8000-00000000d202',
        receivingNo: 'RPT-SCOPE-MATCH-A',
        description: '=SUM(A1:A2)',
        receivingDate: '2026-03-15',
        createdBy: ownerId,
        lot: 'LOT-SCOPE-100',
        itemCode: 'ITEM-SCOPE-A',
        workflowState: 'INSPECTION_COMPLETE',
        inspectionResult: 'PASS',
        releaseSystem: true,
      },
      {
        id: '01900000-0000-7000-8000-00000000d203',
        receivingNo: 'RPT-SCOPE-MATCH-B',
        description: '+cmd|/c',
        receivingDate: '2026-03-15',
        createdBy: ownerId,
        lot: 'LOT-SCOPE-101',
        itemCode: 'ITEM-SCOPE-B',
        workflowState: 'INSPECTION_COMPLETE',
        inspectionResult: 'PASS',
        releaseSystem: true,
      },
      {
        id: '01900000-0000-7000-8000-00000000d204',
        receivingNo: 'RPT-SCOPE-AFTER',
        description: 'After date boundary',
        receivingDate: '2026-03-16',
        createdBy: ownerId,
        lot: 'LOT-SCOPE-100',
        itemCode: 'ITEM-SCOPE-A',
        workflowState: 'INSPECTION_COMPLETE',
        inspectionResult: 'PASS',
        releaseSystem: true,
      },
      {
        id: '01900000-0000-7000-8000-00000000d205',
        receivingNo: 'RPT-SCOPE-OTHER',
        description: 'Other owner must be excluded',
        receivingDate: '2026-03-15',
        createdBy: otherId,
        lot: 'LOT-SCOPE-100',
        itemCode: 'ITEM-SCOPE-A',
        workflowState: 'INSPECTION_COMPLETE',
        inspectionResult: 'PASS',
        releaseSystem: true,
      },
    ])
      await insertReceiving(pool!, row);
    database = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool: pool! }) });
    const query = new PostgresReportQuery(database);
    runReport = new RunReportUseCase(new ReportRegistry(), query);
    exportReport = new ExportReportUseCase(
      new ReportRegistry(),
      query,
      () => new Date('2026-09-23T12:00:00.000Z'),
    );
  });

  afterAll(async () => {
    await pool?.end();
    await stopPostgresContainer();
  });

  it('uses the identical server query for the screen dataset and both spreadsheet exports', async () => {
    const screen = await runReport.execute(reportActor(ownerId), 'quarantine-aging', {});
    const csv = await exportReport.execute(reportActor(ownerId), 'quarantine-aging', 'CSV', {});
    const xlsx = await exportReport.execute(reportActor(ownerId), 'quarantine-aging', 'XLSX', {});
    expect(screen.rows).toHaveLength(OWNER_ROW_COUNT_WITH_SCOPE_FIXTURES);
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
    expect(text).toContain("'\t=1+1");
    expect(text).toContain('"\'=cmd, ""quoted"""');
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain('Generated at (UTC),2026-09-23T12:00:00.000Z');
    expect(text).toContain('Actor scope,Records created by this account (OWN scope)');
    expect(text).toContain('Status,UNAPPROVED REPORT COPY');
    expect(text).toContain('Source,qc.receiving_items');
    expect(text).toContain('Sort,"Receiving date descending, then stable record id descending"');
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
    expect(otherCsv.rowCount).toBe(4);
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
    expect(screen.rows).toHaveLength(LARGE_ROW_COUNT + 3);
    const csv = await exportReport.execute(reportActor(ownerId), 'quarantine-aging', 'CSV', {
      from: '2026-03-15',
      to: '2026-03-15',
    });
    expect(csv.rowCount).toBe(screen.rows.length);
    const excluded = await runReport.execute(reportActor(ownerId), 'quarantine-aging', {
      from: '2026-03-16',
    });
    expect(excluded.rows.map((row) => row.receivingNo)).toEqual(['RPT-SCOPE-AFTER']);
  });

  it('matches every filtered row and cell across screen, CSV, and XLSX on an unchanged source fixture', async () => {
    const filters = {
      from: '2026-03-15',
      to: '2026-03-15',
      lot: 'LOT-SCOPE',
      itemCode: 'ITEM-SCOPE',
      workflowState: 'INSPECTION_COMPLETE',
      inspectionResult: 'PASS',
      releaseSystem: true,
    } as const;
    const screen = await runReport.execute(reportActor(ownerId), 'quarantine-aging', filters);
    const csv = await exportReport.execute(
      reportActor(ownerId),
      'quarantine-aging',
      'CSV',
      filters,
    );
    const xlsx = await exportReport.execute(
      reportActor(ownerId),
      'quarantine-aging',
      'XLSX',
      filters,
    );

    expect(screen.rows.map((row) => row.receivingNo)).toEqual([
      'RPT-SCOPE-MATCH-B',
      'RPT-SCOPE-MATCH-A',
    ]);
    expect(csv.rowCount).toBe(screen.rows.length);
    expect(xlsx.rowCount).toBe(screen.rows.length);
    const expectedRows = screen.rows.map((row) =>
      screen.columns.map((column) => sanitizeSpreadsheetCell(String(row[column.key] ?? ''))),
    );
    const csvRows = parseCsv(csv.bytes.toString('utf8'));
    const csvHeaderIndex = csvRows.findIndex((row) => row[0] === 'Receiving number');
    expect(csvRows[csvHeaderIndex]).toEqual(screen.columns.map((column) => column.label));
    expect(csvRows.slice(csvHeaderIndex + 1, csvHeaderIndex + 1 + screen.rows.length)).toEqual(
      expectedRows,
    );
    const xlsxRows = parseXlsxRows(xlsx.bytes);
    const xlsxHeaderIndex = xlsxRows.findIndex((row) => row[0] === 'Receiving number');
    expect(xlsxRows[xlsxHeaderIndex]).toEqual(screen.columns.map((column) => column.label));
    expect(xlsxRows.slice(xlsxHeaderIndex + 1, xlsxHeaderIndex + 1 + screen.rows.length)).toEqual(
      expectedRows,
    );
    expect(csv.bytes.toString('utf8')).toContain("'=SUM(A1:A2)");
    expect(csv.bytes.toString('utf8')).toContain("'+cmd|/c");
    expect(xlsxSheetXml(xlsx.bytes)).toContain("'=SUM(A1:A2)");
    expect(xlsx.bytes.toString('utf8')).not.toContain('RPT-SCOPE-OTHER');
    expect(csv.bytes.toString('utf8')).not.toContain('RPT-SCOPE-OTHER');
    expect(csv.bytes.toString('utf8')).toContain('Period,2026-03-15 to 2026-03-15');
    expect(csv.bytes.toString('utf8')).toContain('Source,qc.receiving_items');
    expect(csv.bytes.toString('utf8')).toContain(
      'Sort,"Receiving date descending, then stable record id descending"',
    );
    expect(xlsxSheetXml(xlsx.bytes)).toContain(
      'Receiving date descending, then stable record id descending',
    );
    expect(xlsxSheetXml(xlsx.bytes)).toContain('2026-03-15 to 2026-03-15');
    expect(xlsxSheetXml(xlsx.bytes)).toContain('qc.receiving_items');
    expect(csv.bytes.toString('utf8')).toContain('Generated at (UTC),2026-09-23T12:00:00.000Z');
  });

  it('produces deterministic output for repeated large exports', async () => {
    const first = await exportReport.execute(reportActor(ownerId), 'quarantine-aging', 'CSV', {});
    const second = await exportReport.execute(reportActor(ownerId), 'quarantine-aging', 'CSV', {});
    expect(second.bytes.equals(first.bytes)).toBe(true);
    const xlsx = await exportReport.execute(reportActor(ownerId), 'quarantine-aging', 'XLSX', {});
    expect(xlsx.bytes.subarray(0, 2).toString()).toBe('PK');
    expect(xlsx.rowCount).toBe(OWNER_ROW_COUNT_WITH_SCOPE_FIXTURES);
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
    expect(screen.rows).toHaveLength(4);
  });
});
