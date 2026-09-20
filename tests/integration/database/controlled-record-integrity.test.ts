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
const DRAFT_TEMPLATE_VERSION_ID = '01900000-0000-7000-8000-00000000e008';
const DOCUMENT_VERSION_3_ID = '01900000-0000-7000-8000-00000000e009';
const INSPECTION_ID = '01900000-0000-7000-8000-00000000e010';
const RECEIVING_ID = '01900000-0000-7000-8000-00000000e011';
const LAB_TEMPLATE_ID = '01900000-0000-7000-8000-00000000e012';
const LAB_TEMPLATE_VERSION_ID = '01900000-0000-7000-8000-00000000e013';
const LAB_TEST_ID = '01900000-0000-7000-8000-00000000e014';

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
    await pool.query(`UPDATE qc.document_versions SET state = 'EFFECTIVE' WHERE id = $1`, [
      DOCUMENT_VERSION_ID,
    ]);
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
    await pool.query(
      `INSERT INTO qc.inspection_template_versions
        (id, template_id, version_no, state, created_by, content_hash, name)
       VALUES ($1, $2, 'v2', 'DRAFT', $3, 'template-hash-2', 'Draft inspection template')`,
      [DRAFT_TEMPLATE_VERSION_ID, TEMPLATE_ID, ACTOR_ID],
    );
    await pool.query(
      `INSERT INTO qc.receiving_items
        (id, receiving_no, doc_no, item_code, description, lot, qty, receiving_date, created_by)
       VALUES ($1, 'RCV-029-B', 'PO-029-B', 'ITEM-029-B', 'Disposable record fixture', 'LOT-029-B', 1, CURRENT_DATE, $2)`,
      [RECEIVING_ID, ACTOR_ID],
    );
    await pool.query(
      `INSERT INTO qc.inspection_reports
        (id, inspection_no, receiving_item_id, template_version_id, state, author_id, created_by)
       VALUES ($1, 'INSP-029-B', $2, $3, 'DRAFT', $4, $4)`,
      [INSPECTION_ID, RECEIVING_ID, TEMPLATE_VERSION_ID, ACTOR_ID],
    );
    await pool.query(
      `INSERT INTO qc.inspection_report_snapshots
        (inspection_report_id, snapshot_version, snapshot_stage, receiving_snapshot, template_snapshot, snapshot_hash)
       VALUES ($1, 1, 'CREATION', '{}'::jsonb, '{}'::jsonb, 'creation-hash')`,
      [INSPECTION_ID],
    );
    await pool.query(
      `INSERT INTO qc.lab_test_templates (id, test_code, name, active, created_by)
       VALUES ($1, 'LAB-029-B', 'Disposable laboratory template', true, $2)`,
      [LAB_TEMPLATE_ID, ACTOR_ID],
    );
    await pool.query(
      `INSERT INTO qc.lab_test_template_versions
        (id, template_id, version_no, state, created_by, content_hash)
       VALUES ($1, $2, 'v1', 'DRAFT', $3, 'lab-template-hash')`,
      [LAB_TEMPLATE_VERSION_ID, LAB_TEMPLATE_ID, ACTOR_ID],
    );
    await pool.query(
      `INSERT INTO qc.lab_tests
        (id, lab_test_no, template_version_id, state, author_id, created_by)
       VALUES ($1, 'LABTEST-029-B', $2, 'DRAFT', $3, $3)`,
      [LAB_TEST_ID, LAB_TEMPLATE_VERSION_ID, ACTOR_ID],
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
    await expect(pool.query(`TRUNCATE qc.audit_events`)).rejects.toThrow(/append-only/);

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
    await expect(pool.query(`TRUNCATE qc.electronic_signatures`)).rejects.toThrow(/append-only/);
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

  it('binds template sources to effective document versions and makes usage evidence append-only', async () => {
    const inspectionSource = await pool.query(
      `INSERT INTO qc.inspection_template_document_sources
        (template_version_id, document_version_id, usage_type, linked_by)
       VALUES ($1, $2, 'WI', $3) RETURNING id`,
      [DRAFT_TEMPLATE_VERSION_ID, DOCUMENT_VERSION_ID, ACTOR_ID],
    );
    const labSource = await pool.query(
      `INSERT INTO qc.lab_test_template_document_sources
        (template_version_id, document_version_id, usage_type, linked_by)
       VALUES ($1, $2, 'SOP', $3) RETURNING id`,
      [LAB_TEMPLATE_VERSION_ID, DOCUMENT_VERSION_ID, ACTOR_ID],
    );
    await expect(
      pool.query(`DELETE FROM qc.inspection_template_document_sources WHERE id = $1`, [
        inspectionSource.rows[0].id,
      ]),
    ).rejects.toThrow(/append-only/);
    await expect(
      pool.query(
        `UPDATE qc.lab_test_template_document_sources SET usage_type = 'TAMPERED' WHERE id = $1`,
        [labSource.rows[0].id],
      ),
    ).rejects.toThrow(/append-only/);
    await expect(pool.query(`TRUNCATE qc.lab_test_template_document_sources`)).rejects.toThrow(
      /append-only/,
    );
    await pool.query(
      `INSERT INTO qc.lab_document_usage
        (lab_test_id, document_version_id, usage_type, document_snapshot)
       VALUES ($1, $2, 'SOP', $3::jsonb)`,
      [LAB_TEST_ID, DOCUMENT_VERSION_ID, JSON.stringify({ revision: '1', contentHash: 'hash-1' })],
    );
    await expect(
      pool.query(`DELETE FROM qc.lab_document_usage WHERE lab_test_id = $1`, [LAB_TEST_ID]),
    ).rejects.toThrow(/append-only/);
    await expect(pool.query(`TRUNCATE qc.lab_document_usage`)).rejects.toThrow(/append-only/);
  });

  it('preserves execution snapshots and audit history when a document is superseded', async () => {
    const submission = await pool.query(
      `INSERT INTO qc.inspection_report_snapshots
        (inspection_report_id, snapshot_version, snapshot_stage, receiving_snapshot, template_snapshot,
         controlled_source_snapshot, criteria_snapshot, results_snapshot, snapshot_hash)
       VALUES ($1, 2, 'SUBMISSION', '{}'::jsonb, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, 'submission-hash')
       RETURNING id`,
      [
        INSPECTION_ID,
        JSON.stringify({
          templateVersionId: TEMPLATE_VERSION_ID,
          documentVersionId: DOCUMENT_VERSION_ID,
        }),
        JSON.stringify([
          { documentVersionId: DOCUMENT_VERSION_ID, revision: '1', contentHash: 'hash-1' },
        ]),
        JSON.stringify([{ sourceReference: 'DOC-029-B', contentHash: 'hash-1' }]),
        JSON.stringify([{ pointId: 'point-1', value: 'observed-1' }]),
      ],
    );
    const before = await pool.query(
      `SELECT snapshot_hash, controlled_source_snapshot, criteria_snapshot, results_snapshot
       FROM qc.inspection_report_snapshots WHERE id = $1`,
      [submission.rows[0].id],
    );

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE qc.document_versions SET state = 'SUPERSEDED' WHERE id = $1`, [
        DOCUMENT_VERSION_ID,
      ]);
      await client.query(
        `INSERT INTO qc.document_versions (id, document_id, revision, state, content_hash, created_by)
         VALUES ($1, $2, '3', 'EFFECTIVE', 'hash-3', $3)`,
        [DOCUMENT_VERSION_3_ID, DOCUMENT_ID, ACTOR_ID],
      );
      await client.query(
        `INSERT INTO qc.audit_events (actor_type, actor_id, subject_type, subject_id, action, old_state, new_state, reason, request_id)
         VALUES ('USER', $1, 'DOCUMENT_VERSION', $2, 'SUPERSEDE', 'EFFECTIVE', 'SUPERSEDED', 'controlled revision', 'qc-029-b-correction')`,
        [ACTOR_ID, DOCUMENT_VERSION_ID],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const after = await pool.query(
      `SELECT snapshot_hash, controlled_source_snapshot, criteria_snapshot, results_snapshot
       FROM qc.inspection_report_snapshots WHERE id = $1`,
      [submission.rows[0].id],
    );
    expect(after.rows[0]).toEqual(before.rows[0]);
    await expect(
      pool.query(`SELECT state, content_hash FROM qc.document_versions WHERE id = $1`, [
        DOCUMENT_VERSION_ID,
      ]),
    ).resolves.toMatchObject({ rows: [{ state: 'SUPERSEDED', content_hash: 'hash-1' }] });
    await expect(
      pool.query(`SELECT count(*)::int AS count FROM qc.document_versions WHERE document_id = $1`, [
        DOCUMENT_ID,
      ]),
    ).resolves.toMatchObject({ rows: [{ count: 3 }] });
    await expect(
      pool.query(
        `UPDATE qc.inspection_report_snapshots SET snapshot_hash = 'tampered' WHERE id = $1`,
        [submission.rows[0].id],
      ),
    ).rejects.toThrow(/append-only/);
    await expect(pool.query(`TRUNCATE qc.inspection_report_snapshots`)).rejects.toThrow(
      /append-only/,
    );
  });

  it('rolls business state and audit evidence back together on transactional failure', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE qc.document_versions SET state = 'SUPERSEDED' WHERE id = $1`, [
        DOCUMENT_VERSION_3_ID,
      ]);
      await client.query(
        `INSERT INTO qc.audit_events (actor_type, actor_id, subject_type, subject_id, action, request_id)
         VALUES ('USER', $1, 'DOCUMENT_VERSION', $2, 'SUPERSEDE', 'qc-029-b-rollback')`,
        [ACTOR_ID, DOCUMENT_VERSION_3_ID],
      );
      await expect(
        client.query(
          `INSERT INTO qc.document_versions (document_id, revision, state, created_by)
         VALUES ($1, '3', 'DRAFT', $2)`,
          [DOCUMENT_ID, ACTOR_ID],
        ),
      ).rejects.toThrow();
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
    await expect(
      pool.query(`SELECT state FROM qc.document_versions WHERE id = $1`, [DOCUMENT_VERSION_3_ID]),
    ).resolves.toMatchObject({ rows: [{ state: 'EFFECTIVE' }] });
    await expect(
      pool.query(
        `SELECT count(*)::int AS count FROM qc.audit_events WHERE request_id = 'qc-029-b-rollback'`,
      ),
    ).resolves.toMatchObject({ rows: [{ count: 0 }] });
  });
});
