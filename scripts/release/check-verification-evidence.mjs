/* global console, process */

/**
 * Verification-evidence completeness gate (QC-100-FINAL-036-A).
 *
 * Fails closed — it never converts missing evidence or a mandatory skip into a
 * PASS. Three contract families:
 *
 * 1. Expected Vitest JSON reports (`.ci-results/<name>.json`) must exist.
 * 2. With `--fail-on-skip`, any pending/todo test in those reports fails the
 *    gate; a failed test always fails the gate.
 * 3. With `--require-release`, `dist/release-identity.json` (or `--input`)
 *    must exist, must satisfy the release-evidence schema, and must be bound
 *    to the expected Git SHA (`--expected-git-sha`, `$GITHUB_SHA`, or HEAD).
 *
 * Output is a JSON summary; no secret values are read or printed.
 */

import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { assertReleaseMetadataShape } from './release-id.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '../..');

export function summarizeVitestReport(report) {
  if (!report || typeof report !== 'object' || !Array.isArray(report.testResults))
    throw new Error('Invalid Vitest JSON report: missing testResults.');
  return {
    total: Number(report.numTotalTests ?? 0),
    passed: Number(report.numPassedTests ?? 0),
    failed: Number(report.numFailedTests ?? 0),
    pending: Number(report.numPendingTests ?? 0),
    todo: Number(report.numTodoTests ?? 0),
  };
}

export function evaluateReports(reports, { failOnSkip = false } = {}) {
  const failures = [];
  const summaries = {};
  for (const [suite, report] of Object.entries(reports)) {
    if (report === undefined) {
      failures.push(`missing evidence: expected report for suite "${suite}" was not produced`);
      continue;
    }
    const summary = summarizeVitestReport(report);
    summaries[suite] = summary;
    if (summary.failed > 0)
      failures.push(`suite "${suite}" has ${summary.failed} failed test(s)`);
    if (failOnSkip && summary.pending + summary.todo > 0)
      failures.push(
        `suite "${suite}" reports ${summary.pending} pending and ${summary.todo} todo test(s); mandatory coverage may not be skipped`,
      );
  }
  return { failures, summaries };
}

export function evaluateReleaseEvidence(metadata, { expectedGitSha } = {}) {
  assertReleaseMetadataShape(metadata);
  if (expectedGitSha && metadata.gitSha !== expectedGitSha.toLowerCase())
    throw new Error(
      `Release evidence is not bound to the expected checkout: expected ${expectedGitSha}, actual ${metadata.gitSha}.`,
    );
  return { releaseId: metadata.releaseId, gitSha: metadata.gitSha, environment: metadata.environment };
}

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
  return value;
}

function valuesAfter(args, flag) {
  const values = [];
  let index = args.indexOf(flag);
  while (index !== -1) {
    const value = args[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
    values.push(value);
    index = args.indexOf(flag, index + 2);
  }
  return values;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const failures = [];
  const summary = { suites: {}, release: undefined };
  try {
    const args = process.argv.slice(2).filter((arg) => arg !== '--');
    const resultsDir = resolve(
      repositoryRoot,
      valueAfter(args, '--results-dir') ?? '.ci-results',
    );
    const expectedSuites = valuesAfter(args, '--expect');
    const failOnSkip = args.includes('--fail-on-skip');
    const requireRelease = args.includes('--require-release');
    const releaseInput = resolve(
      repositoryRoot,
      valueAfter(args, '--input') ?? 'dist/release-identity.json',
    );

    const reports = {};
    for (const suite of expectedSuites) {
      try {
        reports[suite] = JSON.parse(
          await readFile(resolve(resultsDir, `${suite}.json`), 'utf8'),
        );
      } catch {
        reports[suite] = undefined;
      }
    }
    const evaluation = evaluateReports(reports, { failOnSkip });
    failures.push(...evaluation.failures);
    summary.suites = evaluation.summaries;

    if (requireRelease) {
      let metadata;
      try {
        metadata = JSON.parse(await readFile(releaseInput, 'utf8'));
      } catch {
        failures.push(
          'missing release metadata: release identity evidence was not produced for this candidate',
        );
      }
      if (metadata) {
        const expectedGitSha =
          valueAfter(args, '--expected-git-sha') ??
          process.env.GITHUB_SHA ??
          execFileSync('git', ['rev-parse', 'HEAD'], {
            cwd: repositoryRoot,
            encoding: 'utf8',
          }).trim();
        try {
          summary.release = evaluateReleaseEvidence(metadata, { expectedGitSha });
        } catch (error) {
          failures.push(error instanceof Error ? error.message : 'Invalid release evidence.');
        }
      }
    }
  } catch (error) {
    failures.push(error instanceof Error ? error.message : 'Unable to evaluate evidence.');
  }

  console.log(
    JSON.stringify(
      { status: failures.length === 0 ? 'ok' : 'failed', failures, ...summary },
      null,
      2,
    ),
  );
  process.exit(failures.length === 0 ? 0 : 1);
}
