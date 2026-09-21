import { describe, expect, it } from 'vitest';
import { processOutboxBatch } from '../../../src/shared/outbox/worker';
import type { OutboxEvent, OutboxEventInput } from '../../../src/shared/outbox/outbox-event';
import type { OutboxRepository } from '../../../src/shared/outbox/outbox-repository';

class MemoryOutbox implements OutboxRepository {
  events: OutboxEvent[] = [
    {
      id: 'e1',
      eventType: 'NOTIFY',
      aggregateType: 'TASK',
      aggregateId: 't1',
      payload: {},
      attemptCount: 0,
      availableAt: new Date(),
    },
  ];
  processed: string[] = [];
  retries: string[] = [];
  retryDetails: Array<{ error: string; availableAt: Date }> = [];
  async enqueue(event: OutboxEventInput) {
    this.events.push({ ...event, id: 'e2', attemptCount: 0, availableAt: new Date() });
  }
  async claim(limit: number) {
    return this.events.filter((e) => !this.processed.includes(e.id)).slice(0, limit);
  }
  async markProcessed(id: string) {
    this.processed.push(id);
  }
  async markRetry(id: string, error: string, availableAt: Date) {
    this.retries.push(id);
    this.retryDetails.push({ error, availableAt });
  }
}

describe('durable outbox worker', () => {
  it('marks successful delivery and retains failed delivery for retry', async () => {
    const repository = new MemoryOutbox();
    await processOutboxBatch(repository, async () => undefined);
    expect(repository.processed).toEqual(['e1']);
    const retryRepo = new MemoryOutbox();
    retryRepo.events[0]!.attemptCount = 2;
    await processOutboxBatch(retryRepo, async () => {
      throw new Error('provider unavailable with secret-token');
    });
    expect(retryRepo.retries).toEqual(['e1']);
    expect(retryRepo.retryDetails[0]?.error).toBe('delivery failed');
    expect(retryRepo.retryDetails[0]?.error).not.toContain('secret-token');
    expect(retryRepo.retryDetails[0]?.availableAt.getTime()).toBeGreaterThan(Date.now() + 59_000);
    expect(retryRepo.retryDetails[0]?.availableAt.getTime()).toBeLessThan(Date.now() + 61_000);
  });
});
