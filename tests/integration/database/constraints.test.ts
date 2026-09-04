import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createPool } from '../../../src/shared/database/pool.js';
import { migrate } from '../../../scripts/db/migrate.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

describe('core PostgreSQL constraints and privileges', () => {
  let pool: ReturnType<typeof createPool> | undefined;

  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer()),
      max: 2,
    });
    await migrate({ pool: pool! });
  });

  afterAll(async () => {
    await pool?.end();
    await stopPostgresContainer();
  });

  it('uses PostgreSQL UUIDv7 defaults and rejects duplicate login identities', async () => {
    const first = await pool!.query(
      `INSERT INTO qc.users (login_identity, display_name, password_hash)
       VALUES ('user-1', 'User One', 'test-hash') RETURNING id`,
    );
    expect(first.rows[0].id).toMatch(/^[0-9a-f-]{36}$/);
    await expect(
      pool!.query(
        `INSERT INTO qc.users (login_identity, display_name, password_hash) VALUES ('user-1', 'Other', 'hash')`,
      ),
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('enforces session expiry, FK ownership, and append-only audit references', async () => {
    const user = await pool!.query(
      `INSERT INTO qc.users (login_identity, display_name, password_hash) VALUES ('user-2', 'User Two', 'hash') RETURNING id`,
    );
    const userId = user.rows[0].id as string;
    await expect(
      pool!.query(
        `INSERT INTO qc.sessions (user_id, session_token_hash, expires_at) VALUES ($1, 'token-1', CURRENT_TIMESTAMP)`,
        [userId],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await pool!.query(
      `INSERT INTO qc.audit_events (actor_type, actor_id, subject_type, subject_id, action, request_id)
       VALUES ('USER', $1, 'USER', $1, 'CREATED', 'request-1')`,
      [userId],
    );
    await expect(pool!.query('DELETE FROM qc.users WHERE id = $1', [userId])).rejects.toMatchObject(
      {
        code: '23503',
      },
    );
    expect(
      (
        await pool!.query(
          'SELECT count(*)::int AS count FROM qc.audit_events WHERE actor_id = $1',
          [userId],
        )
      ).rows[0].count,
    ).toBe(1);
  });

  it('does not grant runtime role DDL or public schema create privileges', async () => {
    const result = await pool!.query(`
      SELECT r.rolname, r.rolsuper, r.rolcreatedb, r.rolcreaterole,
             has_schema_privilege(r.rolname, 'qc', 'CREATE') AS can_create_qc,
             has_schema_privilege(r.rolname, 'public', 'CREATE') AS can_create_public
      FROM pg_roles r WHERE r.rolname = 'qc_app_runtime'
    `);
    expect(result.rows[0]).toMatchObject({
      rolsuper: false,
      rolcreatedb: false,
      rolcreaterole: false,
      can_create_qc: false,
      can_create_public: false,
    });
    const session = await pool!.query('SHOW search_path');
    expect(session.rows[0].search_path).toContain('qc');
    expect(session.rows[0].search_path).toContain('pg_catalog');
  });

  it('persists the approved identity, authorization, file, and notification primitives', async () => {
    const tables = await pool!.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'qc'
         AND table_name IN (
           'password_reset_requests', 'roles', 'permissions', 'role_permissions', 'user_roles',
           'files', 'evidence_links', 'notifications', 'notification_deliveries'
         )
       ORDER BY table_name`,
    );
    expect(tables.rows.map((row) => row.table_name)).toEqual([
      'evidence_links',
      'files',
      'notification_deliveries',
      'notifications',
      'password_reset_requests',
      'permissions',
      'role_permissions',
      'roles',
      'user_roles',
    ]);
  });

  it('rejects invalid reset, file, evidence, and notification rows', async () => {
    const user = await pool!.query(
      `INSERT INTO qc.users (login_identity, display_name, password_hash)
       VALUES ('constraint-user', 'Constraint User', 'hash') RETURNING id`,
    );
    const userId = user.rows[0].id as string;

    await expect(
      pool!.query(
        `INSERT INTO qc.password_reset_requests (user_id, request_method, expires_at)
         VALUES ($1, 'ADMIN', CURRENT_TIMESTAMP)`,
        [userId],
      ),
    ).rejects.toMatchObject({ code: '23514' });

    await expect(
      pool!.query(
        `INSERT INTO qc.files
          (original_filename, storage_key, storage_provider, mime_type, size_bytes, sha256, state, uploaded_by)
         VALUES ('report.pdf', 'opaque/report-1', 'OBJECT_STORAGE', 'application/pdf', -1,
                 'not-a-sha', 'ACTIVE', $1)`,
        [userId],
      ),
    ).rejects.toMatchObject({ code: '23514' });

    const file = await pool!.query(
      `INSERT INTO qc.files
        (original_filename, storage_key, storage_provider, mime_type, size_bytes, sha256, state, uploaded_by)
       VALUES ('report.pdf', 'opaque/report-2', 'OBJECT_STORAGE', 'application/pdf', 12,
               repeat('a', 64), 'ACTIVE', $1) RETURNING id`,
      [userId],
    );
    const fileId = file.rows[0].id as string;

    await expect(
      pool!.query(
        `INSERT INTO qc.evidence_links
          (file_id, subject_type, subject_id, linked_by, removed_at)
         VALUES ($1, 'USER', $2, $2, NULL)`,
        [fileId, userId],
      ),
    ).resolves.toBeDefined();

    await expect(
      pool!.query(
        `INSERT INTO qc.notifications
          (recipient_user_id, notification_type, severity, title, message, subject_type)
         VALUES ($1, 'TASK_ASSIGNED', 'INFO', 'Task', 'Assigned', 'TASK')`,
        [userId],
      ),
    ).rejects.toMatchObject({ code: '23514' });
  });

  it('persists the Tasks, Quality, Quarantine, and Laboratory foundation tables', async () => {
    const result = await pool!.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'qc'
         AND table_name IN (
           'tasks', 'task_assignments', 'task_checklist_items', 'task_comments', 'task_dependencies',
           'findings', 'ncrs', 'rcas', 'capas', 'capa_actions',
           'receiving_items', 'inspection_templates', 'inspection_template_versions',
           'inspection_template_sections', 'inspection_template_points', 'inspection_reports',
           'inspection_report_results', 'inspection_report_snapshots',
           'lab_test_templates', 'lab_test_template_versions', 'lab_test_template_sections',
           'lab_test_template_parameters', 'lab_tests', 'lab_samples', 'lab_measurements',
           'lab_equipment_usage', 'lab_document_usage', 'lab_test_snapshots'
         ) ORDER BY table_name`,
    );
    expect(result.rows.map((row) => row.table_name)).toEqual([
      'capa_actions',
      'capas',
      'findings',
      'inspection_report_results',
      'inspection_report_snapshots',
      'inspection_reports',
      'inspection_template_points',
      'inspection_template_sections',
      'inspection_template_versions',
      'inspection_templates',
      'lab_document_usage',
      'lab_equipment_usage',
      'lab_measurements',
      'lab_samples',
      'lab_test_snapshots',
      'lab_test_template_parameters',
      'lab_test_template_sections',
      'lab_test_template_versions',
      'lab_test_templates',
      'lab_tests',
      'ncrs',
      'rcas',
      'receiving_items',
      'task_assignments',
      'task_checklist_items',
      'task_comments',
      'task_dependencies',
      'tasks',
    ]);
  });

  it('rejects invalid controlled states, quantities, retest links, and typed values', async () => {
    const user = await pool!.query(
      `INSERT INTO qc.users (login_identity, display_name, password_hash)
       VALUES ('domain-constraint-user', 'Domain Constraint User', 'hash') RETURNING id`,
    );
    const userId = user.rows[0].id as string;

    await expect(
      pool!.query(
        `INSERT INTO qc.receiving_items
          (doc_no, item_code, description, lot, qty, receiving_date, created_by)
         VALUES ('DOC-1', 'ITEM-1', 'Item', 'LOT-1', 0, CURRENT_DATE, $1)`,
        [userId],
      ),
    ).rejects.toMatchObject({ code: '23514' });

    await expect(
      pool!.query(
        `INSERT INTO qc.tasks (task_no, title, priority, state, created_by)
         VALUES ('TASK-1', 'Task', 'NORMAL', 'UNKNOWN', $1)`,
        [userId],
      ),
    ).rejects.toMatchObject({ code: '23514' });

    await expect(
      pool!.query(
        `INSERT INTO qc.lab_tests
          (lab_test_no, template_version_id, state, retest_sequence, author_id, created_by)
         VALUES ('LAB-1', uuidv7(), 'DRAFT', 1, $1, $1)`,
        [userId],
      ),
    ).rejects.toMatchObject({ code: '23503' });
  });
});
