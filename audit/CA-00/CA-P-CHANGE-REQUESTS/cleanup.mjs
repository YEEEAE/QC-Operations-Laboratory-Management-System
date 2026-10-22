// Removes only the rows inserted by seed.mjs from the disposable database.
import { Pool } from 'pg';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const fixturePath = resolve('.tmp/ca-p-change-requests-fixture.json');
if (!existsSync(fixturePath)) {
  console.log('no fixture file; nothing to remove');
  process.exit(0);
}
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
const databaseUrl = `postgresql://qc_owner@localhost:55432/qc_disposable?sslmode=verify-full&sslrootcert=${resolve('.tmp/pg18/tls/ca.crt')}`;
const url = new URL(databaseUrl);
assert.equal(url.hostname, 'localhost');
assert.equal(url.port, '55432');
assert.equal(url.pathname, '/qc_disposable');

const pool = new Pool({ connectionString: databaseUrl });
const ids = Array.isArray(fixture.ids) ? fixture.ids : [];
const deleted = await pool.query('delete from qc.change_requests where id = any($1::uuid[])', [ids]);
console.log(JSON.stringify({ requested: ids.length, deleted: deleted.rowCount }));
rmSync(fixturePath, { force: true });
await pool.end();
