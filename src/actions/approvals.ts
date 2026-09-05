import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { approvalsActionDependencies } from '../modules/approvals/application/dependencies.js';
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
      message: appError.userSafe
        ? appError.message
        : 'Unable to complete the controlled approval action.',
    });
  }
};
const id = z.string().uuid();
const decide = defineAction({
  accept: 'json',
  input: z.object({
    approvalId: id,
    workItemId: id,
    decision: z.enum(['APPROVE', 'REJECT', 'RETURN']),
    subjectVersion: z.coerce.bigint(),
    reason: z.string().trim().optional(),
    comments: z.string().trim().optional(),
    reauthenticationSecret: z.string().optional(),
  }),
  handler: (input, context) =>
    run(() =>
      approvalsActionDependencies().decide.execute({
        ...input,
        actor: actor(context),
        requestId: requestId(context),
      }),
    ),
});
export const approvals = { decide };
