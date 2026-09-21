import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * QC-100-FINAL-036-A — environment parity and isolation guard contract.
 *
 * The guard is executed as the reviewer does (same command as `pnpm
 * release:parity:check`). Structural parity checks must PASS on this
 * repository; the local-runtime check reflects the actual running Node and is
 * asserted against package.json engines rather than assumed.
 */

type GuardResult = {
  status: string;
  checks: number;
  failed: string[];
  lines: string[];
};

function runGuard(): { result: GuardResult; exitCode: number } {
  let stdout = '';
  let exitCode = 0;
  try {
    stdout = execFileSync(
      'node',
      ['--import=tsx', 'scripts/release/check-environment-parity.mjs'],
      { encoding: 'utf8', env: process.env },
    );
  } catch (error) {
    const failure = error as { stdout?: string; status?: number };
    stdout = failure.stdout ?? '';
    exitCode = failure.status ?? 1;
  }
  const lines = stdout.trim().split('\n');
  const summary = JSON.parse(lines.at(-1) ?? '{}') as GuardResult;
  return { result: { ...summary, lines }, exitCode };
}

const manifest = JSON.parse(readFileSync('package.json', 'utf8')) as {
  engines: { node: string };
};

function satisfiesEngines(version: string, engines: string): boolean {
  const [currentMajor, currentMinor, currentPatch] = version
    .replace(/^v/, '')
    .split('.')
    .map(Number);
  const clauses = engines.trim().split(/\s+/);
  for (const clause of clauses) {
    const match = /^(>=|<=|>|<)?\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(clause);
    if (!match) continue;
    const [, operator, major, minor = '0', patch = '0'] = match;
    const target = [Number(major), Number(minor), Number(patch)];
    const current = [currentMajor, currentMinor, currentPatch];
    const order =
      Math.sign(current[0] - target[0]) ||
      Math.sign(current[1] - target[1]) ||
      Math.sign(current[2] - target[2]);
    if (operator === '>=' && order < 0) return false;
    if (operator === '<=' && order > 0) return false;
    if (operator === '>' && order <= 0) return false;
    if (operator === '<' && order >= 0) return false;
  }
  return true;
}

const detailFor = (lines: string[], check: string) =>
  lines.find((line) => line.includes(` ${check}:`)) ?? '';

describe('QC-100-FINAL-036-A environment parity guard', () => {
  const { result, exitCode } = runGuard();

  it('runs every declared check and reports a machine-readable summary', () => {
    expect(result.checks).toBe(7);
    expect(result.lines.filter((line) => /^\[(PASS|FAIL|INFO)\]/.test(line))).toHaveLength(7);
    expect(['ok', 'failed']).toContain(result.status);
  });

  it('binds CI runtime to the package toolchain contract', () => {
    expect(result.failed).not.toContain('ci-runtime-parity');
    expect(detailFor(result.lines, 'ci-runtime-parity')).toContain('24.20.0');
  });

  it('keeps schema identity aligned with the documented migration head', () => {
    expect(result.failed).not.toContain('schema-identity');
    expect(detailFor(result.lines, 'schema-identity')).toMatch(/head \d{4}_/);
  });

  it('documents every contract variable with names only and no tracked .env', () => {
    expect(result.failed).not.toContain('env-example-contract');
    expect(detailFor(result.lines, 'env-example-contract')).toContain('no secret values');
    expect(detailFor(result.lines, 'env-example-contract')).toContain('.env untracked');
  });

  it('keeps test fixtures and seed tooling out of the server source tree', () => {
    expect(result.failed).not.toContain('fixture-isolation');
    expect(detailFor(result.lines, 'fixture-isolation')).toContain('production-refusal guards');
  });

  it('reports the local runtime truthfully against the declared engines contract', () => {
    const satisfied = satisfiesEngines(process.version, manifest.engines.node);
    expect(detailFor(result.lines, 'runtime-contract')).toContain(process.version);
    if (satisfied) expect(result.failed).not.toContain('runtime-contract');
    else expect(result.failed).toContain('runtime-contract');
  });

  it('fails closed (non-zero exit) whenever any check fails', () => {
    expect(exitCode).toBe(result.failed.length === 0 ? 0 : 1);
  });
});
