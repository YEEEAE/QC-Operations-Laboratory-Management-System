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
import { nextDocumentVersionState, type DocumentVersionAction } from '../domain/document-state.js';
import type { DocumentListFilter, DocumentRepository, DocumentSourceFileOption } from '../ports/repository.js';
import type { DatabaseTransaction } from '../../../shared/database/transaction.js';
import { decideRevisionCreation, expectedPredecessorOf } from '../domain/revision-creation.js';
import { persistApprovalDecisionEvent } from '../../../shared/approval-decision-event.js';

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
  ...(row.effective_until ? { effectiveUntil: row.effective_until } : {}),
  ...(row.scheduled_effective_at ? { scheduledEffectiveAt: row.scheduled_effective_at } : {}),
  ...(row.approved_at ? { approvedAt: row.approved_at } : {}),
  ...(row.approved_by ? { approvedBy: row.approved_by } : {}),
  ...(row.reviewed_at ? { reviewedAt: row.reviewed_at } : {}),
  ...(row.reviewed_by ? { reviewedBy: row.reviewed_by } : {}),
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
    const versions = await Promise.all(rows.map(async (row) => versionMap(row, await this.listVersionFiles(this.database, row.id))));
    if (!versions.length) return versions;
    const requests = await this.database.selectFrom('document_effectivity_requests').selectAll()
      .where('document_version_id', 'in', versions.map((version) => version.id))
      .orderBy('requested_at', 'desc').orderBy('id', 'desc').execute();
    const latest = new Map<string, (typeof requests)[number]>();
    for (const request of requests) if (!latest.has(request.document_version_id)) latest.set(request.document_version_id, request);
    return versions.map((version) => {
      const request = latest.get(version.id);
      return request ? { ...version, effectivityRequestStatus: request.status as DocumentVersion['effectivityRequestStatus'], effectivityRequestAction: request.requested_action as DocumentVersion['effectivityRequestAction'], ...(request.requested_effective_at ? { scheduledEffectiveAt: request.requested_effective_at } : {}) } : version;
    });
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
        let boundSourceDigest: string;
        try {
          boundSourceDigest = documentContentDigest({ documentId: old.document_id, revision: old.revision, files });
        } catch {
          throw new AppError('AUTHZ_DENIED', { userSafe: true });
        }
        if (
          old.source_binding_verified !== true ||
          files.some((file) => file.state !== 'ACTIVE') ||
          old.content_hash !== boundSourceDigest
        ) {
          throw new AppError('AUTHZ_DENIED', { userSafe: true });
        }
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
        const row = await tx.updateTable('document_versions').set({ reviewed_at: input.now, reviewed_by: input.actor.id, version: input.expectedVersion + 1n }).where('id', '=', input.id).where('version', '=', input.expectedVersion).where('state', '=', 'IN_REVIEW').where('created_by', '<>', input.actor.id).where('reviewed_at', 'is', null).returningAll().executeTakeFirst();
        if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id, subjectType: 'DOCUMENT_VERSION', subjectId: input.id, action: 'REVIEW_DOCUMENT_VERSION', oldState: 'IN_REVIEW', newState: 'IN_REVIEW', requestId: input.requestId });
        await this.outboxFor(tx)?.enqueue({ eventType: 'DOCUMENT_VERSION_REVIEWED', aggregateType: 'DOCUMENT_VERSION', aggregateId: input.id, payload: { state: 'IN_REVIEW' }, dedupeKey: `document-version-reviewed:${input.id}:v${input.expectedVersion + 1n}` });
        return versionMap(row);
      });
    } catch (error) { if (error instanceof AppError) throw error; throw translateDatabaseError(error); }
  }

  async transition(input: { id: string; expectedVersion: bigint; actor: ActorContext; action: DocumentVersionAction; toState: DocumentVersion['state']; reason?: string; now: Date; requestId: string; approvalDecisionEvent?: import('../../../shared/approval-decision-event.js').ApprovalDecisionEvent }, transaction?: DatabaseTransaction): Promise<DocumentVersion> {
    try {
      const commit = async (tx: DatabaseTransaction) => {
        const old = await tx.selectFrom('document_versions').selectAll().where('id', '=', input.id).where('version', '=', input.expectedVersion).forUpdate().executeTakeFirst();
        if (!old) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        if (['MAKE_EFFECTIVE', 'SUPERSEDE', 'ARCHIVE'].includes(input.action)) throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
        if (nextDocumentVersionState(old.state as DocumentVersion['state'], input.action) !== input.toState) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
        if (input.action === 'APPROVE') {
          if (old.state !== 'IN_REVIEW' || input.toState !== 'APPROVED')
            throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
          if (!old.reviewed_at || !old.reviewed_by || old.reviewed_by === old.created_by)
            throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
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
        const row = await tx.updateTable('document_versions').set(values as never).where('id', '=', input.id).where('version', '=', input.expectedVersion).where('state', '=', old.state).returningAll().executeTakeFirst();
        if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        const bindingPayload = input.action === 'APPROVE' ? { revision: old.revision, contentHash: old.content_hash, reviewedAt: old.reviewed_at?.toISOString() ?? null, reviewedBy: old.reviewed_by ?? null } : undefined;
        const audit = this.auditFor(tx);
        const auditEvent = { actorType: 'USER' as const, actorId: input.actor.id, subjectType: 'DOCUMENT_VERSION', subjectId: input.id, action: input.action, transitionId: `TR-DOC-${input.action}`, oldState: old.state, newState: input.toState, reason: input.reason, requestId: input.requestId, payload: { ...(bindingPayload ?? {}), ...(input.approvalDecisionEvent ? { approvalPath: input.approvalDecisionEvent.approvalPath, policyRevision: input.approvalDecisionEvent.policyRevision, subjectVersion: input.approvalDecisionEvent.subjectVersion.toString(), reauthenticationStatus: input.approvalDecisionEvent.reauthenticationStatus } : {}) } };
        if (audit instanceof PostgresAuditRepository) {
          const auditEventId = await audit.appendReturningId(auditEvent);
          if (input.approvalDecisionEvent) await persistApprovalDecisionEvent(tx, input.approvalDecisionEvent, auditEventId, input.requestId, input.now);
        } else if (input.approvalDecisionEvent) {
          throw new AppError('SYSTEM_DATABASE_UNAVAILABLE', { userSafe: true });
        } else {
          await audit?.append(auditEvent);
        }
        await this.outboxFor(tx)?.enqueue({ eventType: 'DOCUMENT_VERSION_CHANGED', aggregateType: 'DOCUMENT_VERSION', aggregateId: input.id, payload: { action: input.action, state: input.toState, ...(bindingPayload ?? {}) }, dedupeKey: `document-version:${input.id}:v${input.expectedVersion + 1n}` });
        return versionMap(row, await this.listVersionFiles(tx, input.id));
      };
      return transaction ? await commit(transaction) : await this.database.transaction().execute(commit);
    } catch (error) { if (error instanceof AppError) throw error; throw translateDatabaseError(error); }
  }

  async requestEffectivity(input: { documentId: string; versionId: string; expectedVersion: bigint; expectedContentHash: string; action: 'ACTIVATE_NOW' | 'SCHEDULE_ACTIVATION' | 'SUPERSEDE' | 'ARCHIVE'; effectiveAt?: Date; replacementVersionId?: string; expectedReplacementVersion?: bigint; replacementContentHash?: string; reason: string; actor: ActorContext; requestId: string; requestedAt: Date }): Promise<{ id: string; status: string; action: string; requestedAt: Date }> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const identity = await tx.selectFrom('document_identities').selectAll().where('id', '=', input.documentId).forUpdate().executeTakeFirst();
        if (!identity || !identity.active) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
        const existing = await tx.selectFrom('document_effectivity_requests').selectAll()
          .where('requested_by', '=', input.actor.id).where('request_id', '=', input.requestId)
          .executeTakeFirst();
        if (existing) {
          if (existing.document_id !== input.documentId || existing.document_version_id !== input.versionId || existing.requested_action !== input.action || existing.expected_document_version !== (input.action === 'SCHEDULE_ACTIVATION' ? input.expectedVersion + 1n : input.expectedVersion) || existing.expected_content_hash !== input.expectedContentHash || existing.request_reason !== input.reason || existing.requested_effective_at?.getTime() !== input.effectiveAt?.getTime() || existing.replacement_version_id !== (input.replacementVersionId ?? null) || existing.expected_replacement_version !== (input.expectedReplacementVersion ?? null) || existing.replacement_content_hash !== (input.replacementContentHash ?? null)) {
            throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
          }
          return { id: existing.id, status: existing.status, action: existing.requested_action, requestedAt: existing.requested_at };
        }
        const old = await tx.selectFrom('document_versions').selectAll().where('id', '=', input.versionId).where('document_id', '=', input.documentId).forUpdate().executeTakeFirst();
        if (!old) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
        if (old.version !== input.expectedVersion || old.content_hash !== input.expectedContentHash) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        if ((input.action === 'ACTIVATE_NOW' || input.action === 'SCHEDULE_ACTIVATION') && old.state !== 'APPROVED') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
        if (input.action === 'SUPERSEDE' && old.state !== 'EFFECTIVE') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
        if (input.action === 'ARCHIVE' && old.state !== 'SUPERSEDED') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
        let replacement: DatabaseRow<'document_versions'> | undefined;
        if (input.action === 'SUPERSEDE') {
          replacement = await tx.selectFrom('document_versions').selectAll().where('id', '=', input.replacementVersionId ?? '').where('document_id', '=', input.documentId).forUpdate().executeTakeFirst();
          if (!replacement || replacement.state !== 'APPROVED' || replacement.version !== input.expectedReplacementVersion || replacement.content_hash !== input.replacementContentHash) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
          const replacementFiles = await this.listVersionFiles(tx, replacement.id, true);
          const replacementDigest = documentContentDigest({ documentId: replacement.document_id, revision: replacement.revision, files: replacementFiles });
          if (replacement.source_binding_verified !== true || replacementFiles.length === 0 || replacementFiles.some((file) => file.state !== 'ACTIVE') || replacement.content_hash !== replacementDigest) throw new AppError('AUTHZ_DENIED', { userSafe: true });
        }
        const files = await this.listVersionFiles(tx, input.versionId, true);
        const digest = documentContentDigest({ documentId: old.document_id, revision: old.revision, files });
        if (old.source_binding_verified !== true || files.length === 0 || files.some((file) => file.state !== 'ACTIVE') || old.content_hash !== digest) {
          throw new AppError('AUTHZ_DENIED', { userSafe: true });
        }
        const id = uuidv7();
        await tx.insertInto('document_effectivity_requests').values({
          id, document_id: input.documentId, document_version_id: input.versionId,
          requested_action: input.action, requested_effective_at: input.effectiveAt ?? null,
          replacement_version_id: input.replacementVersionId ?? null,
          expected_replacement_version: input.expectedReplacementVersion ?? null,
          replacement_content_hash: input.replacementContentHash ?? null,
          expected_document_version: input.action === 'SCHEDULE_ACTIVATION' ? input.expectedVersion + 1n : input.expectedVersion,
          expected_content_hash: input.expectedContentHash,
          request_reason: input.reason, requested_by: input.actor.id, requested_at: input.requestedAt,
          status: 'PENDING_POLICY', request_id: input.requestId,
        }).execute();
        if (input.action === 'SCHEDULE_ACTIVATION') {
          const updated = await tx.updateTable('document_versions').set({ scheduled_effective_at: input.effectiveAt!, version: input.expectedVersion + 1n })
            .where('id', '=', input.versionId).where('version', '=', input.expectedVersion).where('state', '=', 'APPROVED').returning('id').executeTakeFirst();
          if (!updated) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        }
        await this.auditFor(tx)?.append({ actorType: 'USER', actorId: input.actor.id, subjectType: 'DOCUMENT_VERSION', subjectId: input.versionId, action: 'REQUEST_DOCUMENT_EFFECTIVITY_DECISION', oldState: old.state, newState: old.state, reason: input.reason, requestId: input.requestId, payload: { requestId: id, requestedAction: input.action, requestedEffectiveAt: input.effectiveAt?.toISOString() ?? null, revision: old.revision, sourceDigest: digest, expectedVersion: input.expectedVersion.toString(), replacementVersionId: replacement?.id ?? null, status: 'PENDING_POLICY' } });
        await this.outboxFor(tx)?.enqueue({ eventType: 'DOCUMENT_EFFECTIVITY_DECISION_REQUESTED', aggregateType: 'DOCUMENT_VERSION', aggregateId: input.versionId, payload: { requestId: id, action: input.action, status: 'PENDING_POLICY' }, dedupeKey: `document-effectivity-request:${id}` });
        return { id, status: 'PENDING_POLICY', action: input.action, requestedAt: input.requestedAt };
      });
    } catch (error) { if (error instanceof AppError) throw error; throw translateDatabaseError(error); }
  }

  async activateApprovedSchedules(input: { now: Date; limit: number }): Promise<{ activated: number }> {
    try {
      return await this.database.transaction().execute(async (tx) => {
        const due = await tx.selectFrom('document_effectivity_requests').selectAll()
          .where('status', '=', 'APPROVED')
          .where((eb) => eb.or([
            eb.and([eb('requested_action', '=', 'SCHEDULE_ACTIVATION'), eb('requested_effective_at', '<=', input.now)]),
            eb('requested_action', '=', 'ACTIVATE_NOW'),
            eb('requested_action', '=', 'SUPERSEDE'),
            eb('requested_action', '=', 'ARCHIVE'),
          ]))
          .orderBy('requested_effective_at').orderBy('requested_at').orderBy('id')
          .limit(input.limit).forUpdate().skipLocked().execute();
        let activated = 0;
        for (const request of due) {
          const identity = await tx.selectFrom('document_identities').selectAll().where('id', '=', request.document_id).forUpdate().executeTakeFirst();
          const target = await tx.selectFrom('document_versions').selectAll().where('id', '=', request.document_version_id).forUpdate().executeTakeFirst();
          const requiredState = request.requested_action === 'SUPERSEDE' ? 'EFFECTIVE' : request.requested_action === 'ARCHIVE' ? 'SUPERSEDED' : 'APPROVED';
          if (!identity?.active || !target || target.document_id !== request.document_id || target.state !== requiredState || target.version !== request.expected_document_version || target.content_hash !== request.expected_content_hash) {
            throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
          }
          if (!request.policy_reference || !request.policy_revision || !/^[0-9a-f]{64}$/.test(request.policy_digest ?? '') || !request.decided_at || !request.decided_by) {
            throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
          }
          const files = await this.listVersionFiles(tx, target.id, true);
          const sourceDigest = documentContentDigest({ documentId: target.document_id, revision: target.revision, files });
          if (target.source_binding_verified !== true || files.length === 0 || files.some((file) => file.state !== 'ACTIVE') || target.content_hash !== sourceDigest) {
            throw new AppError('AUTHZ_DENIED', { userSafe: true });
          }
          const audit = this.auditFor(tx);
          if (!(audit instanceof PostgresAuditRepository)) throw new AppError('SYSTEM_DATABASE_UNAVAILABLE', { userSafe: true });
          if (request.requested_action === 'ARCHIVE') {
            const archived = await tx.updateTable('document_versions').set({ state: 'ARCHIVED', archived_at: input.now, version: target.version + 1n })
              .where('id', '=', target.id).where('version', '=', target.version).where('state', '=', 'SUPERSEDED').returningAll().executeTakeFirst();
            if (!archived) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
            const auditEventId = await audit.appendReturningId({ actorType: 'USER', actorId: request.decided_by, subjectType: 'DOCUMENT_VERSION', subjectId: target.id, action: 'ARCHIVE_DOCUMENT_VERSION', transitionId: 'TR-DOC-ARCHIVE', oldState: 'SUPERSEDED', newState: 'ARCHIVED', reason: request.decision_reason ?? request.request_reason, requestId: request.request_id, payload: { decidedAt: request.decided_at.toISOString(), policyReference: request.policy_reference, policyRevision: request.policy_revision, policyDigest: request.policy_digest, sourceRevision: target.revision, sourceDigest } });
            await tx.insertInto('document_effectivity_decisions').values({ document_id: target.document_id, document_version_id: target.id, decision: 'ARCHIVE', decided_at: request.decided_at, effective_at: null, previous_revision: null, reason: request.decision_reason ?? request.request_reason, actor_id: request.decided_by!, policy_reference: request.policy_reference, policy_revision: request.policy_revision, policy_digest: request.policy_digest, source_revision: target.revision, source_digest: sourceDigest, audit_event_id: auditEventId, request_id: request.request_id }).execute();
            await tx.updateTable('document_effectivity_requests').set({ status: 'EXECUTED', executed_at: input.now }).where('id', '=', request.id).where('status', '=', 'APPROVED').execute();
            activated += 1;
            continue;
          }
          if (request.requested_action === 'SUPERSEDE') {
            const replacement = await tx.selectFrom('document_versions').selectAll().where('id', '=', request.replacement_version_id ?? '').where('document_id', '=', target.document_id).forUpdate().executeTakeFirst();
            if (!replacement || replacement.state !== 'APPROVED' || replacement.version !== request.expected_replacement_version || replacement.content_hash !== request.replacement_content_hash) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
            const replacementFiles = await this.listVersionFiles(tx, replacement.id, true);
            const replacementDigest = documentContentDigest({ documentId: replacement.document_id, revision: replacement.revision, files: replacementFiles });
            if (replacement.source_binding_verified !== true || replacementFiles.length === 0 || replacementFiles.some((file) => file.state !== 'ACTIVE') || replacement.content_hash !== replacementDigest) throw new AppError('AUTHZ_DENIED', { userSafe: true });
            const effectiveAt = input.now;
            const futureHistory = await tx.selectFrom('document_versions').select('id').where('document_id', '=', target.document_id)
              .where('effective_at', '>', effectiveAt).where('id', '<>', target.id).where('id', '<>', replacement.id).executeTakeFirst();
            if (futureHistory) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
            const overlapping = await tx.selectFrom('document_versions').select(['id', 'state'])
              .where('document_id', '=', target.document_id).where('id', '<>', replacement.id).where('effective_at', '<=', effectiveAt)
              .where((eb) => eb.or([eb('effective_until', 'is', null), eb('effective_until', '>', effectiveAt)]))
              .execute();
            if (overlapping.some((row) => row.id !== target.id)) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
            if (target.effective_at && effectiveAt <= target.effective_at) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
            const closed = await tx.updateTable('document_versions').set({ state: 'SUPERSEDED', effective_until: effectiveAt, superseded_at: effectiveAt, version: target.version + 1n })
              .where('id', '=', target.id).where('version', '=', target.version).where('state', '=', 'EFFECTIVE').returning('id').executeTakeFirst();
            if (!closed) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
            const opened = await tx.updateTable('document_versions').set({ state: 'EFFECTIVE', effective_at: effectiveAt, effective_until: null, version: replacement.version + 1n })
              .where('id', '=', replacement.id).where('version', '=', replacement.version).where('state', '=', 'APPROVED').returning('id').executeTakeFirst();
            if (!opened) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
            const supersedeAuditId = await audit.appendReturningId({ actorType: 'USER', actorId: request.decided_by, subjectType: 'DOCUMENT_VERSION', subjectId: target.id, action: 'SUPERSEDE_DOCUMENT_VERSION', transitionId: 'TR-DOC-SUPERSEDE', oldState: 'EFFECTIVE', newState: 'SUPERSEDED', reason: request.decision_reason ?? request.request_reason, requestId: request.request_id, payload: { decidedAt: request.decided_at.toISOString(), effectiveAt: effectiveAt.toISOString(), replacementVersionId: replacement.id, policyReference: request.policy_reference, policyRevision: request.policy_revision, policyDigest: request.policy_digest, sourceRevision: target.revision, sourceDigest } });
            const activateAuditId = await audit.appendReturningId({ actorType: 'USER', actorId: request.decided_by, subjectType: 'DOCUMENT_VERSION', subjectId: replacement.id, action: 'ACTIVATE_APPROVED_DOCUMENT_VERSION', transitionId: 'TR-DOC-ACTIVATE_APPROVED', oldState: 'APPROVED', newState: 'EFFECTIVE', reason: request.decision_reason ?? request.request_reason, requestId: request.request_id, payload: { decidedAt: request.decided_at.toISOString(), effectiveAt: effectiveAt.toISOString(), previousRevision: target.revision, policyReference: request.policy_reference, policyRevision: request.policy_revision, policyDigest: request.policy_digest, sourceRevision: replacement.revision, sourceDigest: replacementDigest } });
            await tx.insertInto('document_effectivity_decisions').values([
              { document_id: target.document_id, document_version_id: target.id, decision: 'SUPERSEDE', decided_at: request.decided_at, effective_at: effectiveAt, previous_revision: null, reason: request.decision_reason ?? request.request_reason, actor_id: request.decided_by!, policy_reference: request.policy_reference, policy_revision: request.policy_revision, policy_digest: request.policy_digest, source_revision: target.revision, source_digest: sourceDigest, audit_event_id: supersedeAuditId, request_id: request.request_id },
              { document_id: replacement.document_id, document_version_id: replacement.id, decision: 'ACTIVATE_APPROVED', decided_at: request.decided_at, effective_at: effectiveAt, previous_revision: target.revision, reason: request.decision_reason ?? request.request_reason, actor_id: request.decided_by!, policy_reference: request.policy_reference, policy_revision: request.policy_revision, policy_digest: request.policy_digest, source_revision: replacement.revision, source_digest: replacementDigest, audit_event_id: activateAuditId, request_id: request.request_id },
            ]).execute();
            await tx.updateTable('document_effectivity_requests').set({ status: 'EXECUTED', executed_at: input.now }).where('id', '=', request.id).where('status', '=', 'APPROVED').execute();
            activated += 1;
            continue;
          }
          const effectiveAt = request.requested_effective_at ?? input.now;
          const futureHistory = await tx.selectFrom('document_versions').select('id').where('document_id', '=', target.document_id)
            .where('effective_at', '>', effectiveAt).where('id', '<>', target.id).executeTakeFirst();
          if (futureHistory) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
          const previous = await tx.selectFrom('document_versions').selectAll().where('document_id', '=', target.document_id).where('state', '=', 'EFFECTIVE').forUpdate().executeTakeFirst();
          if (previous && (!previous.effective_at || effectiveAt <= previous.effective_at || previous.id === target.id)) {
            throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
          }
          const overlappingHistory = await tx.selectFrom('document_versions').select(['id', 'state'])
            .where('document_id', '=', target.document_id).where('id', '<>', target.id)
            .where('effective_at', '<=', effectiveAt)
            .where((eb) => eb.or([eb('effective_until', 'is', null), eb('effective_until', '>', effectiveAt)]))
            .execute();
          if (overlappingHistory.some((row) => row.state !== 'EFFECTIVE' || row.id !== previous?.id)) {
            throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
          }
          if (previous) {
            const closed = await tx.updateTable('document_versions').set({ state: 'SUPERSEDED', effective_until: effectiveAt, superseded_at: effectiveAt, version: previous.version + 1n })
              .where('id', '=', previous.id).where('version', '=', previous.version).where('state', '=', 'EFFECTIVE').returning('id').executeTakeFirst();
            if (!closed) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
          }
          const opened = await tx.updateTable('document_versions').set({ state: 'EFFECTIVE', effective_at: effectiveAt, effective_until: null, scheduled_effective_at: null, version: target.version + 1n })
            .where('id', '=', target.id).where('version', '=', target.version).where('state', '=', 'APPROVED').returningAll().executeTakeFirst();
          if (!opened) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
          const activationDecision = request.requested_action === 'ACTIVATE_NOW' ? 'ACTIVATE_NOW' : 'ACTIVATE_APPROVED';
          const auditEventId = await audit.appendReturningId({ actorType: 'USER', actorId: request.decided_by, subjectType: 'DOCUMENT_VERSION', subjectId: target.id, action: request.requested_action === 'ACTIVATE_NOW' ? 'ACTIVATE_DOCUMENT_VERSION_NOW' : 'ACTIVATE_APPROVED_DOCUMENT_VERSION', transitionId: request.requested_action === 'ACTIVATE_NOW' ? 'TR-DOC-ACTIVATE_NOW' : 'TR-DOC-ACTIVATE_APPROVED', oldState: 'APPROVED', newState: 'EFFECTIVE', reason: request.decision_reason ?? request.request_reason, requestId: request.request_id, payload: { decidedAt: request.decided_at.toISOString(), effectiveAt: effectiveAt.toISOString(), previousRevision: previous?.revision ?? null, policyReference: request.policy_reference, policyRevision: request.policy_revision, policyDigest: request.policy_digest, sourceRevision: target.revision, sourceDigest } });
          await tx.insertInto('document_effectivity_decisions').values({ document_id: target.document_id, document_version_id: target.id, decision: activationDecision, decided_at: request.decided_at, effective_at: effectiveAt, previous_revision: previous?.revision ?? null, reason: request.decision_reason ?? request.request_reason, actor_id: request.decided_by, policy_reference: request.policy_reference, policy_revision: request.policy_revision, policy_digest: request.policy_digest, source_revision: target.revision, source_digest: sourceDigest, audit_event_id: auditEventId, request_id: request.request_id }).execute();
          await tx.updateTable('document_effectivity_requests').set({ status: 'EXECUTED', executed_at: input.now }).where('id', '=', request.id).where('status', '=', 'APPROVED').execute();
          await this.outboxFor(tx)?.enqueue({ eventType: 'DOCUMENT_VERSION_ACTIVATED', aggregateType: 'DOCUMENT_VERSION', aggregateId: target.id, payload: { revision: target.revision, effectiveAt: effectiveAt.toISOString(), previousVersionId: previous?.id ?? null }, dedupeKey: `document-version-activated:${target.id}:${effectiveAt.toISOString()}` });
          activated += 1;
        }
        return { activated };
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
