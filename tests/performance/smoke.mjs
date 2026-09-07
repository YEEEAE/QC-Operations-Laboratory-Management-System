import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import process from 'node:process';

/* global URL, fetch, console */
// Node.js runtime globals used by this performance probe (no DOM involved).

const baseUrl = process.env.QC_PERF_BASE_URL ?? 'http://127.0.0.1:4321';
const paths = (
  process.env.QC_PERF_PATHS ?? '/login,/definitely-not-a-page-master034,/api/health/ready'
)
  .split(',')
  .map((path) => path.trim())
  .filter(Boolean);
const samples = Math.max(1, Number.parseInt(process.env.QC_PERF_SAMPLES ?? '5', 10));
const warmups = Math.max(0, Number.parseInt(process.env.QC_PERF_WARMUPS ?? '1', 10));

function percentile(values, percentileValue) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

async function gitValue(args) {
  try {
    const child = await import('node:child_process');
    return await new Promise((resolve) => {
      child.execFile('git', args, { cwd: process.cwd() }, (error, stdout) =>
        resolve(error ? 'unavailable' : stdout.trim()),
      );
    });
  } catch {
    return 'unavailable';
  }
}

async function releaseIdentity() {
  const packageJson = JSON.parse(
    await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
  );
  const distEntry = new URL('../../dist/server/entry.mjs', import.meta.url);
  let artifactSha256 = 'not-built';
  try {
    artifactSha256 = createHash('sha256')
      .update(await readFile(distEntry))
      .digest('hex');
  } catch {
    // The smoke runner can still measure a separately managed server.
  }
  return {
    serviceVersion: process.env.SERVICE_VERSION ?? packageJson.version,
    gitSha: await gitValue(['rev-parse', 'HEAD']),
    workingTree: await gitValue(['status', '--short']),
    artifactSha256,
  };
}

async function samplePath(path) {
  const url = new URL(path, baseUrl).toString();
  for (let index = 0; index < warmups; index += 1) await fetch(url, { headers: requestHeaders() });
  const timings = [];
  const statuses = [];
  const bytes = [];
  for (let index = 0; index < samples; index += 1) {
    const started = process.hrtime.bigint();
    const response = await fetch(url, { headers: requestHeaders() });
    const firstByte = process.hrtime.bigint();
    const body = await response.arrayBuffer();
    const finished = process.hrtime.bigint();
    statuses.push(response.status);
    bytes.push(body.byteLength);
    timings.push({
      ttfbMs: Number(firstByte - started) / 1_000_000,
      totalMs: Number(finished - started) / 1_000_000,
    });
  }
  return {
    path,
    samples,
    statuses,
    responseBytes: { min: Math.min(...bytes), max: Math.max(...bytes), last: bytes.at(-1) },
    ttfbMs: {
      p50: percentile(
        timings.map((item) => item.ttfbMs),
        50,
      ),
      p95: percentile(
        timings.map((item) => item.ttfbMs),
        95,
      ),
    },
    totalMs: {
      p50: percentile(
        timings.map((item) => item.totalMs),
        50,
      ),
      p95: percentile(
        timings.map((item) => item.totalMs),
        95,
      ),
    },
  };
}

function requestHeaders() {
  const headers = {};
  if (process.env.QC_PERF_COOKIE) headers.cookie = process.env.QC_PERF_COOKIE;
  return headers;
}

const result = {
  measuredAt: new Date().toISOString(),
  environment: {
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    os: `${os.type()} ${os.release()}`,
    baseUrl,
    dataset:
      process.env.QC_PERF_DATASET ??
      'unauthenticated representative routes; no database dataset supplied',
    databaseVersion: process.env.QC_PERF_DATABASE_VERSION ?? 'not supplied',
  },
  release: await releaseIdentity(),
  methodology: {
    warmups,
    samples,
    thresholds: 'none — no approved performance SLO exists',
    note: 'Measurements are observational and are not a PASS/FAIL gate.',
  },
  paths: [],
};

for (const path of paths) result.paths.push(await samplePath(path));
console.log(JSON.stringify(result, null, 2));
