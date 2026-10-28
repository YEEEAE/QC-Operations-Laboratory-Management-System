import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../database/db-types';
import { stableJson } from '../json/stable-stringify';
import { uuidv7 } from '../id/uuid';
import type { OutboxEvent, OutboxEventInput, OutboxFailureClass } from './outbox-event';
import type { OutboxRepository } from './outbox-repository';

const MAX_CLAIM_SIZE = 100;
export class PostgresOutboxRepository implements OutboxRepository {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}
  async enqueue(event: OutboxEventInput): Promise<void> {
    await this.database
      .insertInto('outbox_events')
      .values({
        id: uuidv7(),
        event_type: event.eventType,
        aggregate_type: event.aggregateType,
        aggregate_id: event.aggregateId,
        payload: stableJson(event.payload),
        dedupe_key: event.dedupeKey ?? null,
      })
      .onConflict((oc) => oc.column('dedupe_key').doNothing())
      .returning('id')
      .execute();
  }
  async claim(limit: number, leaseToken: string, leaseUntil: Date): Promise<OutboxEvent[]> {
    if (!Number.isSafeInteger(limit) || limit < 1) throw new RangeError('limit must be a positive integer');
    if (!leaseToken || !Number.isFinite(leaseUntil.getTime())) throw new RangeError('lease is invalid');
    const boundedLimit = Math.max(1, Math.min(MAX_CLAIM_SIZE, Math.trunc(limit)));
    const now = new Date();
    return this.database.transaction().execute(async (trx) => {
      const rows = await trx
        .selectFrom('outbox_events')
        .selectAll()
        .where('processed_at', 'is', null)
        .where('dead_lettered_at', 'is', null)
        .where('available_at', '<=', now)
        .where((eb) => eb.or([
          eb('lease_until', 'is', null),
          eb('lease_until', '<=', now),
        ]))
        // created_at is not unique; the id tie-break keeps claim order
        // deterministic for events sharing one timestamp.
        .orderBy('created_at')
        .orderBy('id')
        .limit(boundedLimit)
        .forUpdate()
        .skipLocked()
        .execute();
      for (const row of rows)
        await trx
          .updateTable('outbox_events')
          .set({
            attempt_count: row.attempt_count + 1,
            lease_token: leaseToken,
            lease_until: leaseUntil,
          })
          .where('id', '=', row.id)
          .execute();
      return rows.map((row) => ({
        id: row.id,
        eventType: row.event_type,
        aggregateType: row.aggregate_type,
        aggregateId: row.aggregate_id,
        payload: row.payload as Record<string, unknown>,
        dedupeKey: row.dedupe_key ?? undefined,
        attemptCount: row.attempt_count + 1,
        availableAt: row.available_at,
        leaseToken,
        leaseUntil,
      }));
    });
  }
  async markProcessed(id: string, leaseToken: string): Promise<void> {
    const processed = await this.database
      .updateTable('outbox_events')
      .set({ processed_at: new Date(), lease_token: null, lease_until: null })
      .where('id', '=', id)
      .where('lease_token', '=', leaseToken)
      .where('processed_at', 'is', null)
      .returning('id')
      .executeTakeFirst();
    if (!processed) throw new Error('Outbox lease is no longer current');
  }
  async markRetry(
    id: string,
    leaseToken: string,
    failureClass: OutboxFailureClass,
    availableAt: Date,
    maxAttempts: number,
  ): Promise<void> {
    if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 100)
      throw new RangeError('maxAttempts must be an integer between 1 and 100');
    const exhausted = (await this.database
      .selectFrom('outbox_events')
      .select('attempt_count')
      .where('id', '=', id)
      .where('lease_token', '=', leaseToken)
      .where('processed_at', 'is', null)
      .executeTakeFirst())?.attempt_count;
    if (exhausted === undefined) return;
    const terminal = exhausted >= maxAttempts;
    await this.database
      .updateTable('outbox_events')
      .set({
        last_error: `delivery failed (${failureClass.toLowerCase()})`,
        last_failure_class: failureClass,
        available_at: availableAt,
        dead_lettered_at: terminal ? new Date() : null,
        lease_token: null,
        lease_until: null,
      })
      .where('id', '=', id)
      .where('lease_token', '=', leaseToken)
      .where('processed_at', 'is', null)
      .execute();
  }
}
