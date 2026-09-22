/* global console */

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
import { createHash } from 'node:crypto';

import { assertReleaseMetadataShape } from './release-id.mjs';
import { evidenceIdentity } from '../verification/evidence-identity.mjs';
import { readFile as readFileForManifest } from 'node:fs/promises';
import { hashFileTree } from './build-manifest.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '../..');

export function summarizeVitestReport(report) {
  if (report?.schemaVersion === 2 && report.totals && report.candidate) {
    return {
      total:
        report.totals.total ?? report.totals.passed + report.totals.failed + report.totals.skipped,
      passed: report.totals.passed,
      failed: report.totals.failed,
      skipped: report.totals.skipped,
    };
  }
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

export function evaluateReports(reports, { failOnSkip = false, expectedCandidate } = {}) {
  const failures = [];
  const summaries = {};
  for (const [suite, report] of Object.entries(reports)) {
    if (report === undefined) {
      failures.push(`missing evidence: expected report for suite "${suite}" was not produced`);
      continue;
    }
    const summary = summarizeVitestReport(report);
    summaries[suite] = summary;
    if (
      report.schemaVersion !== 2 ||
      !report.candidate ||
      !/^[a-f0-9]{64}$/.test(report.artifactDigest ?? '')
    ) {
      failures.push(`suite "${suite}" evidence is missing candidate identity or artifact digest`);
    } else if (expectedCandidate) {
      for (const field of ['gitSha', 'sourceFingerprint', 'migrationHead', 'nodeVersion']) {
        if (report.candidate[field] !== expectedCandidate[field])
          failures.push(`suite "${suite}" belongs to a different candidate (${field})`);
      }
      if (
        report.candidate.executionEnvironment?.kind !== expectedCandidate.executionEnvironment.kind
      )
        failures.push(`suite "${suite}" execution environment is incomplete or mismatched`);
      if (!report.candidate.generatedAt || Number.isNaN(Date.parse(report.candidate.generatedAt)))
        failures.push(`suite "${suite}" generation time is missing`);
    }
    if (report.runId !== expectedCandidate?.runId)
      failures.push(`suite "${suite}" is stale or belongs to another verification run`);
    if (suite === 'build' && report.artifactDigest !== expectedCandidate?.buildArtifactDigest)
      failures.push('build evidence does not match the current build artifact');
    if (suite === 'e2e') {
      if (!['PASS', 'PARTIAL'].includes(report.status) || report.totals.failed > 0)
        failures.push('E2E evidence is blocked or contains failed scenarios');
      const unjustifiedSkips = (report.scenarios ?? []).filter(
        (scenario) => scenario.status === 'SKIPPED' && !scenario.skipReason?.trim(),
      );
      if (unjustifiedSkips.length > 0)
        failures.push(
          `E2E evidence contains ${unjustifiedSkips.length} skipped scenario(s) without a documented reason`,
        );
      if ((report.scenarios ?? []).length !== summary.total)
        failures.push('E2E scenario count does not match its pass/fail/skip totals');
    }
    if (
      report.report &&
      report.artifactDigest !==
        createHash('sha256').update(JSON.stringify(report.report)).digest('hex')
    )
      failures.push(`suite "${suite}" report digest does not match its contents`);
    if (
      suite === 'e2e' &&
      report.artifactDigest !==
        createHash('sha256')
          .update(JSON.stringify({ scenarios: report.scenarios, totals: report.totals }))
          .digest('hex')
    )
      failures.push('E2E artifact digest does not match its scenarios');
    if (summary.failed > 0) failures.push(`suite "${suite}" has ${summary.failed} failed test(s)`);
    if (
      failOnSkip &&
      suite !== 'e2e' &&
      (summary.skipped ?? (summary.pending ?? 0) + (summary.todo ?? 0)) > 0
    )
      failures.push(
        `suite "${suite}" reports skipped tests; mandatory coverage may not be skipped`,
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
  return {
    releaseId: metadata.releaseId,
    gitSha: metadata.gitSha,
    environment: metadata.environment,
  };
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
    const resultsDir = resolve(repositoryRoot, valueAfter(args, '--results-dir') ?? '.ci-results');
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
        const reportName = suite === 'e2e' ? 'authenticated-e2e-evidence.json' : `${suite}.json`;
        reports[suite] = JSON.parse(await readFile(resolve(resultsDir, reportName), 'utf8'));
      } catch {
        reports[suite] = undefined;
      }
    }
    const runContext = JSON.parse(
      await readFile(
        resolve(
          repositoryRoot,
          valueAfter(args, '--run-context') ?? '.ci-results/run-context.json',
        ),
        'utf8',
      ),
    );
    const expectedCandidate = { ...(await evidenceIdentity()), runId: runContext.runId };
    if (
      runContext.candidate?.gitSha !== expectedCandidate.gitSha ||
      runContext.candidate?.sourceFingerprint !== expectedCandidate.sourceFingerprint
    )
      failures.push('verification run context is stale or bound to another candidate');
    if (expectedSuites.includes('build')) {
      const buildManifest = JSON.parse(
        await readFileForManifest(resolve(resultsDir, 'build-manifest.json'), 'utf8'),
      );
      const currentBuildManifest = await hashFileTree(resolve(repositoryRoot, 'dist'));
      if (buildManifest.digest !== currentBuildManifest.digest)
        failures.push('build manifest does not match the current build output');
      expectedCandidate.buildArtifactDigest = buildManifest.digest;
    }
    const evaluation = evaluateReports(reports, { failOnSkip, expectedCandidate });
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
