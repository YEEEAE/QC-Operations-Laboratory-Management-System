import type { Notification, CreateNotificationInput } from './notification';

export interface NotificationRepository {
  create(input: CreateNotificationInput): Promise<Notification>;
  listForRecipient(
    recipientUserId: string,
    options?: { unreadOnly?: boolean; limit?: number },
  ): Promise<Notification[]>;
  markRead(id: string, recipientUserId: string, readAt: Date): Promise<Notification | undefined>;
}
