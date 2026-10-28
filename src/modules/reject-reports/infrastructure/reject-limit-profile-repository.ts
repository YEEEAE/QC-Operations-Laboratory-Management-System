import { sql, type Kysely, type Transaction } from 'kysely';
import { createHash } from 'node:crypto';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { stableJson } from '../../../shared/json/stable-stringify.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import type { RejectLimitProfileInput, RejectLimitProfileRepository } from '../application/reject-limit-profiles.js';
import { sourceDigest } from '../application/reject-limit-profiles.js';

type Tx = Transaction<DatabaseSchema>;
export class PostgresRejectLimitProfileRepository implements RejectLimitProfileRepository {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}
  async create(input: RejectLimitProfileInput & { actor: import('../../../shared/authorization/types.js').ActorContext; requestId: string }) {
    const digest = sourceDigest(input.sourceBytes);
    const id = uuidv7();
    return this.database.transaction().execute(async (tx) => {
      await sql`select pg_advisory_xact_lock(hashtextextended(${`reject-limit-revision:${input.itemCode.trim()}:${input.formulaId}`}, 0))`.execute(tx);
      const previous = await tx.selectFrom('reject_limit_profiles').select('revision')
        .where('item_code', '=', input.itemCode.trim()).where('formula_id', '=', input.formulaId)
        .orderBy('revision', 'desc').executeTakeFirst();
      const revision = (previous?.revision ?? 0) + 1;
      const profile = {
        id, item_code: input.itemCode.trim(), line: input.line?.trim() || null, site: input.site?.trim() || null,
        shift: input.shift?.trim() || null, formula_id: input.formulaId, formula_version: 1,
        denominator: input.denominator.trim(), limit_value: input.limit, unit: input.unit.trim(),
        baseline_period_start: input.baselineStart, baseline_period_end: input.baselineEnd,
        source_file_name: input.sourceFileName.trim(), source_file_digest: digest, revision,
        state: 'REVIEW_REQUIRED', created_by: input.actor.id,
      };
      await tx.insertInto('reject_limit_profiles').values(profile).execute();
      await this.appendEvent(tx, { profileId: id, action: 'DRAFTED', actorId: input.actor.id,
        reason: 'Source file imported as an unapproved draft.', revision, snapshot: profile, requestId: input.requestId });
      await new PostgresAuditRepository(tx).append({ actorType: 'USER', actorId: input.actor.id,
        subjectType: 'REJECT_LIMIT_PROFILE', subjectId: id, action: 'REJECT_LIMIT_PROFILE_DRAFTED',
        newState: 'REVIEW_REQUIRED', requestId: input.requestId,
        payload: { revision, sourceFileDigest: digest },
      });
      return { id, ...profile, version: 1n };
    });
  }
  async transition(input: Parameters<RejectLimitProfileRepository['transition']>[0]) {
    return this.database.transaction().execute(async (tx) => {
      const row = await tx.selectFrom('reject_limit_profiles').selectAll().where('id', '=', input.profileId)
        .forUpdate().executeTakeFirst();
      if (!row) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      if (BigInt(row.version) !== input.expectedVersion) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      if (input.action === 'REVIEW' && row.state !== 'REVIEW_REQUIRED') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      if (input.action === 'ACTIVATE' && row.state !== 'REVIEWED') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      if (input.action === 'REJECT' && !['REVIEW_REQUIRED', 'REVIEWED'].includes(row.state)) throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
      const state = input.action === 'REVIEW' ? 'REVIEWED' : input.action === 'REJECT' ? 'REJECTED' : 'ACTIVE';
      if (input.action === 'ACTIVATE') {
        if (!input.effectiveFrom || (input.effectiveTo && input.effectiveTo <= input.effectiveFrom))
          throw new AppError('VALIDATION_FAILED', { userSafe: true });
        await sql`select pg_advisory_xact_lock(hashtextextended(${`reject-limit-active:${row.item_code}:${row.formula_id}:${row.unit}`}, 0))`.execute(tx);
        const overlapping = await tx.selectFrom('reject_limit_profiles').select('id')
          .where('state', '=', 'ACTIVE').where('item_code', '=', row.item_code).where('formula_id', '=', row.formula_id)
          .where('unit', '=', row.unit).where('id', '!=', row.id)
          .where((eb) => eb.or([eb('effective_to', 'is', null), eb('effective_to', '>', input.effectiveFrom!)]))
          .$if(Boolean(input.effectiveTo), (query) => query.where('effective_from', '<', input.effectiveTo!))
          .execute();
        if (overlapping.length) throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
      }
      const next = await tx.updateTable('reject_limit_profiles').set({ state,
        version: BigInt(row.version) + 1n,
        ...(input.action === 'REVIEW' ? { reviewed_by: input.actor.id, reviewed_at: new Date() } : {}),
        ...(input.action === 'ACTIVATE' ? { approved_by: input.actor.id, effective_from: input.effectiveFrom!, effective_to: input.effectiveTo ?? null } : {}),
      }).where('id', '=', row.id).where('version', '=', input.expectedVersion).returningAll().executeTakeFirst();
      if (!next) throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
      await this.appendEvent(tx, { profileId: row.id, action: input.action === 'REVIEW' ? 'REVIEWED' : input.action === 'REJECT' ? 'REJECTED' : 'ACTIVATED',
        actorId: input.actor.id, reason: input.reason, revision: row.revision, snapshot: next, requestId: input.requestId });
      await new PostgresAuditRepository(tx).append({ actorType: 'USER', actorId: input.actor.id,
        subjectType: 'REJECT_LIMIT_PROFILE', subjectId: row.id, action: `REJECT_LIMIT_PROFILE_${state}`,
        oldState: row.state, newState: state, reason: input.reason, requestId: input.requestId,
        payload: { revision: row.revision, sourceFileDigest: row.source_file_digest },
      });
      return next;
    });
  }
  list() { return this.database.selectFrom('reject_limit_profiles').selectAll().orderBy('created_at', 'desc').execute(); }
  private async appendEvent(tx: Tx, input: { profileId: string; action: string; actorId: string; reason: string; revision: number; snapshot: unknown; requestId: string }) {
    await tx.insertInto('reject_limit_profile_events').values({ profile_id: input.profileId, action: input.action,
      actor_id: input.actorId, reason: input.reason, profile_revision: input.revision, snapshot: input.snapshot,
      snapshot_sha256: createHash('sha256').update(stableJson(input.snapshot)).digest('hex'), request_id: input.requestId }).execute();
  }
}
