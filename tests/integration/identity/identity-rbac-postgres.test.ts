import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { migrate } from '../../../scripts/db/migrate.js';
import { AssignUserScopeUseCase } from '../../../src/modules/administration/application/assign-user-scope.js';
import { ManageUserRoleUseCase } from '../../../src/modules/administration/application/manage-user-role.js';
import { RemoveUserScopeUseCase } from '../../../src/modules/administration/application/remove-user-scope.js';
import { PostgresAuthorizationRepository } from '../../../src/modules/administration/infrastructure/postgres-authorization-repository.js';
import { ActivateUserUseCase } from '../../../src/modules/identity/application/activate-user.js';
import { AdminResetPasswordUseCase } from '../../../src/modules/identity/application/admin-reset-password.js';
import { DisableUserUseCase } from '../../../src/modules/identity/application/disable-user.js';
import { RevokeUserSessionsUseCase } from '../../../src/modules/identity/application/revoke-user-sessions.js';
import { SessionService } from '../../../src/modules/identity/application/session-service.js';
import { PostgresSessionRepository } from '../../../src/modules/identity/infrastructure/postgres-session-repository.js';
import { PostgresUserRepository } from '../../../src/modules/identity/infrastructure/postgres-user-repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { AuditService } from '../../../src/shared/audit/audit-service.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const ADMIN_ID = '01900000-0000-7000-8000-00000000c001';
const MEMBER_ID = '01900000-0000-7000-8000-00000000c002';
const OWNER_ID = '01900000-0000-7000-8000-00000000c003';

let pool: ReturnType<typeof createPool> | undefined;
// Kysely's `destroy()` ends the pool it was handed, so the query layer gets its
// own pool and ownership of each pool stays unambiguous at teardown.
let readerPool: ReturnType<typeof createPool> | undefined;
let db: Kysely<DatabaseSchema>;

const actor = (permission: ActorContext['permissions'][number]['code']): ActorContext => ({
  id: ADMIN_ID,
  loginIdentity: 'identity-admin',
  accountState: 'ACTIVE',
  roles: ['ADMIN'],
  permissions: [{ code: permission, scopes: ['GLOBAL'] }],
});

beforeAll(async () => {
  const container = await startPostgresContainer();
  const databaseUrl = getTestDatabaseUrl(container);
  pool = createPool({ connectionString: databaseUrl, max: 8 });
  await pool.query('DROP SCHEMA IF EXISTS qc CASCADE');
  await pool
    .query(
      `CREATE SCHEMA IF NOT EXISTS qc;
       CREATE OR REPLACE FUNCTION qc.uuidv7() RETURNS uuid AS $f$
       BEGIN RETURN gen_random_uuid(); END $f$ LANGUAGE plpgsql`,
    )
    .catch(() => undefined);
  await migrate({ pool });
  readerPool = createPool({ connectionString: databaseUrl, max: 8 });
  db = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool: readerPool }) });
  await pool.query(
    `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
     VALUES ($1, 'identity-admin', 'Identity Admin', 'hash:admin'),
            ($2, 'identity-member', 'Identity Member', 'hash:member'),
            ($3, 'yazeed', 'Yazeed', 'hash:owner')`,
    [ADMIN_ID, MEMBER_ID, OWNER_ID],
  );
  await pool.query(
    `INSERT INTO qc.roles (code, name, is_system_role) VALUES
       ('QUALITY_TEST', 'Quality test role', false),
       ('SYSTEM_OWNER', 'System owner', true)`,
  );
});

afterAll(async () => {
  await db?.destroy();
  await readerPool?.end().catch(() => undefined);
  await pool?.end().catch(() => undefined);
  await stopPostgresContainer();
});

describe('identity and RBAC PostgreSQL contracts', () => {
  it('makes role and scope grants idempotent under concurrency, preserves audit, and permits re-grant after revocation', async () => {
    const repository = new PostgresAuthorizationRepository(db, new PostgresAuditRepository(db));
    const roles = new ManageUserRoleUseCase(repository);
    const scopes = new AssignUserScopeUseCase(repository);
    const qualityRole = await db
      .selectFrom('roles')
      .select('id')
      .where('code', '=', 'QUALITY_TEST')
      .executeTakeFirstOrThrow();

    await Promise.all([
      roles.assign({
        actor: actor('PERM-ADM-ROLE-ASSIGN'),
        userId: MEMBER_ID,
        roleId: qualityRole.id,
        requestId: 'rbac-role-concurrent-1',
      }),
      roles.assign({
        actor: actor('PERM-ADM-ROLE-ASSIGN'),
        userId: MEMBER_ID,
        roleId: qualityRole.id,
        requestId: 'rbac-role-concurrent-2',
      }),
    ]);
    const activeRoleRows = await db
      .selectFrom('user_roles')
      .select(({ fn }) => fn.countAll<number>().as('count'))
      .where('user_id', '=', MEMBER_ID)
      .where('role_id', '=', qualityRole.id)
      .where('revoked_at', 'is', null)
      .executeTakeFirstOrThrow();
    expect(Number(activeRoleRows.count)).toBe(1);

    await roles.remove({
      actor: actor('PERM-ADM-ROLE-ASSIGN'),
      userId: MEMBER_ID,
      roleId: qualityRole.id,
      requestId: 'rbac-role-remove',
    });
    await roles.assign({
      actor: actor('PERM-ADM-ROLE-ASSIGN'),
      userId: MEMBER_ID,
      roleId: qualityRole.id,
      requestId: 'rbac-role-regrant',
    });
    expect((await repository.listUserRoles(MEMBER_ID)).map((role) => role.code)).toContain(
      'QUALITY_TEST',
    );

    await Promise.all([
      scopes.execute({
        actor: actor('PERM-ADM-SCOPE-ASSIGN'),
        userId: MEMBER_ID,
        kind: 'SITE',
        value: 'riyadh',
        requestId: 'rbac-scope-concurrent-1',
      }),
      scopes.execute({
        actor: actor('PERM-ADM-SCOPE-ASSIGN'),
        userId: MEMBER_ID,
        kind: 'SITE',
        value: 'riyadh',
        requestId: 'rbac-scope-concurrent-2',
      }),
    ]);
    expect(
      (await repository.listUserScopes(MEMBER_ID)).filter((scope) => scope.kind === 'SITE'),
    ).toHaveLength(1);
    await repository.removeUserScope({
      userId: MEMBER_ID,
      kind: 'SITE',
      value: 'riyadh',
      actorId: ADMIN_ID,
      requestId: 'rbac-scope-remove',
    });
    expect(
      (await repository.listUserScopes(MEMBER_ID)).filter((scope) => scope.kind === 'SITE'),
    ).toHaveLength(0);
  });

  it('protects the named owner SYSTEM_OWNER and GLOBAL grants at the persistence boundary', async () => {
    const repository = new PostgresAuthorizationRepository(db, new PostgresAuditRepository(db));
    const ownerRole = await db
      .selectFrom('roles')
      .select('id')
      .where('code', '=', 'SYSTEM_OWNER')
      .executeTakeFirstOrThrow();

    await expect(
      repository.assignUserRole({
        userId: MEMBER_ID,
        roleId: ownerRole.id,
        actorId: ADMIN_ID,
        requestId: 'owner-wrong-identity',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });

    await repository.assignUserRole({
      userId: OWNER_ID,
      roleId: ownerRole.id,
      actorId: ADMIN_ID,
      requestId: 'owner-canonical-role',
    });
    await repository.assignUserScope({
      userId: OWNER_ID,
      kind: 'GLOBAL',
      actorId: ADMIN_ID,
      requestId: 'owner-canonical-global',
    });
    await expect(
      repository.removeUserRole({
        userId: OWNER_ID,
        roleId: ownerRole.id,
        actorId: ADMIN_ID,
        requestId: 'owner-remove-role',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    await expect(
      new RemoveUserScopeUseCase(repository).execute({
        actor: actor('PERM-ADM-SCOPE-ASSIGN'),
        userId: OWNER_ID,
        kind: 'GLOBAL',
        requestId: 'owner-remove-global',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });

  it('persists disable, activation, reset, and explicit session revocation without accepting stale sessions', async () => {
    const users = new PostgresUserRepository(db);
    const sessions = new SessionService(
      users,
      new PostgresSessionRepository(db),
      undefined,
      60_000,
    );
    const passwords = { hash: async (value: string) => `hash:${value}`, verify: async () => true };
    const audit = new AuditService(new PostgresAuditRepository(db));
    const first = await sessions.createForUser(MEMBER_ID);

    await new DisableUserUseCase(users, sessions, audit).execute({
      actor: actor('PERM-IDN-DEACTIVATE'),
      userId: MEMBER_ID,
      expectedVersion: 1n,
      requestId: 'identity-disable',
    });
    await expect(sessions.resolve(first.token)).rejects.toMatchObject({
      code: 'AUTH_SESSION_REVOKED',
    });

    await new ActivateUserUseCase(users, audit).execute({
      actor: actor('PERM-IDN-ACTIVATE'),
      userId: MEMBER_ID,
      expectedVersion: 2n,
      requestId: 'identity-activate',
    });
    const second = await sessions.createForUser(MEMBER_ID);
    await new AdminResetPasswordUseCase(users, passwords, sessions, audit).execute({
      actor: actor('PERM-IDN-RESET-PASSWORD'),
      userId: MEMBER_ID,
      temporaryPassword: 'temporary-password',
      expectedVersion: 3n,
      requestId: 'identity-reset',
    });
    await expect(sessions.resolve(second.token)).rejects.toMatchObject({
      code: 'AUTH_SESSION_REVOKED',
    });
    expect((await users.findById(MEMBER_ID))?.mustChangePassword).toBe(true);

    const third = await sessions.createForUser(MEMBER_ID);
    await new RevokeUserSessionsUseCase(users, sessions, audit).execute({
      actor: actor('PERM-IDN-REVOKE-SESSIONS'),
      userId: MEMBER_ID,
      requestId: 'identity-explicit-revoke',
    });
    await expect(sessions.resolve(third.token)).rejects.toMatchObject({
      code: 'AUTH_SESSION_REVOKED',
    });
  });

  it('leaves no half-committed grant when the audit write fails inside the transaction', async () => {
    const repository = new PostgresAuthorizationRepository(db, new PostgresAuditRepository(db));
    const role = await pool!.query<{ id: string }>(
      `INSERT INTO qc.roles (code, name, is_system_role)
       VALUES ('ATOMIC_AUDIT_TEST', 'Atomic audit test role', false)
       RETURNING id`,
    );
    const requestId = 'rbac-atomic-audit-failure';

    // The grant and its audit event are written in one transaction. Failing the
    // audit must roll the grant back, not leave an unaudited privilege change.
    await pool!.query(`
      CREATE OR REPLACE FUNCTION qc.test_fail_atomic_role_audit() RETURNS trigger AS $$
      BEGIN
        IF NEW.request_id = 'rbac-atomic-audit-failure' THEN
          RAISE EXCEPTION 'injected audit failure';
        END IF;
        RETURN NEW;
      END $$ LANGUAGE plpgsql;
      CREATE TRIGGER test_fail_atomic_role_audit
        BEFORE INSERT ON qc.audit_events
        FOR EACH ROW EXECUTE FUNCTION qc.test_fail_atomic_role_audit();
    `);

    try {
      await expect(
        repository.assignUserRole({
          userId: MEMBER_ID,
          roleId: role.rows[0].id,
          actorId: ADMIN_ID,
          requestId,
        }),
        // Proves the abort happened at the injected audit step, after the
        // user_roles grant row had already been written in the transaction.
      ).rejects.toThrow(/injected audit failure/);

      const active = await db
        .selectFrom('user_roles')
        .select(({ fn }) => fn.countAll<number>().as('count'))
        .where('user_id', '=', MEMBER_ID)
        .where('role_id', '=', role.rows[0].id)
        .where('revoked_at', 'is', null)
        .executeTakeFirstOrThrow();
      expect(Number(active.count)).toBe(0);

      const audits = await pool!.query<{ count: number }>(
        'SELECT count(*)::int AS count FROM qc.audit_events WHERE request_id = $1',
        [requestId],
      );
      expect(audits.rows[0].count).toBe(0);
    } finally {
      await pool!.query(`
        DROP TRIGGER IF EXISTS test_fail_atomic_role_audit ON qc.audit_events;
        DROP FUNCTION IF EXISTS qc.test_fail_atomic_role_audit();
      `);
    }
  });

  it.each(['OWN', 'ASSIGNED', 'GLOBAL'] as const)(
    'rejects a non-canonical value for %s in PostgreSQL',
    async (kind) => {
      await expect(
        pool!.query(
          `INSERT INTO qc.user_scopes (user_id, scope_kind, scope_value, assigned_by)
         VALUES ($1, $2, 'ignored-value', $3)`,
          [MEMBER_ID, kind, ADMIN_ID],
        ),
      ).rejects.toMatchObject({ code: '23514' });
    },
  );
});
