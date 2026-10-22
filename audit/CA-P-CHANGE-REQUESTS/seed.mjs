// Disposable-database fixture for CA-P-CHANGE-REQUESTS presentation evidence.
// Inserts change-request rows through the real qc.change_requests schema so the
// page renders them through ListChangeRequestsUseCase. It never reads .env,
// never touches a provider database, and only writes to the local disposable
// PostgreSQL 18 cluster on 127.0.0.1:55432.
import { Pool } from 'pg';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const databaseUrl = `postgresql://qc_owner@localhost:55432/qc_disposable?sslmode=verify-full&sslrootcert=${resolve('.tmp/pg18/tls/ca.crt')}`;
const url = new URL(databaseUrl);
assert.equal(url.hostname, 'localhost');
assert.equal(url.port, '55432');
assert.equal(url.pathname, '/qc_disposable');

const pool = new Pool({ connectionString: databaseUrl });
const admin = await pool.query(
  "select id from qc.users where login_identity = 'verify-admin' and account_state = 'ACTIVE'",
);
assert.equal(admin.rowCount, 1, 'verify-admin must exist in the disposable database');
const requestedBy = admin.rows[0].id;
const target = await pool.query(
  "select id from qc.document_versions where state in ('DRAFT','IN_REVIEW') order by created_at desc limit 1",
);
assert.equal(target.rowCount, 1, 'a controlled document version must exist for realistic target ids');
const targetId = target.rows[0].id;

const states = [
  'UNDER_REVIEW',
  'DRAFT',
  'SUBMITTED',
  'RETURNED',
  'APPROVED',
  'REVIEWED',
  'APPLYING',
  'APPLIED',
  'APPLICATION_FAILED',
  'CANCELLED',
];
const validStates = states.filter((state) => state !== 'REVIEWED');
const longChangeNo = `CR-2026-${'LONG-IDENTIFIER-'.repeat(6)}001`;

const ids = [];
const now = Date.now();
for (let index = 0; index < 28; index += 1) {
  const id = crypto.randomUUID();
  const changeNo = index === 0 ? longChangeNo : `CR-2026-${String(index + 1).padStart(4, '0')}`;
  // One non-document target type lets the Target type filter be exercised with
  // real stored values; the UI falls back to the raw code, as designed.
  const targetType = index === 27 ? 'DOCUMENT' : 'DOCUMENT_VERSION';
  const state = validStates[index % validStates.length];
  const updatedAt = new Date(now - index * 60 * 60 * 1000);
  await pool.query(
    `insert into qc.change_requests
      (id, change_no, target_type, target_id, target_version, state, reason, target_snapshot, requested_by, updated_at, version)
     values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11)`,
    [
      id,
      changeNo,
      targetType,
      targetId,
      String(index + 1),
      state,
      index === 0
        ? 'Long source-derived reason used to confirm that operator copy wraps without clipping the record identity.'
        : `Disposable verification reason ${index + 1}.`,
      JSON.stringify({ documentId: targetId, revision: `Rev ${String(index + 1).padStart(2, '0')}` }),
      requestedBy,
      updatedAt,
      (index % 4) + 1,
    ],
  );
  ids.push(id);
}

const fixture = resolve('.tmp/ca-p-change-requests-fixture.json');
if (existsSync(fixture)) {
  const previous = JSON.parse(readFileSync(fixture, 'utf8'));
  if (Array.isArray(previous.ids)) ids.push(...previous.ids);
}
writeFileSync(fixture, JSON.stringify({ ids, requestedBy, targetId }, null, 2));
console.log(JSON.stringify({ inserted: ids.length, requestedBy, targetId }));
await pool.end();
