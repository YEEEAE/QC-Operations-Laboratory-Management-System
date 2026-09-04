import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { toActionError } from '../shared/errors/action-error.js';
import { identityDependencies } from '../modules/identity/application/identity-dependencies.js';
import { ChangePasswordUseCase } from '../modules/identity/application/change-password.js';
import { AppError } from '../shared/errors/app-error.js';

const changePassword = defineAction({ accept: 'form', input: z.object({ currentPassword: z.string(), newPassword: z.string() }), handler: async (input, context) => {
  try { if (!context.locals.actor) throw new AppError('AUTH_REQUIRED', { userSafe: true }); const deps = identityDependencies(); await new ChangePasswordUseCase(deps.users, deps.passwords, deps.sessionService).execute({ actor: context.locals.actor, currentPassword: input.currentPassword, newPassword: input.newPassword, requestId: context.locals.requestContext.requestId }); return { ok: true }; }
  catch (error) { const mapped = toActionError(error, context.locals.requestContext?.requestId); throw new ActionError('BAD_REQUEST', mapped.error.messageKey); }
}});

export const account = { changePassword };
