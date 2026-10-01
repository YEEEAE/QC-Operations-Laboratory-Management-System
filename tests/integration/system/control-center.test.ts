import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadMigrations, migrate } from '../../../scripts/db/migrate.js';
import { PostgresAuthorizationRepository } from '../../../src/modules/administration/infrastructure/postgres-authorization-repository.js';
import { ManageUserRoleUseCase } from '../../../src/modules/administration/application/manage-user-role.js';
import { AssignUserScopeUseCase } from '../../../src/modules/administration/application/assign-user-scope.js';
import { RemoveUserScopeUseCase } from '../../../src/modules/administration/application/remove-user-scope.js';
import { ActivateUserUseCase } from '../../../src/modules/identity/application/activate-user.js';
import { AdminResetPasswordUseCase } from '../../../src/modules/identity/application/admin-reset-password.js';
import { CreateUserUseCase } from '../../../src/modules/identity/application/create-user.js';
import { DisableUserUseCase } from '../../../src/modules/identity/application/disable-user.js';
import { ListUsersUseCase } from '../../../src/modules/identity/application/list-users.js';
import { RevokeUserSessionsUseCase } from '../../../src/modules/identity/application/revoke-user-sessions.js';
import { UpdateUserUseCase } from '../../../src/modules/identity/application/update-user.js';
import { SessionService } from '../../../src/modules/identity/application/session-service.js';
import { PostgresSessionRepository } from '../../../src/modules/identity/infrastructure/postgres-session-repository.js';
import { PostgresUserRepository } from '../../../src/modules/identity/infrastructure/postgres-user-repository.js';
import { PostgresCredentialMutationCommit } from '../../../src/modules/identity/infrastructure/postgres-credential-mutation-commit.js';
import { Argon2idPasswordHasher } from '../../../src/modules/identity/security/argon2-password-hasher.js';
import { GetControlCenterOverviewUseCase } from '../../../src/modules/system-health/application/get-control-center-overview.js';
import { PostgresSystemHealthProbes } from '../../../src/modules/system-health/infrastructure/postgres-health-probes.js';
import {
  createPostgresAuditReadiness,
  createPostgresMigrationStatus,
} from '../../../src/modules/system-health/infrastructure/postgres-migration-status.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { AuditService } from '../../../src/shared/audit/audit-service.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const OWNER_ID = '01900000-0000-7000-8000-00000000d001';
const ADMIN_ID = '01900000-0000-7000-8000-00000000d002';
const MANAGER_ID = '01900000-0000-7000-8000-00000000d003';

let pool: ReturnType<typeof createPool> | undefined;
let readerPool: ReturnType<typeof createPool> | undefined;
let db: Kysely<DatabaseSchema>;

const ownerActor = (): ActorContext => ({
  id: OWNER_ID,
  loginIdentity: 'yazeed',
  accountState: 'ACTIVE',
  roles: ['SYSTEM_OWNER'],
  permissions: [],
});

const adminActor = (code: ActorContext['permissions'][number]['code']): ActorContext => ({
  id: ADMIN_ID,
  loginIdentity: 'cc-admin',
  accountState: 'ACTIVE',
  roles: ['ADMIN'],
  permissions: [{ code, scopes: ['GLOBAL'] }],
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
     VALUES ($1, 'yazeed', 'Yazeed', 'hash:owner'),
            ($2, 'cc-admin', 'Control Center Admin', 'hash:admin'),
            ($3, 'cc-manager', 'Control Center Manager', 'hash:manager')`,
    [OWNER_ID, ADMIN_ID, MANAGER_ID],
  );
  await pool.query(
    `INSERT INTO qc.roles (code, name, is_system_role) VALUES
       ('SYSTEM_OWNER', 'System owner', true),
       ('MANAGER', 'Manager', true),
       ('CC_MEMBER', 'Control center member role', false)`,
  );
  const ownerRole = await pool.query(`SELECT id FROM qc.roles WHERE code = 'SYSTEM_OWNER'`);
  await pool.query(
    `INSERT INTO qc.user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $1)`,
    [OWNER_ID, ownerRole.rows[0].id],
  );
  await pool.query(
    `INSERT INTO qc.user_scopes (user_id, scope_kind, assigned_by) VALUES ($1, 'GLOBAL', $1)`,
    [OWNER_ID],
  );
  const managerRole = await pool.query(`SELECT id FROM qc.roles WHERE code = 'MANAGER'`);
  await pool.query(
    `INSERT INTO qc.user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $1)`,
    [MANAGER_ID, managerRole.rows[0].id],
  );
  await pool.query(
    `INSERT INTO qc.user_scopes (user_id, scope_kind, assigned_by) VALUES ($1, 'GLOBAL', $1)`,
    [MANAGER_ID],
  );
});

afterAll(async () => {
  await db?.destroy();
  await readerPool?.end().catch(() => undefined);
  await pool?.end().catch(() => undefined);
  await stopPostgresContainer();
});

function overview() {
  return new GetControlCenterOverviewUseCase({
    // The database probe receives the suite handle directly: the disposable
    // cluster URL is the connectivity evidence, independent of process env.
    probes: new PostgresSystemHealthProbes(db, async () => {
      try {
        await db.selectFrom('users').select('id').limit(1).execute();
        return true;
      } catch {
        return false;
      }
    }),
    auditReadiness: createPostgresAuditReadiness(db),
    migrationStatus: createPostgresMigrationStatus(db),
    release: { status: 'UNVERIFIED' },
  });
}

describe('owner control center PostgreSQL contracts', () => {
  it('denies the live overview to every non-canonical actor, including a SYSTEM_OWNER role holder', async () => {
    const useCase = overview();
    for (const denied of [
      adminActor('PERM-HLTH-VIEW'),
      { ...adminActor('PERM-HLTH-VIEW'), loginIdentity: 'owner-like', roles: ['SYSTEM_OWNER'] },
      { ...ownerActor(), accountState: 'DISABLED' as const },
    ]) {
      await expect(useCase.execute({ actor: denied })).rejects.toMatchObject({
        code: 'AUTHZ_DENIED',
      });
    }
  });

  it('serves the canonical owner a live sanitized overview with the real migration head', async () => {
    const view = await overview().execute({ actor: ownerActor() });
    expect(view.databaseStatus).toBe('HEALTHY');
    expect(view.auditStatus).toBe('HEALTHY');
    // Derived from the shipped migration files instead of a hard-coded number,
    // so adding a migration cannot silently stale this contract assertion.
    const shippedMigrations = await loadMigrations();
    const shippedHead = shippedMigrations.at(-1)?.version;
    expect(shippedHead).toBeDefined();
    expect(view.migration.appliedHead).toBe(shippedHead);
    expect(view.migration.pendingCount).toBe(0);
    expect(view.migration.drift).toBe(false);
    expect(view.sourceCheckedAt.application).toBeInstanceOf(Date);
    expect(view.sourceCheckedAt.database).toBeInstanceOf(Date);
    expect(view.sourceCheckedAt.migration).toBeInstanceOf(Date);
    expect(JSON.stringify(view)).not.toMatch(/password|postgres:\/\//i);
  });

  it('measures real outbox backlog age and processing evidence from PostgreSQL 18 without claiming a heartbeat', async () => {
    const probe = new PostgresSystemHealthProbes(db);
    const baselineResult = await pool!.query<{
      pending: string;
      retrying: string;
      available: string;
    }>(
      `SELECT
         count(*) FILTER (WHERE processed_at IS NULL)::text AS pending,
         count(*) FILTER (WHERE processed_at IS NULL AND attempt_count > 0)::text AS retrying,
         count(*) FILTER (WHERE processed_at IS NULL AND available_at <= now())::text AS available
       FROM qc.outbox_events`,
    );
    const baseline = baselineResult.rows[0]!;
    const dedupeKey = `health-probe:${crypto.randomUUID()}`;
    await pool!.query(
      `INSERT INTO qc.outbox_events
        (event_type, aggregate_type, aggregate_id, payload, created_at, available_at, processed_at, attempt_count, dedupe_key)
       VALUES
        ('health.probe.pending', 'health_probe', gen_random_uuid(), '{}'::jsonb, now() - interval '10 days', now() - interval '1 second', NULL, 2, $1),
        ('health.probe.delayed', 'health_probe', gen_random_uuid(), '{}'::jsonb, now() - interval '9 days', now() + interval '5 minutes', NULL, 4, $2),
        ('health.probe.processed', 'health_probe', gen_random_uuid(), '{}'::jsonb, now() - interval '1 minute', now(), now(), 1, $3)`,
      [`${dedupeKey}:pending`, `${dedupeKey}:delayed`, `${dedupeKey}:processed`],
    );

    try {
      const result = await probe.outbox();
      expect(result.status).toBe('DEGRADED');
      expect(result.outboxDiagnostics).toMatchObject({
        pendingCount: Number(baseline.pending) + 2,
        availableNowCount: Number(baseline.available) + 1,
        retryingCount: Number(baseline.retrying) + 2,
        maxAttemptCount: 4,
        workerHeartbeat: 'NOT_RECORDED',
        channelDelivery: 'NOT_REPRESENTED',
      });
      expect(result.outboxDiagnostics?.oldestPendingAgeSeconds).toBeGreaterThanOrEqual(
        9 * 24 * 60 * 60,
      );
      expect(result.outboxDiagnostics?.lastProcessedAt).toBeInstanceOf(Date);
    } finally {
      await pool!.query('DELETE FROM qc.outbox_events WHERE dedupe_key LIKE $1', [
        `${dedupeKey}:%`,
      ]);
    }
  });

  it('runs the full owner account lifecycle against PostgreSQL with audit persistence', async () => {
    const users = new PostgresUserRepository(db);
    const audit = new AuditService(new PostgresAuditRepository(db));
    const passwords = new Argon2idPasswordHasher();
    const sessionService = new SessionService(
      users,
      new PostgresSessionRepository(db),
      { now: () => new Date() },
      8 * 60 * 60 * 1000,
    );
    const owner = () => ({
      ...ownerActor(),
      permissions: [
        { code: 'PERM-IDN-MANAGE-USERS', scopes: ['GLOBAL'] },
        { code: 'PERM-IDN-DEACTIVATE', scopes: ['GLOBAL'] },
        { code: 'PERM-IDN-ACTIVATE', scopes: ['GLOBAL'] },
        { code: 'PERM-IDN-RESET-PASSWORD', scopes: ['GLOBAL'] },
        { code: 'PERM-IDN-REVOKE-SESSIONS', scopes: ['GLOBAL'] },
      ] as ActorContext['permissions'],
    });

    // Create (transactional provisioning with initial role + scope).
    const memberRole = await db
      .selectFrom('roles')
      .select('id')
      .where('code', '=', 'CC_MEMBER')
      .executeTakeFirstOrThrow();
    const created = await new CreateUserUseCase(users, passwords, audit).execute({
      actor: owner(),
      loginIdentity: 'cc-member',
      displayName: 'Control Center Member',
      temporaryPassword: 'temporary-pass-1',
      roleCodes: ['CC_MEMBER'],
      scopes: [{ kind: 'TEAM', value: 'qc-lab' }],
      requestId: 'cc-create-1',
    });
    expect(created).not.toHaveProperty('passwordHash');

    // List reflects the new account in the safe projection.
    const listed = await new ListUsersUseCase(users).execute({ actor: ownerActor() });
    const listedMember = listed.find((entry) => entry.loginIdentity === 'cc-member');
    expect(listedMember?.accountState).toBe('ACTIVE');

    // Update profile with optimistic concurrency.
    const updated = await new UpdateUserUseCase(users, audit).execute({
      actor: owner(),
      userId: created.id,
      displayName: 'Control Center Member Renamed',
      expectedVersion: created.version,
      requestId: 'cc-update-1',
    });
    expect(updated.displayName).toBe('Control Center Member Renamed');

    // Role and scope grants are present; non-protected scope removal works.
    const authorization = new PostgresAuthorizationRepository(db, new PostgresAuditRepository(db));
    expect((await authorization.listUserRoles(created.id)).map((role) => role.code)).toContain(
      'CC_MEMBER',
    );
    await new RemoveUserScopeUseCase(authorization).execute({
      actor: adminActor('PERM-ADM-SCOPE-ASSIGN'),
      userId: created.id,
      kind: 'TEAM',
      value: 'qc-lab',
      requestId: 'cc-scope-remove-1',
    });

    // Disable revokes sessions; reactivate restores access.
    await new DisableUserUseCase(users, sessionService, audit).execute({
      actor: owner(),
      userId: created.id,
      expectedVersion: updated.version,
      requestId: 'cc-disable-1',
    });
    const disabled = await users.findById(created.id);
    expect(disabled?.accountState).toBe('DISABLED');
    await new ActivateUserUseCase(users, audit).execute({
      actor: owner(),
      userId: created.id,
      expectedVersion: disabled!.version,
      requestId: 'cc-activate-1',
    });

    // Admin password reset + session revocation persist audit events.
    const current = await users.findById(created.id);
    await new AdminResetPasswordUseCase(
      users,
      passwords,
      new PostgresCredentialMutationCommit(db),
    ).execute({
      actor: owner(),
      userId: created.id,
      temporaryPassword: 'temporary-pass-2',
      expectedVersion: current!.version,
      requestId: 'cc-reset-1',
    });
    await new RevokeUserSessionsUseCase(users, sessionService, audit).execute({
      actor: owner(),
      userId: created.id,
      reason: 'owner control center verification',
      requestId: 'cc-revoke-1',
    });

    const auditRows = await db
      .selectFrom('audit_events')
      .select('action')
      .where('subject_id', '=', created.id)
      .execute();
    const actions = auditRows.map((row) => row.action);
    expect(actions).toEqual(
      expect.arrayContaining([
        'CREATE_USER_PROVISIONED',
        'UPDATE_USER',
        'REMOVE_USER_SCOPE',
        'DISABLE_USER',
        'ACTIVATE_USER',
        'ADMIN_RESET_PASSWORD',
        'REVOKE_USER_SESSIONS',
      ]),
    );

    // Role removal works for ordinary targets.
    await new ManageUserRoleUseCase(authorization).remove({
      actor: adminActor('PERM-ADM-ROLE-ASSIGN'),
      userId: created.id,
      roleId: memberRole.id,
      requestId: 'cc-role-remove-1',
    });
    expect((await authorization.listUserRoles(created.id)).map((role) => role.code)).not.toContain(
      'CC_MEMBER',
    );
  });

  it('denies a manager initial grants without leaving user, grant, or audit rows', async () => {
    const users = new PostgresUserRepository(db);
    const audit = new AuditService(new PostgresAuditRepository(db));
    const manager: ActorContext = {
      id: MANAGER_ID,
      loginIdentity: 'cc-manager',
      accountState: 'ACTIVE',
      roles: ['MANAGER'],
      permissions: [{ code: 'PERM-IDN-MANAGE-USERS', scopes: ['GLOBAL'] }],
    };
    const useCase = new CreateUserUseCase(users, new Argon2idPasswordHasher(), audit);

    // Positive control for account creation under MANAGE alone.
    await useCase.execute({
      actor: manager,
      loginIdentity: 'cc-manager-control',
      displayName: 'Manager Control Member',
      temporaryPassword: 'temporary-pass-control',
      requestId: 'cc-manager-control-1',
      roleCodes: [],
      scopes: [],
    });
    expect(await users.findByLoginIdentity('cc-manager-control')).toBeDefined();
    expect(
      await db
        .selectFrom('audit_events')
        .select('action')
        .where('request_id', '=', 'cc-manager-control-1')
        .execute(),
    ).toEqual([{ action: 'CREATE_USER_PROVISIONED' }]);

    const before = await Promise.all([
      db
        .selectFrom('users')
        .select((eb) => eb.fn.countAll().as('count'))
        .executeTakeFirstOrThrow(),
      db
        .selectFrom('user_roles')
        .select((eb) => eb.fn.countAll().as('count'))
        .executeTakeFirstOrThrow(),
      db
        .selectFrom('user_scopes')
        .select((eb) => eb.fn.countAll().as('count'))
        .executeTakeFirstOrThrow(),
      db
        .selectFrom('audit_events')
        .select((eb) => eb.fn.countAll().as('count'))
        .executeTakeFirstOrThrow(),
      db
        .selectFrom('outbox_events')
        .select((eb) => eb.fn.countAll().as('count'))
        .executeTakeFirstOrThrow(),
    ]);
    const requestId = 'cc-manager-provision-denied-1';
    await expect(
      useCase.execute({
        actor: manager,
        loginIdentity: 'cc-manager-provision-denied',
        displayName: 'Denied Manager Member',
        temporaryPassword: 'temporary-pass-denied',
        roleCodes: ['CC_MEMBER'],
        scopes: [{ kind: 'TEAM', value: 'qc-lab' }],
        requestId,
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    const after = await Promise.all([
      db
        .selectFrom('users')
        .select((eb) => eb.fn.countAll().as('count'))
        .executeTakeFirstOrThrow(),
      db
        .selectFrom('user_roles')
        .select((eb) => eb.fn.countAll().as('count'))
        .executeTakeFirstOrThrow(),
      db
        .selectFrom('user_scopes')
        .select((eb) => eb.fn.countAll().as('count'))
        .executeTakeFirstOrThrow(),
      db
        .selectFrom('audit_events')
        .select((eb) => eb.fn.countAll().as('count'))
        .executeTakeFirstOrThrow(),
      db
        .selectFrom('outbox_events')
        .select((eb) => eb.fn.countAll().as('count'))
        .executeTakeFirstOrThrow(),
    ]);
    expect(after).toEqual(before);
    expect(await users.findByLoginIdentity('cc-manager-provision-denied')).toBeUndefined();
    expect(
      await db
        .selectFrom('audit_events')
        .select('id')
        .where('request_id', '=', requestId)
        .execute(),
    ).toHaveLength(0);
  });

  it('serializes concurrent duplicate initial provisions to one account and one audit', async () => {
    const users = new PostgresUserRepository(db);
    const audit = new AuditService(new PostgresAuditRepository(db));
    const actor: ActorContext = {
      ...ownerActor(),
      permissions: [
        { code: 'PERM-IDN-MANAGE-USERS', scopes: ['GLOBAL'] },
        { code: 'PERM-ADM-ROLE-ASSIGN', scopes: ['GLOBAL'] },
        { code: 'PERM-ADM-SCOPE-ASSIGN', scopes: ['GLOBAL'] },
      ],
    };
    const useCase = new CreateUserUseCase(users, new Argon2idPasswordHasher(), audit);
    const input = {
      actor,
      loginIdentity: 'cc-concurrent-provision',
      displayName: 'Concurrent Member',
      temporaryPassword: 'temporary-pass-concurrent',
      roleCodes: ['CC_MEMBER'],
      scopes: [{ kind: 'TEAM', value: 'qc-lab' }],
    };
    const results = await Promise.allSettled([
      useCase.execute({ ...input, requestId: 'cc-concurrent-provision-1' }),
      useCase.execute({ ...input, requestId: 'cc-concurrent-provision-2' }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);

    // A client retry after an ambiguous response is not a second provision;
    // unique login remains the dedupe boundary even though requestId is not an
    // idempotency key.
    const replay = await Promise.allSettled([
      useCase.execute({ ...input, requestId: 'cc-concurrent-provision-replay' }),
    ]);
    expect(replay[0]?.status).toBe('rejected');

    const member = await users.findByLoginIdentity(input.loginIdentity);
    expect(member).toBeDefined();
    expect(
      await db.selectFrom('user_roles').select('id').where('user_id', '=', member!.id).execute(),
    ).toHaveLength(1);
    expect(
      await db.selectFrom('user_scopes').select('id').where('user_id', '=', member!.id).execute(),
    ).toHaveLength(1);
    expect(
      await db
        .selectFrom('audit_events')
        .select('id')
        .where('subject_id', '=', member!.id)
        .where('action', '=', 'CREATE_USER_PROVISIONED')
        .execute(),
    ).toHaveLength(1);
    expect(
      await db
        .selectFrom('outbox_events')
        .select('id')
        .where('aggregate_id', '=', member!.id)
        .execute(),
    ).toHaveLength(0);
  });

  it('rolls back the user and both grants when provisioning audit persistence fails', async () => {
    const users = new PostgresUserRepository(db);
    const audit = new AuditService(new PostgresAuditRepository(db));
    const actor: ActorContext = {
      ...ownerActor(),
      permissions: [
        { code: 'PERM-IDN-MANAGE-USERS', scopes: ['GLOBAL'] },
        { code: 'PERM-ADM-ROLE-ASSIGN', scopes: ['GLOBAL'] },
        { code: 'PERM-ADM-SCOPE-ASSIGN', scopes: ['GLOBAL'] },
      ],
    };
    const useCase = new CreateUserUseCase(users, new Argon2idPasswordHasher(), audit);
    await pool!.query(`
      CREATE OR REPLACE FUNCTION qc.reject_provision_audit() RETURNS trigger AS $$
      BEGIN
        IF NEW.action = 'CREATE_USER_PROVISIONED' THEN
          RAISE EXCEPTION 'injected provisioning audit failure';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      CREATE TRIGGER reject_provision_audit
      BEFORE INSERT ON qc.audit_events
      FOR EACH ROW EXECUTE FUNCTION qc.reject_provision_audit();
    `);
    try {
      const before = await Promise.all([
        db
          .selectFrom('users')
          .select((eb) => eb.fn.countAll().as('count'))
          .executeTakeFirstOrThrow(),
        db
          .selectFrom('user_roles')
          .select((eb) => eb.fn.countAll().as('count'))
          .executeTakeFirstOrThrow(),
        db
          .selectFrom('user_scopes')
          .select((eb) => eb.fn.countAll().as('count'))
          .executeTakeFirstOrThrow(),
      ]);
      await expect(
        useCase.execute({
          actor,
          loginIdentity: 'cc-audit-failure-provision',
          displayName: 'Audit Failure Member',
          temporaryPassword: 'temporary-pass-audit-failure',
          roleCodes: ['CC_MEMBER'],
          scopes: [{ kind: 'TEAM', value: 'qc-lab' }],
          requestId: 'cc-audit-failure-provision-1',
        }),
      ).rejects.toBeDefined();
      const after = await Promise.all([
        db
          .selectFrom('users')
          .select((eb) => eb.fn.countAll().as('count'))
          .executeTakeFirstOrThrow(),
        db
          .selectFrom('user_roles')
          .select((eb) => eb.fn.countAll().as('count'))
          .executeTakeFirstOrThrow(),
        db
          .selectFrom('user_scopes')
          .select((eb) => eb.fn.countAll().as('count'))
          .executeTakeFirstOrThrow(),
      ]);
      expect(after).toEqual(before);
      expect(await users.findByLoginIdentity('cc-audit-failure-provision')).toBeUndefined();
    } finally {
      await pool!.query('DROP TRIGGER IF EXISTS reject_provision_audit ON qc.audit_events');
      await pool!.query('DROP FUNCTION IF EXISTS qc.reject_provision_audit()');
    }
  });

  it('preserves the protected canonical owner grants against crafted removal', async () => {
    const authorization = new PostgresAuthorizationRepository(db, new PostgresAuditRepository(db));
    const ownerRole = await db
      .selectFrom('roles')
      .select('id')
      .where('code', '=', 'SYSTEM_OWNER')
      .executeTakeFirstOrThrow();
    await expect(
      new ManageUserRoleUseCase(authorization).remove({
        actor: adminActor('PERM-ADM-ROLE-ASSIGN'),
        userId: OWNER_ID,
        roleId: ownerRole.id,
        requestId: 'cc-protected-role-1',
      }),
    ).rejects.toBeDefined();
    await expect(
      new RemoveUserScopeUseCase(authorization).execute({
        actor: adminActor('PERM-ADM-SCOPE-ASSIGN'),
        userId: OWNER_ID,
        kind: 'GLOBAL',
        requestId: 'cc-protected-scope-1',
      }),
    ).rejects.toBeDefined();
    // Grants survive untouched.
    expect((await authorization.listUserRoles(OWNER_ID)).map((role) => role.code)).toContain(
      'SYSTEM_OWNER',
    );
    expect((await authorization.listUserScopes(OWNER_ID)).map((scope) => scope.kind)).toContain(
      'GLOBAL',
    );
  });

  it('rolls back provisioned creation atomically when the role set is invalid', async () => {
    const users = new PostgresUserRepository(db);
    const audit = new AuditService(new PostgresAuditRepository(db));
    const before = (await users.listUsers()).length;
    await expect(
      new CreateUserUseCase(users, new Argon2idPasswordHasher(), audit).execute({
        actor: {
          ...ownerActor(),
          permissions: [{ code: 'PERM-IDN-MANAGE-USERS', scopes: ['GLOBAL'] }],
        },
        loginIdentity: 'cc-rollback',
        displayName: 'Rollback Probe',
        temporaryPassword: 'temporary-pass-3',
        roleCodes: ['ROLE_THAT_DOES_NOT_EXIST'],
        requestId: 'cc-rollback-1',
      }),
    ).rejects.toBeDefined();
    expect((await users.listUsers()).length).toBe(before);
    expect(await users.findByLoginIdentity('cc-rollback')).toBeUndefined();
  });

  it('assigns a new scope grant through the audited use case', async () => {
    const users = new PostgresUserRepository(db);
    const target = await users.findByLoginIdentity('cc-member');
    expect(target?.accountState).toBe('ACTIVE');
    const authorization = new PostgresAuthorizationRepository(db, new PostgresAuditRepository(db));
    await new AssignUserScopeUseCase(authorization).execute({
      actor: adminActor('PERM-ADM-SCOPE-ASSIGN'),
      userId: target!.id,
      kind: 'SITE',
      value: 'site-1',
      requestId: 'cc-scope-assign-1',
    });
    const scopes = await authorization.listUserScopes(target!.id);
    expect(scopes.some((scope) => scope.kind === 'SITE' && scope.value === 'site-1')).toBe(true);
  });
});
