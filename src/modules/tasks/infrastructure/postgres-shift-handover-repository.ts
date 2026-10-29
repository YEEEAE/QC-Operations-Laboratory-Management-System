import { sql } from 'kysely';
import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { stableJson } from '../../../shared/json/stable-stringify.js';
import { sha256 } from '../../../shared/files/sha256.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { ShiftHandoverRepository } from '../application/shift-handover.js';
import { transitionHandover, type HandoverAction, type ShiftHandover } from '../domain/shift-handover.js';

type Row = DatabaseSchema['shift_handovers'];
const map = (r: Row): ShiftHandover => ({
  id: r.id, fromShift: r.from_shift_code, toShift: r.to_shift_code, areaCode: r.area_code,
  lineCode: r.line_code, initiatedBy: r.initiated_by, acceptedBy: r.accepted_by ?? undefined,
  initiatedAt: r.initiated_at, acceptedAt: r.accepted_at ?? undefined, state: r.state as ShiftHandover['state'],
  linkedItems: (r.linked_items ?? []) as ShiftHandover['linkedItems'], snapshot: (r.snapshot ?? {}) as ShiftHandover['snapshot'],
  snapshotSha256: r.snapshot_sha256, version: BigInt(r.version),
});

export class PostgresShiftHandoverRepository implements ShiftHandoverRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}
  async get(id: string) {
    const r = await this.db.selectFrom('shift_handovers').selectAll().where('id', '=', id).executeTakeFirst();
    return r ? map(r) : undefined;
  }
  async listForActor(actor: ActorContext) {
    const visible = actor.scopeAssignments?.filter((s) => s.kind === 'AREA' || s.kind === 'SHIFT') ?? [];
    const areas = visible.filter((s) => s.kind === 'AREA').map((s) => s.value).filter((v): v is string => Boolean(v));
    const shifts = visible.filter((s) => s.kind === 'SHIFT').map((s) => s.value).filter((v): v is string => Boolean(v));
    if (!areas.length || !shifts.length) return [];
    const rows = await this.db.selectFrom('shift_handovers').selectAll()
      .where('area_code', 'in', areas).where((eb) => eb.or([
        eb('from_shift_code', 'in', shifts), eb('to_shift_code', 'in', shifts), eb('initiated_by', '=', actor.id), eb('accepted_by', '=', actor.id),
      ])).orderBy('initiated_at', 'desc').limit(100).execute();
    return rows.map(map);
  }
  async create(input: Parameters<ShiftHandoverRepository['create']>[0]) {
    const snapshot = stableJson(input.snapshot);
    const digest = sha256(new TextEncoder().encode(snapshot));
    const id = uuidv7();
    return this.db.transaction().execute(async (tx) => {
      const no = `HO-${id}`;
      const row = await tx.insertInto('shift_handovers').values({
        id, handover_no: no, from_shift_code: input.fromShift, to_shift_code: input.toShift,
        area_code: input.areaCode, line_code: input.lineCode, initiated_by: input.actor.id,
        accepted_by: null, accepted_at: null, state: 'PREPARED', linked_items: JSON.stringify(input.linkedItems),
        snapshot, snapshot_sha256: digest, return_reason: null, version: 1n, request_id: input.requestId,
      }).returningAll().executeTakeFirstOrThrow();
      await tx.insertInto('shift_handover_events').values({ id: uuidv7(), handover_id: id, revision: 1n, event_type: 'PREPARED', actor_id: input.actor.id, reason: null, snapshot, snapshot_sha256: digest, request_id: input.requestId });
      await sql`insert into qc.audit_events (id, actor_type, actor_id, subject_type, subject_id, action, new_state, request_id, payload)
        values (${uuidv7()}, 'USER', ${input.actor.id}, 'SHIFT_HANDOVER', ${id}, 'SHIFT_HANDOVER_PREPARED', 'PREPARED', ${input.requestId}, ${snapshot}::jsonb)`.execute(tx);
      return map(row);
    });
  }
  async transition(input: { actor: ActorContext; requestId: string; id: string; expectedVersion: bigint; action: HandoverAction; reason?: string }) {
    const digestPayload = { handoverId: input.id, action: input.action, actorId: input.actor.id, reason: input.reason ?? null };
    const digestText = stableJson(digestPayload);
    const digest = sha256(new TextEncoder().encode(digestText));
    return this.db.transaction().execute(async (tx) => {
      const old = await tx.selectFrom('shift_handovers').selectAll().where('id', '=', input.id).forUpdate().executeTakeFirst();
      if (!old) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      if (BigInt(old.version) !== input.expectedVersion) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      const state = transitionHandover(old.state as ShiftHandover['state'], input.action, input.reason);
      const accepted = input.action === 'ACCEPT' ? { accepted_by: input.actor.id, accepted_at: new Date() } : {};
      const row = await tx.updateTable('shift_handovers').set({ state, version: input.expectedVersion + 1n, updated_at: new Date(), return_reason: input.action === 'RETURN' ? input.reason! : old.return_reason, ...accepted }).where('id', '=', input.id).where('version', '=', input.expectedVersion).returningAll().executeTakeFirst();
      if (!row) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      const rev = input.expectedVersion + 1n;
      await tx.insertInto('shift_handover_events').values({ id: uuidv7(), handover_id: input.id, revision: rev, event_type: input.action === 'PREPARE' ? 'PREPARED' : input.action === 'REVIEW' ? 'REVIEWED' : input.action === 'RETURN' ? 'RETURNED' : input.action === 'ACCEPT' ? 'ACCEPTED' : 'ACKNOWLEDGED', actor_id: input.actor.id, reason: input.reason ?? null, snapshot: digestText, snapshot_sha256: digest, request_id: input.requestId });
      await sql`insert into qc.audit_events (id, actor_type, actor_id, subject_type, subject_id, action, old_state, new_state, reason, request_id, payload)
        values (${uuidv7()}, 'USER', ${input.actor.id}, 'SHIFT_HANDOVER', ${input.id}, ${`SHIFT_HANDOVER_${input.action}`}, ${old.state}, ${state}, ${input.reason ?? null}, ${input.requestId}, ${digestText}::jsonb)`.execute(tx);
      return map(row);
    });
  }
}
