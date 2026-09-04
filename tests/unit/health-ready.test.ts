import { describe, expect, it } from 'vitest';
import { GET } from '../../src/pages/api/health/ready.js';

describe('GET /api/health/ready', () => {
  it('returns a minimal healthy response without exposing infrastructure details', async () => {
    const response = await GET({} as never);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({ status: 'healthy' });
  });
});
