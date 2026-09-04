import { describe, expect, it } from 'vitest';
import { createReadinessResponse } from '../../src/shared/health/readiness.js';

describe('readiness response', () => {
  it('returns a minimal healthy response when all required probes pass', async () => {
    const response = await createReadinessResponse({ isReady: async () => true });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({ status: 'healthy' });
  });

  it('returns a minimal unavailable response when a required probe fails', async () => {
    const response = await createReadinessResponse({ isReady: async () => false });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: 'unhealthy' });
  });
});
