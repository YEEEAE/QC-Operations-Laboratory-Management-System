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
  async listPageForRecipient(
    userId: string,
    options: { unreadOnly?: boolean; page: number; pageSize: number },
  ) {
    const matching = this.rows.filter(
      (row) => row.recipientUserId === userId && (!options.unreadOnly || !row.readAt),
    );
    const totalPages = Math.max(1, Math.ceil(matching.length / options.pageSize));
    const page = Math.min(options.page, totalPages);
    return {
      items: matching.slice((page - 1) * options.pageSize, page * options.pageSize),
      total: matching.length,
      page,
      pageSize: options.pageSize,
    };
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

  it('keeps own read state isolated and paginates 51 notifications with an exact total', async () => {
    const repository = new MemoryNotifications();
    const service = new NotificationService(repository);
    for (let index = 1; index <= 51; index++) {
      await service.create({
        recipientUserId: 'u1',
        notificationType: 'TASK_ASSIGNED',
        severity: 'INFO',
        title: `Notice ${index}`,
        message: 'A notification',
      });
    }
    await service.create({
      recipientUserId: 'u2',
      notificationType: 'TASK_ASSIGNED',
      severity: 'INFO',
      title: 'Other account',
      message: 'Must stay private',
    });
    const firstPage = await service.listOwnPage(actor('u1'), true, 1);
    const secondPage = await service.listOwnPage(actor('u1'), true, 2);
    expect(firstPage).toMatchObject({ total: 51, page: 1, pageSize: 50 });
    expect(firstPage.items).toHaveLength(50);
    expect(secondPage).toMatchObject({ total: 51, page: 2, pageSize: 50 });
    expect(secondPage.items).toHaveLength(1);
    expect(new Set([...firstPage.items, ...secondPage.items].map((item) => item.id)).size).toBe(51);

    const targetId = firstPage.items[0]!.id;
    const before = firstPage.items[0]!.readAt;
    await expect(service.markOwnRead(actor('u2'), targetId)).resolves.toBeUndefined();
    expect(repository.rows.find((row) => row.id === targetId)?.readAt).toBe(before);
    await expect(
      service.markOwnRead({ ...actor('u1'), accountState: 'DISABLED' }, targetId),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    await expect(
      service.markOwnRead(
        { ...actor('u1'), permissions: [{ code: 'PERM-NOT-VIEW-OWN', scopes: ['OWN'] }] },
        targetId,
      ),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    expect(repository.rows.find((row) => row.id === targetId)?.readAt).toBe(before);
    const firstMark = await service.markOwnRead(actor('u1'), targetId);
    const replay = await service.markOwnRead(actor('u1'), targetId);
    expect(firstMark?.readAt).toBeInstanceOf(Date);
    expect(replay?.readAt).toEqual(firstMark?.readAt);
    await expect(service.listOwnPage(actor('u1'), true, 1)).resolves.toMatchObject({ total: 50 });
    await expect(service.listOwnPage(actor('u1'), false, 1)).resolves.toMatchObject({ total: 51 });
  });
});
