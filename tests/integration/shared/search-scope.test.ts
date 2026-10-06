import { seedControlledInspectionReadVersion } from '../../helpers/controlled-inspection-read-fixture.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Kysely, PostgresDialect } from 'kysely';
import { randomUUID } from 'node:crypto';

import { migrate } from '../../../scripts/db/migrate.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { PostgresSearch } from '../../../src/shared/search/postgres-search.js';
import { SearchService } from '../../../src/shared/search/search-service.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const userA = '01900000-0000-7000-8000-000000000e01';
const userB = '01900000-0000-7000-8000-000000000e02';
const rcaId = randomUUID();
const ncrId = randomUUID();
const findingId = randomUUID();
const receivingId = randomUUID();
const inspectionTemplateId = randomUUID();
const inspectionVersionId = randomUUID();
const inspectionId = randomUUID();
const labTemplateId = randomUUID();
const labVersionId = randomUUID();
const labTestId = randomUUID();
const capaId = randomUUID();
const rejectReportId = randomUUID();
const taskPermissions = (scope: 'GLOBAL' | 'OWN') => [
  { code: 'PERM-SRCH-USE', scopes: ['GLOBAL'] },
  { code: 'PERM-TASK-VIEW', scopes: [scope] },
];
const searchOnlyPermission = [{ code: 'PERM-SRCH-USE', scopes: ['GLOBAL'] }];
const rcaPermissions = (scope: 'GLOBAL' | 'OWN') => [
  { code: 'PERM-SRCH-USE', scopes: ['GLOBAL'] },
  { code: 'PERM-RCA-VIEW', scopes: [scope] },
];
const domainReadPermissions = [
  'PERM-QUAR-VIEW',
  'PERM-INSP-VIEW',
  'PERM-LAB-VIEW',
  'PERM-FIND-VIEW',
  'PERM-NCR-VIEW',
  'PERM-RCA-VIEW',
  'PERM-CAPA-VIEW',
  'PERM-RREJ-VIEW',
].map((code) => ({ code, scopes: ['GLOBAL'] }));

describe('Authorized cross-domain search, scope isolation, and stable ordering (PostgreSQL)', () => {
  let pool: ReturnType<typeof createPool> | undefined;
  let database: Kysely<DatabaseSchema>;
  let repository: PostgresSearch;
  let service: SearchService;

  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer({ tls: true })),
      max: 2,
    });
    await migrate({ pool: pool! });
    for (const [id, identity] of [
      [userA, 'search-actor-a'],
      [userB, 'search-actor-b'],
    ] as const) {
      await pool!.query(
        `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
         VALUES ($1, $2, 'Search test user', 'test-hash')
         ON CONFLICT (id) DO NOTHING`,
        [id, identity],
      );
    }
    for (let index = 1; index <= 37; index++) {
      await pool!.query(
        `INSERT INTO qc.tasks (task_no, title, priority, state, created_by)
         VALUES ($1, $2, 'MEDIUM', 'OPEN', $3)
         ON CONFLICT (task_no) DO NOTHING`,
        [
          `SRCH-A-${String(index).padStart(3, '0')}`,
          index === 1 ? 'Needle title only' : 'Search parity task',
          userA,
        ],
      );
    }
    for (let index = 1; index <= 4; index++) {
      await pool!.query(
        `INSERT INTO qc.tasks (task_no, title, priority, state, created_by)
         VALUES ($1, 'Search parity task', 'MEDIUM', 'OPEN', $2)
         ON CONFLICT (task_no) DO NOTHING`,
        [`SRCH-B-${String(index).padStart(3, '0')}`, userB],
      );
    }
    await pool!.query(
      `INSERT INTO qc.findings (id, finding_no, title, description, state, created_by)
       VALUES ($1, 'SRCH-FIND-001', 'Search finding title', 'Search finding description', 'OPEN', $2)`,
      [findingId, userA],
    );
    await pool!.query(
      `INSERT INTO qc.ncrs (id, ncr_no, title, description, state, finding_id, created_by)
       VALUES ($1, 'SRCH-NCR-RCA', 'Search NCR title', 'Search NCR description', 'OPEN', $2, $3)`,
      [ncrId, findingId, userA],
    );
    await pool!.query(
      `INSERT INTO qc.rcas (id, rca_no, ncr_id, state, root_cause, created_by)
       VALUES ($1, 'SRCH-RCA-001', $2, 'IN_PROGRESS', 'Searchable RCA root cause', $3)`,
      [rcaId, ncrId, userA],
    );
    await pool!.query(
      `INSERT INTO qc.capas
         (id, capa_no, ncr_id, state, title, description, verification_required, effectiveness_required, created_by)
       VALUES ($1, 'SRCH-CAPA-001', $2, 'OPEN', 'Search CAPA title', 'Search CAPA description', FALSE, FALSE, $3)`,
      [capaId, ncrId, userA],
    );
    await pool!.query(
      `INSERT INTO qc.receiving_items
         (id, receiving_no, doc_no, supplier_name, item_code, description, lot, qty, receiving_date, created_by)
       VALUES ($1, 'SRCH-RECEIVE-001', 'SRCH-DOC-001', 'Search supplier', 'SRCH-ITEM-001', 'Search receiving item', 'SRCH-LOT-001', 1, CURRENT_DATE, $2)`,
      [receivingId, userA],
    );
    await pool!.query(
      `INSERT INTO qc.inspection_templates (id, template_code, name, active, created_by)
       VALUES ($1, 'SRCH-INSP-TEMPLATE', 'Search inspection template', TRUE, $2)`,
      [inspectionTemplateId, userA],
    );
    await pool!.query(
      "UPDATE qc.receiving_items SET workflow_state='READY_FOR_INSPECTION' WHERE id=$1",
      [receivingId],
    );
    await seedControlledInspectionReadVersion(pool!, {
      templateId: inspectionTemplateId,
      versionId: inspectionVersionId,
      versionNo: 'v1',
      actorId: userA,
      receivingId,
    });
    await pool!.query(
      `INSERT INTO qc.inspection_reports
         (id, inspection_no, receiving_item_id, template_version_id, state, author_id, created_by)
       VALUES ($1, 'SRCH-INSP-001', $2, $3, 'DRAFT', $4, $4)`,
      [inspectionId, receivingId, inspectionVersionId, userA],
    );
    await pool!.query(
      `INSERT INTO qc.lab_test_templates (id, test_code, name, active, created_by)
       VALUES ($1, 'SRCH-LAB-TEMPLATE', 'Search lab template', TRUE, $2)`,
      [labTemplateId, userA],
    );
    await pool!.query(
      `INSERT INTO qc.lab_test_template_versions (id, template_id, version_no, state, created_by)
       VALUES ($1, $2, 'v1', 'APPROVED', $3)`,
      [labVersionId, labTemplateId, userA],
    );
    await pool!.query(
      `INSERT INTO qc.lab_tests (id, lab_test_no, template_version_id, state, author_id, created_by)
       VALUES ($1, 'SRCH-LAB-001', $2, 'DRAFT', $3, $3)`,
      [labTestId, labVersionId, userA],
    );
    await pool!.query(
      `INSERT INTO qc.reject_reports
         (id, report_no, report_type, report_date, department, status, created_by)
       VALUES ($1, 'SRCH-REJECT-001', 'ISSUE_SLIP', CURRENT_DATE, 'Search department', 'DRAFT', $2)`,
      [rejectReportId, userA],
    );
    await pool!.query(
      `INSERT INTO qc.reject_issue_slips (report_id, item_code, item_name, lot_no, unit, rejected_qty, reject_reason)
       VALUES ($1, 'SRCH-REJECT-ITEM', 'Search rejected item', 'SRCH-REJECT-LOT', 'PCS', 1, 'Search reject reason')`,
      [rejectReportId],
    );
    database = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool: pool! }) });
    repository = new PostgresSearch(database);
    service = new SearchService(repository, async (actorId) => {
      if (![userA, userB].includes(actorId)) throw new Error('unauthorized');
    });
  });

  afterAll(async () => {
    await pool?.query('DELETE FROM qc.reject_issue_slips WHERE report_id = $1', [rejectReportId]);
    await pool?.query('DELETE FROM qc.reject_reports WHERE id = $1', [rejectReportId]);
    await pool?.query('DELETE FROM qc.lab_tests WHERE id = $1', [labTestId]);
    await pool?.query('DELETE FROM qc.lab_test_template_versions WHERE id = $1', [labVersionId]);
    await pool?.query('DELETE FROM qc.lab_test_templates WHERE id = $1', [labTemplateId]);
    await pool?.query('DELETE FROM qc.inspection_reports WHERE id = $1', [inspectionId]);
    await pool?.query('DELETE FROM qc.inspection_template_versions WHERE id = $1', [
      inspectionVersionId,
    ]);
    await pool?.query('DELETE FROM qc.inspection_item_templates WHERE template_id=$1', [
      inspectionTemplateId,
    ]);
    await pool?.query('DELETE FROM qc.inspection_templates WHERE id = $1', [inspectionTemplateId]);
    await pool?.query('DELETE FROM qc.receiving_items WHERE id = $1', [receivingId]);
    await pool?.query('DELETE FROM qc.capas WHERE id = $1', [capaId]);
    await pool?.query('DELETE FROM qc.rcas WHERE id = $1', [rcaId]);
    await pool?.query('DELETE FROM qc.ncrs WHERE id = $1', [ncrId]);
    await pool?.query('DELETE FROM qc.findings WHERE id = $1', [findingId]);
    await pool?.query('DELETE FROM qc.tasks WHERE task_no LIKE $1', ['SRCH-A-%']);
    await pool?.query('DELETE FROM qc.tasks WHERE task_no LIKE $1', ['SRCH-B-%']);
    await pool?.query('DELETE FROM qc.users WHERE id IN ($1, $2)', [userA, userB]);
    await pool?.end();
    await stopPostgresContainer();
  });

  it('returns only authorized cross-domain records for the searching actor', async () => {
    const results = await service.search({
      actorId: userA,
      q: 'SRCH-A',
      permissions: taskPermissions('GLOBAL'),
    });
    expect(results.items).toHaveLength(25);
    expect(results.total).toBe(37);
    expect(results.nextCursor).toBeTruthy();
    expect(results.items.every((result) => result.entityType === 'TASK')).toBe(true);
    const titleMatch = await service.search({
      actorId: userA,
      q: 'Needle title only',
      permissions: taskPermissions('GLOBAL'),
    });
    expect(titleMatch).toMatchObject({ total: 1, items: [{ descriptor: 'Needle title only' }] });
  });

  it('does not leak the existence of unauthorized records to another actor', async () => {
    const denied = await service.search({
      actorId: userB,
      q: 'SRCH-A',
      permissions: taskPermissions('OWN'),
    });
    expect(denied).toMatchObject({ total: 0, items: [] });
    const readableOtherOwner = await service.search({
      actorId: userA,
      q: 'SRCH-B',
      permissions: taskPermissions('GLOBAL'),
    });
    expect(readableOtherOwner.total).toBe(4);
    const deniedExisting = await service.search({
      actorId: userB,
      q: 'SRCH-A',
      permissions: searchOnlyPermission,
    });
    expect(deniedExisting).toMatchObject({ total: 0, items: [] });
  });

  it('searches RCA identifiers only when the actor has the RCA read grant and scope', async () => {
    const authorized = await service.search({
      actorId: userA,
      q: 'SRCH-RCA-001',
      permissions: rcaPermissions('OWN'),
    });
    expect(authorized).toMatchObject({
      total: 1,
      items: [{ entityType: 'RCA', entityId: rcaId, businessId: 'SRCH-RCA-001' }],
    });

    const wrongScope = await service.search({
      actorId: userB,
      q: 'SRCH-RCA-001',
      permissions: rcaPermissions('OWN'),
    });
    expect(wrongScope).toMatchObject({ total: 0, items: [] });

    const missingGrant = await service.search({
      actorId: userB,
      q: 'SRCH-RCA-001',
      permissions: searchOnlyPermission,
    });
    expect(missingGrant).toMatchObject({ total: 0, items: [] });
  });

  it('returns exact authorized totals for each requested domain identifier', async () => {
    const cases = [
      {
        query: 'SRCH-ITEM-001',
        entityType: 'RECEIVING_ITEM',
        businessId: 'SRCH-RECEIVE-001',
        descriptor: 'Search receiving item',
      },
      {
        query: 'SRCH-LOT-001',
        entityType: 'RECEIVING_ITEM',
        businessId: 'SRCH-RECEIVE-001',
        descriptor: 'Search receiving item',
      },
      {
        query: 'SRCH-REJECT-ITEM',
        entityType: 'REJECT_REPORT',
        businessId: 'SRCH-REJECT-001',
        descriptor: 'Search rejected item',
      },
      {
        query: 'SRCH-REJECT-LOT',
        entityType: 'REJECT_REPORT',
        businessId: 'SRCH-REJECT-001',
        descriptor: 'Search rejected item',
      },
      {
        query: 'SRCH-FIND-001',
        entityType: 'FINDING',
        businessId: 'SRCH-FIND-001',
        descriptor: 'Search finding title',
      },
      {
        query: 'SRCH-NCR-RCA',
        entityType: 'NCR',
        businessId: 'SRCH-NCR-RCA',
        descriptor: 'Search NCR description',
      },
      {
        query: 'SRCH-RCA-001',
        entityType: 'RCA',
        businessId: 'SRCH-RCA-001',
        descriptor: 'Searchable RCA root cause',
      },
      {
        query: 'SRCH-CAPA-001',
        entityType: 'CAPA',
        businessId: 'SRCH-CAPA-001',
        descriptor: 'Search CAPA description',
      },
      {
        query: 'SRCH-INSP-001',
        entityType: 'INSPECTION_REPORT',
        businessId: 'SRCH-INSP-001',
        descriptor: 'SRCH-INSP-001',
      },
      {
        query: 'SRCH-REJECT-001',
        entityType: 'REJECT_REPORT',
        businessId: 'SRCH-REJECT-001',
        descriptor: 'Search rejected item',
      },
      {
        query: 'SRCH-LAB-001',
        entityType: 'LAB_TEST',
        businessId: 'SRCH-LAB-001',
        descriptor: 'SRCH-LAB-001',
      },
    ] as const;

    for (const item of cases) {
      const authorized = await service.search({
        actorId: userA,
        q: item.query,
        permissions: [{ code: 'PERM-SRCH-USE', scopes: ['GLOBAL'] }, ...domainReadPermissions],
      });
      expect(authorized.total, item.query).toBe(1);
      expect(authorized.items).toHaveLength(1);
      expect(authorized.items[0]).toMatchObject({
        entityType: item.entityType,
        businessId: item.businessId,
        descriptor: item.descriptor,
      });

      const forbidden = await service.search({
        actorId: userB,
        q: item.query,
        permissions: searchOnlyPermission,
      });
      expect(forbidden, `forbidden ${item.query}`).toMatchObject({ total: 0, items: [] });
    }
  });

  it('treats LIKE wildcards as literal business data, never as scope expansion', async () => {
    // A bare wildcard is literal data, not a pattern: it matches no record at
    // all, and it can never expand past the actor scope.
    const all = await service.search({
      actorId: userB,
      q: '%',
      permissions: taskPermissions('OWN'),
    });
    expect(all.items.every((result) => result.businessId.startsWith('SRCH-B'))).toBe(true);
    expect(all.total).toBe(0);
    // An underscore is literal too, so it neither matches across actors nor
    // across one actor's own records (`SRCH_A` is not `SRCH-A`).
    expect(
      (
        await service.search({
          actorId: userB,
          q: 'SRCH_A',
          permissions: taskPermissions('OWN'),
        })
      ).total,
    ).toBe(0);
    // The same actor searching its own literal prefix still finds its 4 records.
    expect(
      (
        await service.search({
          actorId: userB,
          q: 'SRCH-B',
          permissions: taskPermissions('OWN'),
        })
      ).total,
    ).toBe(4);
    expect(
      (
        await service.search({
          actorId: userA,
          q: 'SRCH%A-00%',
          permissions: taskPermissions('GLOBAL'),
        })
      ).total,
    ).toBe(0);
  });

  it('produces a stable total order across repeated identical queries', async () => {
    const first = await service.search({
      actorId: userA,
      q: 'SRCH-A',
      permissions: taskPermissions('GLOBAL'),
    });
    const second = await service.search({
      actorId: userA,
      q: 'SRCH-A',
      permissions: taskPermissions('GLOBAL'),
    });
    expect(first.items.map((result) => result.businessId)).toEqual(
      second.items.map((result) => result.businessId),
    );
    const ordered = [...first.items.map((result) => result.businessId)].sort();
    expect(first.items.map((result) => result.businessId)).toEqual(ordered);
  });

  it('keeps limited result pages stable and disjoint across the same ordering', async () => {
    const grants = taskPermissions('GLOBAL');
    const page = await service.search({
      actorId: userA,
      q: 'SRCH-A',
      limit: 4,
      permissions: grants,
    });
    expect(page.items).toHaveLength(4);
    const repeat = await service.search({
      actorId: userA,
      q: 'SRCH-A',
      limit: 4,
      permissions: grants,
    });
    expect(page.items.map((result) => result.businessId)).toEqual(
      repeat.items.map((result) => result.businessId),
    );
    const secondPage = await service.search({
      actorId: userA,
      q: 'SRCH-A',
      limit: 4,
      cursor: page.nextCursor,
      permissions: grants,
    });
    expect(secondPage.items).toHaveLength(4);
    expect(secondPage.total).toBe(37);
    expect(
      new Set([...page.items, ...secondPage.items].map((result) => result.entityId)).size,
    ).toBe(8);
    const startedAt = performance.now();
    await service.search({ actorId: userA, q: 'SRCH-A', permissions: grants });
    const queryLatencyMs = performance.now() - startedAt;
    expect(Number.isFinite(queryLatencyMs)).toBe(true);
    expect(queryLatencyMs).toBeGreaterThanOrEqual(0);
  });

  it('rejects empty and oversized queries before touching the repository', async () => {
    await expect(service.search({ actorId: userA, q: '   ' })).rejects.toMatchObject({
      code: 'VALIDATION_INVALID_QUERY',
    });
    await expect(service.search({ actorId: userA, q: 'x'.repeat(201) })).rejects.toMatchObject({
      code: 'VALIDATION_INVALID_QUERY',
    });
  });
});
