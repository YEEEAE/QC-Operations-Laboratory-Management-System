import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import process from 'node:process';

import { createPool } from '../../src/shared/database/pool.js';
import { loadMigrations, migrate } from '../db/migrate.js';
import { seedFoundationData } from '../../db/seeds/common.js';
import {
  startPostgresContainer,
  stopPostgresContainer,
} from '../../tests/helpers/postgres-container.js';

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

function fail(message: string): never {
  throw new Error(message);
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
  await writeFile(
    output,
    `${JSON.stringify(
      {
        schemaVersion: 1,
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
        provenance: {
          source: 'TRUSTED_PLAYWRIGHT',
          immutableReference: output,
          environment: 'test',
        },
        blockedReason: reason,
        totals: { passed: 0, failed: 0, skipped: 0 },
        scenarios: [],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
}

async function main(): Promise<void> {
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

  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  env.RELEASE_GIT_SHA = sha;
  env.RELEASE_BUILD_ID = env.RELEASE_BUILD_ID ?? `qc-closure-${sha.slice(0, 12)}`;
  env.RELEASE_MIGRATION_HEAD = (await loadMigrations()).at(-1)?.name;
  env.RELEASE_IDENTITY_FILE = resolve('dist/release-identity.json');
  env.E2E_EVIDENCE_OUTPUT = output;

  let server: ReturnType<typeof spawn> | undefined;
  try {
    const buildCode = await run(resolve('node_modules/.bin/astro'), ['build'], env);
    if (buildCode !== 0) fail(`Exact build failed with exit code ${buildCode}.`);
    const identityCode = await run(
      process.execPath,
      [
        resolve('scripts/release/release-id.mjs'),
        '--environment',
        'test',
        '--build-id',
        env.RELEASE_BUILD_ID,
      ],
      env,
    );
    if (identityCode !== 0)
      fail(`Release identity generation failed with exit code ${identityCode}.`);

    const container = await startPostgresContainer();
    const databaseUrl = container.getConnectionUri();
    env.DATABASE_URL = databaseUrl;
    env.QC_TEST_DATABASE_URL = databaseUrl;
    env.QC_SEED_ALLOW_NON_PRODUCTION = 'true';
    env.QC_VERIFICATION_SEED_ALLOW = 'true';
    env.QC_VERIFICATION_OPERATOR_IDENTITY = 'yazeed';
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
      const owner = await pool.query(
        `SELECT u.id FROM qc.users u JOIN qc.user_roles ur ON ur.user_id = u.id JOIN qc.roles r ON r.id = ur.role_id WHERE u.login_identity = 'yazeed' AND u.account_state = 'ACTIVE' AND r.code = 'SYSTEM_OWNER' AND ur.revoked_at IS NULL`,
      );
      if (owner.rowCount !== 1)
        fail(
          'Disposable E2E requires an existing ACTIVE canonical yazeed SYSTEM_OWNER; it will not create or mutate that account.',
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
    const e2eCode = await run(
      resolve('node_modules/.bin/playwright'),
      [
        'test',
        'tests/e2e/authenticated-closure.spec.ts',
        'tests/e2e/accessibility.spec.ts',
        'tests/e2e/authorization-matrix.spec.ts',
        'tests/e2e/critical-workflows.spec.ts',
        'tests/e2e/error-recovery.spec.ts',
        'tests/e2e/files-reports.spec.ts',
      ],
      env,
    );
    if (e2eCode !== 0) process.exitCode = e2eCode;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Disposable E2E setup failed.';
    await writeBlockedEvidence(reason, env);
    console.error(`Authenticated E2E BLOCKED: ${reason}`);
    process.exitCode = 2;
  } finally {
    server?.kill('SIGTERM');
    if (!process.env.QC_TEST_DATABASE_URL) await stopPostgresContainer().catch(() => undefined);
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
