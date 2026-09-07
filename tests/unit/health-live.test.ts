import { describe, expect, it } from 'vitest';
import { GET } from '../../src/pages/api/health/live.js';

describe('liveness route', () => {
  it('returns a minimal healthy response without depending on PostgreSQL', async () => {
    const response = await GET({} as never);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({ status: 'healthy' });
  });
});
