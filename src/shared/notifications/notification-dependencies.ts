import { getDatabase } from '../database/database.js';
import { NotificationService } from './notification-service.js';
import { PostgresNotificationRepository } from './postgres-notification-repository.js';

export function notificationDependencies() {
  const service = new NotificationService(new PostgresNotificationRepository(getDatabase()));
  return {
    listOwn: service,
    markOwnRead: (actor: Parameters<NotificationService['markOwnRead']>[0], id: string) =>
      service.markOwnRead(actor, id),
  };
}
