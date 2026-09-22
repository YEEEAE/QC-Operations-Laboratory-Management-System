/**
 * QC-100-FINAL-024 — record-journey linkage on populated PostgreSQL.
 *
 * Proves the read-only journey panel additions stay inside their owning
 * domain's authorization:
 *   - finding -> NCR resolution hides NCRs the actor cannot open;
 *   - lab test -> source receiving provenance follows the lab scope predicate;
 *   - the audit read exposes `reason` but structurally drops `payload`.
 *
 * Every denial case is paired with a positive control, so a denial can never
 * be explained away as "no data".
 */
import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { closePool } from '../../../src/shared/database/pool.js';
import { resetServerEnvForTests } from '../../../src/config/env.js';
import { listRelatedNcrsForFinding } from '../../../src/modules/quality/findings/application/list-related-ncrs.js';
import { listFindingsForActor } from '../../../src/modules/quality/findings/application/list-findings-for-actor.js';
import { getSourceReceivingForLabTest } from '../../../src/modules/laboratory/application/get-source-receiving.js';
import { AuditQueryService } from '../../../src/shared/audit/audit-query.js';
import { PostgresAuditQuery } from '../../../src/shared/audit/postgres-audit-query.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import { mapAuditRowToView } from '../../../src/shared/audit/audit-query.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const OWNER_ID = '01900000-0000-7000-8000-000000000e01';
const OTHER_ID = '01900000-0000-7000-8000-000000000e02';
const LAB_AUTHOR_ID = '01900000-0000-7000-8000-000000000e03';
const originalDatabaseUrl = process.env.DATABASE_URL;
const originalTestDatabaseUrl = process.env.QC_TEST_DATABASE_URL;

const actorFor = (id: string, scope: 'OWN' | 'GLOBAL' = 'OWN'): ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [
    { code: 'PERM-NCR-VIEW', scopes: [scope] },
    { code: 'PERM-FIND-VIEW', scopes: [scope] },
    { code: 'PERM-LAB-VIEW', scopes: [scope] },
    { code: 'PERM-ADM-AUDIT-VIEW', scopes: ['GLOBAL'] },
  ],
});

beforeAll(async () => {
  const databaseUrl = getTestDatabaseUrl(await startPostgresContainer({ tls: true }));
  // The domain functions below use the shared pool singleton, while this suite
  // owns a separate Kysely pool. Bind both to the same disposable database.
  process.env.DATABASE_URL = databaseUrl;
  process.env.QC_TEST_DATABASE_URL = databaseUrl;
  resetServerEnvForTests();
  pool = createPool({ connectionString: databaseUrl, max: 10 });
  await pool.query('DROP SCHEMA IF EXISTS qc CASCADE');
  await migrate({ pool });
  db = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
  for (const [id, identity] of [
    [OWNER_ID, 'journey-owner'],
    [OTHER_ID, 'journey-other'],
    [LAB_AUTHOR_ID, 'journey-lab-author'],
  ] as const) {
    await pool.query(
      `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
       VALUES ($1, $2, $3, 'test-only-placeholder-not-a-secret')`,
      [id, identity, identity],
    );
  }
}, 180_000);

afterAll(async () => {
  if (db) await db.destroy();
  else await pool?.end();
  await closePool();
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  if (originalTestDatabaseUrl === undefined) delete process.env.QC_TEST_DATABASE_URL;
  else process.env.QC_TEST_DATABASE_URL = originalTestDatabaseUrl;
  resetServerEnvForTests();
  await stopPostgresContainer();
});

let pool: ReturnType<typeof createPool> | undefined;
let db: Kysely<DatabaseSchema> | undefined;

describe('finding -> NCR linkage', () => {
  it('resolves a linked NCR for its owner and hides it from another scoped actor', async () => {
    const findingId = '01900000-0000-7000-8000-00000000e101';
    const ncrId = '01900000-0000-7000-8000-00000000e201';
    await pool!.query(
      `INSERT INTO qc.findings (id, finding_no, title, description, state, created_by, updated_at, version)
       VALUES ($1, 'F-J24-1', 'Journey finding', 'Created for linkage proof', 'OPEN', $2, now(), 1)`,
      [findingId, OWNER_ID],
    );
    await pool!.query(
      `INSERT INTO qc.ncrs (id, ncr_no, title, description, state, finding_id, created_by, updated_at, version)
       VALUES ($1, 'NCR-J24-1', 'Journey NCR', 'Linked to the journey finding', 'OPEN', $2, $3, now(), 1)`,
      [ncrId, findingId, OWNER_ID],
    );

    const owner = actorFor(OWNER_ID);
    const other = actorFor(OTHER_ID);

    // Positive control: the owner sees both the finding and its NCR.
    const ownedFindings = await listFindingsForActor(owner);
    expect(ownedFindings.some((f) => f.id === findingId)).toBe(true);
    const ownerLinks = await listRelatedNcrsForFinding(owner, findingId);
    expect(ownerLinks.map((n) => n.id)).toEqual([ncrId]);

    // Negative case with the same data: a differently-scoped actor resolves
    // nothing — the linkage cannot leak a record the NCR read would deny.
    const otherLinks = await listRelatedNcrsForFinding(other, findingId);
    expect(otherLinks).toEqual([]);
    const otherFindings = await listFindingsForActor(other);
    expect(otherFindings.some((f) => f.id === findingId)).toBe(false);
  });

  it('returns nothing for an unlinked finding even for its owner (no data, no guess)', async () => {
    const unlinked = await listRelatedNcrsForActorlessCheck();
    expect(unlinked).toEqual([]);
  });

  async function listRelatedNcrsForActorlessCheck() {
    const findingId = '01900000-0000-7000-8000-00000000e102';
    await pool!.query(
      `INSERT INTO qc.findings (id, finding_no, title, description, state, created_by, updated_at, version)
       VALUES ($1, 'F-J24-2', 'Unlinked finding', 'No NCR points at it', 'OPEN', $2, now(), 1)`,
      [findingId, OWNER_ID],
    );
    return listRelatedNcrsForFinding(actorFor(OWNER_ID), findingId);
  }
});

describe('lab test -> source receiving provenance', () => {
  it('exposes the source receiving item to the author and denies another scoped actor', async () => {
    const receivingId = '01900000-0000-7000-8000-00000000e301';
    const labTestId = '01900000-0000-7000-8000-00000000e302';
    const templateVersionId = '01900000-0000-7000-8000-00000000e303';
    const templateId = '01900000-0000-7000-8000-00000000e304';
    await pool!.query(
      `INSERT INTO qc.receiving_items (id, receiving_no, doc_no, item_code, description, lot, qty, receiving_date, workflow_state, inspection_result, release_system, created_by, updated_at, version)
       VALUES ($1, 'RCV-J24-1', 'DOC-J24-1', 'ITEM-J24', 'Journey item', 'LOT-J24', 5, '2026-09-20', 'PENDING', 'NOT_STARTED', false, $2, now(), 1)`,
      [receivingId, OWNER_ID],
    );
    await pool!.query(
      `INSERT INTO qc.lab_test_templates (id, test_code, name, active, created_by, updated_at, version)
       VALUES ($1, 'TPL-J24', 'Journey template', true, $2, now(), 1)
       ON CONFLICT (id) DO NOTHING`,
      [templateId, LAB_AUTHOR_ID],
    );
    await pool!.query(
      `INSERT INTO qc.lab_test_template_versions (id, template_id, version_no, state, created_by)
       VALUES ($1, $2, 'v1', 'APPROVED', $3)
       ON CONFLICT (id) DO NOTHING`,
      [templateVersionId, templateId, LAB_AUTHOR_ID],
    );
    await pool!.query(
      `INSERT INTO qc.lab_tests (id, lab_test_no, template_version_id, state, author_id, created_by, updated_at, version, source_receiving_item_id)
       VALUES ($1, 'LAB-J24-1', $2::uuid, 'DRAFT', $3::uuid, $3::uuid, now(), 1, $4::uuid)`,
      [labTestId, templateVersionId, LAB_AUTHOR_ID, receivingId],
    );
    const labAuthor = actorFor(LAB_AUTHOR_ID);
    const linked = await getSourceReceivingForLabTest(labAuthor, labTestId);
    expect(linked).toMatchObject({ id: receivingId, receivingNo: 'RCV-J24-1' });

    // Another OWN-scoped actor cannot pivot into the author's lab test.
    const other = actorFor(OTHER_ID);
    expect(await getSourceReceivingForLabTest(other, labTestId)).toBeUndefined();
    // GLOBAL scope reads the same provenance.
    const globalActor = actorFor(OWNER_ID, 'GLOBAL');
    const globalView = await getSourceReceivingForLabTest(globalActor, labTestId);
    expect(globalView?.receivingNo).toBe('RCV-J24-1');
    // A malformed id resolves nothing rather than throwing a leak-shaped error.
    expect(await getSourceReceivingForLabTest(labAuthor, 'not-a-uuid')).toBeUndefined();
  });
});

describe('audit reason exposure without payload leakage', () => {
  it('returns reason in the view and never carries payload', async () => {
    const repo = new PostgresAuditRepository(db!);
    await repo.append({
      actorType: 'USER',
      actorId: OWNER_ID,
      subjectType: 'FINDING',
      subjectId: '01900000-0000-7000-8000-00000000e101',
      action: 'TEST_ACTION',
      oldState: 'OPEN',
      newState: 'UNDER_REVIEW',
      reason: 'Journey linkage proof reason',
      requestId: 'journey-audit-proof',
      payload: { internalSecret: 'must-never-leave-the-store' },
    });
    const service = new AuditQueryService(new PostgresAuditQuery(db!));
    const result = await service.list(actorFor(OWNER_ID, 'GLOBAL'), {
      requestId: undefined,
      action: 'TEST_ACTION',
    } as never);
    const event = result.events.find((e) => e.action === 'TEST_ACTION');
    expect(event?.reason).toBe('Journey linkage proof reason');
    // Structural non-leakage: the view type has no payload member.
    expect(String(event?.eventNo)).toBeTruthy();
    expect(Object.keys(event ?? {})).not.toContain('payload');
  });

  it('maps a raw row without letting reason become a payload channel', () => {
    const view = mapAuditRowToView({
      id: '00000000-0000-0000-0000-00000000e401',
      event_no: 1,
      occurred_at: new Date(),
      actor_type: 'USER',
      actor_id: OWNER_ID,
      subject_type: 'FINDING',
      subject_id: '01900000-0000-7000-8000-00000000e101',
      action: 'MAP_PROOF',
      old_state: 'OPEN',
      new_state: 'UNDER_REVIEW',
      reason: 'Row mapping proof',
      request_id: 'row-proof',
      signature_id: null,
    });
    expect(view.reason).toBe('Row mapping proof');
    expect(Object.keys(view)).not.toContain('payload');
  });
});
