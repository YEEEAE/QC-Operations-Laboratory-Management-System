import { describe, expect, it } from 'vitest';
import { InvalidEnvironmentError, parseServerEnv } from '../../../src/config/env';

const production = {
  NODE_ENV: 'production',
  APP_ENVIRONMENT_PROFILE: 'production',
  NEON_BRANCH: 'production',
  DATABASE_URL: 'postgresql://runtime:synthetic@production.invalid/qc',
  PRODUCTION_DATABASE_HOST: 'production.invalid',
  PRODUCTION_DATABASE_NAME: 'qc',
  SESSION_SECRET: 's'.repeat(32),
  SERVICE_VERSION: '0.1.0',
  RATE_LIMIT_LOGIN_MAX: '5',
  RATE_LIMIT_LOGIN_WINDOW_SECONDS: '60',
};

function configurationFailure(input: Record<string, string | undefined>) {
  try {
    parseServerEnv(input);
    throw new Error('Expected configuration rejection');
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidEnvironmentError);
    return error as InvalidEnvironmentError;
  }
}

describe('runtime database profile isolation', () => {
  it('starts production without provisioning inactive staging or pilot databases', () => {
    expect(parseServerEnv(production).DATABASE_URL).toBe(production.DATABASE_URL);
  });

  it.each(['PRODUCTION_DATABASE_HOST', 'PRODUCTION_DATABASE_NAME'])(
    'still requires the active production identity: %s',
    (key) => {
      expect(configurationFailure({ ...production, [key]: undefined }).missing).toContain(key);
    },
  );

  it('requires both identity fields when an inactive profile is configured', () => {
    expect(
      configurationFailure({ ...production, STAGING_DATABASE_HOST: 'staging.invalid' }).missing,
    ).toContain('STAGING_DATABASE_NAME');
    expect(
      configurationFailure({ ...production, PILOT_DATABASE_NAME: 'qc_pilot' }).missing,
    ).toContain('PILOT_DATABASE_HOST');
  });

  it('rejects a configured inactive host that reuses the production host', () => {
    const error = configurationFailure({
      ...production,
      STAGING_DATABASE_HOST: production.PRODUCTION_DATABASE_HOST,
      STAGING_DATABASE_NAME: 'qc_staging',
    });
    expect(error.invalid).toContain('STAGING_DATABASE_HOST');
  });

  it.each([
    { PRODUCTION_DATABASE_HOST: 'wrong.invalid' },
    { PRODUCTION_DATABASE_NAME: 'wrong_database' },
    { NEON_BRANCH: 'staging' },
    { STAGING_DATABASE_URL: 'postgresql://runtime:synthetic@staging.invalid/qc' },
  ])('rejects mismatched identity, branch, or cross-profile credentials: %j', (override) => {
    configurationFailure({ ...production, ...override });
  });

  it('starts isolated staging without requiring an unused pilot identity', () => {
    const staging = {
      ...production,
      APP_ENVIRONMENT_PROFILE: 'staging',
      NEON_BRANCH: 'staging',
      DATABASE_URL: undefined,
      SESSION_SECRET: undefined,
      STAGING_DATABASE_URL: 'postgresql://runtime:synthetic@staging.invalid/qc_staging',
      STAGING_DATABASE_HOST: 'staging.invalid',
      STAGING_DATABASE_NAME: 'qc_staging',
      STAGING_SESSION_SECRET: 't'.repeat(32),
      STAGING_R2_ENDPOINT: 'https://storage.invalid',
      STAGING_R2_ACCESS_KEY_ID: 'synthetic',
      STAGING_R2_SECRET_ACCESS_KEY: 'synthetic',
      STAGING_R2_BUCKET: 'qc-staging',
    };
    expect(parseServerEnv(staging).DATABASE_URL).toBe(staging.STAGING_DATABASE_URL);
    expect(
      configurationFailure({ ...staging, PRODUCTION_DATABASE_HOST: undefined }).missing,
    ).toContain('PRODUCTION_DATABASE_HOST');
    configurationFailure({
      ...staging,
      STAGING_DATABASE_HOST: production.PRODUCTION_DATABASE_HOST,
    });
  });
});
