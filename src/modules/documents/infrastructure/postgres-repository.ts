import type { Kysely, Transaction } from 'kysely';
import type { DatabaseRow, DatabaseSchema } from '../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../shared/database/database.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { actorHasScope } from '../../../shared/authorization/scope-evaluator.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuditRepository } from '../../../shared/audit/audit-repository.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import type { OutboxRepository } from '../../../shared/outbox/outbox-repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import type { DocumentIdentity } from '../domain/document.js';
import type { DocumentVersion, DocumentVersionFile } from '../domain/document-version.js';
import { documentContentDigest } from '../domain/document-content-digest.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { DocumentVersionAction } from '../domain/document-state.js';
import type { DocumentListFilter, DocumentRepository, DocumentSourceFileOption } from '../ports/repository.js';
import type { DatabaseTransaction } from '../../../shared/database/transaction.js';
import { decideRevisionCreation, expectedPredecessorOf } from '../domain/revision-creation.js';

const identityMap = (row: DatabaseRow<'document_identities'>, currentEffectiveVersionId?: string): DocumentIdentity => ({
  id: row.id,
  documentNo: row.document_no,
  documentType: row.document_type,
  title: row.title,
  ...(row.owner_id ? { ownerId: row.owner_id } : {}),
  active: row.active,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  version: BigInt(row.version),
  ...(currentEffectiveVersionId ? { currentEffectiveVersionId } : {}),
});

type JoinedDocumentFile = DatabaseRow<'document_version_files'> & {
  source_filename: string;
  source_size_bytes: bigint;
  source_sha256: string;
  source_state: string;
};

const fileMap = (row: JoinedDocumentFile): DocumentVersionFile => ({
  id: row.id,
  documentVersionId: row.document_version_id,
  fileId: row.file_id,
  fileRole: row.file_role,
  originalFilename: row.source_filename,
  sizeBytes: Number(row.source_size_bytes),
  sha256: row.source_sha256,
  state: row.source_state,
  linkedAt: row.linked_at,
  linkedBy: row.linked_by,
});

const versionMap = (row: DatabaseRow<'document_versions'>, files: readonly DocumentVersionFile[] = []): DocumentVersion => ({
  id: row.id,
  documentId: row.document_id,
  revision: row.revision,
  state: row.state as DocumentVersion['state'],
  ...(row.effective_at ? { effectiveAt: row.effective_at } : {}),
  ...(row.approved_at ? { approvedAt: row.approved_at } : {}),
  ...(row.approved_by ? { approvedBy: row.approved_by } : {}),
  ...(row.superseded_at ? { supersededAt: row.superseded_at } : {}),
  ...(row.archived_at ? { archivedAt: row.archived_at } : {}),
  ...(row.voided_at ? { voidedAt: row.voided_at } : {}),
  ...(row.void_reason ? { voidReason: row.void_reason } : {}),
  ...(row.change_summary ? { changeSummary: row.change_summary } : {}),
  ...(row.content_hash ? { contentHash: row.content_hash } : {}),
  sourceBindingVerified: row.source_binding_verified,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.created_at,
  version: BigInt(row.version),
  files,
});

export class PostgresDocumentRepository implements DocumentRepository {
  constructor(private readonly database: Kysely<DatabaseSchema>, private readonly audit?: AuditRepository, private readonly outbox?: OutboxRepository) {}

  async createDocument(input: { document: DocumentIdentity; actor: ActorContext; requestId: string }): Promise<DocumentIdentity> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const document = input.document;
        const row = await tx.insertInto('document_identities').values({ id: document.id, document_no: document.documentNo, document_type: document.documentType, title: document.title, owner_id: document.ownerId ?? null, active: document.active, created_by: document.createdBy, updated_at: document.updatedAt, version: 1n }).returningAll().executeTakeFirstOrThrow();
        await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id, subjectType: 'DOCUMENT_IDENTITY', subjectId: document.id, action: 'CREATE_DOCUMENT_IDENTITY', newState: 'CATALOG_ONLY', requestId: input.requestId });
        await this.outboxFor(tx)?.enqueue({ eventType: 'DOCUMENT_IDENTITY_CREATED', aggregateType: 'DOCUMENT_IDENTITY', aggregateId: document.id, payload: { documentNo: document.documentNo }, dedupeKey: `document-identity-created:${document.id}` });
        return identityMap(row);
      });
    } catch (error) { throw translateDatabaseError(error); }
  }

  async getDocument(id: string): Promise<DocumentIdentity | undefined> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
    const row = await this.database.selectFrom('document_identities').selectAll().where('id', '=', id).executeTakeFirst();
    if (!row) return undefined;
    const effective = await this.database.selectFrom('document_versions').select('id').where('document_id', '=', id).where('state', '=', 'EFFECTIVE').executeTakeFirst();
    return identityMap(row, effective?.id);
  }

  async listSourceFiles(documentId: string): Promise<readonly DocumentSourceFileOption[]> {
    const rows = await this.database
      .selectFrom('evidence_links as evidence')
      .innerJoin('files as file', 'file.id', 'evidence.file_id')
      .select(['file.id', 'file.original_filename', 'file.size_bytes', 'file.uploaded_at', 'file.sha256'])
      .distinct()
      .where('evidence.subject_type', '=', 'DOCUMENT_IDENTITY')
      .where('evidence.subject_id', '=', documentId)
      .where('evidence.removed_at', 'is', null)
      .where('file.state', '=', 'ACTIVE')
      .orderBy('file.original_filename')
      .orderBy('file.id')
      .execute();
    return rows
      .filter((row) => /^[0-9a-f]{64}$/i.test(row.sha256))
      .map((row) => ({ id: row.id, originalFilename: row.original_filename, sizeBytes: Number(row.size_bytes), uploadedAt: row.uploaded_at }));
  }

  async listDocuments(input: { actor: ActorContext; filter?: DocumentListFilter }): Promise<readonly DocumentIdentity[]> {
    let query = this.database.selectFrom('document_identities').selectAll().orderBy('updated_at', 'desc').orderBy('id', 'desc');
    if (input.filter?.documentType) query = query.where('document_type', '=', input.filter.documentType) as typeof query;
    if (input.filter?.search) query = query.where((eb) => eb.or([eb('document_no', 'ilike', `%${input.filter!.search}%`), eb('title', 'ilike', `%${input.filter!.search}%`)])) as typeof query;
    const rows = await query.execute();
    const result: DocumentIdentity[] = [];
    for (const row of rows) {
      const document = identityMap(row);
      if (!actorHasScope(input.actor, { type: 'DOCUMENT_IDENTITY', id: document.id, state: 'CATALOG_ONLY', ownerId: document.ownerId ?? document.createdBy }, { ownerId: document.ownerId ?? document.createdBy })) continue;
      if (input.filter?.state) {
        const versions = await this.listVersions(document.id);
        if (!versions.some((version) => version.state === input.filter?.state)) continue;
      }
      result.push(document);
    }
    return result;
  }

  async listDocumentsPage(input: Parameters<NonNullable<DocumentRepository['listDocumentsPage']>>[0]) {
    const grant = input.actor.permissions.find((p) => p.code === 'PERM-DOC-VIEW');
    if (!grant || grant.active === false || !grant.scopes.some((scope) => scope === 'OWN' || scope === 'GLOBAL')) {
      return { items: [], total: 0, page: 1, pageSize: input.page.pageSize };
    }
    let query = this.database.selectFrom('document_identities').selectAll().where('active', '=', true);
    if (!grant.scopes.includes('GLOBAL')) query = query.where((eb) =>
      eb(eb.fn.coalesce('owner_id', 'created_by'), '=', input.actor.id));
    if (input.filter?.documentType) query = query.where('document_type', '=', input.filter.documentType);
    if (input.filter?.search) query = query.where((eb) => eb.or([
      eb('document_no', 'ilike', `%${input.filter!.search}%`),
      eb('title', 'ilike', `%${input.filter!.search}%`),
    ]));
    if (input.filter?.state) query = query.where((eb) => eb.exists(
      eb.selectFrom('document_versions').select('id')
        .whereRef('document_versions.document_id', '=', 'document_identities.id')
        .where('document_versions.state', '=', input.filter!.state!),
    ));
    const counted = await query.clearSelect().select(({ fn }) => fn.countAll().as('count')).executeTakeFirst();
    const total = Number(counted?.count ?? 0);
    const page = Math.min(input.page.page, Math.max(1, Math.ceil(total / input.page.pageSize)));
    const rows = await query.orderBy('updated_at', 'desc').orderBy('id', 'desc')
      .limit(input.page.pageSize).offset((page - 1) * input.page.pageSize).execute();
    return { items: rows.map((row) => identityMap(row)), total, page, pageSize: input.page.pageSize };
  }

  async createVersion(input: { version: DocumentVersion; sourceFiles: readonly { fileId: string; fileRole: string }[]; expectedDocumentVersion: bigint; expectedPredecessor: { id: string; state: DocumentVersion['state']; version: bigint } | null; actor: ActorContext; requestId: string }): Promise<DocumentVersion> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const version = input.version;
        if (version.state !== 'DRAFT') throw new AppError('AUTHZ_DENIED', { userSafe: true });
        const document = await tx
          .selectFrom('document_identities')
          .selectAll()
          .where('id', '=', version.documentId)
          .forUpdate()
          .executeTakeFirst();
        if (!document) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
        if (!document.active) throw new AppError('AUTHZ_DENIED', { userSafe: true });
        if (BigInt(document.version) !== input.expectedDocumentVersion) {
          throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        }
        const historyRows = await tx
          .selectFrom('document_versions')
          .selectAll()
          .where('document_id', '=', version.documentId)
          .orderBy('created_at', 'desc')
          .orderBy('id', 'desc')
          .forUpdate()
          .execute();
        const history = historyRows.map((row) => versionMap(row));
        const lockedPredecessor = expectedPredecessorOf(history);
        const suppliedPredecessor = input.expectedPredecessor;
        if (
          lockedPredecessor === null
            ? suppliedPredecessor !== null
            : suppliedPredecessor === null ||
              lockedPredecessor.id !== suppliedPredecessor.id ||
              lockedPredecessor.state !== suppliedPredecessor.state ||
              lockedPredecessor.version !== suppliedPredecessor.version
        ) {
          throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        }
        const revisionDecision = decideRevisionCreation(history);
        if (!revisionDecision.allowed) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
        const selected = input.sourceFiles;
        if (!selected.length || new Set(selected.map((file) => file.fileId)).size !== selected.length)
          throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { files: ['select one or more unique source files'] } });
        const sourceRows = await tx
          .selectFrom('evidence_links as evidence')
          .innerJoin('files as file', 'file.id', 'evidence.file_id')
          .select(['file.id', 'file.original_filename', 'file.size_bytes', 'file.sha256', 'file.state'])
          .where('evidence.subject_type', '=', 'DOCUMENT_IDENTITY')
          .where('evidence.subject_id', '=', version.documentId)
          .where('evidence.removed_at', 'is', null)
          .where('file.state', '=', 'ACTIVE')
          .where('file.id', 'in', selected.map((file) => file.fileId))
          .orderBy('file.id')
          .forUpdate()
          .execute();
        if (sourceRows.length !== selected.length) throw new AppError('AUTHZ_DENIED', { userSafe: true });
        const rowsById = new Map(sourceRows.map((source) => [source.id, source]));
        const digestFiles = selected.map((source) => {
          const stored = rowsById.get(source.fileId);
          if (!stored) throw new AppError('AUTHZ_DENIED', { userSafe: true });
          return { fileId: stored.id, fileRole: source.fileRole, sha256: stored.sha256 };
        });
        const contentHash = documentContentDigest({ documentId: version.documentId, revision: version.revision, files: digestFiles });
        const linkedFiles: DocumentVersionFile[] = selected.map((source) => {
          const stored = rowsById.get(source.fileId)!;
          return { id: uuidv7(), documentVersionId: version.id, fileId: source.fileId, fileRole: source.fileRole, originalFilename: stored.original_filename, sizeBytes: Number(stored.size_bytes), sha256: stored.sha256, state: stored.state, linkedAt: version.createdAt, linkedBy: input.actor.id };
        });
        const row = await tx.insertInto('document_versions').values({ id: version.id, document_id: version.documentId, revision: version.revision, state: version.state, effective_at: version.effectiveAt ?? null, approved_at: version.approvedAt ?? null, approved_by: version.approvedBy ?? null, superseded_at: null, archived_at: null, voided_at: null, void_reason: null, change_summary: version.changeSummary ?? null, content_hash: contentHash, source_binding_verified: true, created_by: version.createdBy, version: 1n }).returningAll().executeTakeFirstOrThrow();
        await tx.insertInto('document_version_files').values(linkedFiles.map((file) => ({ id: file.id, document_version_id: version.id, file_id: file.fileId, file_role: file.fileRole, linked_at: file.linkedAt, linked_by: file.linkedBy }))).execute();
        await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id, subjectType: 'DOCUMENT_VERSION', subjectId: version.id, action: 'CREATE_DOCUMENT_VERSION', newState: 'DRAFT', requestId: input.requestId, payload: { revision: version.revision, contentHash, sourceFileIds: selected.map((file) => file.fileId) } });
        await this.outboxFor(tx)?.enqueue({ eventType: 'DOCUMENT_VERSION_CREATED', aggregateType: 'DOCUMENT_VERSION', aggregateId: version.id, payload: { documentId: version.documentId, revision: version.revision, contentHash }, dedupeKey: `document-version-created:${version.id}` });
        return versionMap(row, linkedFiles);
      });
    } catch (error) { throw translateDatabaseError(error); }
  }

  async getVersion(id: string): Promise<DocumentVersion | undefined> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
    const row = await this.database.selectFrom('document_versions').selectAll().where('id', '=', id).executeTakeFirst();
    if (!row) return undefined;
    return versionMap(row, await this.listVersionFiles(this.database, id));
  }

  async listVersions(documentId: string): Promise<readonly DocumentVersion[]> {
    const rows = await this.database.selectFrom('document_versions').selectAll().where('document_id', '=', documentId).orderBy('created_at', 'desc').orderBy('id', 'desc').execute();
    return Promise.all(rows.map(async (row) => versionMap(row, await this.listVersionFiles(this.database, row.id))));
  }

  async updateDraft(input: { id: string; expectedVersion: bigint; expectedContentHash: string; actor: ActorContext; revision: string; changeSummary?: string; now: Date; requestId: string }, transaction?: DatabaseTransaction): Promise<DocumentVersion> {
    try {
      const commit = async (tx: DatabaseTransaction) => {
        const context = await tx.selectFrom('document_versions').select('document_id').where('id', '=', input.id).executeTakeFirst();
        if (!context) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
        const identity = await tx.selectFrom('document_identities').selectAll().where('id', '=', context.document_id).forUpdate().executeTakeFirst();
        if (!identity || !identity.active) throw new AppError('AUTHZ_DENIED', { userSafe: true });
        const old = await tx.selectFrom('document_versions').selectAll().where('id', '=', input.id).where('version', '=', input.expectedVersion).where('content_hash', '=', input.expectedContentHash).where('state', '=', 'DRAFT').forUpdate().executeTakeFirst();
        if (!old) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        const files = await this.listVersionFiles(tx, input.id, true);
        const contentHash = documentContentDigest({ documentId: old.document_id, revision: input.revision, files });
        const row = await tx.updateTable('document_versions').set({ revision: input.revision.trim(), change_summary: input.changeSummary?.trim() || null, content_hash: contentHash, source_binding_verified: true, version: input.expectedVersion + 1n }).where('id', '=', input.id).where('version', '=', input.expectedVersion).where('content_hash', '=', input.expectedContentHash).where('state', '=', 'DRAFT').returningAll().executeTakeFirst();
        if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id, subjectType: 'DOCUMENT_VERSION', subjectId: input.id, action: 'EDIT_DOCUMENT_DRAFT', oldState: 'DRAFT', newState: 'DRAFT', reason: input.changeSummary?.trim() || undefined, requestId: input.requestId, payload: { expectedVersion: input.expectedVersion.toString(), version: (input.expectedVersion + 1n).toString(), expectedContentHash: input.expectedContentHash, revision: input.revision.trim(), contentHash } });
        await this.outboxFor(tx)?.enqueue({ eventType: 'DOCUMENT_VERSION_DRAFT_UPDATED', aggregateType: 'DOCUMENT_VERSION', aggregateId: input.id, payload: { version: (input.expectedVersion + 1n).toString(), revision: input.revision.trim(), contentHash }, dedupeKey: `document-version-draft-updated:${input.id}:v${input.expectedVersion + 1n}` });
        return versionMap(row, files);
      };
      return transaction ? await commit(transaction) : await this.database.transaction().execute(commit);
    } catch (error) { if (error instanceof AppError) throw error; throw translateDatabaseError(error); }
  }

  async recordReview(input: { id: string; expectedVersion: bigint; actor: ActorContext; now: Date; requestId: string }): Promise<DocumentVersion> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const row = await tx.updateTable('document_versions').set({ version: input.expectedVersion + 1n }).where('id', '=', input.id).where('version', '=', input.expectedVersion).where('state', '=', 'IN_REVIEW').returningAll().executeTakeFirst();
        if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id, subjectType: 'DOCUMENT_VERSION', subjectId: input.id, action: 'REVIEW_DOCUMENT_VERSION', oldState: 'IN_REVIEW', newState: 'IN_REVIEW', requestId: input.requestId });
        await this.outboxFor(tx)?.enqueue({ eventType: 'DOCUMENT_VERSION_REVIEWED', aggregateType: 'DOCUMENT_VERSION', aggregateId: input.id, payload: { state: 'IN_REVIEW' }, dedupeKey: `document-version-reviewed:${input.id}:v${input.expectedVersion + 1n}` });
        return versionMap(row);
      });
    } catch (error) { if (error instanceof AppError) throw error; throw translateDatabaseError(error); }
  }

  async transition(input: { id: string; expectedVersion: bigint; actor: ActorContext; action: DocumentVersionAction; toState: DocumentVersion['state']; reason?: string; now: Date; requestId: string }, transaction?: DatabaseTransaction): Promise<DocumentVersion> {
    try {
      const commit = async (tx: DatabaseTransaction) => {
        const old = await tx.selectFrom('document_versions').selectAll().where('id', '=', input.id).where('version', '=', input.expectedVersion).forUpdate().executeTakeFirst();
        if (!old) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        if (input.action === 'APPROVE') {
          const files = await this.listVersionFiles(tx, input.id, true);
          const expectedDigest = documentContentDigest({ documentId: old.document_id, revision: old.revision, files });
          if (files.some((file) => file.state !== 'ACTIVE') || old.content_hash !== expectedDigest)
            throw new AppError('AUTHZ_DENIED', { userSafe: true });
        }
        const values: Record<string, unknown> = { state: input.toState, version: input.expectedVersion + 1n };
        if (input.action === 'APPROVE') { values.approved_at = input.now; values.approved_by = input.actor.id; }
        if (input.action === 'MAKE_EFFECTIVE') values.effective_at = input.now;
        if (input.action === 'SUPERSEDE') values.superseded_at = input.now;
        if (input.action === 'ARCHIVE') values.archived_at = input.now;
        if (input.action === 'VOID') { values.voided_at = input.now; values.void_reason = input.reason?.trim() ?? null; }
        const row = await tx.updateTable('document_versions').set(values as never).where('id', '=', input.id).where('version', '=', input.expectedVersion).returningAll().executeTakeFirst();
        if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        const bindingPayload = input.action === 'APPROVE' ? { revision: old.revision, contentHash: old.content_hash } : undefined;
        await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id, subjectType: 'DOCUMENT_VERSION', subjectId: input.id, action: input.action, transitionId: `TR-DOC-${input.action}`, oldState: old.state, newState: input.toState, reason: input.reason, requestId: input.requestId, ...(bindingPayload ? { payload: bindingPayload } : {}) });
        await this.outboxFor(tx)?.enqueue({ eventType: 'DOCUMENT_VERSION_CHANGED', aggregateType: 'DOCUMENT_VERSION', aggregateId: input.id, payload: { action: input.action, state: input.toState, ...(bindingPayload ?? {}) }, dedupeKey: `document-version:${input.id}:v${input.expectedVersion + 1n}` });
        return versionMap(row, await this.listVersionFiles(tx, input.id));
      };
      return transaction ? await commit(transaction) : await this.database.transaction().execute(commit);
    } catch (error) { if (error instanceof AppError) throw error; throw translateDatabaseError(error); }
  }

  async supersede(input: { currentId: string; currentExpectedVersion: bigint; replacementId: string; replacementExpectedVersion: bigint; actor: ActorContext; effectiveAt: Date; requestId: string }): Promise<{ current: DocumentVersion; replacement: DocumentVersion }> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const current = await tx.selectFrom('document_versions').selectAll().where('id', '=', input.currentId).forUpdate().executeTakeFirst();
        const replacement = await tx.selectFrom('document_versions').selectAll().where('id', '=', input.replacementId).forUpdate().executeTakeFirst();
        if (!current || !replacement || current.version !== input.currentExpectedVersion || replacement.version !== input.replacementExpectedVersion) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        if (current.document_id !== replacement.document_id || current.state !== 'EFFECTIVE' || replacement.state !== 'APPROVED') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
        const oldRow = await tx.updateTable('document_versions').set({ state: 'SUPERSEDED', superseded_at: input.effectiveAt, version: input.currentExpectedVersion + 1n }).where('id', '=', input.currentId).where('version', '=', input.currentExpectedVersion).executeTakeFirst();
        if (Number(oldRow.numUpdatedRows) !== 1) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        const newRow = await tx.updateTable('document_versions').set({ state: 'EFFECTIVE', effective_at: input.effectiveAt, version: input.replacementExpectedVersion + 1n }).where('id', '=', input.replacementId).where('version', '=', input.replacementExpectedVersion).returningAll().executeTakeFirstOrThrow();
        const oldVersion = versionMap({ ...current, state: 'SUPERSEDED', superseded_at: input.effectiveAt, version: input.currentExpectedVersion + 1n });
        const newVersion = versionMap(newRow);
        await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id, subjectType: 'DOCUMENT_VERSION', subjectId: input.currentId, action: 'SUPERSEDE_DOCUMENT_VERSION', oldState: 'EFFECTIVE', newState: 'SUPERSEDED', requestId: input.requestId, payload: { replacementVersionId: input.replacementId } });
        await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id, subjectType: 'DOCUMENT_VERSION', subjectId: input.replacementId, action: 'MAKE_DOCUMENT_VERSION_EFFECTIVE', oldState: 'APPROVED', newState: 'EFFECTIVE', requestId: input.requestId, payload: { supersededVersionId: input.currentId } });
        await this.outboxFor(tx)?.enqueue({ eventType: 'DOCUMENT_VERSION_SUPERSEDED', aggregateType: 'DOCUMENT_VERSION', aggregateId: input.replacementId, payload: { supersededVersionId: input.currentId }, dedupeKey: `document-version-superseded:${input.replacementId}` });
        return { current: oldVersion, replacement: newVersion };
      });
    } catch (error) { if (error instanceof AppError) throw error; throw translateDatabaseError(error); }
  }

  private auditFor(tx: Transaction<DatabaseSchema>): AuditRepository | undefined { return this.audit instanceof PostgresAuditRepository ? new PostgresAuditRepository(tx) : this.audit; }
  private outboxFor(tx: Transaction<DatabaseSchema>): OutboxRepository | undefined { return this.outbox instanceof PostgresOutboxRepository ? new PostgresOutboxRepository(tx) : this.outbox; }

  private async listVersionFiles(db: Kysely<DatabaseSchema> | Transaction<DatabaseSchema>, versionId: string, lock = false): Promise<DocumentVersionFile[]> {
    const query = db
      .selectFrom('document_version_files as link')
      .innerJoin('files as file', 'file.id', 'link.file_id')
      .select([
        'link.id', 'link.document_version_id', 'link.file_id', 'link.file_role', 'link.linked_at', 'link.linked_by',
        'file.original_filename as source_filename', 'file.size_bytes as source_size_bytes', 'file.sha256 as source_sha256', 'file.state as source_state',
      ])
      .where('link.document_version_id', '=', versionId)
      .orderBy('link.linked_at');
    const rows = lock ? await query.forUpdate().execute() : await query.execute();
    return rows.map((row) => fileMap(row as JoinedDocumentFile));
  }
}
