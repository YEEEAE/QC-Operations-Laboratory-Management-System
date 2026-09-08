import { describe, expect, it } from 'vitest';

import {
  headerEnvironmentForHealth,
  liveHealthResponse,
  unavailableHealthResponse,
} from '../../../src/shared/http/health-gates.js';

describe('middleware health gates (production read-only)', () => {
  it('resolves header environment leniently without throwing on missing production secrets', () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      expect(headerEnvironmentForHealth()).toBe('production');
    } finally {
      process.env.NODE_ENV = previous;
    }
  });

  it('keeps liveness dependency-free with security headers', async () => {
    const response = liveHealthResponse('production', 'req_live_1');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'healthy' });
    expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");
    expect(response.headers.get('x-request-id')).toBe('req_live_1');
  });

  it('returns 503 JSON with headers and requestId when readiness dependency is unavailable', async () => {
    const response = unavailableHealthResponse('production', 'req_ready_1');

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: 'unhealthy' });
    expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");
    expect(response.headers.get('x-request-id')).toBe('req_ready_1');
  });
});
