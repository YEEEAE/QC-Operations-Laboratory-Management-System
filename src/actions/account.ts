import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { toActionError } from '../shared/errors/action-error.js';
import { identityDependencies } from '../modules/identity/application/identity-dependencies.js';
import { ChangePasswordUseCase } from '../modules/identity/application/change-password.js';
import { AppError } from '../shared/errors/app-error.js';

const changePassword = defineAction({
  accept: 'form',
  input: z.object({
    currentPassword: z.string().catch(''),
    newPassword: z.string().catch(''),
  }),
  handler: async (input, context) => {
    try {
      if (!context.locals.actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
      const deps = identityDependencies();
      await new ChangePasswordUseCase(deps.users, deps.passwords, deps.credentialMutation).execute({
        actor: context.locals.actor,
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
        requestId: context.locals.requestContext.requestId,
      });
      return { ok: true, redirectTo: '/login?session=PASSWORD_CHANGED' };
    } catch (error) {
      const mapped = toActionError(error, context.locals.requestContext?.requestId);
      if (mapped.error.fieldErrors) return { ok: false, fieldErrors: mapped.error.fieldErrors };
      if (mapped.error.code === 'AUTH_REAUTH_REQUIRED')
        return {
          ok: false,
          fieldErrors: { currentPassword: ['errors.current-password-incorrect'] },
        };
      if (mapped.error.code === 'CONFLICT_STALE_VERSION') return { ok: false, formError: 'stale' };
      if (mapped.error.code === 'AUTH_REQUIRED' || mapped.error.code === 'RESOURCE_NOT_FOUND')
        return { ok: false, formError: 'missing' };
      if (
        mapped.error.code === 'AUTHZ_DENIED' ||
        mapped.error.code === 'AUTHZ_PERMISSION_MISSING' ||
        mapped.error.code === 'AUTHZ_SCOPE_DENIED'
      )
        return { ok: false, formError: 'denied' };
      if (mapped.error.code === 'SYSTEM_DATABASE_UNAVAILABLE')
        return { ok: false, formError: 'provider' };
      return { ok: false, formError: 'unknown' };
    }
  },
});

export const account = { changePassword };
