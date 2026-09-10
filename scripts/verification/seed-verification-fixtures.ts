/**
 * Seed disposable verification fixtures for Prompt 13 (C-12).
 *
 * Safety properties:
 * - Refuses to run unless NODE_ENV is development|test AND
 *   QC_SEED_ALLOW_NON_PRODUCTION=true AND QC_VERIFICATION_SEED_ALLOW=true.
 * - Refuses against production hostnames (DATABASE_URL containing
 *   `qclevel.top`, `render.com`, or `prod` without `test`/`dev`/`localhost`).
 * - NEVER creates, resets, or mutates the `yazeed` SYSTEM_OWNER account.
 * - Passwords come only from QC_VERIFY_* env vars; nothing is logged.
 * - All disposable identities use the `verify-*` prefix; all disposable
 *   records use the `VERIFY-` prefix and a 24h expiry marker.
 * - Idempotent: re-running with the same env reuses existing fixtures.
 */
import { Pool, type PoolClient } from 'pg';
import { hash } from 'argon2';
import { randomUUID } from 'node:crypto';

import { stableSeedUuid } from '../../db/seeds/common.js';
import { VERIFICATION_PERSONAS } from '../../tests/fixtures/verification-personas.js';

const MIN_PASSWORD_LENGTH = 16;

function fail(message: string): never {
  throw new Error(message);
}

function requireGuard(env: NodeJS.ProcessEnv): void {
  const nodeEnv = env.NODE_ENV;
  if (nodeEnv !== 'development' && nodeEnv !== 'test') {
    fail('Refusing verification seed: NODE_ENV must be development or test.');
  }
  if (env.QC_SEED_ALLOW_NON_PRODUCTION !== 'true') {
    fail('Refusing verification seed: QC_SEED_ALLOW_NON_PRODUCTION=true is required.');
  }
  if (env.QC_VERIFICATION_SEED_ALLOW !== 'true') {
    fail('Refusing verification seed: QC_VERIFICATION_SEED_ALLOW=true is required.');
  }
  const databaseUrl = env.DATABASE_URL ?? '';
  if (!databaseUrl) fail('Refusing verification seed: DATABASE_URL is required.');
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
    fail('Refusing verification seed: DATABASE_URL looks like production.');
  }
}

function requirePassword(envVar: string, env: NodeJS.ProcessEnv): string {
  const value = env[envVar];
  if (!value || value.length < MIN_PASSWORD_LENGTH) {
    fail(
      `Refusing verification seed: ${envVar} must be set with at least ${MIN_PASSWORD_LENGTH} characters.`,
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
  const existing = await client.query<{ id: string }>(
    'SELECT id FROM qc.users WHERE login_identity = $1',
    [loginIdentity],
  );
  if (existing.rows[0]) return existing.rows[0].id;
  const passwordHash = await hash(password);
  const id = stableSeedUuid(`verification-user:${loginIdentity}`);
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
  if (!role.rows[0]) fail(`Foundation role is missing: ${roleCode}. Run the foundation seed first.`);
  const existing = await client.query(
    'SELECT id FROM qc.user_roles WHERE user_id = $1 AND role_id = $2 AND revoked_at IS NULL',
    [userId, role.rows[0].id],
  );
  if (existing.rows[0]) return;
  await client.query(
    `INSERT INTO qc.user_roles (id, user_id, role_id, assigned_by, reason, valid_until)
     VALUES ($1, $2, $3, $4, 'PROMPT-13 VERIFICATION FIXTURE (24H EXPIRY)', NOW() + INTERVAL '24 hours')`,
    [randomUUID(), userId, role.rows[0].id, assignedBy],
  );
}

async function ensureScope(
  client: PoolClient,
  userId: string,
  scopeKind: 'OWN' | 'TEAM' | 'GLOBAL',
): Promise<void> {
  const existing = await client.query(
    'SELECT id FROM qc.user_scopes WHERE user_id = $1 AND scope_kind = $2 AND revoked_at IS NULL',
    [userId, scopeKind],
  );
  if (existing.rows[0]) return;
  await client.query(
    `INSERT INTO qc.user_scopes (id, user_id, scope_kind, scope_value, assigned_by, reason)
     VALUES ($1, $2, $3, NULL, $4, 'PROMPT-13 VERIFICATION FIXTURE (24H EXPIRY)')`,
    [randomUUID(), userId, scopeKind, userId],
  );
}

async function main(): Promise<void> {
  requireGuard(process.env);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    application_name: 'qc-verification-seed',
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Operator-owned bootstrap account seeds itself as assigner for audit traceability.
    const operatorIdentity = process.env.QC_VERIFICATION_OPERATOR_IDENTITY ?? 'yazeed';
    const operator = await client.query<{ id: string }>(
      'SELECT id FROM qc.users WHERE login_identity = $1',
      [operatorIdentity],
    );
    const assignedBy =
      operator.rows[0]?.id ?? stableSeedUuid('verification-user:verify-supervisor');

    for (const persona of VERIFICATION_PERSONAS) {
      if (!persona.seedManaged) continue;
      if (persona.loginIdentity === 'yazeed') {
        fail('Refusing verification seed: yazeed must never be seed-managed.');
      }
      const password = requirePassword(persona.passwordEnvVar, process.env);
      const userId = await ensureUser(
        client,
        persona.loginIdentity,
        `Verification ${persona.label} (disposable, 24h)`,
        password,
      );
      if (persona.foundationRole !== 'NONE') {
        await ensureRole(client, userId, persona.foundationRole, assignedBy);
      }
      await ensureScope(client, userId, persona.scope === 'OWN' ? 'OWN' : persona.scope);
      await client.query(
        `INSERT INTO qc.audit_events (actor_type, actor_id, subject_type, subject_id, action, request_id, reason)
         VALUES ('SYSTEM', NULL, 'USER', $1, 'VERIFY_FIXTURE_PROVISIONED', $2, 'Prompt 13 disposable fixture (24h)')`,
        [userId, `verify-seed-${persona.id}`],
      );
    }
    await client.query('COMMIT');
    console.log(
      'Verification fixtures provisioned (seed-managed only; yazeed untouched; passwords not logged).',
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
  console.error(error instanceof Error ? error.message : 'Verification seed failed.');
  process.exitCode = 1;
});
