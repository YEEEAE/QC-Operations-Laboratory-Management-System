import { describe, expect, it } from 'vitest';
import { AppError } from '../../../src/shared/errors/app-error.js';
import {
  classifyReadFailure,
  providerUnavailableResponse,
} from '../../../src/shared/errors/read-failure.js';

describe('classifyReadFailure', () => {
  it('distinguishes missing records from authorization denials internally', () => {
    expect(classifyReadFailure(new AppError('RESOURCE_NOT_FOUND'))).toBe('MISSING');
    expect(classifyReadFailure(new AppError('AUTHZ_SCOPE_DENIED'))).toBe('DENIED');
    expect(classifyReadFailure(new AppError('AUTH_SESSION_EXPIRED'))).toBe('DENIED');
  });

  it('fails closed when the read fails for a provider or unknown reason', () => {
    expect(classifyReadFailure(new AppError('SYSTEM_DATABASE_UNAVAILABLE'))).toBe('UNAVAILABLE');
    expect(classifyReadFailure(new Error('database details must not affect public state'))).toBe(
      'UNAVAILABLE',
    );
    expect(classifyReadFailure(undefined)).toBe('UNAVAILABLE');
  });

  it('returns a sanitized, non-cacheable 503 and limits retries to local paths', async () => {
    const response = providerUnavailableResponse(
      'Record details unavailable',
      '/records?tab=history',
    );
    const body = await response.text();
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body).toContain('href="/records?tab=history"');
    expect(body).not.toContain('database details');

    const unsafeRetry = providerUnavailableResponse('Unavailable', '//outside.example/path');
    expect(await unsafeRetry.text()).toContain('href="/"');
  });
});
