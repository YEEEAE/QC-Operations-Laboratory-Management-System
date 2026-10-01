import type { Notification, CreateNotificationInput } from './notification';

export interface NotificationRepository {
  create(input: CreateNotificationInput): Promise<Notification>;
  listForRecipient(
    recipientUserId: string,
    options?: { unreadOnly?: boolean; limit?: number },
  ): Promise<Notification[]>;
  listPageForRecipient(
    recipientUserId: string,
    options: { unreadOnly?: boolean; page: number; pageSize: number },
  ): Promise<{ items: Notification[]; total: number; page: number; pageSize: number }>;
  markRead(id: string, recipientUserId: string, readAt: Date): Promise<Notification | undefined>;
}
