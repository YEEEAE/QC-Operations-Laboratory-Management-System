import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { releaseGovernanceActionDependencies } from '../modules/release-governance/application/dependencies.js';
import { AppError } from '../shared/errors/app-error.js';

const actor = (context: { locals: App.Locals }) => {
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
      message: appError.userSafe ? appError.message : 'Unable to complete the release approval.',
    });
  }
};

const approveRelease = defineAction({
  accept: 'json',
  input: z.object({
    releaseId: z.string().uuid(),
    expectedVersion: z.coerce.bigint(),
    reauthenticationSecret: z.string().min(1),
  }),
  handler: (input, context) =>
    run(() =>
      releaseGovernanceActionDependencies().approve.execute({
        releaseId: input.releaseId,
        expectedVersion: input.expectedVersion,
        reauthenticationSecret: input.reauthenticationSecret,
        actor: actor(context),
        requestId: requestId(context),
      }),
    ),
});

export const releaseGovernance = { approveRelease };
