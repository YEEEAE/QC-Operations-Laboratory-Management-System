import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPool } from '../../../src/shared/database/pool.js';
import { migrate } from '../../../scripts/db/migrate.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const ACTOR_ID = '01900000-0000-7000-8000-00000000e001';
const DOCUMENT_ID = '01900000-0000-7000-8000-00000000e002';
const DOCUMENT_VERSION_ID = '01900000-0000-7000-8000-00000000e003';
const DRAFT_DOCUMENT_VERSION_ID = '01900000-0000-7000-8000-00000000e006';
const DOCUMENT_FILE_ID = '01900000-0000-7000-8000-00000000e007';
const TEMPLATE_ID = '01900000-0000-7000-8000-00000000e004';
const TEMPLATE_VERSION_ID = '01900000-0000-7000-8000-00000000e005';

describe('QC-CLOSURE-009 controlled-record integrity', () => {
  let pool: ReturnType<typeof createPool>;

  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer()),
      max: 4,
    });
    await pool.query('DROP SCHEMA IF EXISTS qc CASCADE');
    await migrate({ pool });
    await pool.query(
      `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
       VALUES ($1, 'closure-009-actor', 'Closure 009 actor', 'test-only-placeholder')`,
      [ACTOR_ID],
    );
    await pool.query(
      `INSERT INTO qc.document_identities (id, document_no, document_type, title, active, created_by)
       VALUES ($1, 'DOC-CLOSURE-009', 'SOP', 'Controlled procedure', true, $2)`,
      [DOCUMENT_ID, ACTOR_ID],
    );
    await pool.query(
      `INSERT INTO qc.document_versions (id, document_id, revision, state, content_hash, created_by)
       VALUES ($1, $2, '1', 'APPROVED', 'hash-1', $3)`,
      [DOCUMENT_VERSION_ID, DOCUMENT_ID, ACTOR_ID],
    );
    await pool.query(
      `INSERT INTO qc.document_versions (id, document_id, revision, state, content_hash, created_by)
       VALUES ($1, $2, '2', 'DRAFT', 'hash-2', $3)`,
      [DRAFT_DOCUMENT_VERSION_ID, DOCUMENT_ID, ACTOR_ID],
    );
    await pool.query(
      `INSERT INTO qc.files
        (id, original_filename, storage_key, storage_provider, mime_type, size_bytes, sha256, uploaded_by, state)
       VALUES ($1, 'procedure.pdf', 'qc-029/document-v2.pdf', 'OBJECT_STORAGE', 'application/pdf', 12, repeat('b', 64), $2, 'ACTIVE')`,
      [DOCUMENT_FILE_ID, ACTOR_ID],
    );
    await pool.query(
      `INSERT INTO qc.inspection_templates (id, template_code, name, active, created_by)
       VALUES ($1, 'TMPL-CLOSURE-009', 'Inspection template', true, $2)`,
      [TEMPLATE_ID, ACTOR_ID],
    );
    await pool.query(
      `INSERT INTO qc.inspection_template_versions
        (id, template_id, version_no, state, created_by, content_hash, name)
       VALUES ($1, $2, 'v1', 'APPROVED', $3, 'template-hash-1', 'Inspection template')`,
      [TEMPLATE_VERSION_ID, TEMPLATE_ID, ACTOR_ID],
    );
  });

  afterAll(async () => {
    await pool?.end();
    await stopPostgresContainer();
  });

  it('rejects tampering with audit and signature evidence', async () => {
    const audit = await pool.query(
      `INSERT INTO qc.audit_events (actor_type, actor_id, subject_type, subject_id, action, request_id)
       VALUES ('USER', $1, 'DOCUMENT_VERSION', $2, 'TEST', 'closure-009-audit') RETURNING id`,
      [ACTOR_ID, DOCUMENT_VERSION_ID],
    );
    await expect(
      pool.query(`UPDATE qc.audit_events SET action = 'TAMPERED' WHERE id = $1`, [
        audit.rows[0].id,
      ]),
    ).rejects.toThrow(/append-only/);

    const signature = await pool.query(
      `INSERT INTO qc.electronic_signatures
        (actor_id, subject_type, subject_id, subject_version, action, meaning, snapshot_hash, reauth_method, request_id)
       VALUES ($1, 'DOCUMENT_VERSION', $2, 1, 'APPROVE', 'Approve exact version', 'hash-1', 'PASSWORD', 'closure-009-signature')
       RETURNING id`,
      [ACTOR_ID, DOCUMENT_VERSION_ID],
    );
    await expect(
      pool.query(`DELETE FROM qc.electronic_signatures WHERE id = $1`, [signature.rows[0].id]),
    ).rejects.toThrow(/append-only/);
  });

  it('rejects editing approved document and template content in place', async () => {
    await expect(
      pool.query(`UPDATE qc.document_versions SET content_hash = 'tampered' WHERE id = $1`, [
        DOCUMENT_VERSION_ID,
      ]),
    ).rejects.toThrow(/immutable/);
    await expect(
      pool.query(`UPDATE qc.inspection_template_versions SET name = 'tampered' WHERE id = $1`, [
        TEMPLATE_VERSION_ID,
      ]),
    ).rejects.toThrow(/immutable/);
  });

  it('allows draft file linkage and preserves file linkage as append-only evidence', async () => {
    await pool.query(
      `INSERT INTO qc.document_version_files (document_version_id, file_id, file_role, linked_by)
       VALUES ($1, $2, 'CONTROLLED_COPY', $3)`,
      [DRAFT_DOCUMENT_VERSION_ID, DOCUMENT_FILE_ID, ACTOR_ID],
    );
    const linkage = await pool.query(
      `SELECT id FROM qc.document_version_files WHERE document_version_id = $1`,
      [DRAFT_DOCUMENT_VERSION_ID],
    );
    await expect(
      pool.query(`UPDATE qc.document_version_files SET file_role = 'TAMPERED' WHERE id = $1`, [
        linkage.rows[0].id,
      ]),
    ).rejects.toThrow(/append-only/);
    await expect(
      pool.query(`DELETE FROM qc.document_version_files WHERE id = $1`, [linkage.rows[0].id]),
    ).rejects.toThrow(/append-only/);
    await expect(
      pool.query(
        `INSERT INTO qc.document_version_files (document_version_id, file_id, file_role, linked_by)
         VALUES ($1, $2, 'CONTROLLED_COPY', $3)`,
        [DOCUMENT_VERSION_ID, DOCUMENT_FILE_ID, ACTOR_ID],
      ),
    ).rejects.toThrow(/only be linked while the version is DRAFT/);
  });

  it('rejects invalid controlled template history at the database boundary', async () => {
    await expect(
      pool.query(
        `INSERT INTO qc.inspection_template_versions
          (template_id, version_no, state, created_by, name)
         VALUES ($1, 'invalid', 'EFFECTIVE', $2, 'Invalid history')`,
        [TEMPLATE_ID, ACTOR_ID],
      ),
    ).rejects.toThrow(/ck_inspection_template_versions__state/);
  });
});
