import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { backupRestoreActionDependencies } from '../modules/backup-recovery/application/dependencies.js';
import { AppError } from '../shared/errors/app-error.js';

const requireActor = (context: { locals: App.Locals }) => {
  if (!context.locals.actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
  return context.locals.actor;
};
const requestId = (context: { locals: App.Locals }) =>
  context.locals.requestContext?.requestId ?? 'unknown';
const run = async <T>(work: () => Promise<T>): Promise<T> => {
  try {
    return await work();
  } catch (error) {
    const appError =
      error instanceof AppError
        ? error
        : new AppError('SYSTEM_INTERNAL', { userSafe: false, cause: error });
    throw new ActionError({
      code:
        appError.category === 'AUTHENTICATION'
          ? 'UNAUTHORIZED'
          : appError.category === 'AUTHORIZATION'
            ? 'FORBIDDEN'
            : 'BAD_REQUEST',
      message: appError.userSafe
        ? appError.message
        : 'Unable to record the controlled restore request.',
    });
  }
};

/**
 * Controlled restore intent boundary. This action only records a restore
 * request after server-side validation and authorization; it never executes
 * a restore, never calls a recovery provider, and never reports a restore as
 * executed or verified. GET paths never reach this action.
 */
const requestRestore = defineAction({
  accept: 'json',
  input: z.object({
    backupId: z.string().uuid(),
    restoreType: z.enum(['DRILL', 'PRODUCTION']),
    targetEnvironment: z.enum(['local', 'test', 'staging', 'production']),
    reason: z.string().trim().min(1).max(2000),
    confirmRestore: z.literal(true),
  }),
  handler: (input, context) =>
    run(async () => {
      const { restore, orchestration } =
        await backupRestoreActionDependencies().requestRestore.execute({
          actor: requireActor(context),
          backupId: input.backupId,
          restoreType: input.restoreType,
          targetEnvironment: input.targetEnvironment,
          reason: input.reason,
          confirmation: input.confirmRestore,
          requestId: requestId(context),
        });
      return {
        restore: {
          id: restore.id,
          backupRunId: restore.backupRunId,
          restoreType: restore.restoreType,
          state: restore.state,
          targetEnvironment: restore.targetEnvironment,
          requestedAt: restore.requestedAt,
        },
        orchestration,
      };
    }),
});

export const system = { requestRestore };
