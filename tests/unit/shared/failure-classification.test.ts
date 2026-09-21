import { describe, expect, it } from 'vitest';
import { AppError } from '../../../src/shared/errors/app-error.js';
import {
  classifyFailure,
  outboxRetryDelayMs,
  safeFailureSummary,
} from '../../../src/shared/errors/failure-classification.js';
import { translateDatabaseError } from '../../../src/shared/database/database.js';

describe('failure classification and recovery schedule', () => {
  it.each([
    ['VALIDATION_FAILED', 'VALIDATION'],
    ['AUTHZ_DENIED', 'AUTHORIZATION'],
    ['CONFLICT_STALE_VERSION', 'STALE_STATE'],
    ['CONFLICT_DUPLICATE_COMMAND', 'DUPLICATE'],
    ['SYSTEM_DATABASE_UNAVAILABLE', 'DEPENDENCY'],
  ] as const)('classifies %s as %s', (code, expected) => {
    expect(classifyFailure(new AppError(code))).toBe(expected);
  });

  it('keeps unclassified exception contents out of persisted summaries', () => {
    expect(safeFailureSummary(new Error('postgres://user:secret@host/db'))).toBe('delivery failed');
  });

  it('preserves PostgreSQL retry and rejection semantics at the database boundary', () => {
    expect(translateDatabaseError({ code: '40001' })).toMatchObject({
      code: 'CONFLICT_DUPLICATE_COMMAND',
      retryability: 'INTERNAL_RETRY_ONLY',
    });
    expect(translateDatabaseError({ code: '40P01' })).toMatchObject({
      code: 'SYSTEM_DATABASE_UNAVAILABLE',
      retryability: 'INTERNAL_RETRY_ONLY',
    });
    expect(translateDatabaseError({ code: '23505' })).toMatchObject({
      code: 'RESOURCE_ALREADY_EXISTS',
      retryability: 'UNKNOWN',
    });
  });

  it('uses bounded exponential delivery backoff without an attempt limit', () => {
    expect(outboxRetryDelayMs(1)).toBe(30_000);
    expect(outboxRetryDelayMs(2)).toBe(60_000);
    expect(outboxRetryDelayMs(99)).toBe(15 * 60_000);
    expect(outboxRetryDelayMs(-4)).toBe(30_000);
  });
});
