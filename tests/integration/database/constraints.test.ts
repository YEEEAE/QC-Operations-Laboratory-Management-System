import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createPool } from '../../../src/shared/database/pool.js';
import { migrate } from '../../../scripts/db/migrate.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

describe('core PostgreSQL constraints and privileges', () => {
  let pool: ReturnType<typeof createPool> | undefined;

  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer()),
      max: 2,
    });
    await migrate({ pool: pool! });
  });

  afterAll(async () => {
    await pool?.end();
    await stopPostgresContainer();
  });

  it('uses PostgreSQL UUIDv7 defaults and rejects duplicate login identities', async () => {
    const first = await pool!.query(
      `INSERT INTO qc.users (login_identity, display_name, password_hash)
       VALUES ('user-1', 'User One', 'test-hash') RETURNING id`,
    );
    expect(first.rows[0].id).toMatch(/^[0-9a-f-]{36}$/);
    await expect(
      pool!.query(
        `INSERT INTO qc.users (login_identity, display_name, password_hash) VALUES ('user-1', 'Other', 'hash')`,
      ),
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('enforces session expiry, FK ownership, and append-only audit references', async () => {
    const user = await pool!.query(
      `INSERT INTO qc.users (login_identity, display_name, password_hash) VALUES ('user-2', 'User Two', 'hash') RETURNING id`,
    );
    const userId = user.rows[0].id as string;
    await expect(
      pool!.query(
        `INSERT INTO qc.sessions (user_id, session_token_hash, expires_at) VALUES ($1, 'token-1', CURRENT_TIMESTAMP)`,
        [userId],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await pool!.query(
      `INSERT INTO qc.audit_events (actor_type, actor_id, subject_type, subject_id, action, request_id)
       VALUES ('USER', $1, 'USER', $1, 'CREATED', 'request-1')`,
      [userId],
    );
    await expect(pool!.query('DELETE FROM qc.users WHERE id = $1', [userId])).rejects.toMatchObject(
      {
        code: '23503',
      },
    );
    expect(
      (
        await pool!.query(
          'SELECT count(*)::int AS count FROM qc.audit_events WHERE actor_id = $1',
          [userId],
        )
      ).rows[0].count,
    ).toBe(1);
  });

  it('does not grant runtime role DDL or public schema create privileges', async () => {
    const result = await pool!.query(`
      SELECT r.rolname, r.rolsuper, r.rolcreatedb, r.rolcreaterole,
             has_schema_privilege(r.rolname, 'qc', 'CREATE') AS can_create_qc,
             has_schema_privilege(r.rolname, 'public', 'CREATE') AS can_create_public
      FROM pg_roles r WHERE r.rolname = 'qc_app_runtime'
    `);
    expect(result.rows[0]).toMatchObject({
      rolsuper: false,
      rolcreatedb: false,
      rolcreaterole: false,
      can_create_qc: false,
      can_create_public: false,
    });
    const session = await pool!.query('SHOW search_path');
    expect(session.rows[0].search_path).toContain('qc');
    expect(session.rows[0].search_path).toContain('pg_catalog');
  });
});
