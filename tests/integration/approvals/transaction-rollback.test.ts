import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Kysely, PostgresDialect } from 'kysely';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../src/shared/outbox/postgres-outbox-repository.js';
import { PostgresApprovalRepository } from '../../../src/modules/approvals/infrastructure/postgres-repository.js';
import { PostgresDocumentRepository } from '../../../src/modules/documents/infrastructure/postgres-repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { uuidv7 } from '../../../src/shared/id/uuid.js';
import { migrate } from '../../../scripts/db/migrate.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const actorId = '01900000-0000-7000-8000-00000000f001';
const subjectId = '01900000-0000-7000-8000-00000000f002';
const caseId = '01900000-0000-7000-8000-00000000f003';
const workItemId = '01900000-0000-7000-8000-00000000f004';
const requestId = 'signature-rollback-fault-injection';

const actor: ActorContext = {
  id: actorId,
  accountState: 'ACTIVE',
  roles: ['MANAGER'],
  permissions: [{ code: 'PERM-ESIG-SIGN', scopes: ['GLOBAL'] }],
};

describe('approval transaction rollback at every persistence boundary', () => {
  let pool: ReturnType<typeof createPool>;
  let database: Kysely<DatabaseSchema>;

  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer()),
      max: 4,
    });
    database = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
    await pool.query('DROP SCHEMA IF EXISTS qc CASCADE');
    await migrate({ pool });
    await pool.query(
      `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
       VALUES ($1, 'signature-rollback-test', 'Signature rollback test', 'test-only-placeholder')`,
      [actorId],
    );
  });

  afterAll(async () => {
    await database?.destroy();
    await pool?.end();
    await stopPostgresContainer();
  });

  it.each([
    ['electronic_signatures', 'INSERT'],
    ['approval_decisions', 'INSERT'],
    ['approval_work_items', 'UPDATE'],
    ['approval_cases', 'UPDATE'],
    ['audit_events', 'INSERT'],
    ['outbox_events', 'INSERT'],
  ])('rolls back all earlier writes when %s %s fails', async (table, operation) => {
    await pool.query('DELETE FROM qc.approval_work_items WHERE id = $1', [workItemId]);
    await pool.query('DELETE FROM qc.approval_cases WHERE id = $1', [caseId]);
    await pool.query(
      `INSERT INTO qc.approval_cases
        (id, subject_type, subject_id, subject_version, workflow_type, state, requested_by)
       VALUES ($1, 'DOCUMENT_VERSION', $2, 4, 'DOCUMENT_APPROVAL', 'IN_PROGRESS', $3)`,
      [caseId, subjectId, actorId],
    );
    await pool.query(
      `INSERT INTO qc.approval_work_items
        (id, approval_case_id, step_no, work_type, assigned_user_id, state, assigned_at)
       VALUES ($1, $2, 1, 'APPROVAL', $3, 'PENDING', CURRENT_TIMESTAMP)`,
      [workItemId, caseId, actorId],
    );
    const triggerName = `fail_${table}_${operation.toLowerCase()}`;
    await pool.query(`
      CREATE FUNCTION qc.${triggerName}() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'test fault injection at ${table}'; END;
      $$
    `);
    await pool.query(
      `CREATE TRIGGER ${triggerName} BEFORE ${operation} ON qc.${table}
       FOR EACH ROW EXECUTE FUNCTION qc.${triggerName}()`,
    );

    try {
      const repository = new PostgresApprovalRepository(
        database,
        new PostgresAuditRepository(database),
        new PostgresOutboxRepository(database),
      );
      await expect(
        repository.recordDecision({
          approvalCaseId: caseId,
          workItemId,
          actor,
          decision: 'APPROVE',
          subjectVersion: 4n,
          signature: {
            id: '01900000-0000-7000-8000-00000000f005',
            actorId,
            subjectType: 'DOCUMENT_VERSION',
            subjectId,
            subjectVersion: 4n,
            action: 'APPROVE',
            meaning: 'Approve document version 4',
            signedAt: new Date('2026-09-23T00:00:00Z'),
            snapshotHash: 'a'.repeat(64),
            reauthMethod: 'PASSWORD',
            requestId,
          },
          requestId,
          now: new Date('2026-09-23T00:00:00Z'),
        }),
      ).rejects.toThrow();
    } finally {
      await pool.query(`DROP TRIGGER IF EXISTS ${triggerName} ON qc.${table}`);
      await pool.query(`DROP FUNCTION IF EXISTS qc.${triggerName}()`);
    }

    const state = await pool.query(
      `SELECT c.state AS case_state, c.version AS case_version,
              w.state AS work_state, w.version AS work_version
       FROM qc.approval_cases c JOIN qc.approval_work_items w ON w.approval_case_id = c.id
       WHERE c.id = $1 AND w.id = $2`,
      [caseId, workItemId],
    );
    expect(state.rows[0]).toMatchObject({
      case_state: 'IN_PROGRESS',
      case_version: '1',
      work_state: 'PENDING',
      work_version: '1',
    });
    for (const tableName of [
      'electronic_signatures',
      'approval_decisions',
      'audit_events',
      'outbox_events',
    ]) {
      const count =
        tableName === 'outbox_events'
          ? await pool.query(
              `SELECT count(*)::int AS count FROM qc.outbox_events WHERE dedupe_key = $1`,
              [`approval-decision:${caseId}:${workItemId}:${requestId}`],
            )
          : await pool.query(
              `SELECT count(*)::int AS count FROM qc.${tableName} WHERE request_id = $1`,
              [requestId],
            );
      // The request ID is unique to this fault-injection suite; signatures and
      // audit/outbox effects must not survive any failed transaction step.
      expect(count.rows[0]?.count).toBe(0);
    }
  });

  it.each([
    ['audit_events', 'INSERT'],
    ['outbox_events', 'INSERT'],
  ])('rolls both WI/SOP revisions back when supersession %s %s fails', async (table, operation) => {
    const documentId = uuidv7();
    const currentId = uuidv7();
    const replacementId = uuidv7();
    const request = `document-supersede-fault-${table}`;
    await pool.query(
      `INSERT INTO qc.document_identities
        (id, document_no, document_type, title, active, created_by)
       VALUES ($1, $2, 'SOP', 'Transaction rollback SOP', true, $3)`,
      [documentId, `ROLLBACK-${table}`, actorId],
    );
    await pool.query(
      `INSERT INTO qc.document_versions
        (id, document_id, revision, state, content_hash, created_by)
       VALUES ($1, $2, '1', 'EFFECTIVE', 'historic-hash-1', $3),
              ($4, $2, '2', 'APPROVED', 'historic-hash-2', $3)`,
      [currentId, documentId, actorId, replacementId],
    );
    const triggerName = `fail_doc_supersede_${table}`;
    await pool.query(`
      CREATE FUNCTION qc.${triggerName}() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'test fault injection at ${table}'; END;
      $$
    `);
    await pool.query(
      `CREATE TRIGGER ${triggerName} BEFORE ${operation} ON qc.${table}
       FOR EACH ROW EXECUTE FUNCTION qc.${triggerName}()`,
    );
    try {
      const repository = new PostgresDocumentRepository(
        database,
        new PostgresAuditRepository(database),
        new PostgresOutboxRepository(database),
      );
      await expect(
        repository.supersede({
          currentId,
          currentExpectedVersion: 1n,
          replacementId,
          replacementExpectedVersion: 1n,
          actor,
          effectiveAt: new Date('2026-09-23T00:00:00Z'),
          requestId: request,
        }),
      ).rejects.toThrow();
    } finally {
      await pool.query(`DROP TRIGGER IF EXISTS ${triggerName} ON qc.${table}`);
      await pool.query(`DROP FUNCTION IF EXISTS qc.${triggerName}()`);
    }
    const versions = await pool.query(
      `SELECT id, state, content_hash, version FROM qc.document_versions
       WHERE id = ANY($1::uuid[]) ORDER BY revision`,
      [[currentId, replacementId]],
    );
    expect(versions.rows).toMatchObject([
      { id: currentId, state: 'EFFECTIVE', content_hash: 'historic-hash-1', version: '1' },
      { id: replacementId, state: 'APPROVED', content_hash: 'historic-hash-2', version: '1' },
    ]);
    const audit = await pool.query(
      'SELECT count(*)::int AS count FROM qc.audit_events WHERE request_id = $1',
      [request],
    );
    expect(audit.rows[0]?.count).toBe(0);
    const outbox = await pool.query(
      'SELECT count(*)::int AS count FROM qc.outbox_events WHERE dedupe_key = $1',
      [`document-version-superseded:${replacementId}`],
    );
    expect(outbox.rows[0]?.count).toBe(0);
  });
});
