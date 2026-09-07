import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ActionError, ActionInputError } from 'astro:actions';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { server } from '../../../src/actions/index.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { destroyDatabase } from '../../../src/shared/database/database.js';
import { resetPoolForTests } from '../../../src/shared/database/pool.js';
import { resetServerEnvForTests } from '../../../src/config/env.js';
import { migrate } from '../../../scripts/db/migrate.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

// Astro resolves `astro:actions` to `export { server } from 'src/actions'`
// (vitePluginUserActions) and reaches nested actions through dot-separated
// paths (/_actions/quarantine.reviewInspection). This mirrors that lookup so
// the test fails if a page references an action the server cannot resolve.
function resolveActionPath(root: unknown, path: string): unknown {
  let current = root;
  for (const key of path.split('.')) {
    if (typeof current !== 'object' || current === null || !(key in current)) {
      throw new Error(`Action not found: ${path}`);
    }
    current = (current as Record<string, unknown>)[key];
  }
  if (typeof current !== 'function') {
    throw new Error(`Expected handler for action ${path} to be a function.`);
  }
  return current;
}

// Builds the same API-context marker Astro sets for server-side action calls
// (ACTION_API_CONTEXT_SYMBOL in astro/dist/actions/runtime/utils.js).
function actionContext(actor: ActorContext | undefined) {
  const context = {
    locals: { actor, requestContext: { requestId: 'server-contract-test' } },
    cookies: { get: () => undefined, set: () => undefined },
  };
  Reflect.set(context, Symbol.for('astro.actionAPIContext'), true);
  return context;
}

// Every `actions.<namespace>.<leaf>` / `actions.<leaf>` reference used by
// pages and components must resolve through the single `server` export.
const UI_ACTION_PATHS = [
  'login',
  'logout',
  'account.changePassword',
  'quarantine.createReceiving',
  'quarantine.updateReceivingDraft',
  'quarantine.transitionReceiving',
  'quarantine.holdReceiving',
  'quarantine.releaseReceiving',
  'quarantine.saveInspectionDraft',
  'quarantine.submitInspection',
  'quarantine.reviewInspection',
  'quarantine.approveInspection',
  'quarantine.returnInspection',
  'quarantine.resumeInspection',
  'documents.create',
  'documents.createVersion',
  'documents.updateDraft',
  'documents.submit',
  'documents.review',
  'documents.approve',
  'assets.createEquipment',
  'assets.createCalibration',
  'assets.createMaintenance',
  'tasks.createTask',
  'tasks.transition',
  'laboratory.create',
  'laboratory.submit',
  'changeRequests.create',
  'changeRequests.transition',
  'system.requestRestore',
  'approvals.decide',
  'aiAdvisory.requestAdvisory',
];

describe('actions server contract', () => {
  it('exposes a single server object aggregating every domain namespace', () => {
    for (const key of [
      'login',
      'logout',
      'account',
      'admin',
      'reports',
      'tasks',
      'findings',
      'ncr',
      'rca',
      'capa',
      'quarantine',
      'laboratory',
      'assets',
      'documents',
      'approvals',
      'changeRequests',
      'system',
      'aiAdvisory',
    ]) {
      expect(server, `server.${key}`).toHaveProperty(key);
    }
  });

  it('resolves every UI-referenced action path to a callable handler', () => {
    for (const path of UI_ACTION_PATHS) {
      expect(typeof resolveActionPath(server, path), path).toBe('function');
    }
  });

  it('rejects unauthenticated callers before touching the database', async () => {
    const context = actionContext(undefined);
    const outcome = await (
      server.findings.create as unknown as (input: unknown) => Promise<{
        data?: unknown;
        error?: unknown;
      }>
    ).bind(context)({
      findingNo: 'F-1',
      title: 'Contract probe',
      description: 'Unauthorized callers never reach the repository.',
    });
    expect(outcome.data).toBeUndefined();
    expect(outcome.error).toBeInstanceOf(ActionError);
    expect((outcome.error as ActionError).code).toBe('UNAUTHORIZED');
  });

  it('rejects invalid input through schema validation', async () => {
    const context = actionContext(undefined);
    const outcome = await (
      server.tasks.createTask as unknown as (input: unknown) => Promise<{
        data?: unknown;
        error?: unknown;
      }>
    ).bind(context)({ taskNo: 42, priority: 'HIGH' });
    expect(outcome.data).toBeUndefined();
    expect(outcome.error).toBeInstanceOf(ActionInputError);
  });
});

describe('actions authorized path on a disposable database', () => {
  let previousDatabaseUrl: string | undefined;
  let container: StartedPostgreSqlContainer | undefined;
  let sslDir: string | undefined;
  // Fixture identity for the disposable database only. Not a production
  // account; created fresh in the migrated test schema above.
  const PROBE_ACTOR_ID = '01900000-0000-7000-8000-000000000021';

  beforeAll(async () => {
    previousDatabaseUrl = process.env.DATABASE_URL;
    // Disposable PostgreSQL 18 with real TLS: the canonical connection policy
    // requires an explicit sslmode and pg negotiates encryption, so the test
    // cluster serves a throwaway self-signed certificate. This never touches
    // production credentials or databases; everything is created and removed
    // inside this file.
    sslDir = mkdtempSync(join(tmpdir(), 'qc-test-pgssl-'));
    const keyPath = join(sslDir, 'server.key');
    const certPath = join(sslDir, 'server.crt');
    execFileSync('openssl', [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-keyout',
      keyPath,
      '-out',
      certPath,
      '-days',
      '1',
      '-nodes',
      '-subj',
      '/CN=127.0.0.1',
      '-addext',
      'subjectAltName=DNS:localhost,IP:127.0.0.1',
    ]);
    container = await new PostgreSqlContainer('postgres:18-alpine')
      .withDatabase('qc_test')
      .withUsername('test')
      .withPassword('test')
      .withCopyFilesToContainer([
        { source: certPath, target: '/etc/pgssl/server.crt' },
        { source: keyPath, target: '/etc/pgssl/server.key' },
      ])
      .withEntrypoint([
        'sh',
        '-c',
        'chown postgres:postgres /etc/pgssl/server.key && chmod 600 /etc/pgssl/server.key && exec docker-entrypoint.sh "$@"',
        'sh',
      ])
      .withCommand([
        'postgres',
        '-c',
        'ssl=on',
        '-c',
        'ssl_cert_file=/etc/pgssl/server.crt',
        '-c',
        'ssl_key_file=/etc/pgssl/server.key',
      ])
      .start();
    // Provider-style URL with explicit `verify-full` against the throwaway
    // local CA: encryption plus hostname verification, mirroring the
    // production TLS posture. `sslrootcert` is a pg client parameter, not
    // application policy; the app itself only requires an explicit mode.
    const containerUri = getTestDatabaseUrl(container);
    const separator = containerUri.includes('?') ? '&' : '?';
    process.env.DATABASE_URL = `${containerUri}${separator}sslmode=verify-full&sslrootcert=${certPath}`;
    resetServerEnvForTests();
    resetPoolForTests();
    const pool = createPool({ connectionString: process.env.DATABASE_URL, max: 4 });
    try {
      const client = await pool.connect();
      try {
        await client.query('DROP SCHEMA IF EXISTS qc CASCADE');
      } finally {
        client.release();
      }
      await migrate({ pool });
      // Local disposable fixture only (never production): the controlled
      // schema references qc.users from tasks/audit rows, so the probe actor
      // needs a matching user row. The hash is inert and never authenticated.
      await pool.query(
        `INSERT INTO qc.users (id, login_identity, display_name, password_hash, account_state, created_by, updated_by)
         VALUES ($1, 'contract-probe', 'Contract Probe', 'test-fixture-never-authenticated', 'ACTIVE', $1, $1)`,
        [PROBE_ACTOR_ID],
      );
    } finally {
      await pool.end();
    }
    resetPoolForTests();
  });

  afterAll(async () => {
    await destroyDatabase();
    resetPoolForTests();
    resetServerEnvForTests();
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
    await container?.stop();
    container = undefined;
    if (sslDir) {
      rmSync(sslDir, { recursive: true, force: true });
      sslDir = undefined;
    }
  });

  it('serves an authorized namespaced action end to end', async () => {
    const actor: ActorContext = {
      id: PROBE_ACTOR_ID,
      accountState: 'ACTIVE',
      roles: ['EMPLOYEE'],
      permissions: [{ code: 'PERM-TASK-CREATE', scopes: ['OWN'] }],
    };
    const context = actionContext(actor);
    const outcome = await (
      server.tasks.createTask as unknown as (input: unknown) => Promise<{
        data?: { taskNo: string; state: string };
        error?: unknown;
      }>
    ).bind(context)({
      taskNo: 'TASK-CONTRACT-1',
      title: 'Contract proof task',
      priority: 'HIGH',
    });
    expect(outcome.error).toBeUndefined();
    expect(outcome.data?.taskNo).toBe('TASK-CONTRACT-1');
    expect(outcome.data?.state).toBe('DRAFT');
  });
});
