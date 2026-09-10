import { type Kysely, type Transaction } from 'kysely';
import type { DatabaseSchema, DatabaseRow } from '../../../../shared/database/db-types.js';
import { translateDatabaseError } from '../../../../shared/database/database.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { actorHasScope } from '../../../../shared/authorization/scope-evaluator.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { TemplateRepository } from '../ports/repository.js';
import type { TemplateVersion } from '../domain/template.js';
import type { TemplateVersionAction, TemplateVersionState } from '../domain/template-state.js';
import { transitionIdFor } from '../domain/template-state.js';
import type { AuditRepository } from '../../../../shared/audit/audit-repository.js';
import { PostgresAuditRepository } from '../../../../shared/audit/postgres-audit-repository.js';
import type { OutboxRepository } from '../../../../shared/outbox/outbox-repository.js';
import { PostgresOutboxRepository } from '../../../../shared/outbox/postgres-outbox-repository.js';

type TemplateRow = DatabaseRow<'inspection_template_versions'>;
type HeaderRow = DatabaseRow<'inspection_templates'>;

function map(header: HeaderRow, row: TemplateRow): TemplateVersion {
  return {
    id: row.id,
    templateId: row.template_id,
    templateCode: header.template_code,
    versionNo: row.version_no,
    state: row.state as TemplateVersionState,
    name: header.name,
    description: header.description,
    contentHash: row.content_hash,
    sourceDocument: row.source_document,
    createdBy: row.created_by,
    authorId: row.created_by,
    reviewerId: null,
    approverId: row.approved_by,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    version: BigInt(row.version),
    createdAt: row.created_at,
    updatedAt: header.updated_at,
  };
}

export class PostgresTemplateRepository implements TemplateRepository {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly audit?: AuditRepository,
    private readonly outbox?: OutboxRepository,
  ) {}

  private async load(id: string): Promise<TemplateVersion | undefined> {
    const row = await this.db
      .selectFrom('inspection_template_versions')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!row) return undefined;
    const header = await this.db
      .selectFrom('inspection_templates')
      .selectAll()
      .where('id', '=', row.template_id)
      .executeTakeFirstOrThrow();
    return map(header, row);
  }

  async get(id: string, actor: ActorContext): Promise<TemplateVersion | undefined> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
    const item = await this.load(id);
    if (!item) return undefined;
    const grant = actor.permissions.find((p) => p.code === 'PERM-ADM-TEMPLATES');
    const scoped =
      grant &&
      actorHasScope(
        actor,
        { type: 'INSPECTION_TEMPLATE_VERSION', id: item.id, state: item.state },
        {},
        grant,
      );
    // P-06: every active user may read template context once authenticated;
    // the use case still enforces ACTIVE + version/SoD for mutations.
    if (actor.accountState !== 'ACTIVE') return undefined;
    if (!scoped && !actor.permissions.some((p) => p.code === 'PERM-ADM-TEMPLATES')) {
      // No template permission at all: still return for list context? Deny detail.
      return undefined;
    }
    return item;
  }

  async list(input: {
    actor: ActorContext;
    state?: TemplateVersion['state'];
  }): Promise<TemplateVersion[]> {
    if (input.actor.accountState !== 'ACTIVE') return [];
    const rows = await this.db
      .selectFrom('inspection_template_versions')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(200)
      .execute();
    const result: TemplateVersion[] = [];
    for (const row of rows) {
      if (input.state && (row.state as string) !== input.state) continue;
      const item = await this.get(row.id, input.actor);
      if (item) result.push(item);
    }
    return result;
  }

  async create(input: {
    template: TemplateVersion;
    templateCode: string;
    actor: ActorContext;
    requestId: string;
    signatureId?: string;
  }): Promise<TemplateVersion> {
    try {
      const created = await this.db.transaction().execute(async (tx) => {
        const replay = await this.findReplayTx(tx, input.requestId, input.template.id);
        if (replay) return replay;
        const header = await tx
          .selectFrom('inspection_templates')
          .selectAll()
          .where('template_code', '=', input.templateCode.trim())
          .executeTakeFirst();
        let templateId = header?.id;
        if (!templateId) {
          const inserted = await tx
            .insertInto('inspection_templates')
            .values({
              id: input.template.templateId,
              template_code: input.templateCode.trim(),
              name: input.template.name,
              description: input.template.description,
              active: true,
              created_by: input.actor.id,
              updated_at: new Date(),
              version: 1n,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
          templateId = inserted.id;
        }
        const now = new Date();
        const row = await tx
          .insertInto('inspection_template_versions')
          .values({
            id: input.template.id,
            template_id: templateId,
            version_no: input.template.versionNo,
            state: input.template.state,
            effective_at: input.template.state === 'APPROVED' ? now : null,
            approved_at: input.template.state === 'APPROVED' ? now : null,
            approved_by: input.template.state === 'APPROVED' ? input.actor.id : null,
            source_document: input.template.sourceDocument ?? null,
            created_by: input.actor.id,
            content_hash: input.template.contentHash ?? null,
            version: 1n,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'INSPECTION_TEMPLATE_VERSION',
          subjectId: row.id,
          action: 'CREATE',
          transitionId: 'TR-TMPL-001',
          newState: row.state,
          reason: input.template.description ?? undefined,
          requestId: input.requestId,
          signatureId: input.signatureId,
        });
        await this.outboxFor(tx)?.enqueue({
          eventType: 'TEMPLATE_CHANGED',
          aggregateType: 'INSPECTION_TEMPLATE_VERSION',
          aggregateId: row.id,
          payload: { action: 'CREATE', state: row.state },
          dedupeKey: `template:${row.id}:v1`,
        });
        return row;
      });
      const item = await this.load(created.id);
      if (!item) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      return item;
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw translateDatabaseError(e);
    }
  }

  async transition(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    action: TemplateVersionAction;
    reason?: string;
    requestId: string;
    signatureId?: string;
  }): Promise<TemplateVersion> {
    const old = await this.load(input.id);
    if (!old) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const { transitionTemplateVersion } = await import('../domain/template-state.js');
    const next = transitionTemplateVersion(old.state, input.action);
    try {
      const row = await this.db.transaction().execute(async (tx) => {
        const replay = await this.findReplayTx(tx, input.requestId, input.id);
        if (replay) return replay;
        const now = new Date();
        const updated = await tx
          .updateTable('inspection_template_versions')
          .set({
            state: next,
            ...(input.action === 'APPROVE'
              ? { approved_at: now, approved_by: input.actor.id, effective_at: now }
              : {}),
            version: input.expectedVersion + 1n,
          })
          .where('id', '=', input.id)
          .where('version', '=', input.expectedVersion)
          .where('state', '=', old.state)
          .returningAll()
          .executeTakeFirst();
        if (!updated) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'INSPECTION_TEMPLATE_VERSION',
          subjectId: input.id,
          action: input.action,
          transitionId: transitionIdFor(old.state, input.action),
          oldState: old.state,
          newState: next,
          reason: input.reason,
          requestId: input.requestId,
          signatureId: input.signatureId,
        });
        await this.outboxFor(tx)?.enqueue({
          eventType: 'TEMPLATE_CHANGED',
          aggregateType: 'INSPECTION_TEMPLATE_VERSION',
          aggregateId: input.id,
          payload: { action: input.action, state: next },
          dedupeKey: `template:${input.id}:v${input.expectedVersion + 1n}`,
        });
        return updated;
      });
      const item = await this.load(row.id);
      if (!item) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      return item;
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw translateDatabaseError(e);
    }
  }

  async createRevision(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    versionNo: string;
    name: string;
    description?: string | null;
    contentHash?: string | null;
    sourceDocument?: string | null;
    requestId: string;
    signatureId?: string;
  }): Promise<TemplateVersion> {
    const old = await this.load(input.id);
    if (!old) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (old.state !== 'APPROVED' && old.state !== 'STOPPED') {
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    }
    if (!input.versionNo.trim() || !input.name.trim()) {
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    }
    try {
      const { uuidv7 } = await import('../../../../shared/id/uuid.js');
      const created = await this.db.transaction().execute(async (tx) => {
        const newId = uuidv7();
        const replay = await this.findReplayTx(tx, input.requestId, newId);
        if (replay) return replay;
        // Optimistic guard on the source revision: it must be untouched.
        const guard = await tx
          .selectFrom('inspection_template_versions')
          .select('id')
          .where('id', '=', input.id)
          .where('version', '=', input.expectedVersion)
          .executeTakeFirst();
        if (!guard) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        if (input.expectedVersion !== old.version) {
          throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
        }
        await tx
          .updateTable('inspection_templates')
          .set({ name: input.name.trim(), description: input.description ?? null })
          .where('id', '=', old.templateId)
          .execute();
        const row = await tx
          .insertInto('inspection_template_versions')
          .values({
            id: newId,
            template_id: old.templateId,
            version_no: input.versionNo.trim(),
            state: 'DRAFT',
            effective_at: null,
            approved_at: null,
            approved_by: null,
            source_document: input.sourceDocument ?? null,
            created_by: input.actor.id,
            content_hash: input.contentHash ?? null,
            version: 1n,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        await this.auditFor(tx)?.append({
          actorType: 'USER',
          actorId: input.actor.id,
          subjectType: 'INSPECTION_TEMPLATE_VERSION',
          subjectId: row.id,
          action: 'REVISE',
          transitionId: 'TR-TMPL-007',
          oldState: old.state,
          newState: 'DRAFT',
          reason: `Revision of ${old.versionNo} (${input.id})`,
          requestId: input.requestId,
          signatureId: input.signatureId,
        });
        await this.outboxFor(tx)?.enqueue({
          eventType: 'TEMPLATE_CHANGED',
          aggregateType: 'INSPECTION_TEMPLATE_VERSION',
          aggregateId: row.id,
          payload: { action: 'REVISE', state: 'DRAFT', supersedes: input.id },
          dedupeKey: `template:${row.id}:v1`,
        });
        return row;
      });
      const item = await this.load(created.id);
      if (!item) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      return item;
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw translateDatabaseError(e);
    }
  }

  async findReplay(requestId: string, subjectId: string): Promise<TemplateVersion | undefined> {
    const hit = await this.db
      .selectFrom('audit_events')
      .selectAll()
      .where('request_id', '=', requestId)
      .where('subject_id', '=', subjectId)
      .executeTakeFirst();
    if (!hit) return undefined;
    return this.load(subjectId);
  }

  private async findReplayTx(
    tx: Transaction<DatabaseSchema>,
    requestId: string,
    subjectId: string,
  ): Promise<TemplateRow | undefined> {
    const hit = await tx
      .selectFrom('audit_events')
      .selectAll()
      .where('request_id', '=', requestId)
      .where('subject_id', '=', subjectId)
      .executeTakeFirst();
    if (!hit) return undefined;
    return tx
      .selectFrom('inspection_template_versions')
      .selectAll()
      .where('id', '=', subjectId)
      .executeTakeFirst();
  }

  private auditFor(tx: Transaction<DatabaseSchema>): AuditRepository | undefined {
    return this.audit instanceof PostgresAuditRepository
      ? new PostgresAuditRepository(tx)
      : this.audit;
  }

  private outboxFor(tx: Transaction<DatabaseSchema>): OutboxRepository | undefined {
    return this.outbox instanceof PostgresOutboxRepository
      ? new PostgresOutboxRepository(tx)
      : this.outbox;
  }
}
