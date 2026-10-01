import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { notificationDependencies } from '../shared/notifications/notification-dependencies.js';
import { AppError } from '../shared/errors/app-error.js';
import { toActionError } from '../shared/errors/action-error.js';

const markOwnRead = defineAction({
  accept: 'form',
  input: z.object({ notificationId: z.string().uuid() }),
  handler: async ({ notificationId }, context) => {
    try {
      const actor = context.locals.actor;
      if (!actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
      const notification = await notificationDependencies().markOwnRead(actor, notificationId);
      return notification
        ? { ok: true as const }
        : { ok: false as const, reason: 'missing' as const, notificationId };
    } catch (error) {
      const mapped = toActionError(error, context.locals.requestContext?.requestId);
      if (
        mapped.error.code === 'AUTH_REQUIRED' ||
        mapped.error.code === 'AUTHZ_DENIED' ||
        mapped.error.code === 'AUTHZ_PERMISSION_MISSING' ||
        mapped.error.code === 'AUTHZ_SCOPE_DENIED'
      )
        return { ok: false as const, reason: 'denied' as const, notificationId };
      if (mapped.error.code === 'SYSTEM_DATABASE_UNAVAILABLE')
        return { ok: false as const, reason: 'provider' as const, notificationId };
      if (mapped.error.code === 'CONFLICT_STALE_VERSION')
        return { ok: false as const, reason: 'stale' as const, notificationId };
      return { ok: false as const, reason: 'unknown' as const, notificationId };
    }
  },
});

export const notifications = { markOwnRead };
