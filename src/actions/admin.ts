import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { isPermissionCode } from '../shared/authorization/permissions.js';
import { SCOPE_KINDS } from '../shared/authorization/types.js';
import { toActionError } from '../shared/errors/action-error.js';
import { astroActionCodeFor } from '../shared/errors/action-error-code.js';
import { AppError } from '../shared/errors/app-error.js';
import { administrationDependencies } from '../modules/administration/application/dependencies.js';
import { identityAdminActionDependencies } from '../modules/identity/application/admin-dependencies.js';

const repo = () => administrationDependencies();
const identity = () => identityAdminActionDependencies();
/**
 * Administrative contract: every failure is re-encoded on the Astro Action
 * boundary with a distinguishable code plus the exact application error code
 * as the message. No stack trace, SQL text, or secret crosses this boundary,
 * and the UI can react to the specific cause (stale record, authorization
 * change, duplicate, missing dependency) instead of one generic message.
 */
const withErrors = async <T>(work: () => Promise<T>, requestId?: string): Promise<T> => {
  try {
    return await work();
  } catch (error) {
    const mapped = toActionError(error, requestId);
    throw new ActionError({
      code: astroActionCodeFor(mapped.error.code),
      message: mapped.error.code,
    });
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
    scopeAssignments: z.array(z.object({ kind: z.enum(SCOPE_KINDS), value: z.string().max(200).optional() })).max(100),
    expectedVersion: z.coerce.bigint(),
    idempotencyKey: z.string().uuid(),
    reason: z.string().min(8).max(500),
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
        scopeAssignments: input.scopeAssignments,
        expectedVersion: input.expectedVersion,
        idempotencyKey: input.idempotencyKey,
        reason: input.reason,
        requestId: context.locals.requestContext?.requestId ?? 'unknown',
      });
    }, context.locals.requestContext?.requestId),
});
const scopeShape = z.object({
  kind: z.enum(SCOPE_KINDS),
  value: z.string().max(200).optional(),
});
const manageUserScopes = defineAction({
  accept: 'json',
  input: z.object({
    userId: z.string(),
    scopes: z.array(scopeShape),
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
const assignUserScope = defineAction({
  accept: 'json',
  input: z.object({
    userId: z.string().uuid(),
    kind: z.enum(SCOPE_KINDS),
    value: z.string().max(200).optional(),
    reason: z.string().max(500).optional(),
  }),
  handler: (input, context) =>
    withErrors(async () => {
      requireActor(context.locals.actor);
      return repo().assignUserScope.execute({
        actor: context.locals.actor!,
        ...input,
        requestId: context.locals.requestContext?.requestId ?? 'unknown',
      });
    }, context.locals.requestContext?.requestId),
});
const removeUserScope = defineAction({
  accept: 'json',
  input: z.object({
    userId: z.string().uuid(),
    kind: z.enum(SCOPE_KINDS),
    value: z.string().max(200).optional(),
    reason: z.string().max(500).optional(),
  }),
  handler: (input, context) =>
    withErrors(async () => {
      requireActor(context.locals.actor);
      await repo().removeUserScope.execute({
        actor: context.locals.actor!,
        ...input,
        requestId: context.locals.requestContext?.requestId ?? 'unknown',
      });
      return { ok: true };
    }, context.locals.requestContext?.requestId),
});
const listUserRoles = defineAction({
  accept: 'json',
  input: z.object({ userId: z.string().uuid() }),
  handler: (input, context) =>
    withErrors(async () => {
      requireActor(context.locals.actor);
      return repo().listUserRoles.execute({ actor: context.locals.actor!, userId: input.userId });
    }, context.locals.requestContext?.requestId),
});
const assignUserRole = defineAction({
  accept: 'json',
  input: z.object({
    userId: z.string().uuid(),
    roleId: z.string().uuid(),
    reason: z.string().optional(),
  }),
  handler: (input, context) =>
    withErrors(async () => {
      requireActor(context.locals.actor);
      await repo().manageUserRole.assign({
        actor: context.locals.actor!,
        ...input,
        requestId: context.locals.requestContext?.requestId ?? 'unknown',
      });
      return { ok: true };
    }, context.locals.requestContext?.requestId),
});
const removeUserRole = defineAction({
  accept: 'json',
  input: z.object({
    userId: z.string().uuid(),
    roleId: z.string().uuid(),
    reason: z.string().optional(),
  }),
  handler: (input, context) =>
    withErrors(async () => {
      requireActor(context.locals.actor);
      await repo().manageUserRole.remove({
        actor: context.locals.actor!,
        ...input,
        requestId: context.locals.requestContext?.requestId ?? 'unknown',
      });
      return { ok: true };
    }, context.locals.requestContext?.requestId),
});
export const admin = {
  listRoles,
  getRole,
  listPermissions,
  updateRolePermissions,
  manageUserScopes,
  assignUserScope,
  removeUserScope,
  listUserRoles,
  assignUserRole,
  removeUserRole,
  createUser: defineAction({
    accept: 'json',
    input: z.object({
      loginIdentity: z.string().min(1).max(200),
      displayName: z.string().min(1).max(200),
      email: z.string().email().max(320).optional(),
      temporaryPassword: z.string().min(1).max(512),
      roleCodes: z.array(z.string().min(1)).optional(),
      scopes: z.array(scopeShape).optional(),
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
  linkExternalIdentity: defineAction({
    accept: 'form',
    input: z.object({
      userId: z.string().uuid(),
      subject: z.string().trim().min(1).max(512),
      currentPassword: z.string().min(1).max(512),
      note: z.string().trim().min(8).max(500),
    }),
    handler: (input, context) =>
      withErrors(async () => {
        requireActor(context.locals.actor);
        await identity().linkExternalIdentity.execute({
          actor: context.locals.actor!,
          ...input,
          requestId: context.locals.requestContext?.requestId ?? 'unknown',
        });
        return { ok: true };
      }, context.locals.requestContext?.requestId),
  }),
  deactivateExternalIdentity: defineAction({
    accept: 'form',
    input: z.object({
      linkId: z.string().uuid(),
      currentPassword: z.string().min(1).max(512),
      reason: z.enum(['REVOKED', 'MERGED', 'DUPLICATE_IDENTITY', 'OPERATOR_REMOVAL']),
      note: z.string().trim().min(8).max(500),
    }),
    handler: (input, context) =>
      withErrors(async () => {
        requireActor(context.locals.actor);
        await identity().deactivateExternalIdentity.execute({
          actor: context.locals.actor!,
          ...input,
          requestId: context.locals.requestContext?.requestId ?? 'unknown',
        });
        return { ok: true };
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
  activateUser: defineAction({
    accept: 'json',
    input: z.object({ userId: z.string().uuid(), expectedVersion: z.coerce.bigint() }),
    handler: (input, context) =>
      withErrors(async () => {
        requireActor(context.locals.actor);
        await identity().activateUser.execute({
          actor: context.locals.actor!,
          ...input,
          requestId: context.locals.requestContext?.requestId ?? 'unknown',
        });
        return { ok: true };
      }, context.locals.requestContext?.requestId),
  }),
  revokeUserSessions: defineAction({
    accept: 'json',
    input: z.object({ userId: z.string().uuid(), reason: z.string().optional() }),
    handler: (input, context) =>
      withErrors(async () => {
        requireActor(context.locals.actor);
        await identity().revokeUserSessions.execute({
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
  previewMasterDataRevision: defineAction({
    accept: 'json',
    input: z.object({ datasetKey: z.string(), source: z.string().max(2_000_000), mapping: z.record(z.string(), z.string()) }).strict(),
    handler: (input, context) => withErrors(async () => {
      requireActor(context.locals.actor);
      return repo().previewMasterDataRevision.execute(input);
    }, context.locals.requestContext?.requestId),
  }),
  submitMasterDataRevision: defineAction({
    accept: 'json',
    input: z.object({
      datasetKey: z.string(), source: z.string().max(2_000_000), mapping: z.record(z.string(), z.string()),
      sourceOwner: z.string().min(1).max(200), sourceReference: z.string().min(1).max(500),
      sourceFileReference: z.string().trim().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/), requestId: z.string().uuid(),
    }).strict(),
    handler: (input, context) => withErrors(async () => {
      requireActor(context.locals.actor);
      return repo().submitMasterDataRevision.execute({
        ...input, actor: context.locals.actor!, requestId: context.locals.requestContext?.requestId ?? 'unknown',
      });
    }, context.locals.requestContext?.requestId),
  }),
  approveMasterDataRevision: defineAction({
    accept: 'json',
    input: z.object({
      revisionId: z.string().uuid(), expectedVersion: z.number().int().positive(),
      effectiveRevision: z.string().min(1).max(100), sourceApprovalReference: z.string().min(1).max(500),
      sourceLastUpdated: z.string().date(), reason: z.string().min(1).max(500), requestId: z.string().uuid(),
    }).strict(),
    handler: (input, context) => withErrors(async () => {
      requireActor(context.locals.actor);
      return repo().approveMasterDataRevision.execute({
        ...input, actor: context.locals.actor!, requestId: context.locals.requestContext?.requestId ?? 'unknown',
      });
    }, context.locals.requestContext?.requestId),
  }),
};
