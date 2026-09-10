import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { AppError } from '../shared/errors/app-error.js';
import { capaActionDependencies } from '../modules/quality/capa/application/dependencies.js';

const actor = (context: { locals: App.Locals }) => {
  if (!context.locals.actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
  return context.locals.actor;
};
const requestId = (context: { locals: App.Locals }) => context.locals.requestContext?.requestId ?? 'unknown';
const run = async <T>(work: () => Promise<T>) => {
  try { return await work(); }
  catch (error) {
    const appError = error instanceof AppError ? error : new AppError('SYSTEM_INTERNAL', { cause: error });
    throw new ActionError({
      code: appError.category === 'AUTHENTICATION' ? 'UNAUTHORIZED' : appError.category === 'AUTHORIZATION' ? 'FORBIDDEN' : 'BAD_REQUEST',
      message: appError.userSafe ? appError.message : 'Unable to complete the controlled action.',
    });
  }
};
const close = defineAction({
  accept: 'json',
  input: z.object({
    id: z.string().uuid(), expectedVersion: z.coerce.bigint(), reason: z.string().trim().min(1).max(2000),
    reauthenticationSecret: z.string().min(1),
  }),
  handler: (input, context) => run(() => capaActionDependencies().close.execute({ ...input, actor: actor(context), requestId: requestId(context) })),
});
export const capa = {
  close,
  create: defineAction({
    accept: 'json',
    input: z.object({ ncrId: z.string().uuid() }),
    handler: () => {
      throw new ActionError({
        code: 'FORBIDDEN',
        message: 'CAPA creation requires an approved source/RCA relation.',
      });
    },
  }),
};
