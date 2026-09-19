/**
 * QC-100-FINAL-007 §2 — EXPLAIN (ANALYZE, BUFFERS) of critical reads.
 * Runs against the disposable local cluster only (DATABASE_URL must be the
 * disposable qc_disposable/qc_test/qc_perf database on localhost).
 * Prints one JSON document: one EXPLAIN row set per statement.
 */
import { Pool } from 'pg';

function guard(url) {
  const u = new URL(url);
  if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') throw new Error('Refusing: non-local DATABASE_URL.');
  const db = decodeURIComponent(u.pathname.replace(/^\//, ''));
  if (!['qc_disposable', 'qc_test', 'qc_perf'].includes(db)) throw new Error(`Refusing: not a disposable database (${db}).`);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL required.');
guard(databaseUrl);

const pool = new Pool({ connectionString: databaseUrl, application_name: 'qc-perf-explain' });
const client = await pool.connect();
try {
  const actor = (
    await client.query(`SELECT id FROM qc.users WHERE login_identity = 'perf-measure' LIMIT 1`)
  ).rows[0]?.id;
  const statements = [
    {
      name: 'dashboard: audit activity timeline (actor-scoped, bounded)',
      sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT id, event_no, occurred_at, actor_type, actor_id, subject_type, subject_id,
               action, old_state, new_state, reason, request_id, signature_id
        FROM qc.audit_events WHERE actor_id = $1
        ORDER BY occurred_at DESC, event_no DESC LIMIT 8`,
      params: [actor],
    },
    {
      name: 'tasks: full-scope list page (UNBOUNDED — measured risk)',
      sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT * FROM qc.tasks ORDER BY updated_at DESC, id DESC`,
      params: [],
    },
    {
      name: 'tasks: checklist batch read for 3000 ids (IN-list bound)',
      sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT * FROM qc.task_checklist_items
        WHERE task_id IN (SELECT id FROM qc.tasks WHERE task_no LIKE 'PERF-%')
        ORDER BY position`,
      params: [],
    },
    {
      name: 'receiving register scan (quarantine source, 8000 rows)',
      sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT * FROM qc.receiving_items WHERE receiving_no LIKE 'PERF-%' ORDER BY created_at DESC`,
      params: [],
    },
    {
      name: 'inspection reports by state (review queue shape)',
      sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT * FROM qc.inspection_reports WHERE state = 'UNDER_REVIEW' ORDER BY created_at DESC LIMIT 50`,
      params: [],
    },
    {
      name: 'lab tests by state (workload shape)',
      sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT * FROM qc.lab_tests WHERE state IN ('SUBMITTED','UNDER_REVIEW') ORDER BY created_at DESC LIMIT 50`,
      params: [],
    },
    {
      name: 'daily reject reports register (largest HTML doc ~100KB)',
      sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT * FROM qc.reject_reports ORDER BY created_at DESC LIMIT 50`,
      params: [],
    },
    {
      name: 'notifications recipient queue',
      sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT * FROM qc.notifications WHERE dedupe_key LIKE 'PERF-%' ORDER BY created_at DESC LIMIT 50`,
      params: [],
    },
    {
      name: 'outbox pending drain shape',
      sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
        SELECT to_regclass('qc.qc_outbox')::text AS outbox_relation`,
      params: [],
    },
  ];
  const results = [];
  for (const statement of statements) {
    const started = process.hrtime.bigint();
    const rows = (await client.query(statement.sql, statement.params)).rows;
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    const plan = rows[0]['QUERY PLAN'][0].Plan;
    const summarize = (node, depth = 0) => {
      const out = {
        node: node['Node Type'],
        relation: node['Relation Name'] ?? null,
        index: node['Index Name'] ?? null,
        rows: node['Actual Rows'],
        loops: node['Actual Loops'],
        totalMs: node['Actual Total Time'],
        sharedHit: node['Shared Hit Blocks'] ?? 0,
        sharedRead: node['Shared Read Blocks'] ?? 0,
      };
      if (node.Plans) out.children = node.Plans.map((p) => summarize(p, depth + 1));
      return out;
    };
    results.push({
      name: statement.name,
      totalElapsedMs: Math.round(elapsedMs * 100) / 100,
      plan: summarize(plan),
    });
  }
  const indexes = (
    await client.query(
      `SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'qc' AND indexname LIKE 'idx_%__%' ORDER BY 1, 2`,
    )
  ).rows;
  console.log(
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        database: 'disposable local PostgreSQL 18.6 (qc_disposable)',
        pgVersion: (await client.query('SHOW server_version')).rows[0].server_version,
        statements: results,
        migration0029IndexCount: indexes.length,
        migration0029IndexSample: indexes.slice(0, 5),
      },
      null,
      2,
    ),
  );
} finally {
  client.release();
  await pool.end();
}

