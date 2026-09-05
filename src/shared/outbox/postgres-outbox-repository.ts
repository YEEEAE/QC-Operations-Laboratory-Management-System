import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../database/db-types';
import { stableJson } from '../json/stable-stringify';
import { uuidv7 } from '../id/uuid';
import type { OutboxEvent, OutboxEventInput } from './outbox-event';
import type { OutboxRepository } from './outbox-repository';
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
      .execute();
  }
  async claim(limit: number): Promise<OutboxEvent[]> {
    return this.database.transaction().execute(async (trx) => {
      const rows = await trx
        .selectFrom('outbox_events')
        .selectAll()
        .where('processed_at', 'is', null)
        .where('available_at', '<=', new Date())
        .orderBy('created_at')
        .limit(limit)
        .forUpdate()
        .skipLocked()
        .execute();
      for (const row of rows)
        await trx
          .updateTable('outbox_events')
          .set({
            attempt_count: row.attempt_count + 1,
            available_at: new Date(Date.now() + 30_000),
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
        availableAt: new Date(Date.now() + 30_000),
      }));
    });
  }
  async markProcessed(id: string): Promise<void> {
    await this.database
      .updateTable('outbox_events')
      .set({ processed_at: new Date() })
      .where('id', '=', id)
      .execute();
  }
  async markRetry(id: string, error: string, availableAt: Date): Promise<void> {
    await this.database
      .updateTable('outbox_events')
      .set({ last_error: error.slice(0, 2000), available_at: availableAt })
      .where('id', '=', id)
      .execute();
  }
}
