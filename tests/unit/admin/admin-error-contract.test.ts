import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ActionError } from 'astro:actions';
import { server } from '../../../src/actions/index.js';
import { astroActionCodeFor } from '../../../src/shared/errors/action-error-code.js';
import type { ErrorCode } from '../../../src/shared/errors/error-codes.js';
import {
  appErrorCodeOf,
  classifyActionResult,
} from '../../../src/ui/forms/mutation-interaction.js';
import {
  STALE_VERSION_MESSAGE,
  adminFailureMessage,
  isStaleVersionState,
} from '../../../src/ui/forms/admin-mutation-copy.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { resetServerEnvForTests } from '../../../src/config/env.js';
import { resetPoolForTests } from '../../../src/shared/database/pool.js';
import { destroyDatabase } from '../../../src/shared/database/database.js';

const context = { operation: 'Remove role', subject: 'verify-user — Verify User' };

function actionContext(actor: ActorContext | undefined) {
  const apiContext = {
    locals: { actor, requestContext: { requestId: 'admin-unit-test' } },
    cookies: { get: () => undefined, set: () => undefined },
  };
  Reflect.set(apiContext, Symbol.for('astro.actionAPIContext'), true);
  return apiContext;
}

describe('admin action error contract', () => {
  it.each([
    ['AUTH_REQUIRED', 'UNAUTHORIZED'],
    ['AUTHZ_DENIED', 'FORBIDDEN'],
    ['AUTHZ_SOD_VIOLATION', 'FORBIDDEN'],
    ['VALIDATION_FAILED', 'BAD_REQUEST'],
    ['RESOURCE_NOT_FOUND', 'NOT_FOUND'],
    ['RESOURCE_ALREADY_EXISTS', 'CONFLICT'],
    ['CONFLICT_STALE_VERSION', 'CONFLICT'],
    ['CONFLICT_DUPLICATE_COMMAND', 'CONFLICT'],
    ['SYSTEM_DATABASE_UNAVAILABLE', 'INTERNAL_SERVER_ERROR'],
  ] as ReadonlyArray<readonly [ErrorCode, string]>)(
    'projects %s onto the Astro %s action code',
    (code, expected) => {
      expect(astroActionCodeFor(code)).toBe(expected);
    },
  );

  it('classifies every canonical error code deterministically', () => {
    const cases: ReadonlyArray<readonly [ErrorCode, string]> = [
      ['AUTH_REQUIRED', 'AUTHORIZATION_CHANGED'],
      ['AUTHZ_DENIED', 'AUTHORIZATION_CHANGED'],
      ['AUTHZ_SOD_VIOLATION', 'AUTHORIZATION_CHANGED'],
      ['AUTHZ_PERMISSION_MISSING', 'AUTHORIZATION_CHANGED'],
      ['VALIDATION_FAILED', 'VALIDATION_ERROR'],
      ['CONFLICT_STALE_VERSION', 'CONFLICT_STALE'],
      ['CONFLICT_DUPLICATE_COMMAND', 'DUPLICATE_COMMAND'],
      ['RESOURCE_ALREADY_EXISTS', 'DUPLICATE_COMMAND'],
      ['RESOURCE_NOT_FOUND', 'DEPENDENCY_UNAVAILABLE'],
      ['SYSTEM_DATABASE_UNAVAILABLE', 'DEPENDENCY_UNAVAILABLE'],
      ['SYSTEM_INTERNAL', 'UNKNOWN_SAFE_ERROR'],
    ];
    for (const [code, state] of cases) {
      expect(classifyActionResult({ error: { code: 'BAD_REQUEST', message: code } }).state).toBe(
        state,
      );
    }
  });

  it('still classifies the default message-key form of an application error', () => {
    expect(
      classifyActionResult({ error: { message: 'errors.conflict_stale_version' } }).state,
    ).toBe('CONFLICT_STALE');
    expect(appErrorCodeOf({ message: 'errors.conflict_stale_version' })).toBe(
      'CONFLICT_STALE_VERSION',
    );
    expect(appErrorCodeOf({ message: 'CONFLICT_STALE_VERSION' })).toBe('CONFLICT_STALE_VERSION');
    expect(appErrorCodeOf({ message: 'weird' })).toBeUndefined();
  });

  it('treats a successful payload as success', () => {
    expect(classifyActionResult({ data: { ok: true } }).state).toBe('SUCCESS');
    expect(classifyActionResult({ data: { id: 'user-1' } })).toMatchObject({
      state: 'SUCCESS',
      recordId: 'user-1',
    });
  });
});

describe('admin failure copy', () => {
  it('gives the stale record its own explicit message and refresh path', () => {
    const message = adminFailureMessage('CONFLICT_STALE', context);
    expect(message).toBe(STALE_VERSION_MESSAGE);
    expect(message).toMatch(/changed after you opened it/i);
    expect(message).toMatch(/refresh the latest data/i);
    expect(message).toMatch(/Nothing was resubmitted/i);
    expect(isStaleVersionState('CONFLICT_STALE')).toBe(true);
    expect(isStaleVersionState('AUTHORIZATION_CHANGED')).toBe(false);
  });

  it('names the operation for every distinguishable failure state', () => {
    for (const state of [
      'DUPLICATE_COMMAND',
      'AUTHORIZATION_CHANGED',
      'VALIDATION_ERROR',
      'DEPENDENCY_UNAVAILABLE',
      'UNKNOWN_SAFE_ERROR',
    ] as const) {
      const message = adminFailureMessage(state, context);
      expect(message).toContain('Remove role');
      expect(message).toContain('verify-user');
    }
    expect(adminFailureMessage('AUTHORIZATION_CHANGED', context)).not.toBe(
      adminFailureMessage('VALIDATION_ERROR', context),
    );
  });

  it('never leaks an authorization message for a stale conflict', () => {
    const stale = adminFailureMessage('CONFLICT_STALE', context);
    expect(stale).not.toMatch(/authoriz|denied|permission/i);
  });
});

describe('admin action surface', () => {
  it('exposes the explicit role and scope administration leaves', () => {
    for (const leaf of [
      'listUserRoles',
      'assignUserRole',
      'removeUserRole',
      'assignUserScope',
      'removeUserScope',
      'manageUserScopes',
      'createUser',
      'updateUser',
      'activateUser',
      'disableUser',
      'resetPassword',
      'revokeUserSessions',
    ]) {
      expect(typeof (server.admin as Record<string, unknown>)[leaf], leaf).toBe('function');
    }
  });

  it('rejects an unauthenticated scope grant with UNAUTHORIZED before any work', async () => {
    const context = actionContext(undefined);
    const outcome = await (
      server.admin.assignUserScope as unknown as (input: unknown) => Promise<{
        data?: unknown;
        error?: unknown;
      }>
    ).bind(context)({ userId: '01900000-0000-7000-8000-000000000001', kind: 'GLOBAL' });
    expect(outcome.data).toBeUndefined();
    expect(outcome.error).toBeInstanceOf(ActionError);
    expect((outcome.error as ActionError).code).toBe('UNAUTHORIZED');
    expect((outcome.error as ActionError).message).toBe('AUTH_REQUIRED');
  });

  it('rejects a malformed scope kind through schema validation', async () => {
    const actor: ActorContext = {
      id: '01900000-0000-7000-8000-000000000002',
      loginIdentity: 'verify-owner',
      accountState: 'ACTIVE',
      roles: ['SYSTEM_OWNER'],
      permissions: [{ code: 'PERM-ADM-SCOPE-ASSIGN', scopes: ['GLOBAL'] }],
    };
    const context = actionContext(actor);
    const outcome = await (
      server.admin.assignUserScope as unknown as (input: unknown) => Promise<{
        data?: unknown;
        error?: unknown;
      }>
    ).bind(context)({ userId: '01900000-0000-7000-8000-000000000001', kind: 'TENANT' });
    expect(outcome.data).toBeUndefined();
    expect(outcome.error).toBeDefined();
  });
});

/**
 * Server-side denial at the Action boundary. The connection string is a
 * non-connecting placeholder: node-postgres opens connections lazily, and
 * every case below must reject before any query is issued.
 */
describe('admin action server-side denial', () => {
  let previousDatabaseUrl: string | undefined;

  beforeAll(() => {
    previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL =
      'postgresql://qc:qc@127.0.0.1:5432/qc_admin_contract?sslmode=require';
    resetServerEnvForTests();
    resetPoolForTests();
  });

  afterAll(async () => {
    await destroyDatabase();
    resetPoolForTests();
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
    resetServerEnvForTests();
  });

  it('rejects an authenticated actor without the scope grant with FORBIDDEN', async () => {
    const actor: ActorContext = {
      id: '01900000-0000-7000-8000-000000000002',
      loginIdentity: 'verify-admin',
      accountState: 'ACTIVE',
      roles: ['ADMIN'],
      permissions: [{ code: 'PERM-IDN-MANAGE-USERS', scopes: ['GLOBAL'] }],
    };
    const context = actionContext(actor);
    const outcome = await (
      server.admin.removeUserScope as unknown as (input: unknown) => Promise<{
        data?: unknown;
        error?: unknown;
      }>
    ).bind(context)({
      userId: '01900000-0000-7000-8000-000000000001',
      kind: 'GLOBAL',
    });
    expect(outcome.data).toBeUndefined();
    expect((outcome.error as ActionError).code).toBe('FORBIDDEN');
    expect((outcome.error as ActionError).message).toBe('AUTHZ_PERMISSION_MISSING');
  });

  it('rejects an unauthorized role removal with the same distinguishable code', async () => {
    const actor: ActorContext = {
      id: '01900000-0000-7000-8000-000000000003',
      loginIdentity: 'verify-supervisor',
      accountState: 'ACTIVE',
      roles: ['SUPERVISOR'],
      permissions: [{ code: 'PERM-ADM-ROLE-VIEW', scopes: ['GLOBAL'] }],
    };
    const context = actionContext(actor);
    const outcome = await (
      server.admin.removeUserRole as unknown as (input: unknown) => Promise<{
        data?: unknown;
        error?: unknown;
      }>
    ).bind(context)({
      userId: '01900000-0000-7000-8000-000000000001',
      roleId: '01900000-0000-7000-8000-000000000004',
    });
    expect(outcome.data).toBeUndefined();
    expect((outcome.error as ActionError).code).toBe('FORBIDDEN');
    expect((outcome.error as ActionError).message).toBe('AUTHZ_PERMISSION_MISSING');
  });
});
