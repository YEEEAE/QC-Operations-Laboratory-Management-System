import { authorize } from '../../../../shared/authorization/authorize.js';
import { ncrReadDependencies } from '../../ncr/application/dependencies.js';
import { updateRca, transitionRca } from '../domain/rca.js';
import type { Kysely } from 'kysely';
import type { DatabaseRow, DatabaseSchema } from '../../../../shared/database/db-types.js';
import type { RcaRepository } from '../ports/repository.js';
import type { Rca } from '../domain/rca.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { AppError } from '../../../../shared/errors/app-error.js';
export class PostgresRcaRepository implements RcaRepository {
  constructor(private db: Kysely<DatabaseSchema>) {}
  private map(r: DatabaseRow<'rcas'>): Rca {
    return {
      id: r.id,
      rcaNo: r.rca_no ?? undefined,
      ncrId: r.ncr_id,
      state: r.state as Rca['state'],
      method: r.method ?? undefined,
      analysis: r.analysis ?? undefined,
      rootCause: r.root_cause ?? undefined,
      submittedAt: r.submitted_at ?? undefined,
      approvedAt: r.approved_at ?? undefined,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      version: BigInt(r.version),
    };
  }
  async get(id: string, a: ActorContext) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return;
    const r = await this.db
      .selectFrom('rcas')
      .selectAll()
      .where('id', '=', id)
      .where('created_by', '=', a.id)
      .executeTakeFirst();
    return r && this.map(r);
  }
  async list(i: Parameters<RcaRepository['list']>[0]) {
    let q = this.db.selectFrom('rcas').selectAll().where('created_by', '=', i.actor.id);
    if (i.ncrId) q = q.where('ncr_id', '=', i.ncrId);
    return (await q.execute()).map((r) => this.map(r));
  }
  private async audit(
    db: Kysely<DatabaseSchema>,
    before: Rca | null,
    after: Rca,
    actor: ActorContext,
    requestId: string,
    action: string,
  ) {
    await db
      .insertInto('audit_events')
      .values({
        actor_type: 'USER',
        actor_id: actor.id,
        subject_type: 'RCA',
        subject_id: after.id,
        action,
        transition_id: null,
        old_state: before?.state ?? null,
        new_state: after.state,
        reason: null,
        request_id: requestId,
        signature_id: null,
        payload: {
          priorVersion: before?.version.toString() ?? null,
          version: after.version.toString(),
          ncrId: after.ncrId,
          technicalSource: 'QC360-RCA-TECHNICAL-POLICY-2026-10-08@1',
        },
      })
      .execute();
  }
  async create(i: Parameters<RcaRepository['create']>[0]) {
    return this.db.transaction().execute(async (trx) => {
      const source = await ncrReadDependencies(trx, true).get.execute({
        actor: i.actor,
        id: i.rca.ncrId,
      });
      if (!source) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      authorize(
        {
          actor: i.actor,
          permission: 'PERM-NCR-VIEW',
          action: 'VIEW',
          entity: { type: 'NCR', id: source.id, state: source.state },
          scope: { ownerId: source.ownerId === i.actor.id ? source.ownerId : source.createdBy },
          currentVersion: source.version,
          expectedVersion: source.version,
          businessCondition: true,
        },
        { throwOnDeny: true },
      );
      if (source.version !== i.expectedNcrVersion)
        throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      if (
        ['CLOSED', 'VOID'].includes(source.state) ||
        i.rca.createdBy !== i.actor.id ||
        i.rca.state !== 'DRAFT'
      )
        throw new AppError('AUTHZ_DENIED', { userSafe: true });
      authorize(
        {
          actor: i.actor,
          permission: 'PERM-RCA-CREATE',
          action: 'CREATE',
          entity: { type: 'RCA', id: i.rca.id, state: 'DRAFT' },
          scope: { ownerId: i.actor.id },
          currentVersion: 1n,
          expectedVersion: 1n,
          businessCondition: true,
        },
        { throwOnDeny: true },
      );
      const row = await trx
        .insertInto('rcas')
        .values({
          id: i.rca.id,
          rca_no: null,
          ncr_id: source.id,
          state: 'DRAFT',
          method: null,
          analysis: null,
          root_cause: null,
          submitted_at: null,
          approved_at: null,
          created_by: i.actor.id,
          created_at: i.rca.createdAt,
          updated_at: i.rca.updatedAt,
          version: 1n,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      const created = this.map(row);
      await this.audit(trx, null, created, i.actor, i.requestId, 'CREATE');
      return created;
    });
  }
  private async locked(
    db: Kysely<DatabaseSchema>,
    id: string,
    actor: ActorContext,
    expectedVersion: bigint,
  ) {
    const row = await db
      .selectFrom('rcas')
      .selectAll()
      .where('id', '=', id)
      .where('created_by', '=', actor.id)
      .forUpdate()
      .executeTakeFirst();
    if (!row) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const current = this.map(row);
    if (current.version !== expectedVersion)
      throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
    return current;
  }
  async update(i: Parameters<RcaRepository['update']>[0]) {
    return this.db.transaction().execute(async (trx) => {
      const before = await this.locked(trx, i.rca.id, i.actor, i.expectedVersion);
      authorize(
        {
          actor: i.actor,
          permission: 'PERM-RCA-EDIT',
          action: 'UPDATE',
          entity: { type: 'RCA', id: before.id, state: before.state },
          scope: { ownerId: before.createdBy },
          currentVersion: before.version,
          expectedVersion: i.expectedVersion,
          businessCondition: true,
        },
        { throwOnDeny: true },
      );
      const next = updateRca(before, {
        method: i.rca.method,
        analysis: i.rca.analysis,
        rootCause: i.rca.rootCause,
        now: i.rca.updatedAt,
      });
      const row = await trx
        .updateTable('rcas')
        .set({
          method: next.method ?? null,
          analysis: next.analysis ?? null,
          root_cause: next.rootCause ?? null,
          updated_at: next.updatedAt,
          version: next.version,
        })
        .where('id', '=', before.id)
        .where('version', '=', before.version)
        .where('state', '=', before.state)
        .returningAll()
        .executeTakeFirstOrThrow();
      const after = this.map(row);
      await this.audit(trx, before, after, i.actor, i.requestId, 'UPDATE');
      return after;
    });
  }
  async transition(i: Parameters<RcaRepository['transition']>[0]) {
    if (!['START', 'SUBMIT'].includes(i.action))
      throw new AppError('AUTHZ_DENIED', {
        userSafe: true,
        messageKey: 'errors.policy_source_required',
      });
    return this.db.transaction().execute(async (trx) => {
      const before = await this.locked(trx, i.id, i.actor, i.expectedVersion);
      authorize(
        {
          actor: i.actor,
          permission: i.action === 'START' ? 'PERM-RCA-EDIT' : 'PERM-RCA-SUBMIT',
          action: i.action,
          entity: { type: 'RCA', id: before.id, state: before.state },
          scope: { ownerId: before.createdBy },
          currentVersion: before.version,
          expectedVersion: i.expectedVersion,
          businessCondition: true,
        },
        { throwOnDeny: true },
      );
      const next = transitionRca(before, i.action, new Date(), i.reason);
      const row = await trx
        .updateTable('rcas')
        .set({
          state: next.state,
          updated_at: next.updatedAt,
          submitted_at: next.submittedAt ?? null,
          version: next.version,
        })
        .where('id', '=', before.id)
        .where('version', '=', before.version)
        .where('state', '=', before.state)
        .returningAll()
        .executeTakeFirstOrThrow();
      const after = this.map(row);
      await this.audit(trx, before, after, i.actor, i.requestId, i.action);
      return after;
    });
  }
}
