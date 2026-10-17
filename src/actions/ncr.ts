import { defineAction, ActionError, ActionInputError } from 'astro:actions';
import { z } from 'astro:schema';
import { createNcrInput } from '../modules/quality/ncr/domain/create-input.js';
import { ncrActionDependencies } from '../modules/quality/ncr/application/dependencies.js';
import { AppError } from '../shared/errors/app-error.js';
import { toActionError } from '../shared/errors/action-error.js';

type ActionContext = { locals: App.Locals };
const requestId = (context: ActionContext) => context.locals.requestContext?.requestId ?? 'unknown';

function actor(context: ActionContext) {
  if (!context.locals.actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
  return context.locals.actor;
}

function toAstroError(error: unknown, context: ActionContext): never {
  const mapped = toActionError(error, requestId(context));
  if (mapped.error.fieldErrors) {
    const issues: z.ZodIssue[] = Object.entries(mapped.error.fieldErrors).flatMap(
      ([fieldName, messages]) =>
        messages.map((message) => ({
          code: 'custom' as const,
          message,
          path: fieldName.split('.'),
        })),
    );
    throw new ActionInputError(issues);
  }
  if (mapped.error.code === 'AUTH_REQUIRED')
    throw new ActionError({ code: 'UNAUTHORIZED', message: mapped.error.messageKey });
  if (
    mapped.error.code === 'AUTHZ_DENIED' ||
    mapped.error.code === 'AUTHZ_PERMISSION_MISSING' ||
    mapped.error.code === 'AUTHZ_SCOPE_DENIED' ||
    mapped.error.code === 'AUTHZ_SOD_VIOLATION'
  )
    throw new ActionError({ code: 'FORBIDDEN', message: mapped.error.messageKey });
  if (mapped.error.code === 'RESOURCE_NOT_FOUND')
    throw new ActionError({ code: 'NOT_FOUND', message: mapped.error.messageKey });
  if (mapped.error.code.startsWith('CONFLICT_'))
    throw new ActionError({ code: 'CONFLICT', message: mapped.error.messageKey });
  if (mapped.error.code === 'SYSTEM_DATABASE_UNAVAILABLE')
    throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: mapped.error.messageKey });
  throw new ActionError({ code: 'BAD_REQUEST', message: mapped.error.messageKey });
}

export const ncr = {
  create: defineAction({
    accept: 'json',
    input: z.unknown().transform((raw, ctx) => {
      const parsed = createNcrInput.safeParse(raw);
      if (!parsed.success) {
        for (const issue of parsed.error.issues)
          ctx.addIssue({
            code: 'custom',
            path: issue.path as (string | number)[],
            message: 'Check this field.',
          });
        return z.NEVER;
      }
      return parsed.data;
    }),
    handler: async (input, context) => {
      try {
        const record = await ncrActionDependencies().create.execute({
          ...input,
          actor: actor(context),
          requestId: requestId(context),
        });
        return { id: record.id };
      } catch (error) {
        return toAstroError(error, context);
      }
    },
  }),
};
