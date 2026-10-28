import { createHash } from 'node:crypto';
import type { Transaction } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { stableJson } from '../../../shared/json/stable-stringify.js';

export type ExecutionDocument = Readonly<{
  documentId: string;
  documentVersionId: string;
  documentNo: string;
  documentType: string;
  title: string;
  revision: string;
  usageType: string;
  contentHash: string;
  effectiveAt: Date;
  sourceFileDigest: string;
  sourceFiles: readonly Readonly<{ fileId: string; fileRole: string; filename: string; sha256: string }>[];
}>;

type ExecutionType = 'INSPECTION_REPORT' | 'LAB_TEST';

/** Resolve a pinned template's approved sources under the owning write transaction. */
export async function captureExecutionDocuments(
  tx: Transaction<DatabaseSchema>,
  input: {
    executionType: ExecutionType;
    executionId: string;
    templateVersionId: string;
    checkpoint: 'CREATE' | 'SUBMIT';
    executionAt: Date;
    capturedAt: Date;
    itemCode: string | null;
    lot: string | null;
    methodReference: string;
    actorId: string;
    requestId: string;
  },
): Promise<readonly ExecutionDocument[]> {
  const query = input.executionType === 'INSPECTION_REPORT'
    ? tx.selectFrom('inspection_template_document_sources as source')
    : tx.selectFrom('lab_test_template_document_sources as source');
  const rows = await query
    .innerJoin('document_versions as version', 'version.id', 'source.document_version_id')
    .innerJoin('document_identities as identity', 'identity.id', 'version.document_id')
    .select([
      'source.document_version_id as documentVersionId', 'source.usage_type as usageType',
      'source.source_revision as sourceRevision', 'source.source_content_hash as sourceContentHash',
      'source.source_files_snapshot as sourceFilesSnapshot', 'source.source_snapshot_verified as sourceSnapshotVerified',
      'identity.id as documentId', 'identity.document_no as documentNo', 'identity.document_type as documentType',
      'identity.title as title', 'identity.active as documentActive', 'version.revision as revision',
      'version.effective_at as effectiveAt', 'version.effective_until as effectiveUntil',
      'version.approved_at as approvedAt', 'version.reviewed_at as reviewedAt', 'version.content_hash as contentHash',
      'version.source_binding_verified as sourceBindingVerified', 'version.state as state',
    ])
    .where('source.template_version_id', '=', input.templateVersionId)
    .orderBy('identity.document_no').orderBy('version.id').execute();

  if (!rows.length) throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
  const captured: ExecutionDocument[] = [];
  for (const row of rows) {
    if (!row.documentActive || row.state !== 'EFFECTIVE' || !row.approvedAt || !row.reviewedAt
      || !row.effectiveAt || row.effectiveAt > input.executionAt
      || (row.effectiveUntil && row.effectiveUntil <= input.executionAt)
      || row.sourceBindingVerified !== true || row.sourceSnapshotVerified !== true
      || !row.contentHash || !/^[0-9a-f]{64}$/.test(row.contentHash)
      || row.sourceRevision !== row.revision || row.sourceContentHash !== row.contentHash) {
      throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
    }
    const files = await tx.selectFrom('document_version_files as link')
      .innerJoin('files as file', 'file.id', 'link.file_id')
      .select(['link.file_id as fileId', 'link.file_role as fileRole', 'file.original_filename as filename', 'file.sha256 as sha256', 'file.state as state'])
      .where('link.document_version_id', '=', row.documentVersionId)
      .orderBy('link.file_id').orderBy('link.file_role').execute();
    if (!files.length || files.some((file) => file.state !== 'ACTIVE' || !/^[0-9a-f]{64}$/.test(file.sha256)))
      throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
    const manifest = files.map(({ fileId, fileRole, sha256 }) => ({ fileId, fileRole, sha256 }));
    const sourceFilesDigest = createHash('sha256').update(stableJson(manifest)).digest('hex');
    const previousManifest = row.sourceFilesSnapshot as unknown;
    const previousFiles = Array.isArray(previousManifest) ? previousManifest : [];
    if (stableJson(previousFiles) !== stableJson(manifest))
      throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
    const document: ExecutionDocument = {
      documentId: row.documentId, documentVersionId: row.documentVersionId, documentNo: row.documentNo,
      documentType: row.documentType, title: row.title, revision: row.revision, usageType: row.usageType,
      contentHash: row.contentHash, effectiveAt: row.effectiveAt, sourceFileDigest: sourceFilesDigest,
      sourceFiles: files.map(({ fileId, fileRole, filename, sha256 }) => ({ fileId, fileRole, filename, sha256 })),
    };
    await tx.insertInto('document_execution_contexts').values({
      execution_type: input.executionType, execution_id: input.executionId, checkpoint: input.checkpoint,
      document_id: document.documentId, document_version_id: document.documentVersionId,
      template_version_id: input.templateVersionId, usage_type: document.usageType, revision: document.revision,
      content_hash: document.contentHash, source_file_digest: sourceFilesDigest,
      source_files_snapshot: stableJson(manifest), effective_at: document.effectiveAt,
      execution_at: input.executionAt, captured_at: input.capturedAt, item_code: input.itemCode, lot: input.lot,
      method_reference: input.methodReference, captured_by: input.actorId, request_id: input.requestId,
    }).execute();
    captured.push(document);
  }
  return captured;
}

export async function repeatExecutionDocumentsAtSubmission(
  tx: Transaction<DatabaseSchema>,
  input: { executionType: ExecutionType; executionId: string; actorId: string; capturedAt: Date; requestId: string },
): Promise<readonly ExecutionDocument[]> {
  const rows = await tx.selectFrom('document_execution_contexts as context')
    .innerJoin('document_identities as identity', 'identity.id', 'context.document_id')
    .selectAll('context').select([
      'identity.document_no as documentNo', 'identity.document_type as documentType', 'identity.title as title',
    ])
    .where('context.execution_type', '=', input.executionType).where('context.execution_id', '=', input.executionId)
    .where('context.checkpoint', '=', 'CREATE').orderBy('context.document_version_id').execute();
  if (!rows.length) throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
  for (const row of rows) {
    await tx.insertInto('document_execution_contexts').values({
      execution_type: row.execution_type, execution_id: row.execution_id, checkpoint: 'SUBMIT',
      document_id: row.document_id, document_version_id: row.document_version_id,
      template_version_id: row.template_version_id, usage_type: row.usage_type, revision: row.revision,
      content_hash: row.content_hash, source_file_digest: row.source_file_digest,
      source_files_snapshot: row.source_files_snapshot, effective_at: row.effective_at,
      execution_at: row.execution_at, captured_at: input.capturedAt, item_code: row.item_code, lot: row.lot,
      method_reference: row.method_reference, captured_by: input.actorId, request_id: input.requestId,
    }).execute();
  }
  return rows.map((row) => ({
    documentId: row.document_id, documentVersionId: row.document_version_id, documentNo: row.documentNo,
    documentType: row.documentType, title: row.title, revision: row.revision, usageType: row.usage_type,
    contentHash: row.content_hash, effectiveAt: row.effective_at, sourceFileDigest: row.source_file_digest,
    sourceFiles: row.source_files_snapshot as ExecutionDocument['sourceFiles'],
  }));
}
