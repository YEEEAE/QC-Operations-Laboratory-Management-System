import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * QC-100-FINAL-036-A — verification-evidence completeness gate.
 *
 * Exercises the real CLI: missing reports, failed tests, mandatory skips, and
 * release metadata that is absent or bound to another candidate must all fail
 * closed. Nothing here converts absent coverage into a PASS.
 */

type Run = { status: number; stdout: string; stderr: string };

function run(args: string[]): Run {
  try {
    const stdout = execFileSync(
      'node',
      ['scripts/release/check-verification-evidence.mjs', ...args],
      {
        encoding: 'utf8',
        env: process.env,
      },
    );
    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string; status?: number };
    return {
      status: failure.status ?? 1,
      stdout: failure.stdout ?? '',
      stderr: failure.stderr ?? '',
    };
  }
}

const report = (overrides: Record<string, number> = {}) =>
  JSON.stringify({
    numTotalTests: 10,
    numPassedTests: 10,
    numFailedTests: 0,
    numPendingTests: 0,
    numTodoTests: 0,
    testResults: [{ name: 'suite.test.ts', assertionResults: [] }],
    ...overrides,
  });

const workdir = mkdtempSync(join(tmpdir(), 'qc-evidence-'));
const currentSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

function prepareReleaseEvidence(): string {
  const output = join(workdir, 'release-identity.json');
  execFileSync(
    'node',
    [
      'scripts/release/release-id.mjs',
      '--environment',
      'ci',
      '--build-id',
      'github-1.1',
      '--output',
      output,
    ],
    { encoding: 'utf8' },
  );
  return output;
}

describe('QC-100-FINAL-036-A verification evidence gate', () => {
  it('passes only when every expected suite report is present and clean', () => {
    const resultsDir = mkdtempSync(join(workdir, 'clean-'));
    writeFileSync(join(resultsDir, 'integration.json'), report());
    const outcome = run(['--results-dir', resultsDir, '--expect', 'integration', '--fail-on-skip']);
    expect(outcome.status).toBe(0);
    expect(JSON.parse(outcome.stdout)).toMatchObject({
      status: 'ok',
      suites: { integration: { total: 10, passed: 10, pending: 0 } },
    });
  });

  it('fails closed when a mandatory suite produced no report', () => {
    const resultsDir = mkdtempSync(join(workdir, 'missing-'));
    const outcome = run(['--results-dir', resultsDir, '--expect', 'concurrency']);
    expect(outcome.status).toBe(1);
    expect(JSON.parse(outcome.stdout).failures.join(' ')).toContain('missing evidence');
  });

  it('fails closed on failed and on skipped mandatory coverage', () => {
    const resultsDir = mkdtempSync(join(workdir, 'skipped-'));
    writeFileSync(
      join(resultsDir, 'security.json'),
      report({ numPassedTests: 8, numFailedTests: 1, numPendingTests: 1, numTodoTests: 1 }),
    );
    const outcome = run(['--results-dir', resultsDir, '--expect', 'security', '--fail-on-skip']);
    expect(outcome.status).toBe(1);
    const failures = JSON.parse(outcome.stdout).failures.join(' ');
    expect(failures).toContain('1 failed test(s)');
    expect(failures).toContain('may not be skipped');
  });

  it('requires candidate-bound release metadata when --require-release is set', () => {
    const resultsDir = mkdtempSync(join(workdir, 'release-'));
    writeFileSync(join(resultsDir, 'integration.json'), report());
    const absent = run([
      '--results-dir',
      resultsDir,
      '--expect',
      'integration',
      '--require-release',
      '--input',
      join(workdir, 'absent.json'),
    ]);
    expect(absent.status).toBe(1);
    expect(JSON.parse(absent.stdout).failures.join(' ')).toContain('missing release metadata');

    const evidence = prepareReleaseEvidence();
    const wrongSha = run([
      '--results-dir',
      resultsDir,
      '--expect',
      'integration',
      '--require-release',
      '--input',
      evidence,
      '--expected-git-sha',
      'a'.repeat(40),
    ]);
    expect(wrongSha.status).toBe(1);
    expect(JSON.parse(wrongSha.stdout).failures.join(' ')).toContain('not bound');

    const bound = run([
      '--results-dir',
      resultsDir,
      '--expect',
      'integration',
      '--require-release',
      '--input',
      evidence,
      '--expected-git-sha',
      currentSha,
    ]);
    expect(bound.status).toBe(0);
    expect(JSON.parse(bound.stdout).release.gitSha).toBe(currentSha);
  });
});
