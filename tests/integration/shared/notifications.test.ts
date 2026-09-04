import { describe, expect, it } from 'vitest';
import { NotificationService } from '../../../src/shared/notifications/notification-service';
import type {
  Notification,
  CreateNotificationInput,
} from '../../../src/shared/notifications/notification';
import type { NotificationRepository } from '../../../src/shared/notifications/notification-repository';
import type { ActorContext } from '../../../src/shared/authorization/types';

type ListOptions = { unreadOnly?: boolean; limit?: number };

class MemoryNotifications implements NotificationRepository {
  rows: Notification[] = [];
  async create(input: CreateNotificationInput) {
    const row = {
      ...input,
      id: input.id ?? `n-${this.rows.length + 1}`,
      createdAt: input.createdAt ?? new Date(),
    };
    const notification = row as Notification;
    this.rows.push(notification);
    return notification;
  }
  async listForRecipient(userId: string, options: ListOptions = {}) {
    return this.rows
      .filter((r) => r.recipientUserId === userId && (!options.unreadOnly || !r.readAt))
      .slice(0, options.limit ?? 100);
  }
  async markRead(id: string, userId: string, readAt: Date) {
    const row = this.rows.find((r) => r.id === id && r.recipientUserId === userId);
    if (!row) return undefined;
    row.readAt ??= readAt;
    return row;
  }
}

const actor = (id: string): ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles: [],
  permissions: [
    { code: 'PERM-NOT-VIEW-OWN', scopes: ['OWN'] },
    { code: 'PERM-NOT-MARK-READ', scopes: ['OWN'] },
  ],
});

describe('notifications', () => {
  it('isolates recipients and makes mark-read replay idempotent', async () => {
    const repository = new MemoryNotifications();
    const service = new NotificationService(repository);
    await service.create({
      recipientUserId: 'u1',
      notificationType: 'TASK_ASSIGNED',
      severity: 'INFO',
      title: 'A',
      message: 'B',
    });
    await service.create({
      recipientUserId: 'u2',
      notificationType: 'TASK_ASSIGNED',
      severity: 'INFO',
      title: 'C',
      message: 'D',
    });
    expect((await service.listOwn(actor('u1'))).map((n) => n.title)).toEqual(['A']);
    const first = await service.markOwnRead(actor('u1'), 'n-1');
    const second = await service.markOwnRead(actor('u1'), 'n-1');
    expect(first?.readAt).toEqual(second?.readAt);
    await expect(service.listOwn(actor('u2'))).resolves.toHaveLength(1);
  });

  it('denies inactive or unpermissioned actors before repository access', async () => {
    const repository = new MemoryNotifications();
    const service = new NotificationService(repository);
    await expect(
      service.listOwn({ ...actor('u1'), accountState: 'DISABLED' }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    await expect(service.listOwn({ ...actor('u1'), permissions: [] })).rejects.toMatchObject({
      code: 'AUTHZ_PERMISSION_MISSING',
    });
  });
});
