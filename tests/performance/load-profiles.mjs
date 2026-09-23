import os from 'node:os';
import process from 'node:process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

/* global URL, fetch, console */

/*
 * Observational load runner. It has no capacity threshold and refuses writes
 * unless an operator supplies an explicit, disposable-environment opt-in.
 */
const baseUrl = process.env.QC_PERF_BASE_URL ?? 'http://127.0.0.1:4321';
const profile = process.env.QC_PERF_LOAD_PROFILE ?? 'dashboard-reads';
const concurrency = Math.max(1, Number.parseInt(process.env.QC_PERF_CONCURRENCY ?? '1', 10));
const requests = Math.max(1, Number.parseInt(process.env.QC_PERF_REQUESTS ?? '100', 10));
const warmupRequests = Math.max(
  0,
  Number.parseInt(process.env.QC_PERF_WARMUP_REQUESTS ?? '10', 10),
);
const baselinePath = process.env.QC_PERF_BASELINE_FILE;
const outputPath = process.env.QC_PERF_OUTPUT_FILE;
const metricsUrl = process.env.QC_PERF_METRICS_URL;
const datasetId = process.env.QC_PERF_DATASET_ID ?? null;

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
const bodySha256 = body ? createHash('sha256').update(body).digest('hex') : null;
const headers = {
  ...(process.env.QC_PERF_COOKIE ? { cookie: process.env.QC_PERF_COOKIE } : {}),
  ...(body ? { 'content-type': 'application/json' } : {}),
};
const elapsed = [];
const statuses = [];
let cursor = 0;
let peakRss = process.memoryUsage().rss;
let peakHeapUsed = process.memoryUsage().heapUsed;
const serverSamples = [];
let metricsError;
let sampleInProgress = false;
async function sampleServer() {
  if (!metricsUrl || sampleInProgress) return;
  sampleInProgress = true;
  try {
    const response = await fetch(metricsUrl, {
      headers: process.env.QC_PERF_METRICS_TOKEN
        ? { authorization: `Bearer ${process.env.QC_PERF_METRICS_TOKEN}` }
        : {},
    });
    if (!response.ok) throw new Error(`metrics endpoint returned HTTP ${response.status}`);
    serverSamples.push(await response.json());
  } catch (error) {
    metricsError = error instanceof Error ? error.message : 'metrics sampling failed';
  } finally {
    sampleInProgress = false;
  }
}
const memorySampler = setInterval(() => {
  const current = process.memoryUsage();
  peakRss = Math.max(peakRss, current.rss);
  peakHeapUsed = Math.max(peakHeapUsed, current.heapUsed);
  void sampleServer();
}, 100);

async function requestOnce() {
  const response = await fetch(new URL(endpoint, baseUrl), {
    method: selected.method,
    headers,
    ...(body ? { body } : {}),
  });
  await response.arrayBuffer();
  return response.status;
}

async function worker() {
  while (cursor < requests) {
    cursor += 1;
    const started = process.hrtime.bigint();
    const status = await requestOnce();
    const currentMemory = process.memoryUsage();
    peakRss = Math.max(peakRss, currentMemory.rss);
    peakHeapUsed = Math.max(peakHeapUsed, currentMemory.heapUsed);
    elapsed.push(Number(process.hrtime.bigint() - started) / 1_000_000);
    statuses.push(status);
  }
}

for (let i = 0; i < warmupRequests; i += 1) await requestOnce();
const warmedMemory = process.memoryUsage();
peakRss = warmedMemory.rss;
peakHeapUsed = warmedMemory.heapUsed;
serverSamples.length = 0;
await sampleServer();
const startedAt = new Date().toISOString();
try {
  await Promise.all(Array.from({ length: concurrency }, worker));
} finally {
  clearInterval(memorySampler);
}
const sorted = elapsed.sort((a, b) => a - b);
const percentile = (p) => sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)];
await sampleServer();
const maxMetric = (selector) =>
  serverSamples.reduce((maximum, sample) => Math.max(maximum, selector(sample) ?? 0), 0);
const result = {
  measuredAt: startedAt,
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
  bodySha256,
  datasetId,
  requests,
  warmupRequests,
  concurrency,
  statuses,
  latencyMs: { p50: percentile(0.5), p95: percentile(0.95), max: sorted.at(-1) },
  loadGeneratorMemoryBytes: {
    peakRss,
    peakHeapUsed,
  },
  applicationMemoryBytes:
    metricsUrl && serverSamples.length
      ? {
          samples: serverSamples.length,
          peakRss: maxMetric((sample) => sample.processMemoryBytes?.rss),
          peakHeapUsed: maxMetric((sample) => sample.processMemoryBytes?.heapUsed),
        }
      : { status: metricsError ?? 'NOT_CAPTURED — configure local QC_PERF_METRICS_URL' },
  databasePool:
    metricsUrl && serverSamples.length
      ? {
          samples: serverSamples.length,
          maxTotal: maxMetric((sample) => sample.databasePool?.total),
          maxWaiting: maxMetric((sample) => sample.databasePool?.waiting),
          configuredMaximum: maxMetric((sample) => sample.databasePool?.maximum),
        }
      : { status: metricsError ?? 'NOT_CAPTURED — configure local QC_PERF_METRICS_URL' },
  verdict: 'OBSERVATIONAL_ONLY — no approved capacity or latency threshold is encoded.',
};

if (baselinePath) {
  const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
  const sameScenario =
    [
      'profile',
      'endpoint',
      'method',
      'requests',
      'warmupRequests',
      'concurrency',
      'writeProfile',
      'bodySha256',
    ].every((key) => baseline[key] === result[key]) &&
    baseline.environment?.baseUrl === result.environment.baseUrl &&
    baseline.datasetId === result.datasetId;
  const hasServerMetrics =
    typeof result.applicationMemoryBytes.peakRss === 'number' &&
    typeof baseline.applicationMemoryBytes?.peakRss === 'number' &&
    typeof result.databasePool.maxTotal === 'number' &&
    typeof baseline.databasePool?.maxTotal === 'number';
  result.comparison = !sameScenario
    ? { status: 'REJECTED — scenario parameters differ' }
    : {
        status: hasServerMetrics ? 'COMPARABLE' : 'COMPARABLE_WITH_METRICS_GAPS',
        p95DeltaMs: result.latencyMs.p95 - baseline.latencyMs.p95,
        peakRssDeltaBytes:
          result.loadGeneratorMemoryBytes.peakRss - baseline.loadGeneratorMemoryBytes.peakRss,
        applicationPeakRssDeltaBytes: hasServerMetrics
          ? result.applicationMemoryBytes.peakRss - baseline.applicationMemoryBytes.peakRss
          : null,
        databasePoolMaxTotalDelta: hasServerMetrics
          ? result.databasePool.maxTotal - baseline.databasePool.maxTotal
          : null,
      };
}

const serialized = `${JSON.stringify(result, null, 2)}\n`;
if (outputPath) await writeFile(outputPath, serialized, { flag: 'wx' });
console.log(serialized);
