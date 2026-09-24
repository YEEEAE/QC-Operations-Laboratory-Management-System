import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ActionError, ActionInputError } from 'astro:actions';
import { server } from '../../../src/actions/index.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { destroyDatabase } from '../../../src/shared/database/database.js';
import { resetPoolForTests } from '../../../src/shared/database/pool.js';
import { resetServerEnvForTests } from '../../../src/config/env.js';
import { migrate } from '../../../scripts/db/migrate.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
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
  'quarantine.rejectInspection',
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
  // Fixture identity for the disposable database only. Not a production
  // account; created fresh in the migrated test schema above.
  const PROBE_ACTOR_ID = '01900000-0000-7000-8000-000000000021';

  beforeAll(async () => {
    previousDatabaseUrl = process.env.DATABASE_URL;
    // Disposable PostgreSQL 18 with real TLS: the canonical connection policy
    // requires an explicit sslmode and pg negotiates encryption, so the
    // disposable cluster serves a throwaway self-signed certificate (a
    // container running ssl=on, or an externally provisioned cluster whose URL
    // already declares a non-disabled sslmode). This never touches production
    // credentials or databases.
    process.env.DATABASE_URL = getTestDatabaseUrl(await startPostgresContainer({ tls: true }));
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
    await stopPostgresContainer();
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

  it('rejects an authenticated caller without task-create permission before writing', async () => {
    const context = actionContext({
      id: PROBE_ACTOR_ID,
      accountState: 'ACTIVE',
      roles: ['EMPLOYEE'],
      permissions: [],
    });
    const outcome = await (
      server.tasks.createTask as unknown as (input: unknown) => Promise<{
        data?: unknown;
        error?: unknown;
      }>
    ).bind(context)({ taskNo: 'TASK-ACTION-DENIED', title: 'Denied probe', priority: 'HIGH' });

    expect(outcome.data).toBeUndefined();
    expect(outcome.error).toBeInstanceOf(ActionError);
    expect((outcome.error as ActionError).code).toBe('BAD_REQUEST');
    expect((outcome.error as ActionError).message).toBe('errors.authz_permission_missing');
  });

  it('denies a direct transition for a read-only actor on a real task, then accepts the permitted version', async () => {
    const permittedActor: ActorContext = {
      id: PROBE_ACTOR_ID,
      accountState: 'ACTIVE',
      roles: ['EMPLOYEE'],
      permissions: [
        { code: 'PERM-TASK-CREATE', scopes: ['OWN'] },
        { code: 'PERM-TASK-VIEW', scopes: ['OWN'] },
        { code: 'PERM-TASK-EDIT', scopes: ['OWN'] },
      ],
    };
    const created = await (
      server.tasks.createTask as unknown as (input: unknown) => Promise<{
        data?: { id: string; taskNo: string; state: string; version: bigint };
        error?: unknown;
      }>
    ).bind(actionContext(permittedActor))({
      taskNo: 'TASK-AUTHZ-REAL-RECORD',
      title: 'Authorization matrix record',
      priority: 'HIGH',
    });
    expect(created.error).toBeUndefined();
    expect(created.data).toMatchObject({ taskNo: 'TASK-AUTHZ-REAL-RECORD', state: 'DRAFT' });
    const taskId = created.data!.id;

    const readOnlyActor: ActorContext = {
      ...permittedActor,
      permissions: [{ code: 'PERM-TASK-VIEW', scopes: ['OWN'] }],
    };
    const denied = await (
      server.tasks.transition as unknown as (input: unknown) => Promise<{
        data?: unknown;
        error?: unknown;
      }>
    ).bind(actionContext(readOnlyActor))({
      taskId,
      expectedVersion: 1,
      action: 'START',
    });
    expect(denied.data).toBeUndefined();
    expect(denied.error).toBeInstanceOf(ActionError);
    expect((denied.error as ActionError).message).toBe('errors.authz_permission_missing');

    const activated = await (
      server.tasks.transition as unknown as (input: unknown) => Promise<{
        data?: { state: string; version: bigint };
        error?: unknown;
      }>
    ).bind(actionContext(permittedActor))({
      taskId,
      expectedVersion: 1,
      action: 'ACTIVATE',
    });
    expect(activated.error).toBeUndefined();
    expect(activated.data).toMatchObject({ state: 'OPEN', version: 2n });

    const stale = await (
      server.tasks.transition as unknown as (input: unknown) => Promise<{
        data?: unknown;
        error?: unknown;
      }>
    ).bind(actionContext(permittedActor))({
      taskId,
      expectedVersion: 1,
      action: 'START',
    });
    expect(stale.data).toBeUndefined();
    expect(stale.error).toBeInstanceOf(ActionError);
    expect((stale.error as ActionError).message).toBe('errors.conflict_stale_version');

    const verificationPool = createPool({ connectionString: process.env.DATABASE_URL, max: 1 });
    try {
      const persisted = await verificationPool.query<{ state: string; version: string }>(
        'SELECT state, version FROM qc.tasks WHERE id = $1',
        [taskId],
      );
      expect(persisted.rows).toEqual([{ state: 'OPEN', version: '2' }]);
    } finally {
      await verificationPool.end();
    }
  });
});
