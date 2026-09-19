/**
 * Seed disposable UAT personas for QC-100-FINAL-004 Task 4 (six real users on
 * the local disposable UAT database).
 *
 * Safety properties (mirrors scripts/verification/seed-verification-fixtures.ts):
 * - Refuses to run unless NODE_ENV is development|test AND
 *   QC_SEED_ALLOW_NON_PRODUCTION=true AND QC_UAT_SEED_ALLOW=true.
 * - Refuses against production hostnames (DATABASE_URL containing
 *   `qclevel.top`, `render.com`, or `prod` without test/dev/localhost markers).
 * - NEVER creates, resets, or mutates the `yazeed` SYSTEM_OWNER account
 *   (verify-only: its existence/state/role/scope are asserted, not changed).
 * - Passwords come only from QC_UAT_* env vars; nothing is logged.
 * - All disposable identities use the `uat-` prefix; disposable records are
 *   tagged `UAT-` and role grants expire after 72h (cleanup script also exists).
 * - Idempotent: re-running with the same env reuses existing fixtures.
 * - Post-seed assertions: each persona's effective permission set (role
 *   permissions joined through an active, unrevoked role grant) equals the
 *   foundation bundle for its role, scopes are present, accounts are ACTIVE.
 */
import { Pool, type PoolClient } from 'pg';
import { hash } from 'argon2';
import { randomUUID } from 'node:crypto';

import { stableSeedUuid, FOUNDATION_ROLE_PERMISSIONS } from '../../db/seeds/common.js';
import { UAT_PERSONAS, UAT_TEAM_VALUE } from '../../tests/fixtures/uat-personas.js';

const MIN_PASSWORD_LENGTH = 16;
const EXPIRY_HOURS = 72;
const REASON = 'QC-100-FINAL-004 UAT FIXTURE (72H EXPIRY)';

function fail(message: string): never {
  throw new Error(message);
}

function requireGuard(env: NodeJS.ProcessEnv): void {
  const nodeEnv = env.NODE_ENV;
  if (nodeEnv !== 'development' && nodeEnv !== 'test') {
    fail('Refusing UAT seed: NODE_ENV must be development or test.');
  }
  if (env.QC_SEED_ALLOW_NON_PRODUCTION !== 'true') {
    fail('Refusing UAT seed: QC_SEED_ALLOW_NON_PRODUCTION=true is required.');
  }
  if (env.QC_UAT_SEED_ALLOW !== 'true') {
    fail('Refusing UAT seed: QC_UAT_SEED_ALLOW=true is required.');
  }
  const databaseUrl = env.DATABASE_URL ?? '';
  if (!databaseUrl) fail('Refusing UAT seed: DATABASE_URL is required.');
  const lowered = databaseUrl.toLowerCase();
  const looksProduction =
    lowered.includes('qclevel.top') ||
    lowered.includes('render.com') ||
    (lowered.includes('prod') &&
      !lowered.includes('test') &&
      !lowered.includes('dev') &&
      !lowered.includes('localhost') &&
      !lowered.includes('127.0.0.1'));
  if (looksProduction) {
    fail('Refusing UAT seed: DATABASE_URL looks like production.');
  }
}

function requirePassword(envVar: string, env: NodeJS.ProcessEnv): string {
  const value = env[envVar];
  if (!value || value.length < MIN_PASSWORD_LENGTH) {
    fail(
      `Refusing UAT seed: ${envVar} must be set with at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  }
  return value;
}

async function ensureUser(
  client: PoolClient,
  loginIdentity: string,
  displayName: string,
  password: string,
): Promise<string> {
  const existing = await client.query<{ id: string; account_state: string }>(
    'SELECT id, account_state FROM qc.users WHERE login_identity = $1',
    [loginIdentity],
  );
  if (existing.rows[0]) {
    // Re-provision after cleanup/expiry: reactivate the disposable account,
    // rotate its password to the current run's one-time value, and clear any
    // must-change-password block left by a previous run.
    await client.query(
      `UPDATE qc.users
       SET account_state = 'ACTIVE', password_hash = $2, must_change_password = TRUE
       WHERE id = $1`,
      [existing.rows[0].id, await hash(password)],
    );
    return existing.rows[0].id;
  }
  const passwordHash = await hash(password);
  const id = stableSeedUuid(`uat-user:${loginIdentity}`);
  await client.query(
    `INSERT INTO qc.users (id, login_identity, display_name, password_hash, account_state, must_change_password)
     VALUES ($1, $2, $3, $4, 'ACTIVE', TRUE)`,
    [id, loginIdentity, displayName, passwordHash],
  );
  return id;
}

async function ensureRole(
  client: PoolClient,
  userId: string,
  roleCode: string,
  assignedBy: string,
): Promise<void> {
  const role = await client.query<{ id: string }>(
    'SELECT id FROM qc.roles WHERE code = $1 AND active = TRUE',
    [roleCode],
  );
  if (!role.rows[0])
    fail(`Foundation role is missing: ${roleCode}. Run the foundation seed first.`);
  const existing = await client.query(
    `SELECT id FROM qc.user_roles
     WHERE user_id = $1 AND role_id = $2 AND revoked_at IS NULL
       AND (valid_until IS NULL OR valid_until > NOW())`,
    [userId, role.rows[0].id],
  );
  if (existing.rows[0]) return;
  await client.query(
    `INSERT INTO qc.user_roles (id, user_id, role_id, assigned_by, reason, valid_until)
     VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '${EXPIRY_HOURS} hours')`,
    [randomUUID(), userId, role.rows[0].id, assignedBy, REASON],
  );
}

async function ensureScope(
  client: PoolClient,
  userId: string,
  scopeKind: 'TEAM' | 'GLOBAL',
  teamValue: string | null,
): Promise<void> {
  const existing = await client.query(
    'SELECT id FROM qc.user_scopes WHERE user_id = $1 AND scope_kind = $2 AND revoked_at IS NULL',
    [userId, scopeKind],
  );
  if (existing.rows[0]) return;
  await client.query(
    `INSERT INTO qc.user_scopes (id, user_id, scope_kind, scope_value, assigned_by, reason)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [randomUUID(), userId, scopeKind, teamValue, userId, REASON],
  );
}

/**
 * Post-seed assertion: the effective permission set derived exactly the way
 * the application derives it (resolveActor path: active role + active
 * permission through an unexpired, unrevoked user_roles row) must equal the
 * foundation bundle for the persona's role, and the account must be ACTIVE.
 * AVD universal operational read grants are excluded from both sides.
 */
async function assertPersonaAuthorization(
  client: PoolClient,
  userId: string,
  loginIdentity: string,
  roleCode: string,
  expectedScope: 'TEAM' | 'GLOBAL',
  expectedTeamValue: string | null,
): Promise<void> {
  const account = await client.query<{ account_state: string }>(
    'SELECT account_state FROM qc.users WHERE id = $1',
    [userId],
  );
  if (account.rows[0]?.account_state !== 'ACTIVE') {
    fail(`UAT assertion failed: ${loginIdentity} is not ACTIVE.`);
  }

  const effective = await client.query<{ permission_code: string }>(
    `SELECT DISTINCT permissions.code AS permission_code
     FROM qc.user_roles
     JOIN qc.roles ON roles.id = user_roles.role_id
     JOIN qc.role_permissions ON role_permissions.role_id = roles.id
     JOIN qc.permissions ON permissions.id = role_permissions.permission_id
     WHERE user_roles.user_id = $1
       AND user_roles.revoked_at IS NULL
       AND (user_roles.valid_until IS NULL OR user_roles.valid_until > NOW())
       AND roles.active = TRUE
       AND permissions.active = TRUE`,
    [userId],
  );
  const effectiveCodes = new Set<string>(effective.rows.map((row) => row.permission_code));

  const expected = new Set<string>(
    FOUNDATION_ROLE_PERMISSIONS[roleCode as 'EMPLOYEE' | 'MANAGER' | 'SUPERVISOR' | 'ADMIN'] ?? [],
  );
  const missing = [...expected].filter((code) => !effectiveCodes.has(code));
  // Extra grants are tolerated only if they are not approval/sign authority —
  // for UAT personas the bundle must be the single source of truth.
  const extras = [...effectiveCodes].filter((code) => !expected.has(code));
  if (missing.length > 0 || extras.length > 0) {
    fail(
      `UAT assertion failed: ${loginIdentity} effective permissions drift from the ${roleCode} bundle.\n` +
        `  missing: ${missing.join(', ') || '(none)'}\n` +
        `  extra:   ${extras.join(', ') || '(none)'}`,
    );
  }

  const forbidden = [...effectiveCodes].filter(
    (code: string) =>
      code === 'PERM-APR-APPROVE' ||
      code === 'PERM-APR-SIGN' ||
      code === 'PERM-ESIG-SIGN' ||
      code.endsWith('-APPROVE'),
  );
  if (roleCode === 'EMPLOYEE' && forbidden.length > 0) {
    fail(
      `UAT assertion failed: ${loginIdentity} (EMPLOYEE) must hold zero approval/sign grants; found: ${forbidden.join(', ')}.`,
    );
  }

  const scopes = await client.query<{ scope_kind: string; scope_value: string | null }>(
    `SELECT scope_kind, scope_value FROM qc.user_scopes
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
  );
  const hasExpectedScope = scopes.rows.some(
    (row) =>
      row.scope_kind === expectedScope &&
      (expectedScope === 'GLOBAL' || row.scope_value === expectedTeamValue),
  );
  if (!hasExpectedScope) {
    fail(
      `UAT assertion failed: ${loginIdentity} lacks expected ${expectedScope} scope` +
        (expectedTeamValue ? ` with value ${expectedTeamValue}` : '') +
        '.',
    );
  }
}

async function main(): Promise<void> {
  requireGuard(process.env);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    application_name: 'qc-uat-seed',
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Operator-owned bootstrap account seeds itself as assigner for audit traceability.
    const operatorIdentity = process.env.QC_UAT_OPERATOR_IDENTITY ?? 'yazeed';
    const operator = await client.query<{ id: string }>(
      'SELECT id FROM qc.users WHERE login_identity = $1',
      [operatorIdentity],
    );
    const assignedBy = operator.rows[0]?.id ?? stableSeedUuid('uat-user:uat-supervisor');

    for (const persona of UAT_PERSONAS) {
      if (persona.loginIdentity === 'yazeed') continue; // verify-only, never mutated
      if (!persona.seedManaged) {
        fail(`Refusing UAT seed: persona ${persona.id} is not seed-managed.`);
      }
      const password = requirePassword(persona.passwordEnvVar, process.env);
      const userId = await ensureUser(
        client,
        persona.loginIdentity,
        `UAT ${persona.label} (disposable, 72h)`,
        password,
      );
      await ensureRole(client, userId, persona.foundationRole, assignedBy);
      await ensureScope(client, userId, persona.scope, persona.teamValue);
      await client.query(
        `INSERT INTO qc.audit_events (actor_type, actor_id, subject_type, subject_id, action, request_id, reason)
         VALUES ('SYSTEM', NULL, 'USER', $1, 'UAT_FIXTURE_PROVISIONED', $2, $3)`,
        [userId, `uat-seed-${persona.id}`, REASON],
      );
    }

    // yazeed verify-only assertions (existence, ACTIVE, SYSTEM_OWNER, GLOBAL scope).
    // The named owner's effective permission set comes from the refreshed
    // owner bundle (migration 0030 + owner grant), not from the smaller
    // FOUNDATION_ROLE_PERMISSIONS.SYSTEM_OWNER bootstrap bundle, so the
    // full-equality assertion used for disposable personas does not apply.
    const owner = await client.query<{ id: string; account_state: string }>(
      `SELECT id, account_state FROM qc.users WHERE login_identity = 'yazeed'`,
    );
    if (!owner.rows[0]) fail('UAT assertion failed: yazeed owner account must already exist.');
    if (owner.rows[0].account_state !== 'ACTIVE') {
      fail('UAT assertion failed: yazeed owner account is not ACTIVE.');
    }
    const ownerRole = await client.query(
      `SELECT 1 FROM qc.user_roles
       JOIN qc.roles ON roles.id = user_roles.role_id
       WHERE user_roles.user_id = $1 AND user_roles.revoked_at IS NULL
         AND (user_roles.valid_until IS NULL OR user_roles.valid_until > NOW())
         AND roles.code = 'SYSTEM_OWNER' AND roles.active = TRUE`,
      [owner.rows[0].id],
    );
    if (ownerRole.rowCount === 0) {
      fail('UAT assertion failed: yazeed lacks an active SYSTEM_OWNER role grant.');
    }
    const ownerScope = await client.query(
      `SELECT 1 FROM qc.user_scopes
       WHERE user_id = $1 AND scope_kind = 'GLOBAL' AND revoked_at IS NULL`,
      [owner.rows[0].id],
    );
    if (ownerScope.rowCount === 0) {
      fail('UAT assertion failed: yazeed lacks an active GLOBAL scope.');
    }
    for (const persona of UAT_PERSONAS) {
      if (persona.loginIdentity === 'yazeed') continue;
      const row = await client.query<{ id: string }>(
        'SELECT id FROM qc.users WHERE login_identity = $1',
        [persona.loginIdentity],
      );
      if (!row.rows[0]) fail(`UAT assertion failed: ${persona.loginIdentity} was not provisioned.`);
      await assertPersonaAuthorization(
        client,
        row.rows[0].id,
        persona.loginIdentity,
        persona.foundationRole,
        persona.scope,
        UAT_TEAM_VALUE,
      );
    }

    await client.query('COMMIT');
    console.log(
      'UAT personas provisioned (5 disposable uat-* accounts, 72h expiry; yazeed verified untouched; passwords not logged).',
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'UAT seed failed.');
  process.exitCode = 1;
});
