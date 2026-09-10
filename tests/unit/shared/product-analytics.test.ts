import { describe, expect, it, vi } from 'vitest';
import {
  NoopProductAnalyticsTracker,
  OutboxProductAnalyticsTracker,
  safeTrack,
  sanitizeProductAnalyticsEvent,
  type ProductAnalyticsEvent,
} from '../../../src/shared/analytics/product-analytics';

const baseEvent: ProductAnalyticsEvent = {
  name: 'search.submitted',
  occurredAt: '2026-09-10T00:00:00.000Z',
  environment: 'production',
  domain: 'search',
  operation: 'search',
  outcome: 'completed',
  attributes: {
    search_surface: 'global',
    result_count_bucket: '1-9',
  },
};

describe('privacy-conscious product analytics', () => {
  it('keeps only allowlisted bounded attributes and rejects unknown events', () => {
    const safe = sanitizeProductAnalyticsEvent({
      ...baseEvent,
      attributes: {
        ...baseEvent.attributes,
        query: 'private controlled content',
        userId: 'user-1',
        operation: 'search',
      },
    });
    expect(safe?.attributes).toEqual({
      search_surface: 'global',
      result_count_bucket: '1-9',
      operation: 'search',
    });
    expect(
      sanitizeProductAnalyticsEvent({ ...baseEvent, name: 'arbitrary.event' }),
    ).toBeUndefined();
  });

  it('hands safe analytics to the outbox without business identifiers', async () => {
    const enqueue = vi.fn().mockResolvedValue(undefined);
    const tracker = new OutboxProductAnalyticsTracker({ enqueue } as never, 'test');
    await tracker.track(baseEvent);
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'PRODUCT_ANALYTICS_EVENT',
        aggregateType: 'PRODUCT_ANALYTICS',
        payload: expect.objectContaining({ environment: 'test' }),
      }),
    );
    const payload = enqueue.mock.calls[0]?.[0].payload as Record<string, unknown>;
    expect(payload).not.toHaveProperty('userId');
    expect(payload).not.toHaveProperty('query');
  });

  it('does not propagate analytics failures or make the noop tracker observable', async () => {
    const tracker = { track: vi.fn().mockRejectedValue(new Error('sink unavailable')) };
    await expect(safeTrack(tracker, baseEvent)).resolves.toBeUndefined();
    await expect(new NoopProductAnalyticsTracker().track(baseEvent)).resolves.toBeUndefined();
  });
});
