import { describe, expect, it } from 'vitest';
import { classifyPreflightError, formatPreflightError } from '../../../scripts/db/preflight';
import { parseLocalEnvFile } from '../../../scripts/db/load-local-env';
import {
  DatabaseConfigurationError,
  getDatabaseConnectionConfig,
} from '../../../src/shared/database/pool';

describe('database preflight diagnostics', () => {
  it('classifies missing or malformed URLs as configuration errors without echoing values', () => {
    const secret = 'not-a-real-secret-value';
    const error = new DatabaseConfigurationError(
      'DATABASE_URL is malformed. Provide a valid postgres:// or postgresql:// URL through the approved secret mechanism; the value is never printed.',
    );
    expect(classifyPreflightError(error)).toBe('CONFIGURATION');
    expect(formatPreflightError(error)).not.toContain(secret);
    expect(formatPreflightError(error)).toContain('CONFIGURATION ERROR');
  });

  it('uses a generic category for driver and network failures', () => {
    const driverError = new Error('password authentication failed for user operator');
    expect(classifyPreflightError(driverError)).toBe('DATABASE_NETWORK');
    expect(formatPreflightError(driverError)).not.toContain('operator');
    expect(formatPreflightError(driverError)).not.toContain('password');
  });

  it('loads only the canonical allowlisted environment keys without shell evaluation', () => {
    const parsed = parseLocalEnvFile(`
      # provider export fields are intentionally ignored
      External_Database_URL=postgresql://old.example.invalid/qc
      DATABASE_URL='postgresql://local.example.invalid/qc?sslmode=require'
      SERVICE_VERSION=0.1.0 # inline comment
      INJECTED=$(touch /tmp/should-not-exist)
    `);

    expect(parsed).toEqual({
      DATABASE_URL: 'postgresql://local.example.invalid/qc?sslmode=require',
      SERVICE_VERSION: '0.1.0',
    });
  });

  it('preserves explicit sslmode and rejects disabled TLS', () => {
    expect(
      getDatabaseConnectionConfig('postgresql://local.example.invalid/qc?sslmode=require'),
    ).toEqual({
      connectionString: 'postgresql://local.example.invalid/qc?sslmode=require',
    });
    expect(getDatabaseConnectionConfig('postgresql://local.example.invalid/qc')).toMatchObject({
      connectionString: 'postgresql://local.example.invalid/qc',
      ssl: { rejectUnauthorized: true },
    });
    expect(() =>
      getDatabaseConnectionConfig('postgresql://local.example.invalid/qc?sslmode=disable'),
    ).toThrow(/TLS/);
  });
});
