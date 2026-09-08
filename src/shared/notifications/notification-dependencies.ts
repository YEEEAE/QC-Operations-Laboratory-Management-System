import { getDatabase } from '../database/database.js';
import { NotificationService } from './notification-service.js';
import { PostgresNotificationRepository } from './postgres-notification-repository.js';

export function notificationDependencies() {
  return { listOwn: new NotificationService(new PostgresNotificationRepository(getDatabase())) };
}
