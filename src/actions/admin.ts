import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { isPermissionCode } from '../shared/authorization/permissions.js';
import { toActionError } from '../shared/errors/action-error.js';
import { AppError } from '../shared/errors/app-error.js';
import { administrationDependencies } from '../modules/administration/application/dependencies.js';
import { identityAdminActionDependencies } from '../modules/identity/application/admin-dependencies.js';

const repo = () => administrationDependencies();
const identity = () => identityAdminActionDependencies();
const withErrors = async <T>(work: () => Promise<T>, requestId?: string): Promise<T> => {
  try {
    return await work();
  } catch (error) {
    const mapped = toActionError(error, requestId);
    throw new ActionError({ code: 'BAD_REQUEST', message: mapped.error.messageKey });
  }
};
const requireActor = (actor: unknown) => {
  if (!actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
};

const listRoles = defineAction({
  accept: 'json',
  handler: (_input, context) =>
    withErrors(async () => {
      requireActor(context.locals.actor);
      return repo().listRoles.execute({ actor: context.locals.actor! });
    }, context.locals.requestContext?.requestId),
});
const getRole = defineAction({
  accept: 'json',
  input: z.object({ roleId: z.string() }),
  handler: (input, context) =>
    withErrors(async () => {
      requireActor(context.locals.actor);
      return repo().getRole.execute({
        actor: context.locals.actor!,
        roleId: input.roleId,
      });
    }, context.locals.requestContext?.requestId),
});
const listPermissions = defineAction({
  accept: 'json',
  handler: (_input, context) =>
    withErrors(async () => {
      requireActor(context.locals.actor);
      return repo().listPermissions.execute({ actor: context.locals.actor! });
    }, context.locals.requestContext?.requestId),
});
const updateRolePermissions = defineAction({
  accept: 'json',
  input: z.object({
    roleId: z.string(),
    permissionCodes: z.array(z.string()),
    expectedVersion: z.coerce.bigint(),
  }),
  handler: (input, context) =>
    withErrors(async () => {
      requireActor(context.locals.actor);
      if (input.permissionCodes.some((code) => !isPermissionCode(code)))
        throw new AppError('VALIDATION_FAILED', { userSafe: true });
      return repo().updateRolePermissions.execute({
        actor: context.locals.actor!,
        roleId: input.roleId,
        permissionCodes: input.permissionCodes as never,
        expectedVersion: input.expectedVersion,
        requestId: context.locals.requestContext?.requestId ?? 'unknown',
      });
    }, context.locals.requestContext?.requestId),
});
const manageUserScopes = defineAction({
  accept: 'json',
  input: z.object({
    userId: z.string(),
    scopes: z.array(
      z.object({
        kind: z.enum(['OWN', 'ASSIGNED', 'TEAM', 'DEPARTMENT', 'SITE', 'DOMAIN', 'GLOBAL']),
        value: z.string().optional(),
      }),
    ),
    reason: z.string().optional(),
  }),
  handler: (input, context) =>
    withErrors(async () => {
      requireActor(context.locals.actor);
      return repo().manageUserScopes.execute({
        actor: context.locals.actor!,
        userId: input.userId,
        scopes: input.scopes,
        reason: input.reason,
        requestId: context.locals.requestContext?.requestId ?? 'unknown',
      });
    }, context.locals.requestContext?.requestId),
});
export const admin = {
  listRoles,
  getRole,
  listPermissions,
  updateRolePermissions,
  manageUserScopes,
  createUser: defineAction({
    accept: 'json',
    input: z.object({
      loginIdentity: z.string().min(1).max(200),
      displayName: z.string().min(1).max(200),
      email: z.string().email().max(320).optional(),
      temporaryPassword: z.string().min(1).max(512),
    }),
    handler: (input, context) =>
      withErrors(async () => {
        requireActor(context.locals.actor);
        return identity().createUser.execute({
          actor: context.locals.actor!,
          ...input,
          requestId: context.locals.requestContext?.requestId ?? 'unknown',
        });
      }, context.locals.requestContext?.requestId),
  }),
  updateUser: defineAction({
    accept: 'json',
    input: z.object({
      userId: z.string().uuid(),
      displayName: z.string().min(1).max(200),
      email: z.string().email().max(320).optional(),
      expectedVersion: z.coerce.bigint(),
    }),
    handler: (input, context) =>
      withErrors(async () => {
        requireActor(context.locals.actor);
        const { toSafeUserView } =
          await import('../modules/identity/application/safe-user-view.js');
        const updated = await identity().updateUser.execute({
          actor: context.locals.actor!,
          ...input,
          requestId: context.locals.requestContext?.requestId ?? 'unknown',
        });
        return toSafeUserView(updated);
      }, context.locals.requestContext?.requestId),
  }),
  disableUser: defineAction({
    accept: 'json',
    input: z.object({ userId: z.string().uuid(), expectedVersion: z.coerce.bigint() }),
    handler: (input, context) =>
      withErrors(async () => {
        requireActor(context.locals.actor);
        await identity().disableUser.execute({
          actor: context.locals.actor!,
          ...input,
          requestId: context.locals.requestContext?.requestId ?? 'unknown',
        });
        return { ok: true };
      }, context.locals.requestContext?.requestId),
  }),
  resetPassword: defineAction({
    accept: 'json',
    input: z.object({
      userId: z.string().uuid(),
      temporaryPassword: z.string().min(1).max(512),
      expectedVersion: z.coerce.bigint(),
    }),
    handler: (input, context) =>
      withErrors(async () => {
        requireActor(context.locals.actor);
        await identity().resetPassword.execute({
          actor: context.locals.actor!,
          ...input,
          requestId: context.locals.requestContext?.requestId ?? 'unknown',
        });
        return { ok: true };
      }, context.locals.requestContext?.requestId),
  }),
};
