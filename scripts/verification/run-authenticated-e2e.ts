import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import process from 'node:process';

import type { Pool } from 'pg';

import { loadLocalEnv } from '../db/load-local-env.js';
import { createPool } from '../../src/shared/database/pool.js';
import { loadMigrations, migrate } from '../db/migrate.js';
import { seedFoundationData } from '../../db/seeds/common.js';
import { Argon2idPasswordHasher } from '../../src/modules/identity/security/argon2-password-hasher.js';
import {
  startPostgresContainer,
  stopPostgresContainer,
} from '../../tests/helpers/postgres-container.js';
import { verificationRun } from './evidence-identity.mjs';

const root = resolve(new URL('../..', import.meta.url).pathname);
const runId = process.env.E2E_TEST_RUN_ID ?? `qc-closure-${randomUUID()}`;
const output = resolve(
  process.env.E2E_EVIDENCE_OUTPUT ?? '.ci-results/authenticated-e2e-evidence.json',
);
const requiredPasswords = [
  'QC_VERIFY_SYSTEM_OWNER_PASSWORD',
  'QC_VERIFY_SUPERVISOR_PASSWORD',
  'QC_VERIFY_MANAGER_PASSWORD',
  'QC_VERIFY_ADMIN_PASSWORD',
  'QC_VERIFY_EMPLOYEE_PASSWORD',
  'QC_VERIFY_LEAST_PASSWORD',
] as const;
const securityE2eSpecs = [
  'tests/e2e/files-reports.spec.ts',
  'tests/e2e/approvals.spec.ts',
  'tests/e2e/security-headers.spec.ts',
] as const;

function fail(message: string): never {
  throw new Error(message);
}

async function bootstrapDisposableSystemOwner(pool: Pool, password: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM qc.users WHERE login_identity = 'yazeed' FOR UPDATE`,
    );
    if (existing.rows[0]) {
      fail('Disposable E2E expected a fresh database; refusing to reset or modify yazeed.');
    }

    const role = await client.query<{ id: string }>(
      `INSERT INTO qc.roles (code, name, description, is_system_role, active)
       VALUES ('SYSTEM_OWNER', 'System Owner', 'Disposable authenticated E2E owner', FALSE, TRUE)
       RETURNING id`,
    );
    const roleId = role.rows[0]?.id;
    if (!roleId) fail('Disposable E2E could not create the SYSTEM_OWNER role.');

    const passwordHash = await new Argon2idPasswordHasher().hash(password);
    const userId = randomUUID();
    await client.query(
      `INSERT INTO qc.users (id, login_identity, display_name, password_hash, account_state, must_change_password)
       VALUES ($1, 'yazeed', 'Disposable E2E System Owner', $2, 'ACTIVE', FALSE)`,
      [userId, passwordHash],
    );
    await client.query(
      `INSERT INTO qc.role_permissions (role_id, permission_id, granted_by)
       SELECT $1, permission.id, $2
       FROM qc.permissions permission
       WHERE permission.active = TRUE`,
      [roleId, userId],
    );
    await client.query(
      `INSERT INTO qc.user_roles (id, user_id, role_id, assigned_by, reason)
       VALUES ($1, $2, $3, $2, 'DISPOSABLE_AUTHENTICATED_E2E')`,
      [randomUUID(), userId, roleId],
    );
    await client.query(
      `INSERT INTO qc.user_scopes (id, user_id, scope_kind, scope_value, assigned_by, reason)
       VALUES ($1, $2, 'GLOBAL', NULL, $2, 'DISPOSABLE_AUTHENTICATED_E2E')`,
      [randomUUID(), userId],
    );
    await client.query(
      `INSERT INTO qc.audit_events
        (actor_type, actor_id, subject_type, subject_id, action, request_id, reason)
       VALUES ('SYSTEM', NULL, 'USER', $1, 'BOOTSTRAP_DISPOSABLE_SYSTEM_OWNER', $2,
               'Docker-only authenticated E2E fixture')`,
      [userId, `authenticated-e2e-owner-${randomUUID()}`],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function run(command: string, args: string[], env: NodeJS.ProcessEnv): Promise<number> {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd: root, env, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code, signal) => resolveRun(code ?? (signal ? 1 : 0)));
  });
}

async function writeBlockedEvidence(reason: string, env: NodeJS.ProcessEnv): Promise<void> {
  await mkdir(dirname(output), { recursive: true });
  const migrations = await loadMigrations();
  const run = await verificationRun();
  await writeFile(
    output,
    `${JSON.stringify(
      {
        schemaVersion: 2,
        evidenceKind: 'ENGINEERING_AUTHENTICATED_PLAYWRIGHT_E2E',
        uatClaim: false,
        status: 'BLOCKED',
        testRunId: runId,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        release: {
          gitSha: env.RELEASE_GIT_SHA ?? 'unbound',
          buildId: env.RELEASE_BUILD_ID ?? 'unbound',
          applicationVersion: env.SERVICE_VERSION ?? '0.1.0',
          migrationHead: migrations.at(-1)?.name ?? 'unknown',
        },
        candidate: run.candidate,
        runId: run.runId,
        provenance: {
          source: 'TRUSTED_PLAYWRIGHT',
          immutableReference: output,
          environment: 'test',
        },
        blockedReason: reason,
        totals: { passed: 0, failed: 0, skipped: 0 },
        artifactDigest: createHash('sha256')
          .update(JSON.stringify({ scenarios: [], totals: { passed: 0, failed: 0, skipped: 0 } }))
          .digest('hex'),
        scenarios: [],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
}

async function main(): Promise<void> {
  loadLocalEnv();
  const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: 'test', E2E_TEST_RUN_ID: runId };
  // The direct Node+tsx loader is needed in this sandbox because the tsx CLI
  // IPC socket is restricted. Do not leak that loader into pnpm/preview child
  // processes; it makes pnpm try to reify node_modules.
  delete env.NODE_OPTIONS;
  process.env.NODE_ENV = 'test';
  if (env.QC_TEST_DATABASE_URL) {
    const lowered = env.QC_TEST_DATABASE_URL.toLowerCase();
    if (
      lowered.includes('qclevel.top') ||
      lowered.includes('render.com') ||
      lowered.includes('prod')
    )
      fail('Refusing authenticated E2E: QC_TEST_DATABASE_URL looks like production.');
  }
  for (const key of requiredPasswords)
    if (!env[key]) fail(`${key} is required and is never logged.`);
    // PostgreSQL 18 Testcontainers is the default. A separately provisioned
    // disposable cluster may be supplied for restricted local environments.

  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  env.RELEASE_GIT_SHA = sha;
  env.E2E_TEST_RUN_ID = (await verificationRun()).runId;
  env.RELEASE_MIGRATION_HEAD = (await loadMigrations()).at(-1)?.name;
  env.RELEASE_IDENTITY_FILE = resolve('dist/release-identity.json');
  env.E2E_EVIDENCE_OUTPUT = output;

  let server: ReturnType<typeof spawn> | undefined;
  let container: Awaited<ReturnType<typeof startPostgresContainer>> | undefined;
  try {
    let releaseIdentity: {
      environment: string;
      buildId: string;
      buildTimestamp: string;
      serviceVersion: string;
    };
    try {
      releaseIdentity = JSON.parse(await readFile(env.RELEASE_IDENTITY_FILE, 'utf8'));
    } catch {
      fail('Candidate release identity is missing; build and record release evidence first.');
    }
    const identityCode = await run(
      process.execPath,
      [
        resolve('scripts/release/verify-release.mjs'),
        '--input',
        env.RELEASE_IDENTITY_FILE,
        '--environment',
        releaseIdentity.environment,
        '--build-id',
        releaseIdentity.buildId,
        '--build-timestamp',
        releaseIdentity.buildTimestamp,
        '--service-version',
        releaseIdentity.serviceVersion,
        '--expected-git-sha',
        sha,
        '--artifact',
        'dist/server/entry.mjs',
      ],
      env,
    );
    if (identityCode !== 0)
      fail(`Exact candidate artifact verification failed with exit code ${identityCode}.`);

    // The app's canonical PostgreSQL pool requires verified TLS. Test suites
    // that exercise the server must use the helper's disposable TLS setup too.
    const externalDatabaseUrl = env.QC_TEST_DATABASE_URL;
    if (externalDatabaseUrl) {
      const parsed = new URL(externalDatabaseUrl);
      if (!['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname))
        fail('Refusing authenticated E2E override: QC_TEST_DATABASE_URL must target local disposable PostgreSQL.');
      if (parsed.searchParams.get('sslmode') !== 'verify-full' || !parsed.searchParams.has('sslrootcert'))
        fail('Refusing authenticated E2E override: local PostgreSQL must use verified TLS.');
    }
    container = externalDatabaseUrl ? undefined : await startPostgresContainer({ tls: true });
    const databaseUrl = externalDatabaseUrl ?? container!.getConnectionUri();
    env.DATABASE_URL = databaseUrl;
    env.QC_TEST_DATABASE_URL = databaseUrl;
    env.QC_SEED_ALLOW_NON_PRODUCTION = 'true';
    env.QC_VERIFICATION_SEED_ALLOW = 'true';
    env.QC_VERIFICATION_OPERATOR_IDENTITY = 'yazeed';
    // Declares the fixture-gated journeys as mandatory for this run, so a
    // missing fixture fails the pipeline instead of reporting a silent skip.
    env.QC_MANDATORY_VERIFY_FIXTURES = 'true';
    env.QC_VERIFY_BASE_URL = env.QC_VERIFY_BASE_URL ?? 'http://127.0.0.1:4321';
    env.QC_E2E_LEAST_SESSION_TOKEN = `${randomUUID()}${randomUUID()}`;
    // The broader closure suites use the single disposable employee as their
    // read-only actor. Keep the aliases candidate-bound and never source a
    // password from a file or print it.
    env.QC_E2E_LOGIN_IDENTITY = env.QC_E2E_LOGIN_IDENTITY ?? 'verify-employee';
    env.QC_E2E_PASSWORD = env.QC_E2E_PASSWORD ?? env.QC_VERIFY_EMPLOYEE_PASSWORD;
    env.QC_E2E_LOGIN_PASSWORD = env.QC_E2E_LOGIN_PASSWORD ?? env.QC_VERIFY_EMPLOYEE_PASSWORD;
    // QC-100-FINAL-006: the accessibility suite needs the Admin persona to reach
    // the administration surfaces (dialog/focus coverage) without weakening any
    // authorization rule; the persona is disposable and candidate-bound.
    env.QC_E2E_ADMIN_LOGIN_IDENTITY = env.QC_E2E_ADMIN_LOGIN_IDENTITY ?? 'verify-admin';
    env.QC_E2E_ADMIN_PASSWORD = env.QC_E2E_ADMIN_PASSWORD ?? env.QC_VERIFY_ADMIN_PASSWORD;
    env.QC_E2E_SUPERVISOR_LOGIN_IDENTITY =
      env.QC_E2E_SUPERVISOR_LOGIN_IDENTITY ?? 'verify-supervisor';
    env.QC_E2E_SUPERVISOR_PASSWORD =
      env.QC_E2E_SUPERVISOR_PASSWORD ?? env.QC_VERIFY_SUPERVISOR_PASSWORD;
    env.QC_E2E_MANAGER_LOGIN_IDENTITY = env.QC_E2E_MANAGER_LOGIN_IDENTITY ?? 'verify-manager';
    env.QC_E2E_MANAGER_PASSWORD = env.QC_E2E_MANAGER_PASSWORD ?? env.QC_VERIFY_MANAGER_PASSWORD;
    env.QC_E2E_SYSTEM_OWNER_LOGIN_IDENTITY = env.QC_E2E_SYSTEM_OWNER_LOGIN_IDENTITY ?? 'yazeed';
    env.QC_E2E_SYSTEM_OWNER_PASSWORD =
      env.QC_E2E_SYSTEM_OWNER_PASSWORD ?? env.QC_VERIFY_SYSTEM_OWNER_PASSWORD;
    env.SESSION_SECRET = env.SESSION_SECRET ?? 'closure-test-session-secret-0123456789';
    env.RATE_LIMIT_LOGIN_MAX = env.RATE_LIMIT_LOGIN_MAX ?? '8';
    env.RATE_LIMIT_LOGIN_WINDOW_SECONDS = env.RATE_LIMIT_LOGIN_WINDOW_SECONDS ?? '60';

    const pool = createPool({
      connectionString: databaseUrl,
      application_name: 'qc-authenticated-e2e',
    });
    try {
      await migrate({ pool });
      await seedFoundationData(pool);
      await bootstrapDisposableSystemOwner(pool, env.QC_VERIFY_SYSTEM_OWNER_PASSWORD ?? '');
      const owner = await pool.query(
        `SELECT u.id
         FROM qc.users u
         JOIN qc.user_roles ur ON ur.user_id = u.id AND ur.revoked_at IS NULL
         JOIN qc.roles r ON r.id = ur.role_id AND r.code = 'SYSTEM_OWNER'
         JOIN qc.user_scopes scope ON scope.user_id = u.id
           AND scope.scope_kind = 'GLOBAL'
           AND scope.scope_value IS NULL
           AND scope.revoked_at IS NULL
         WHERE u.login_identity = 'yazeed' AND u.account_state = 'ACTIVE'`,
      );
      if (owner.rowCount !== 1)
        fail(
          'Disposable E2E bootstrap did not create exactly one ACTIVE yazeed SYSTEM_OWNER with GLOBAL scope.',
        );
    } finally {
      await pool.end();
    }
    const seedCode = await run(
      process.execPath,
      ['--import=tsx', resolve('scripts/verification/seed-verification-fixtures.ts')],
      env,
    );
    if (seedCode !== 0) fail(`Verification fixture seed failed with exit code ${seedCode}.`);

    server = spawn(process.execPath, [resolve('dist/server/entry.mjs')], {
      cwd: root,
      env: { ...env, HOST: '127.0.0.1', PORT: '4321' },
      stdio: 'inherit',
    });
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const response = await fetch('http://127.0.0.1:4321/api/health/live');
        if (response.ok) break;
      } catch {
        /* server is still starting */
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 1000));
      if (attempt === 29) fail('Built preview server did not become live.');
    }
    const authorizationOnly = env.QC_ADP08_AUTHORIZATION_ONLY === 'true';
    const selectedSpecs = env.QC_AUTHENTICATED_E2E_SECURITY_ONLY === 'true'
      ? securityE2eSpecs
      : ['tests/e2e/authenticated-closure.spec.ts', 'tests/e2e/accessibility.spec.ts'];
    const playwrightArgs = authorizationOnly
      ? [
          'test',
          '--workers=1',
          'tests/e2e/authenticated-closure.spec.ts',
          '--grep',
          'read-only role is denied a direct POST',
        ]
      : ['test', '--workers=1', ...selectedSpecs];
    const e2eCode = await run(
      resolve('node_modules/.bin/playwright'),
      playwrightArgs,
      env,
    );
    if (e2eCode !== 0) process.exitCode = e2eCode;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Disposable E2E setup failed.';
    await writeBlockedEvidence(reason, env);
    console.error(`Authenticated E2E BLOCKED: ${reason}`);
    process.exitCode = 2;
  } finally {
    if (server && server.exitCode === null) {
      const exited = new Promise<void>((resolveExit) => server?.once('exit', () => resolveExit()));
      server.kill('SIGTERM');
      await Promise.race([exited, delay(5000)]);
      if (server.exitCode === null) server.kill('SIGKILL');
    }
    if (container) await stopPostgresContainer().catch(() => undefined);
  }
}

main().catch(async (error) => {
  await writeBlockedEvidence(
    error instanceof Error ? error.message : 'Runner failed.',
    process.env,
  ).catch(() => undefined);
  console.error(error instanceof Error ? error.message : 'Authenticated E2E runner failed.');
  process.exitCode = 2;
});
