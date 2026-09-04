import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { isPermissionCode } from '../shared/authorization/permissions.js';
import { toActionError } from '../shared/errors/action-error.js';
import { AppError } from '../shared/errors/app-error.js';
import { getDatabase } from '../shared/database/database.js';
import { PostgresAuthorizationRepository } from '../modules/administration/infrastructure/postgres-authorization-repository.js';
import { PostgresAuditRepository } from '../shared/audit/postgres-audit-repository.js';
import { ListRolesUseCase } from '../modules/administration/application/list-roles.js';
import { GetRoleUseCase } from '../modules/administration/application/get-role.js';
import { ListPermissionsUseCase } from '../modules/administration/application/list-permissions.js';
import { UpdateRolePermissionsUseCase } from '../modules/administration/application/update-role-permissions.js';
import { ManageUserScopesUseCase } from '../modules/administration/application/manage-user-scopes.js';

const repo = () => { const database = getDatabase(); return new PostgresAuthorizationRepository(database, new PostgresAuditRepository(database)); };
const withErrors = async <T>(work: () => Promise<T>, requestId?: string): Promise<T> => { try { return await work(); } catch (error) { const mapped = toActionError(error, requestId); throw new ActionError('BAD_REQUEST', mapped.error.messageKey); } };
const requireActor = (actor: unknown) => { if (!actor) throw new AppError('AUTH_REQUIRED', { userSafe: true }); };

const listRoles = defineAction({ accept: 'json', handler: (_input, context) => withErrors(async () => { requireActor(context.locals.actor); return new ListRolesUseCase(repo()).execute({ actor: context.locals.actor! }); }, context.locals.requestContext?.requestId) });
const getRole = defineAction({ accept: 'json', input: z.object({ roleId: z.string() }), handler: (input, context) => withErrors(async () => { requireActor(context.locals.actor); return new GetRoleUseCase(repo()).execute({ actor: context.locals.actor!, roleId: input.roleId }); }, context.locals.requestContext?.requestId) });
const listPermissions = defineAction({ accept: 'json', handler: (_input, context) => withErrors(async () => { requireActor(context.locals.actor); return new ListPermissionsUseCase(repo()).execute({ actor: context.locals.actor! }); }, context.locals.requestContext?.requestId) });
const updateRolePermissions = defineAction({ accept: 'json', input: z.object({ roleId: z.string(), permissionCodes: z.array(z.string()), expectedVersion: z.coerce.bigint() }), handler: (input, context) => withErrors(async () => { requireActor(context.locals.actor); if (input.permissionCodes.some((code) => !isPermissionCode(code))) throw new AppError('VALIDATION_FAILED', { userSafe: true }); return new UpdateRolePermissionsUseCase(repo()).execute({ actor: context.locals.actor!, roleId: input.roleId, permissionCodes: input.permissionCodes as never, expectedVersion: input.expectedVersion, requestId: context.locals.requestContext?.requestId ?? 'unknown' }); }, context.locals.requestContext?.requestId) });
const manageUserScopes = defineAction({ accept: 'json', input: z.object({ userId: z.string(), scopes: z.array(z.object({ kind: z.enum(['OWN', 'ASSIGNED', 'TEAM', 'DEPARTMENT', 'SITE', 'DOMAIN', 'GLOBAL']), value: z.string().optional() })), reason: z.string().optional() }), handler: (input, context) => withErrors(async () => { requireActor(context.locals.actor); return new ManageUserScopesUseCase(repo()).execute({ actor: context.locals.actor!, userId: input.userId, scopes: input.scopes, reason: input.reason, requestId: context.locals.requestContext?.requestId ?? 'unknown' }); }, context.locals.requestContext?.requestId) });
export const admin = { listRoles, getRole, listPermissions, updateRolePermissions, manageUserScopes };
