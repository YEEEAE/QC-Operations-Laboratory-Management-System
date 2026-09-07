import { describe, expect, it } from 'vitest';
import { classifyPreflightError, formatPreflightError } from '../../../scripts/db/preflight';
import { DatabaseConfigurationError } from '../../../src/shared/database/pool';

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
});
