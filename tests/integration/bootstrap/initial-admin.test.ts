import { randomBytes } from 'node:crypto';

import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BootstrapInitialAdminUseCase } from '../../../src/modules/identity/application/bootstrap-initial-admin.js';
import { LoginUseCase } from '../../../src/modules/identity/application/login.js';
import { SessionService } from '../../../src/modules/identity/application/session-service.js';
import { PostgresSessionRepository } from '../../../src/modules/identity/infrastructure/postgres-session-repository.js';
import { PostgresUserRepository } from '../../../src/modules/identity/infrastructure/postgres-user-repository.js';
import { Argon2idPasswordHasher } from '../../../src/modules/identity/security/argon2-password-hasher.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { systemClock } from '../../../src/shared/time/clock.js';
import { migrate } from '../../../scripts/db/migrate.js';
import { seedFoundationData } from '../../../db/seeds/common.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const password = randomBytes(32).toString('base64url');
const config = {
  databaseUrl: 'postgres://test:test@localhost/qc_test',
  identity: `bootstrap-${randomBytes(8).toString('hex')}`,
  password,
  displayName: 'Bootstrap Test Administrator',
};

describe('initial administrator bootstrap', () => {
  let pool: ReturnType<typeof createPool>;
  let database: Kysely<DatabaseSchema>;
  let users: PostgresUserRepository;
  let passwords: Argon2idPasswordHasher;

  beforeAll(async () => {
    pool = createPool({ connectionString: getTestDatabaseUrl(await startPostgresContainer()) });
    await migrate({ pool });
    await seedFoundationData(pool);
    database = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
    users = new PostgresUserRepository(database);
    passwords = new Argon2idPasswordHasher();
  });

  afterAll(async () => {
    await database?.destroy();
    await pool?.end();
    await stopPostgresContainer();
  });

  it('creates one ACTIVE account with canonical ADMIN and GLOBAL relationships, without grants', async () => {
    const bootstrap = new BootstrapInitialAdminUseCase(database, passwords);
    expect(await bootstrap.execute(config)).toEqual({
      status: 'CREATED',
      authorizationGrantsConfigured: false,
    });

    const user = await users.findByLoginIdentity(config.identity);
    expect(user).toMatchObject({
      loginIdentity: config.identity,
      accountState: 'ACTIVE',
      mustChangePassword: false,
    });
    expect(user?.passwordHash).not.toBe(password);
    expect(await passwords.verify(password, user!.passwordHash)).toBe(true);

    const roles = await database
      .selectFrom('user_roles')
      .innerJoin('roles', 'roles.id', 'user_roles.role_id')
      .select('roles.code')
      .where('user_roles.user_id', '=', user!.id)
      .where('user_roles.revoked_at', 'is', null)
      .execute();
    expect(roles).toEqual([{ code: 'ADMIN' }]);
    expect(
      await database
        .selectFrom('user_scopes')
        .select(['scope_kind', 'scope_value'])
        .where('user_id', '=', user!.id)
        .where('revoked_at', 'is', null)
        .execute(),
    ).toEqual([{ scope_kind: 'GLOBAL', scope_value: null }]);
    expect(await database.selectFrom('role_permissions').selectAll().execute()).toHaveLength(0);
    expect(
      await database
        .selectFrom('audit_events')
        .select('action')
        .where('subject_id', '=', user!.id)
        .execute(),
    ).toHaveLength(3);
  });

  it('is create-only and leaves the password and assignments unchanged on repeat execution', async () => {
    const first = await users.findByLoginIdentity(config.identity);
    expect(await new BootstrapInitialAdminUseCase(database, passwords).execute(config)).toEqual({
      status: 'ALREADY_EXISTS',
    });
    const second = await users.findByLoginIdentity(config.identity);
    expect(second?.passwordHash).toBe(first?.passwordHash);
    expect(
      await database
        .selectFrom('user_roles')
        .selectAll()
        .where('user_id', '=', first!.id)
        .execute(),
    ).toHaveLength(1);
    expect(
      await database
        .selectFrom('user_scopes')
        .selectAll()
        .where('user_id', '=', first!.id)
        .execute(),
    ).toHaveLength(1);
  });

  it('uses the existing Login use case and denies wrong passwords and disabled accounts', async () => {
    const sessions = new PostgresSessionRepository(database);
    const login = new LoginUseCase(
      users,
      passwords,
      new SessionService(users, sessions, systemClock, 60_000),
    );
    await expect(
      login.execute(config.identity, randomBytes(32).toString('base64url')),
    ).rejects.toMatchObject({ code: 'AUTH_INVALID_CREDENTIALS' });
    await expect(login.execute(config.identity, password)).resolves.toMatchObject({
      userId: (await users.findByLoginIdentity(config.identity))!.id,
    });
    const user = await users.findByLoginIdentity(config.identity);
    await users.setAccountState(user!.id, 'DISABLED', user!.version, user!.id, new Date());
    await expect(login.execute(config.identity, password)).rejects.toMatchObject({
      code: 'AUTH_INVALID_CREDENTIALS',
    });
  });
});
