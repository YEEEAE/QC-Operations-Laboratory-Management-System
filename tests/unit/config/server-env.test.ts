import { describe, expect, it } from 'vitest';
import { InvalidEnvironmentError, parseServerEnv } from '../../../src/config/env';
import { ENV_KEYS } from '../../../src/config/constants';
import { resolveLogLevel } from '../../../src/shared/observability/logger';

const productionBase = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://qc:secret@db.internal:5432/qc',
  SESSION_SECRET: 's'.repeat(32),
  SERVICE_VERSION: '0.1.0',
  RATE_LIMIT_LOGIN_MAX: '5',
  RATE_LIMIT_LOGIN_WINDOW_SECONDS: '60',
} as const;

describe('server environment configuration', () => {
  it('applies approved defaults outside production', () => {
    const env = parseServerEnv({});
    expect(env.NODE_ENV).toBe('development');
    expect(env.SERVICE_VERSION).toBe('0.1.0');
    expect(env.LOG_LEVEL).toBeUndefined();
  });

  it('fails closed in production when critical configuration is missing', () => {
    try {
      parseServerEnv({ NODE_ENV: 'production' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidEnvironmentError);
      const failure = error as InvalidEnvironmentError;
      expect(failure.missing).toEqual(
        expect.arrayContaining([
          ENV_KEYS.databaseUrl,
          ENV_KEYS.sessionSecret,
          ENV_KEYS.serviceVersion,
        ]),
      );
      expect(failure.missing.join(' ')).toContain(ENV_KEYS.rateLimitLoginMax);
    }
  });

  it('rejects non-PostgreSQL database URLs without echoing the value', () => {
    try {
      parseServerEnv({ NODE_ENV: 'test', DATABASE_URL: 'mysql://example.invalid/db' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidEnvironmentError);
      expect(String(error)).not.toContain('mysql://example.invalid/db');
      expect((error as InvalidEnvironmentError).invalid).toContain(ENV_KEYS.databaseUrl);
    }
  });

  it('requires OTEL endpoint and headers as a pair', () => {
    expect(() =>
      parseServerEnv({ NODE_ENV: 'test', OTEL_EXPORTER_OTLP_ENDPOINT: 'https://otel.invalid' }),
    ).toThrow(InvalidEnvironmentError);
    expect(() =>
      parseServerEnv({ NODE_ENV: 'test', OTEL_EXPORTER_OTLP_HEADERS: 'authorization=x' }),
    ).toThrow(InvalidEnvironmentError);
    expect(
      parseServerEnv({
        NODE_ENV: 'test',
        OTEL_EXPORTER_OTLP_ENDPOINT: 'https://otel.invalid',
        OTEL_EXPORTER_OTLP_HEADERS: 'authorization=x',
      }).OTEL_EXPORTER_OTLP_ENDPOINT,
    ).toBe('https://otel.invalid');
  });

  it('fails closed on a partial R2 backup configuration and accepts all-or-none', () => {
    for (const partial of [
      { R2_ENDPOINT: 'https://r2.invalid' },
      { R2_ENDPOINT: 'https://r2.invalid', R2_ACCESS_KEY_ID: 'a', R2_SECRET_ACCESS_KEY: 'b' },
      { R2_BUCKET: 'qc-backups' },
    ]) {
      try {
        parseServerEnv({ NODE_ENV: 'test', ...partial });
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidEnvironmentError);
        const invalid = (error as InvalidEnvironmentError).invalid;
        expect(invalid).toEqual(
          expect.arrayContaining([
            ENV_KEYS.r2Endpoint,
            ENV_KEYS.r2AccessKeyId,
            ENV_KEYS.r2SecretAccessKey,
            ENV_KEYS.r2Bucket,
          ]),
        );
      }
    }
    const complete = parseServerEnv({
      NODE_ENV: 'test',
      R2_ENDPOINT: 'https://r2.invalid',
      R2_ACCESS_KEY_ID: 'a',
      R2_SECRET_ACCESS_KEY: 'b',
      R2_BUCKET: 'qc-backups',
    });
    expect(complete.R2_BUCKET).toBe('qc-backups');
  });

  it('accepts only known log levels and never echoes the rejected value', () => {
    expect(parseServerEnv({ NODE_ENV: 'test', LOG_LEVEL: 'debug' }).LOG_LEVEL).toBe('debug');
    try {
      parseServerEnv({ NODE_ENV: 'test', LOG_LEVEL: 'verbose-please' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidEnvironmentError);
      expect(String(error)).not.toContain('verbose-please');
      expect((error as InvalidEnvironmentError).invalid).toContain(ENV_KEYS.logLevel);
    }
  });

  it('accepts a fully configured production environment', () => {
    const env = parseServerEnv({ ...productionBase });
    expect(env.NODE_ENV).toBe('production');
    expect(env.RATE_LIMIT_LOGIN_MAX).toBe('5');
  });
});

describe('resolveLogLevel', () => {
  it('passes through valid levels and degrades unknown values to the approved default', () => {
    expect(resolveLogLevel('warn')).toBe('warn');
    expect(resolveLogLevel(' DEBUG ')).toBe('debug');
    expect(resolveLogLevel(undefined)).toBe('info');
    expect(resolveLogLevel('verbose-please')).toBe('info');
  });
});
