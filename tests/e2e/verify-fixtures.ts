/**
 * Candidate-bound verification fixtures (QC_VERIFY_*).
 *
 * Passwords never live in the repository: the CI workflow generates one-time
 * disposable values and the fixture runner seeds them into a disposable
 * database for the exact candidate that is being verified.
 *
 * Local runs skip the fixture-gated journeys when the fixtures are absent.
 * A CI run must never report a silent skip for a mandatory authenticated
 * journey, so the authenticated E2E runner declares `QC_MANDATORY_VERIFY_
 * FIXTURES=true` and a missing fixture then fails the run instead.
 */

const REQUIRED_FIXTURE_ENV = [
  'QC_VERIFY_BASE_URL',
  'QC_VERIFY_SYSTEM_OWNER_PASSWORD',
  'QC_VERIFY_SUPERVISOR_PASSWORD',
  'QC_VERIFY_MANAGER_PASSWORD',
  'QC_VERIFY_ADMIN_PASSWORD',
  'QC_VERIFY_EMPLOYEE_PASSWORD',
  'QC_VERIFY_LEAST_PASSWORD',
] as const;

export const FIXTURE_SKIP_MESSAGE = 'QC_VERIFY_* fixtures are absent; journey stays NOT VERIFIED.';

export function verificationFixturesPresent(): boolean {
  return REQUIRED_FIXTURE_ENV.every((name) => Boolean(process.env[name]));
}

/**
 * Fails the run when the pipeline declared these journeys mandatory but the
 * fixtures are absent, so a missing fixture can never look like a green skip.
 */
export function assertMandatoryVerificationFixtures(): void {
  if (process.env.QC_MANDATORY_VERIFY_FIXTURES !== 'true') return;
  if (verificationFixturesPresent()) return;
  const missing = REQUIRED_FIXTURE_ENV.filter((name) => !process.env[name]);
  throw new Error(
    `Mandatory authenticated journeys require candidate-bound QC_VERIFY_* fixtures; ` +
      `missing: ${missing.join(', ')}. Silent skips are not allowed for required CI coverage.`,
  );
}
