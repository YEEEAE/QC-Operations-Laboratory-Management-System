import { describe, expect, it } from 'vitest';
import { createRequestContext } from '../../../src/shared/http/request-context';

describe('request context integration contract', () => {
  it('creates a request correlation context and exposes no client authorization claims', () => {
    const context = createRequestContext(
      new Request('https://example.test/', { headers: { 'x-actor-id': 'attacker' } }),
    );
    expect(context.requestId).toBeTruthy();
    expect(context.traceId).toHaveLength(32);
    expect(context.spanId).toHaveLength(16);
    expect(context.actor).toBeUndefined();
  });
});
