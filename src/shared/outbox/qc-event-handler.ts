import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../database/db-types.js';
import { PostgresNotificationRepository } from '../notifications/postgres-notification-repository.js';
import type { OutboxEvent } from './outbox-event.js';

/**
 * Projects committed approval events into recipient-scoped notifications.
 * The projection is safe to replay; business truth remains in the owning
 * transaction and notification dedupe is enforced by the database.
 */
export function createQcOutboxHandler(database: Kysely<DatabaseSchema>) {
  const notifications = new PostgresNotificationRepository(database);

  return async (event: OutboxEvent): Promise<void> => {
    if (
      event.payload.action !== 'APPROVE' ||
      (event.eventType !== 'INSPECTION_CHANGED' && event.eventType !== 'LAB_TEST_CHANGED')
    )
      return;

    const table = event.eventType === 'INSPECTION_CHANGED' ? 'inspection_reports' : 'lab_tests';
    const row = await database
      .selectFrom(table)
      .select('author_id')
      .where('id', '=', event.aggregateId)
      .executeTakeFirst();
    if (!row?.author_id) return;

    const subject = event.eventType === 'INSPECTION_CHANGED' ? 'inspection' : 'laboratory test';
    await notifications.create({
      recipientUserId: row.author_id,
      notificationType: `${event.eventType}_APPROVED`,
      severity: 'INFO',
      title: `${subject[0].toUpperCase()}${subject.slice(1)} approved`,
      message: `The ${subject} was approved. Open the record to review its current status.`,
      subjectType: event.aggregateType,
      subjectId: event.aggregateId,
      dedupeKey: `notification:${event.id}`,
    });
  };
}
