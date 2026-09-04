import type { PermissionCode } from '../authorization/permissions';

export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Notification {
  id: string;
  recipientUserId: string;
  notificationType: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  subjectType?: string;
  subjectId?: string;
  dedupeKey?: string;
  createdAt: Date;
  readAt?: Date;
}

export interface CreateNotificationInput extends Omit<Notification, 'id' | 'createdAt' | 'readAt'> {
  id?: string;
  createdAt?: Date;
}

export interface NotificationActor {
  id: string;
  accountState: 'ACTIVE' | 'INACTIVE' | 'DISABLED';
  permissions: readonly { code: PermissionCode; scopes: readonly 'OWN'[]; active?: boolean }[];
}
