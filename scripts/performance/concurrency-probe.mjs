/**
 * QC-100-FINAL-007 §4 — approved concurrency exercise (READ-ONLY).
 * Local disposable measurement server only. Writes are never issued here;
 * the write path is exercised at unit-tested contention level via the
 * checked-in concurrency suite (tests/integration/concurrency).
 * Prints one JSON document: latency distribution per concurrency rung,
 * status classes, and observed pg_stat_activity peak.
 */
import { readFileSync } from 'node:fs';
import { Pool } from 'pg';

/* global URL, console, fetch, process */

const baseUrl = process.env.QC_PERF_BASE_URL ?? 'http://127.0.0.1:4321';
if (!['localhost', '127.0.0.1'].includes(new URL(baseUrl).hostname)) {
  throw new Error('Refusing: QC_PERF_BASE_URL must be local.');
}
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL required for pool observation.');
const u = new URL(databaseUrl);
if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1')
  throw new Error('Refusing: non-local DATABASE_URL.');

const cookie = readFileSync('.tmp/perf007-cookie.txt', 'utf8').trim();
const rungs = (process.env.QC_PERF_RUNGS ?? '1,4,8,16,24').split(',').map(Number);
const requestsPerRung = Number(process.env.QC_PERF_RUNG_REQUESTS ?? '40');
const endpoints = ['/dashboard', '/tasks?state=OPEN'];

const db = new Pool({ connectionString: databaseUrl, application_name: 'qc-perf-concurrency' });
async function peakBackends() {
  const r = await db.query(
    `SELECT count(*)::int AS n FROM pg_stat_activity
     WHERE backend_type = 'client backend' AND datname = current_database()`,
  );
  return r.rows[0].n;
}

function percentile(sorted, p) {
  return sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)];
}

const rungsOut = [];
for (const concurrency of rungs) {
  const started = Date.now();
  let cursor = 0;
  const elapsed = [];
  const statuses = [];
  async function worker() {
    while (cursor < requestsPerRung) {
      cursor += 1;
      const endpoint = endpoints[cursor % endpoints.length];
      const t0 = process.hrtime.bigint();
      const res = await fetch(new URL(endpoint, baseUrl), { headers: { cookie } });
      await res.arrayBuffer();
      elapsed.push(Number(process.hrtime.bigint() - t0) / 1_000_000);
      statuses.push(res.status);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  elapsed.sort((a, b) => a - b);
  const byStatus = {};
  for (const s of statuses) byStatus[s] = (byStatus[s] ?? 0) + 1;
  rungsOut.push({
    concurrency,
    requests: requestsPerRung,
    endpoints,
    wallSeconds: Math.round(((Date.now() - started) / 1000) * 10) / 10,
    statusCounts: byStatus,
    latencyMs: {
      p50: Math.round(percentile(elapsed, 0.5) * 10) / 10,
      p95: Math.round(percentile(elapsed, 0.95) * 10) / 10,
      max: Math.round(Math.max(...elapsed) * 10) / 10,
    },
    appBackendsObserved: await peakBackends(),
  });
}
await db.end();
console.log(
  JSON.stringify(
    {
      measuredAt: new Date().toISOString(),
      baseUrl,
      identity: 'perf-measure (disposable)',
      poolConfig: 'default node-postgres pool (max 10), single shared pool via getPool()',
      writePath:
        'NOT EXERCISED by this probe — covered by tests/integration/concurrency (see §4 evidence)',
      rungs: rungsOut,
    },
    null,
    2,
  ),
);
