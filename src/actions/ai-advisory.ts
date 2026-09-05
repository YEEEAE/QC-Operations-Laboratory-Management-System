import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { DisabledAiProvider } from '../modules/ai-advisory/infrastructure/disabled-ai-provider.js';
import { GetAdvisoryUseCase } from '../modules/ai-advisory/application/get-advisory.js';
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
        : 'Unable to process the advisory request.',
    });
  }
};

/**
 * Advisory-only AI action. Delivery passes an authenticated actor and the
 * bounded request into the application use case, which re-authorizes
 * server-side, refuses secret-like material, degrades safely when no
 * provider is configured, and rejects any provider output that attempts
 * authoritative encoding. The response is a plain advisory view: it can
 * never carry approval, release, signature, PASS/FAIL, or permission
 * fields, and no prompt/response content is logged here.
 */
const requestAdvisory = defineAction({
  accept: 'json',
  input: z.object({
    mode: z.enum(['SUMMARIZE', 'SUGGEST', 'DRAFT']),
    question: z.string().trim().min(1).max(4000),
    context: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(120),
          content: z.string().trim().min(1).max(4000),
        }),
      )
      .max(10)
      .optional(),
  }),
  handler: (input, context) =>
    run(async () => {
      const useCase = new GetAdvisoryUseCase(new DisabledAiProvider());
      const result = await useCase.execute({
        actor: requireActor(context),
        mode: input.mode,
        question: input.question,
        context: input.context ?? [],
        requestId: requestId(context),
      });
      return {
        status: result.status,
        message: result.message,
        advisoryNotice: result.advisoryNotice,
        ...(result.advisory ? { advisory: result.advisory } : {}),
      };
    }),
});

export const aiAdvisory = { requestAdvisory };
