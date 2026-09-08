import os from 'node:os';
import process from 'node:process';

/* global URL, fetch, console */

/*
 * Observational load runner. It has no capacity threshold and refuses writes
 * unless an operator supplies an explicit, disposable-environment opt-in.
 */
const baseUrl = process.env.QC_PERF_BASE_URL ?? 'http://127.0.0.1:4321';
const profile = process.env.QC_PERF_LOAD_PROFILE ?? 'dashboard-reads';
const concurrency = Math.max(1, Number.parseInt(process.env.QC_PERF_CONCURRENCY ?? '1', 10));
const requests = Math.max(1, Number.parseInt(process.env.QC_PERF_REQUESTS ?? '5', 10));

const profiles = {
  'concurrent-logins': { method: 'POST', path: '/login', write: true },
  'dashboard-reads': { method: 'GET', path: '/dashboard', write: false },
  'filtered-lists': { method: 'GET', path: '/tasks?status=OPEN', write: false },
  search: { method: 'GET', path: '/search?q=fixture', write: false },
  'receiving-item-creation': { method: 'POST', path: '/quarantine/receiving/new', write: true },
  'laboratory-writes': { method: 'POST', path: '/laboratory/tests', write: true },
  approvals: { method: 'POST', path: '/approvals', write: true },
  'report-generation': { method: 'GET', path: '/reports', write: false },
};

const selected = profiles[profile];
if (!selected) throw new Error(`Unknown QC_PERF_LOAD_PROFILE: ${profile}`);
if (selected.write && process.env.QC_PERF_ENABLE_WRITES !== 'true') {
  throw new Error(
    'Write profile blocked. Set QC_PERF_ENABLE_WRITES=true only for an approved disposable environment.',
  );
}

const endpoint = process.env.QC_PERF_PROFILE_PATH ?? selected.path;
const body = process.env.QC_PERF_PROFILE_BODY;
const headers = {
  ...(process.env.QC_PERF_COOKIE ? { cookie: process.env.QC_PERF_COOKIE } : {}),
  ...(body ? { 'content-type': 'application/json' } : {}),
};
const elapsed = [];
const statuses = [];
let cursor = 0;

async function worker() {
  while (cursor < requests) {
    cursor += 1;
    const startedAt = process.hrtime.bigint();
    const response = await fetch(new URL(endpoint, baseUrl), {
      method: selected.method,
      headers,
      ...(body ? { body } : {}),
    });
    await response.arrayBuffer();
    elapsed.push(Number(process.hrtime.bigint() - startedAt) / 1_000_000);
    statuses.push(response.status);
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
const sorted = elapsed.sort((a, b) => a - b);
const percentile = (p) => sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)];
console.log(
  JSON.stringify(
    {
      measuredAt: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: `${process.platform}-${process.arch}`,
        os: `${os.type()} ${os.release()}`,
        baseUrl,
      },
      profile,
      endpoint,
      method: selected.method,
      writeProfile: selected.write,
      requests,
      concurrency,
      statuses,
      latencyMs: { p50: percentile(0.5), p95: percentile(0.95), max: sorted.at(-1) },
      verdict: 'OBSERVATIONAL_ONLY — no approved capacity or latency threshold is encoded.',
    },
    null,
    2,
  ),
);
