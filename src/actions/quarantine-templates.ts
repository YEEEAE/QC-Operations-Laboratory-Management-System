import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { AppError } from '../shared/errors/app-error.js';
import { templateActionDependencies } from '../modules/quarantine/templates/application/dependencies.js';

const requireActor = (context: { locals: App.Locals }) => {
  if (!context.locals.actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
  return context.locals.actor;
};
const requestId = (context: { locals: App.Locals }) =>
  context.locals.requestContext?.requestId ?? 'unknown';

const run = async <T>(work: () => Promise<T>) => {
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
      message: appError.userSafe ? appError.message : 'Unable to complete the controlled action.',
    });
  }
};

const templateFields = z.object({
  templateCode: z.string().trim().min(1).max(64),
  versionNo: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  contentHash: z.string().trim().max(256).optional(),
  sourceDocument: z.string().trim().max(256).optional(),
  reauthenticationSecret: z.string().optional(),
});
const idVersion = z.object({ id: z.string().uuid(), expectedVersion: z.coerce.bigint() });

const createTemplate = defineAction({
  accept: 'json',
  input: templateFields,
  handler: (input, context) =>
    run(() =>
      templateActionDependencies().create.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});

const reviewTemplate = defineAction({
  accept: 'json',
  input: idVersion,
  handler: (input, context) =>
    run(() =>
      templateActionDependencies().review.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});

const approveTemplate = defineAction({
  accept: 'json',
  input: idVersion.extend({ reauthenticationSecret: z.string().min(1) }),
  handler: (input, context) =>
    run(() =>
      templateActionDependencies().approve.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});

const stopTemplate = defineAction({
  accept: 'json',
  input: idVersion.extend({
    reason: z.string().trim().min(1).max(2000),
    reauthenticationSecret: z.string().min(1),
  }),
  handler: (input, context) =>
    run(() =>
      templateActionDependencies().stop.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});

const voidTemplate = defineAction({
  accept: 'json',
  input: idVersion.extend({
    reason: z.string().trim().min(1).max(2000),
    reauthenticationSecret: z.string().min(1),
  }),
  handler: (input, context) =>
    run(() =>
      templateActionDependencies().void.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});

const supersedeTemplate = defineAction({
  accept: 'json',
  input: idVersion.extend({
    reason: z.string().trim().min(1).max(2000),
    reauthenticationSecret: z.string().min(1),
  }),
  handler: (input, context) =>
    run(() =>
      templateActionDependencies().supersede.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});

const reviseTemplate = defineAction({
  accept: 'json',
  input: idVersion.extend({
    versionNo: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional(),
    contentHash: z.string().trim().max(256).optional(),
    sourceDocument: z.string().trim().max(256).optional(),
  }),
  handler: (input, context) =>
    run(() =>
      templateActionDependencies().revise.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});

export const quarantineTemplates = {
  createTemplate,
  reviewTemplate,
  approveTemplate,
  stopTemplate,
  voidTemplate,
  supersedeTemplate,
  reviseTemplate,
};
