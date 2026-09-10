import type { Kysely } from 'kysely';
import type { DatabaseRow, DatabaseSchema } from '../../../../shared/database/db-types.js';
import type { CapaRepository } from '../ports/repository.js';
import type { Capa, CapaActionType } from '../domain/capa.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { stableJson } from '../../../../shared/json/stable-stringify.js';
import { createHash } from 'node:crypto';
export class PostgresCapaRepository implements CapaRepository {
  constructor(private db: Kysely<DatabaseSchema>) {}
  private map(r: DatabaseRow<'capas'>, a: readonly DatabaseRow<'capa_actions'>[] = []): Capa {
    return {
      id: r.id,
      capaNo: r.capa_no,
      ncrId: r.ncr_id ?? undefined,
      state: r.state as Capa['state'],
      title: r.title,
      description: r.description,
      ownerId: r.owner_id ?? undefined,
      targetDate: r.target_date ?? undefined,
      verificationRequired: r.verification_required,
      effectivenessRequired: r.effectiveness_required,
      closedAt: r.closed_at ?? undefined,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      version: BigInt(r.version),
      actions: a.map((x) => ({
        id: x.id,
        capaId: x.capa_id,
        sequenceNo: x.sequence_no,
        description: x.description,
        ownerId: x.owner_id,
        dueAt: x.due_at ?? undefined,
        state: x.state,
        completedAt: x.completed_at ?? undefined,
        completedBy: x.completed_by ?? undefined,
        verificationState: x.verification_state ?? undefined,
        version: BigInt(x.version),
      })),
    };
  }
  async create(i: Parameters<CapaRepository['create']>[0]) {
    const r = await this.db
      .insertInto('capas')
      .values({
        id: i.capa.id,
        capa_no: i.capa.capaNo,
        ncr_id: i.capa.ncrId ?? null,
        state: 'DRAFT',
        title: i.capa.title,
        description: i.capa.description,
        owner_id: i.capa.ownerId ?? null,
        target_date: i.capa.targetDate ?? null,
        verification_required: i.capa.verificationRequired,
        effectiveness_required: i.capa.effectivenessRequired,
        closed_at: null,
        created_by: i.actor.id,
        updated_at: i.capa.updatedAt,
        version: 1n,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return this.map(r);
  }
  async get(id: string, a: ActorContext) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return;
    const r = await this.db
      .selectFrom('capas')
      .selectAll()
      .where('id', '=', id)
      .where((eb) => eb.or([eb('owner_id', '=', a.id), eb('created_by', '=', a.id)]))
      .executeTakeFirst();
    return r && this.map(r);
  }
  async list(i: Parameters<CapaRepository['list']>[0]) {
    let q = this.db
      .selectFrom('capas')
      .selectAll()
      .where((eb) => eb.or([eb('owner_id', '=', i.actor.id), eb('created_by', '=', i.actor.id)]));
    if (i.state) q = q.where('state', '=', i.state);
    return (await q.execute()).map((r) => this.map(r));
  }
  async transition(i: Parameters<CapaRepository['transition']>[0]) {
    if (i.action === 'CLOSE') throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const next: Record<CapaActionType, string> = {
      OPEN: 'OPEN',
      START: 'IN_PROGRESS',
      ACTIONS_COMPLETE: 'AWAITING_VERIFICATION',
      START_EFFECTIVENESS: 'EFFECTIVENESS_REVIEW',
      READY_FOR_CLOSURE: 'READY_FOR_CLOSURE',
      CLOSE: 'CLOSED',
      VOID: 'VOID',
    };
    const r = await this.db
      .updateTable('capas')
      .set({
        state: next[i.action],
        updated_at: new Date(),
        closed_at: null,
      })
      .where('id', '=', i.id)
      .where('version', '=', i.expectedVersion)
      .returningAll()
      .executeTakeFirst();
    if (!r) throw new Error('stale');
    return this.map(r);
  }

  async close(i: Parameters<CapaRepository['close']>[0]) {
    const key = `CAPA:CLOSE:${i.id}:${i.requestId}`;
    const fingerprint = createHash('sha256')
      .update(stableJson({ id: i.id, expectedVersion: i.expectedVersion, actorId: i.actor.id, reason: i.reason }))
      .digest('hex');
    return this.db.transaction().execute(async (trx) => {
      const replay = await trx.selectFrom('idempotency_records').selectAll().where('key', '=', key).executeTakeFirst();
      if (replay) {
        if (replay.request_fingerprint !== fingerprint)
          throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
        if (replay.status === 'COMPLETED' && replay.response_payload) return replay.response_payload as Capa;
        throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
      }
      await trx.insertInto('idempotency_records').values({
        key, request_fingerprint: fingerprint, status: 'IN_PROGRESS', response_payload: null,
      }).execute();
      const row = await trx.selectFrom('capas').selectAll().where('id', '=', i.id).forUpdate().executeTakeFirst();
      if (!row) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      if (BigInt(row.version) !== i.expectedVersion) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      if (row.state === 'CLOSED' || row.state === 'VOID') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      const actions = await trx.selectFrom('capa_actions').selectAll().where('capa_id', '=', i.id).orderBy('sequence_no').execute();
      const snapshotCapa = this.map(row, actions);
      const snapshot = { capa: snapshotCapa, actions: snapshotCapa.actions };
      const snapshotJson = stableJson(snapshot);
      const snapshotHash = createHash('sha256').update(snapshotJson).digest('hex');
      if (snapshotHash !== i.signature.snapshotHash) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      await trx.insertInto('capa_close_snapshots').values({
        capa_id: i.id, capa_version: BigInt(row.version), snapshot, snapshot_hash: snapshotHash,
      }).execute();
      const updated = await trx.updateTable('capas').set({
        state: 'CLOSED', closed_at: new Date(), updated_at: new Date(), version: BigInt(row.version) + 1n,
      }).where('id', '=', i.id).where('version', '=', i.expectedVersion).returningAll().executeTakeFirst();
      if (!updated) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      await trx.insertInto('electronic_signatures').values({
        id: i.signature.id, actor_id: i.signature.actorId, subject_type: i.signature.subjectType,
        subject_id: i.signature.subjectId, subject_version: i.signature.subjectVersion,
        action: i.signature.action, meaning: i.signature.meaning, signed_at: i.signature.signedAt,
        snapshot_hash: i.signature.snapshotHash, reason: i.signature.reason ?? null,
        reauth_method: i.signature.reauthMethod, request_id: i.signature.requestId,
      }).execute();
      await trx.insertInto('audit_events').values({
        actor_type: 'USER', actor_id: i.actor.id, subject_type: 'CAPA', subject_id: i.id,
        action: 'CLOSE', transition_id: 'TR-CAPA-006', old_state: row.state, new_state: 'CLOSED',
        reason: i.reason, request_id: i.requestId, signature_id: i.signature.id,
        payload: { oldVersion: String(row.version), newVersion: String(BigInt(row.version) + 1n), snapshotHash },
      }).execute();
      const result = this.map(updated, actions);
      await trx.updateTable('idempotency_records').set({
        status: 'COMPLETED', response_payload: result, completed_at: new Date(),
      }).where('key', '=', key).execute();
      return result;
    });
  }
}
