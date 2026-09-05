import type { Kysely, Transaction } from 'kysely';
import type { DatabaseRow, DatabaseSchema } from '../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../shared/database/database.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import { actorHasScope } from '../../../shared/authorization/scope-evaluator.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { AuditRepository } from '../../../shared/audit/audit-repository.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import type { OutboxRepository } from '../../../shared/outbox/outbox-repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import type { DocumentIdentity } from '../domain/document.js';
import type { DocumentVersion, DocumentVersionFile } from '../domain/document-version.js';
import type { DocumentVersionAction } from '../domain/document-state.js';
import type { DocumentListFilter, DocumentRepository } from '../ports/repository.js';

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

const fileMap = (row: DatabaseRow<'document_version_files'>): DocumentVersionFile => ({
  id: row.id,
  documentVersionId: row.document_version_id,
  fileId: row.file_id,
  fileRole: row.file_role,
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

  async listDocuments(input: { actor: ActorContext; filter?: DocumentListFilter }): Promise<readonly DocumentIdentity[]> {
    let query = this.database.selectFrom('document_identities').selectAll().orderBy('updated_at', 'desc');
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

  async createVersion(input: { version: DocumentVersion; actor: ActorContext; requestId: string }): Promise<DocumentVersion> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const version = input.version;
        const row = await tx.insertInto('document_versions').values({ id: version.id, document_id: version.documentId, revision: version.revision, state: version.state, effective_at: version.effectiveAt ?? null, approved_at: version.approvedAt ?? null, approved_by: version.approvedBy ?? null, superseded_at: null, archived_at: null, voided_at: null, void_reason: null, change_summary: version.changeSummary ?? null, content_hash: version.contentHash ?? null, created_by: version.createdBy, version: 1n }).returningAll().executeTakeFirstOrThrow(); 
        if (version.files.length) await tx.insertInto('document_version_files').values(version.files.map((file) => ({ id: file.id, document_version_id: version.id, file_id: file.fileId, file_role: file.fileRole, linked_at: file.linkedAt, linked_by: file.linkedBy }))).execute();
        await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id, subjectType: 'DOCUMENT_VERSION', subjectId: version.id, action: 'CREATE_DOCUMENT_VERSION', newState: 'DRAFT', requestId: input.requestId });
        await this.outboxFor(tx)?.enqueue({ eventType: 'DOCUMENT_VERSION_CREATED', aggregateType: 'DOCUMENT_VERSION', aggregateId: version.id, payload: { documentId: version.documentId, revision: version.revision }, dedupeKey: `document-version-created:${version.id}` });
        return versionMap(row);
      });
    } catch (error) { throw translateDatabaseError(error); }
  }

  async getVersion(id: string): Promise<DocumentVersion | undefined> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
    const row = await this.database.selectFrom('document_versions').selectAll().where('id', '=', id).executeTakeFirst();
    if (!row) return undefined;
    const files = await this.database.selectFrom('document_version_files').selectAll().where('document_version_id', '=', id).orderBy('linked_at').execute();
    return versionMap(row, files.map(fileMap));
  }

  async listVersions(documentId: string): Promise<readonly DocumentVersion[]> {
    const rows = await this.database.selectFrom('document_versions').selectAll().where('document_id', '=', documentId).orderBy('created_at', 'desc').execute();
    return Promise.all(rows.map(async (row) => versionMap(row, (await this.database.selectFrom('document_version_files').selectAll().where('document_version_id', '=', row.id).orderBy('linked_at').execute()).map(fileMap))));
  }

  async updateDraft(input: { id: string; expectedVersion: bigint; actor: ActorContext; revision: string; changeSummary?: string; contentHash?: string; now: Date; requestId: string }): Promise<DocumentVersion> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const row = await tx.updateTable('document_versions').set({ revision: input.revision.trim(), change_summary: input.changeSummary?.trim() || null, content_hash: input.contentHash?.trim() || null, version: input.expectedVersion + 1n }).where('id', '=', input.id).where('version', '=', input.expectedVersion).where('state', '=', 'DRAFT').returningAll().executeTakeFirst();
        if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id, subjectType: 'DOCUMENT_VERSION', subjectId: input.id, action: 'EDIT_DOCUMENT_DRAFT', oldState: 'DRAFT', newState: 'DRAFT', requestId: input.requestId });
        return versionMap(row);
      });
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

  async transition(input: { id: string; expectedVersion: bigint; actor: ActorContext; action: DocumentVersionAction; toState: DocumentVersion['state']; reason?: string; now: Date; requestId: string }): Promise<DocumentVersion> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const old = await tx.selectFrom('document_versions').selectAll().where('id', '=', input.id).where('version', '=', input.expectedVersion).forUpdate().executeTakeFirst();
        if (!old) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        const values: Record<string, unknown> = { state: input.toState, version: input.expectedVersion + 1n };
        if (input.action === 'APPROVE') { values.approved_at = input.now; values.approved_by = input.actor.id; }
        if (input.action === 'MAKE_EFFECTIVE') values.effective_at = input.now;
        if (input.action === 'SUPERSEDE') values.superseded_at = input.now;
        if (input.action === 'ARCHIVE') values.archived_at = input.now;
        if (input.action === 'VOID') { values.voided_at = input.now; values.void_reason = input.reason?.trim() ?? null; }
        const row = await tx.updateTable('document_versions').set(values as never).where('id', '=', input.id).where('version', '=', input.expectedVersion).returningAll().executeTakeFirst();
        if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id, subjectType: 'DOCUMENT_VERSION', subjectId: input.id, action: input.action, transitionId: `TR-DOC-${input.action}`, oldState: old.state, newState: input.toState, reason: input.reason, requestId: input.requestId });
        await this.outboxFor(tx)?.enqueue({ eventType: 'DOCUMENT_VERSION_CHANGED', aggregateType: 'DOCUMENT_VERSION', aggregateId: input.id, payload: { action: input.action, state: input.toState }, dedupeKey: `document-version:${input.id}:v${input.expectedVersion + 1n}` });
        return versionMap(row);
      });
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
}
