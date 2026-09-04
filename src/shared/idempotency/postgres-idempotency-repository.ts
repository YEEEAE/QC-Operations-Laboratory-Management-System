import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../database/db-types';
import { uuidv7 } from '../id/uuid';
import type { IdempotencyRecord, IdempotencyRepository } from './idempotency-repository';

export class PostgresIdempotencyRepository implements IdempotencyRepository {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}
  async find(key: string): Promise<IdempotencyRecord | undefined> {
    const row = await this.database
      .selectFrom('idempotency_records')
      .selectAll()
      .where('key', '=', key)
      .executeTakeFirst();
    return (
      row && {
        key: row.key,
        fingerprint: row.request_fingerprint,
        status: row.status,
        response: row.response_payload,
      }
    );
  }
  async reserve(record: IdempotencyRecord): Promise<boolean> {
    const result = await this.database
      .insertInto('idempotency_records')
      .values({
        id: uuidv7(),
        key: record.key,
        request_fingerprint: record.fingerprint,
        status: record.status,
        response_payload: null,
      })
      .onConflict((oc) => oc.column('key').doNothing())
      .executeTakeFirst();
    return Number(result.numInsertedOrUpdatedRows) === 1;
  }
  async complete(key: string, response: unknown): Promise<void> {
    await this.database
      .updateTable('idempotency_records')
      .set({
        status: 'COMPLETED',
        response_payload: JSON.stringify(response),
        completed_at: new Date(),
      })
      .where('key', '=', key)
      .execute();
  }
  async fail(key: string): Promise<void> {
    await this.database
      .updateTable('idempotency_records')
      .set({ status: 'FAILED' })
      .where('key', '=', key)
      .execute();
  }
}
