import type { Kysely } from 'kysely';
import type { DatabaseRow, DatabaseSchema } from '../database/db-types';
import { uuidv7 } from '../id/uuid';
import type { CreateNotificationInput, Notification } from './notification';
import type { NotificationRepository } from './notification-repository';

function toNotification(row: DatabaseRow<'notifications'>): Notification {
  return {
    id: row.id as string,
    recipientUserId: row.recipient_user_id,
    notificationType: row.notification_type,
    severity: row.severity as Notification['severity'],
    title: row.title,
    message: row.message,
    ...(row.subject_type ? { subjectType: row.subject_type } : {}),
    ...(row.subject_id ? { subjectId: row.subject_id } : {}),
    ...(row.dedupe_key ? { dedupeKey: row.dedupe_key } : {}),
    createdAt: row.created_at as Date,
    ...(row.read_at ? { readAt: row.read_at } : {}),
  };
}

export class PostgresNotificationRepository implements NotificationRepository {
  constructor(private readonly database: Kysely<DatabaseSchema>) {}

  async create(input: CreateNotificationInput): Promise<Notification> {
    const row = await this.database
      .insertInto('notifications')
      .values({
        id: input.id ?? uuidv7(),
        recipient_user_id: input.recipientUserId,
        notification_type: input.notificationType,
        severity: input.severity,
        title: input.title,
        message: input.message,
        subject_type: input.subjectType ?? null,
        subject_id: input.subjectId ?? null,
        dedupe_key: input.dedupeKey ?? null,
        created_at: input.createdAt ?? new Date(),
        read_at: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toNotification(row);
  }

  async listForRecipient(
    recipientUserId: string,
    options: { unreadOnly?: boolean; limit?: number } = {},
  ) {
    const limit = Math.min(100, Math.max(1, options.limit ?? 50));
    let query = this.database
      .selectFrom('notifications')
      .selectAll()
      .where('recipient_user_id', '=', recipientUserId)
      .orderBy('created_at', 'desc')
      .limit(limit);
    if (options.unreadOnly) query = query.where('read_at', 'is', null);
    const rows = await query.execute();
    return rows.map(toNotification);
  }

  async markRead(
    id: string,
    recipientUserId: string,
    readAt: Date,
  ): Promise<Notification | undefined> {
    const row = await this.database
      .updateTable('notifications')
      .set({ read_at: readAt })
      .where('id', '=', id)
      .where('recipient_user_id', '=', recipientUserId)
      .where('read_at', 'is', null)
      .returningAll()
      .executeTakeFirst();
    if (row) return toNotification(row);
    const existing = await this.database
      .selectFrom('notifications')
      .selectAll()
      .where('id', '=', id)
      .where('recipient_user_id', '=', recipientUserId)
      .executeTakeFirst();
    return existing ? toNotification(existing) : undefined;
  }
}
