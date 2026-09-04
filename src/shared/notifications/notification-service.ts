import { authorize } from '../authorization/authorize';
import type { ActorContext } from '../authorization/types';
import { AppError } from '../errors/app-error';
import type { Clock } from '../time/clock';
import { systemClock } from '../time/clock';
import type { CreateNotificationInput, Notification } from './notification';
import type { NotificationRepository } from './notification-repository';

function assertNotificationPermission(
  actor: ActorContext,
  action: 'VIEW' | 'MARK_READ',
  id: string,
) {
  const permission = action === 'VIEW' ? 'PERM-NOT-VIEW-OWN' : 'PERM-NOT-MARK-READ';
  const decision = authorize({
    actor,
    permission,
    action,
    entity: { type: 'NOTIFICATION', id, state: 'ACTIVE', ownerId: actor.id },
    scope: { ownerId: actor.id },
    currentVersion: 1,
    expectedVersion: 1,
    businessCondition: true,
  });
  if (!decision.allowed) throw new AppError(decision.code ?? 'AUTHZ_DENIED');
}

export class NotificationService {
  constructor(
    private readonly repository: NotificationRepository,
    private readonly clock: Clock = systemClock,
  ) {}

  async create(input: CreateNotificationInput): Promise<Notification> {
    if (!input.recipientUserId || !input.title.trim() || !input.message.trim())
      throw new AppError('VALIDATION_FAILED');
    return this.repository.create({ ...input, createdAt: input.createdAt ?? this.clock.now() });
  }

  async listOwn(actor: ActorContext, unreadOnly = false) {
    assertNotificationPermission(actor, 'VIEW', actor.id);
    return this.repository.listForRecipient(actor.id, { unreadOnly });
  }

  async markOwnRead(
    actor: ActorContext,
    notificationId: string,
  ): Promise<Notification | undefined> {
    assertNotificationPermission(actor, 'MARK_READ', notificationId);
    return this.repository.markRead(notificationId, actor.id, this.clock.now());
  }
}
