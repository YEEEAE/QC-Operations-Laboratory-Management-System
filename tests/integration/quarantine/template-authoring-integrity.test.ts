import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPool } from '../../../src/shared/database/pool.js';
import { migrate } from '../../../scripts/db/migrate.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

/**
 * QC-360 authoring-origin integrity on real PostgreSQL.
 *
 * Verifies the guard split introduced by `0048_inspection_template_authoring`:
 * a user-authored specification is approved against a bound EFFECTIVE
 * controlled document, while the externally transcribed catalogue path keeps
 * the 0046 evidence chain unchanged. Also verifies that an approved authoring
 * origin is immutable and that a controlled document body is writable only
 * while its revision is a draft.
 */

const ACTOR_ID = '01900000-0000-7000-8000-00000000f001';
const FILE_ID = '01900000-0000-7000-8000-00000000f002';
const DOCUMENT_ID = '01900000-0000-7000-8000-00000000f003';
const EFFECTIVE_VERSION_ID = '01900000-0000-7000-8000-00000000f004';
const DRAFT_VERSION_ID = '01900000-0000-7000-8000-00000000f005';
const TEMPLATE_ID = '01900000-0000-7000-8000-00000000f006';
const TEMPLATE_VERSION_ID = '01900000-0000-7000-8000-00000000f007';
const UNBOUND_TEMPLATE_VERSION_ID = '01900000-0000-7000-8000-00000000f008';

const authoredDesign = (schemaVersion: number) => ({
  schemaVersion,
  docCode: 'QC-AUTH-900',
  reportRevision: '1',
  sourceTitle: 'Authored specimen inspection',
  sourceDate: null,
  headerFields: [],
  sections: [],
  aqlFields: [],
  resultVocabulary: 'PASS_FAIL_REMARK_NA',
  finalDisposition: [],
  reviewResponsibilities: [],
});

const HASH = 'c'.repeat(64);

/** Captures the SQLSTATE message of a rejected statement. */
async function rejection(sql: string, values: unknown[] = []): Promise<string> {
  try {
    await pool!.query(sql, values);
  } catch (error) {
    return (error as { message: string }).message;
  }
  throw new Error(`Expected the statement to be rejected but it committed: ${sql}`);
}

let pool: ReturnType<typeof createPool> | undefined;

describe('QC-360 authoring origin and controlled-body integrity', () => {
  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer()),
      max: 4,
    });
    await pool.query('DROP SCHEMA IF EXISTS qc CASCADE');
    await migrate({ pool });
    await pool.query(
      `INSERT INTO qc.users (id, login_identity, display_name, password_hash, account_state)
       VALUES ($1, 'qc360-author', 'QC360 author', 'test-only-placeholder', 'ACTIVE')`,
      [ACTOR_ID],
    );
    await pool.query(
      `INSERT INTO qc.files
        (id, original_filename, storage_key, storage_provider, mime_type, extension, size_bytes, sha256, uploaded_by, state)
       VALUES ($1, 'procedure.pdf', 'qc360/procedure.pdf', 'OBJECT_STORAGE', 'application/pdf', 'pdf', 12, repeat('a', 64), $2, 'ACTIVE')`,
      [FILE_ID, ACTOR_ID],
    );
    await pool.query(
      `INSERT INTO qc.document_identities (id, document_no, document_type, title, active, created_by)
       VALUES ($1, 'SOP-FRS-900', 'SOP', 'Authored inspection procedure', true, $2)`,
      [DOCUMENT_ID, ACTOR_ID],
    );
    await pool.query(
      `INSERT INTO qc.document_versions (id, document_id, revision, state, content_hash, source_binding_verified, created_by)
       VALUES ($1, $2, 'D0.1', 'DRAFT', repeat('b', 64), true, $3)`,
      [EFFECTIVE_VERSION_ID, DOCUMENT_ID, ACTOR_ID],
    );
    await pool.query(
      `INSERT INTO qc.document_version_files (document_version_id, file_id, file_role, linked_by)
       VALUES ($1, $2, 'SOURCE', $3)`,
      [EFFECTIVE_VERSION_ID, FILE_ID, ACTOR_ID],
    );
    await pool.query(`UPDATE qc.document_versions SET state = 'EFFECTIVE' WHERE id = $1`, [
      EFFECTIVE_VERSION_ID,
    ]);
    await pool.query(
      `INSERT INTO qc.document_versions (id, document_id, revision, state, content_hash, created_by)
       VALUES ($1, $2, 'D0.2', 'DRAFT', NULL, $3)`,
      [DRAFT_VERSION_ID, DOCUMENT_ID, ACTOR_ID],
    );
    await pool.query(
      `INSERT INTO qc.inspection_templates (id, catalog_id, template_code, name, active, created_by)
       VALUES ($1, NULL, 'QC-AUTH-900', 'Authored specimen inspection', true, $2)`,
      [TEMPLATE_ID, ACTOR_ID],
    );
    for (const [id, versionNo] of [
      [TEMPLATE_VERSION_ID, '1'],
      [UNBOUND_TEMPLATE_VERSION_ID, '2'],
    ] as const)
      await pool.query(
        `INSERT INTO qc.inspection_template_versions
           (id, template_id, version_no, state, name, created_by, content_hash, digital_form, report_revision, authoring_origin)
         VALUES ($1, $2, $3, 'DRAFT', 'Authored specimen inspection', $4, $5, $6::jsonb, $3, 'USER_AUTHORED_SPECIFICATION')`,
        [
          id,
          TEMPLATE_ID,
          versionNo,
          ACTOR_ID,
          HASH,
          JSON.stringify({ ...authoredDesign(2), reportRevision: versionNo }),
        ],
      );
    await pool.query(
      `INSERT INTO qc.inspection_template_document_sources
         (template_version_id, document_version_id, usage_type, linked_by)
       VALUES ($1, $2, 'SPECIFICATION', $3)`,
      [TEMPLATE_VERSION_ID, EFFECTIVE_VERSION_ID, ACTOR_ID],
    );
  }, 180_000);

  afterAll(async () => {
    if (pool) await pool.end();
    await stopPostgresContainer();
  });

  it('defaults a version created without an explicit origin to a source transcription', async () => {
    const id = '01900000-0000-7000-8000-00000000f009';
    await pool!.query(
      `INSERT INTO qc.inspection_template_versions
         (id, template_id, version_no, state, name, created_by)
       VALUES ($1, $2, '99', 'DRAFT', 'Defaulted origin', $3)`,
      [id, TEMPLATE_ID, ACTOR_ID],
    );
    const { rows } = await pool!.query<{ authoring_origin: string }>(
      `SELECT authoring_origin FROM qc.inspection_template_versions WHERE id = $1`,
      [id],
    );
    expect(rows[0]!.authoring_origin).toBe('SOURCE_TRANSCRIPTION');
  });

  it('rejects an authored approval that has no bound effective document', async () => {
    expect(
      await rejection(`UPDATE qc.inspection_template_versions SET state = 'APPROVED' WHERE id = $1`, [
        UNBOUND_TEMPLATE_VERSION_ID,
      ]),
    ).toContain('CONTROLLED_TEMPLATE_SOURCE_REQUIRED');
  });

  it('rejects an unsupported schema version even when a document is bound', async () => {
    await pool!.query(
      `UPDATE qc.inspection_template_versions SET digital_form = digital_form || '{"schemaVersion":3}'::jsonb WHERE id = $1`,
      [TEMPLATE_VERSION_ID],
    );
    expect(
      await rejection(`UPDATE qc.inspection_template_versions SET state = 'APPROVED' WHERE id = $1`, [
        TEMPLATE_VERSION_ID,
      ]),
    ).toContain('CONTROLLED_TEMPLATE_SOURCE_REQUIRED');
  });

  it('approves an authored specification bound to an effective controlled document', async () => {
    await pool!.query(
      `UPDATE qc.inspection_template_versions SET digital_form = digital_form || '{"schemaVersion":2}'::jsonb WHERE id = $1`,
      [TEMPLATE_VERSION_ID],
    );
    await pool!.query(
      `UPDATE qc.inspection_template_versions
          SET state = 'APPROVED', approved_at = now(), approved_by = $2
        WHERE id = $1`,
      [TEMPLATE_VERSION_ID, ACTOR_ID],
    );
    const { rows } = await pool!.query<{ state: string }>(
      `SELECT state FROM qc.inspection_template_versions WHERE id = $1`,
      [TEMPLATE_VERSION_ID],
    );
    expect(rows[0]!.state).toBe('APPROVED');
  });

  it('keeps the approved authoring origin immutable', async () => {
    expect(
      await rejection(
        `UPDATE qc.inspection_template_versions SET authoring_origin = 'SOURCE_TRANSCRIPTION' WHERE id = $1`,
        [TEMPLATE_VERSION_ID],
      ),
    ).toContain('APPROVED_TEMPLATE_IMMUTABLE');
  });

  it('writes a controlled document body only while the revision is a draft', async () => {
    expect(
      await rejection(
        `INSERT INTO qc.document_version_sections (document_version_id, block_type, body_text, position, created_by)
         VALUES ($1, 'PARAGRAPH', 'body on an effective revision', 1, $2)`,
        [EFFECTIVE_VERSION_ID, ACTOR_ID],
      ),
    ).toContain('immutable outside draft');

    await pool!.query(
      `INSERT INTO qc.document_version_sections (document_version_id, block_type, body_text, position, created_by)
       VALUES ($1, 'PARAGRAPH', 'draft body', 1, $2)`,
      [DRAFT_VERSION_ID, ACTOR_ID],
    );

    await pool!.query(`UPDATE qc.document_versions SET state = 'IN_REVIEW' WHERE id = $1`, [
      DRAFT_VERSION_ID,
    ]);
    expect(
      await rejection(
        `UPDATE qc.document_version_sections SET body_text = 'late edit' WHERE document_version_id = $1`,
        [DRAFT_VERSION_ID],
      ),
    ).toContain('immutable outside draft');
    expect(
      await rejection(`DELETE FROM qc.document_version_sections WHERE document_version_id = $1`, [
        DRAFT_VERSION_ID,
      ]),
    ).toContain('immutable outside draft');
  });

  it('keeps the Rev 14 catalogue identity set intact', async () => {
    const total = await pool!.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM qc.inspection_report_catalog`,
    );
    expect(total.rows[0]!.count).toBe('194');
    const conflicted = await pool!.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM qc.inspection_report_catalog WHERE catalog_state <> 'ACTIVE'`,
    );
    expect(conflicted.rows[0]!.count).toBe('7');
    const blank = await pool!.query(`SELECT 1 FROM qc.inspection_report_catalog WHERE doc_code = 'F-823-T175'`);
    expect(blank.rowCount).toBe(0);
  });
});
