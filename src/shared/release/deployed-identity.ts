/**
 * Fail-closed deployed build-identity verification (Prompt 12 / C-11).
 *
 * Pure shared kernel: no I/O, no database, no browser input. Every value
 * compared here must originate from server-side build evidence or from a
 * server-derived API/page surface. Browser-supplied identity is never
 * trusted — callers must pass only observed server values.
 */

export interface DeployedIdentitySample {
  releaseId?: string;
  buildId?: string;
  gitSha?: string;
  buildTimestamp?: string;
  environment?: string;
}

export interface DeployedIdentityTriple {
  /** Identity observed at the start of the live run. */
  start: DeployedIdentitySample;
  /** Identity observed at the end of the live run (detects mid-run redeploys). */
  end: DeployedIdentitySample;
  /** Expected identity from the release evidence package / ledger. */
  expected: DeployedIdentitySample;
}

const GIT_SHA = /^[0-9a-f]{40}$/i;
const RELEASE_ID = /^rel-[0-9a-f]{16}$/i;
const SAFE_VALUE = /^[A-Za-z0-9][A-Za-z0-9._:+/@-]{0,127}$/;

function fieldError(field: string, reason: string): Error {
  // Field names only. Observed values are server-derived build metadata, but
  // they are still omitted from errors to keep failure output sanitized.
  return new Error(`Deployed build identity is not verifiable: ${field} ${reason}.`);
}

function normalizeSha(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Fail closed when any required identity field is absent or malformed.
 * Throws on the first problem found; returns void when the sample is whole.
 */
export function assertDeployedIdentitySample(sample: DeployedIdentitySample): void {
  if (!sample.releaseId || !RELEASE_ID.test(sample.releaseId.trim())) {
    throw fieldError('releaseId', 'is missing or malformed');
  }
  if (!sample.buildId || !SAFE_VALUE.test(sample.buildId.trim())) {
    throw fieldError('buildId', 'is missing or malformed');
  }
  if (!sample.gitSha || !GIT_SHA.test(sample.gitSha.trim())) {
    throw fieldError('gitSha', 'is missing or malformed');
  }
  if (!sample.buildTimestamp || !Number.isFinite(Date.parse(sample.buildTimestamp))) {
    throw fieldError('buildTimestamp', 'is missing or malformed');
  }
  if (!sample.environment || !SAFE_VALUE.test(sample.environment.trim())) {
    throw fieldError('environment', 'is missing or malformed');
  }
}

function sameField(field: keyof DeployedIdentitySample, first: string, second: string): boolean {
  if (field === 'gitSha') return normalizeSha(first) === normalizeSha(second);
  return first.trim() === second.trim();
}

/**
 * C-11 gate: the start sample, the end sample, and the expected release
 * evidence must all describe the exact same deployed build. Any absence,
 * mismatch, or mid-run deployment change throws — never degrades to a
 * warning and never passes.
 */
export function assertSameDeployedIdentity(triple: DeployedIdentityTriple): void {
  assertDeployedIdentitySample(triple.start);
  assertDeployedIdentitySample(triple.end);
  assertDeployedIdentitySample(triple.expected);

  const fields: readonly (keyof DeployedIdentitySample)[] = [
    'releaseId',
    'buildId',
    'gitSha',
    'buildTimestamp',
    'environment',
  ];
  for (const field of fields) {
    const start = String(triple.start[field]);
    const end = String(triple.end[field]);
    const expected = String(triple.expected[field]);
    if (!sameField(field, start, end)) {
      throw fieldError(field, 'changed during the live run (possible redeploy)');
    }
    if (!sameField(field, start, expected)) {
      throw fieldError(field, 'differs from the release evidence package');
    }
  }
}
