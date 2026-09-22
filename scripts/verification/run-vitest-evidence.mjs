import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';
import { verificationRun } from './evidence-identity.mjs';

const args = process.argv.slice(2);
const suite = args.shift();
if (!suite || args.shift() !== '--')
  throw new Error('Usage: run-vitest-evidence.mjs <suite> -- <vitest args>');
if (args[0] === 'vitest') args.shift();
const output = resolve(`.ci-results/${suite}.json`);
const raw = resolve(`.ci-results/${suite}.vitest.json`);
await mkdir('.ci-results', { recursive: true });
await rm(raw, { force: true });
const child = spawn(
  resolve('node_modules/.bin/vitest'),
  [...args, '--reporter=default', '--reporter=json', `--outputFile=${raw}`],
  { stdio: 'inherit', env: process.env },
);
const code = await new Promise((done, reject) => {
  child.once('error', reject);
  child.once('exit', (status) => done(status ?? 1));
});
let report;
try {
  report = JSON.parse(await readFile(raw, 'utf8'));
} catch {
  report = undefined;
}
if (!report) {
  console.error(`No machine-readable ${suite} report was produced.`);
  process.exit(code || 1);
}
const rawDigest = createHash('sha256').update(JSON.stringify(report)).digest('hex');
const totals = {
  total: Number(report.numTotalTests ?? 0),
  passed: Number(report.numPassedTests ?? 0),
  failed: Number(report.numFailedTests ?? 0),
  skipped: Number(report.numPendingTests ?? 0) + Number(report.numTodoTests ?? 0),
};
const run = await verificationRun();
await writeFile(
  output,
  `${JSON.stringify({ schemaVersion: 2, suite, runId: run.runId, candidate: run.candidate, artifactDigest: rawDigest, totals, report }, null, 2)}\n`,
);
await rm(raw, { force: true });
process.exit(code);
