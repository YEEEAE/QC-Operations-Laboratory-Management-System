import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { changeRequestsActionDependencies } from '../modules/change-requests/application/dependencies.js';
import { AppError } from '../shared/errors/app-error.js';

const requireActor = (context: { locals: App.Locals }) => {
  if (!context.locals.actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
  return context.locals.actor;
};
const requestId = (context: { locals: App.Locals }) => context.locals.requestContext?.requestId ?? 'unknown';
const run = async <T>(work: () => Promise<T>): Promise<T> => {
  try {
    return await work();
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('SYSTEM_INTERNAL', { userSafe: false, cause: error });
    throw new ActionError({
      code: appError.category === 'AUTHENTICATION' ? 'UNAUTHORIZED' : appError.category === 'AUTHORIZATION' ? 'FORBIDDEN' : 'BAD_REQUEST',
      message: appError.userSafe ? appError.message : 'Unable to complete the controlled change request action.',
    });
  }
};

const id = z.string().uuid();
const change = z.object({
  fieldPath: z.string().trim().min(1),
  currentValue: z.unknown().optional(),
  proposedValue: z.unknown().optional(),
  dataType: z.string().trim().min(1),
});

const create = defineAction({
  accept: 'json',
  input: z.object({
    changeNo: z.string().trim().min(1),
    targetType: z.string().trim().min(1),
    targetId: id,
    targetVersion: z.coerce.bigint().positive(),
    reason: z.string().trim().min(1),
    targetSnapshot: z.record(z.string(), z.unknown()),
    targetSnapshotHash: z.string().trim().min(1).optional(),
    changes: z.array(change).min(1),
  }),
  handler: (input, context) =>
    run(() => changeRequestsActionDependencies().create.execute({ ...input, actor: requireActor(context), requestId: requestId(context) })),
});

const transition = defineAction({
  accept: 'json',
  input: z.object({
    id,
    action: z.enum(['SUBMIT', 'START_REVIEW', 'RETURN', 'RESUME', 'APPROVE', 'REJECT', 'CANCEL']),
    expectedVersion: z.coerce.bigint().positive(),
    reason: z.string().trim().optional(),
  }),
  handler: (input, context) =>
    run(() => changeRequestsActionDependencies().transition.execute({ ...input, actor: requireActor(context), requestId: requestId(context) })),
});

export const changeRequests = { create, transition };
