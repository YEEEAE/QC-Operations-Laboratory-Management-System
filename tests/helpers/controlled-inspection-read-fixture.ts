import { createHash, randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { assertTestEnvironment } from './test-env.js';

/** Synthetic read-model setup only: never evidence of scientific approval or effectivity. */
export async function seedControlledInspectionReadVersion(
  pool: Pool,
  input: {
    templateId: string;
    versionId?: string;
    versionNo: string;
    actorId: string;
    receivingId: string;
  },
): Promise<{ rows: { id: string }[] }> {
  assertTestEnvironment();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const template = await client.query(
      'SELECT catalog_id, name FROM qc.inspection_templates WHERE id=$1 FOR UPDATE',
      [input.templateId],
    );
    let catalogId = template.rows[0].catalog_id;
    const code = `SYNTHETIC-READ-${input.templateId}`;
    const digest = createHash('sha256').update(code).digest('hex');
    if (!catalogId) {
      catalogId = randomUUID();
      await client.query(
        `INSERT INTO qc.inspection_report_catalog
        (id,doc_code,normalized_doc_code,official_title,normalized_search_title,master_revision,source_list_revision,source_row_no,source_sha256,source_document_status)
        VALUES ($1,$2,$2,$3,$3,'SYNTHETIC',14,0,$4,'MATCHED')`,
        [catalogId, code, template.rows[0].name, digest],
      );
      await client.query('UPDATE qc.inspection_templates SET catalog_id=$2 WHERE id=$1', [
        input.templateId,
        catalogId,
      ]);
      await client.query(
        `INSERT INTO qc.inspection_report_source_evidence
        (catalog_id,doc_code,source_title,source_revision,source_file,source_sha256,content_sha256,status)
        VALUES ($1,$2,$3,'SYNTHETIC','synthetic-test-only:no-authority',$4,$4,'MATCHED')`,
        [catalogId, code, template.rows[0].name, digest],
      );
    }
    const version = await client.query<{ id: string }>(
      `INSERT INTO qc.inspection_template_versions
      (id,template_id,version_no,state,name,created_by,report_revision,digital_form,content_hash,source_document,source_evidence_id,approved_at,effective_at)
      SELECT $1,$2,$3,'APPROVED',c.official_title,$4,c.master_revision,
        jsonb_build_object('docCode',c.doc_code,'reportRevision',c.master_revision,'schemaVersion','1'),$5,
        'synthetic-test-only:no-authority',e.id,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
      FROM qc.inspection_report_catalog c JOIN qc.inspection_report_source_evidence e ON e.catalog_id=c.id
      WHERE c.id=$6 ON CONFLICT (template_id,version_no) DO UPDATE SET state='APPROVED' RETURNING id`,
      [
        input.versionId ?? randomUUID(),
        input.templateId,
        input.versionNo,
        input.actorId,
        digest,
        catalogId,
      ],
    );
    await client.query(
      `INSERT INTO qc.inspection_item_templates (item_code,template_id,effective_from,created_by)
      SELECT item_code,$2,CURRENT_DATE,$3 FROM qc.receiving_items WHERE id=$1
      ON CONFLICT (item_code,template_id) DO NOTHING`,
      [input.receivingId, input.templateId, input.actorId],
    );
    await client.query('COMMIT');
    return version;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
