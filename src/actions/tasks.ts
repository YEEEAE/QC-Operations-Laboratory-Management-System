import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { toActionError } from '../shared/errors/action-error.js';
import { AppError } from '../shared/errors/app-error.js';
import { tasksActionDependencies } from '../modules/tasks/application/dependencies.js';
const repo = () => tasksActionDependencies();
type ActionContext = { locals: App.Locals };
const requestId = (context: ActionContext) => context.locals.requestContext?.requestId ?? 'unknown';
const actor = (context: ActionContext) => {
  if (!context.locals.actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
  return context.locals.actor;
};
const run = async <T>(work: () => Promise<T>, context: ActionContext): Promise<T> => {
  try {
    return await work();
  } catch (error) {
    const mapped = toActionError(error, requestId(context));
    throw new ActionError({ code: 'BAD_REQUEST', message: mapped.error.messageKey });
  }
};
const createTask = defineAction({
  accept: 'json',
  input: z.object({
    taskNo: z.string(),
    title: z.string(),
    description: z.string().optional(),
    priority: z.string(),
    dueAt: z.coerce.date().optional(),
    currentAssigneeId: z.string().uuid().optional(),
  }),
  handler: (input, context) =>
    run(
      () =>
        repo().create.execute({
          ...input,
          actor: actor(context),
          requestId: requestId(context),
        }),
      context,
    ),
});
const updateDraft = defineAction({
  accept: 'json',
  input: z.object({
    taskId: z.string().uuid(),
    expectedVersion: z.coerce.bigint(),
    title: z.string(),
    description: z.string().optional(),
    priority: z.string(),
    dueAt: z.coerce.date().optional(),
  }),
  handler: (input, context) =>
    run(
      () =>
        repo().updateDraft.execute({
          ...input,
          actor: actor(context),
          requestId: requestId(context),
        }),
      context,
    ),
});
const transition = defineAction({
  accept: 'json',
  input: z.object({
    taskId: z.string().uuid(),
    expectedVersion: z.coerce.bigint(),
    action: z.enum(['ACTIVATE', 'START', 'HOLD', 'RESUME', 'COMPLETE', 'CANCEL', 'REOPEN']),
    reason: z.string().optional(),
  }),
  handler: (input, context) =>
    run(
      () =>
        repo().transition.execute({
          ...input,
          actor: actor(context),
          requestId: requestId(context),
        }),
      context,
    ),
});
export const tasks = { createTask, updateDraft, transition };
