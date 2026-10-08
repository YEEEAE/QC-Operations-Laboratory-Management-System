import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { rcaActionDependencies } from '../modules/quality/rca/application/dependencies.js';
const version = z.coerce.bigint().refine((value) => value > 0n);
export const rca = {
  create: defineAction({
    accept: 'json',
    input: z.object({ ncrId: z.string().uuid(), expectedNcrVersion: version }).strict(),
    handler: async (input, context) => {
      if (!context.locals.actor)
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      return rcaActionDependencies().create.execute({
        ...input,
        actor: context.locals.actor,
        requestId: context.locals.requestContext?.requestId ?? 'unknown',
      });
    },
  }),
  update: defineAction({
    accept: 'json',
    input: z
      .object({
        rcaId: z.string().uuid(),
        expectedVersion: version,
        method: z.string().max(200).optional(),
        analysis: z.string().max(50000).optional(),
        rootCause: z.string().max(10000).optional(),
      })
      .strict(),
    handler: async (input, context) => {
      if (!context.locals.actor)
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      return rcaActionDependencies().update.execute({
        ...input,
        actor: context.locals.actor,
        requestId: context.locals.requestContext?.requestId ?? 'unknown',
      });
    },
  }),
  transition: defineAction({
    accept: 'json',
    input: z
      .object({
        id: z.string().uuid(),
        expectedVersion: version,
        action: z.enum(['START', 'SUBMIT', 'RETURN', 'APPROVE', 'VOID']),
        reason: z.string().optional(),
      })
      .strict(),
    handler: async (input, context) => {
      if (!context.locals.actor)
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      return rcaActionDependencies().transition.execute({
        ...input,
        actor: context.locals.actor,
        requestId: context.locals.requestContext?.requestId ?? 'unknown',
      });
    },
  }),
};
