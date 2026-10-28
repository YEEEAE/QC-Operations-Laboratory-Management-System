import type { OutboxRepository } from './outbox-repository';
import { withSpan, recordCounter } from '../observability/telemetry';
import { outboxRetryDelayMs } from '../errors/failure-classification.js';
import { classifyFailure } from '../errors/failure-classification.js';
import { uuidv7 } from '../id/uuid.js';

export type OutboxHandler = (
  event: Awaited<ReturnType<OutboxRepository['claim']>>[number],
) => Promise<void>;

/**
 * Durable outbox processing with bounded telemetry (OBSERVABILITY-ARCHITECTURE
 * §39): outcome-only counters/spans — never event payloads or error contents.
 */
export async function processOutboxBatch(
  repository: OutboxRepository,
  handler: OutboxHandler,
  options: { limit: number; maxAttempts: number; leaseDurationMs: number },
): Promise<number> {
  if (!Number.isSafeInteger(options.limit) || options.limit < 1)
    throw new RangeError('limit must be a positive integer');
  const limit = Math.min(100, options.limit);
  if (!Number.isSafeInteger(options.maxAttempts) || options.maxAttempts < 1 || options.maxAttempts > 100)
    throw new RangeError('maxAttempts must be an integer between 1 and 100');
  if (!Number.isSafeInteger(options.leaseDurationMs) || options.leaseDurationMs < 1_000 || options.leaseDurationMs > 15 * 60_000)
    throw new RangeError('leaseDurationMs must be between 1000 and 900000 milliseconds');
  const leaseToken = uuidv7();
  const events = await repository.claim(
    limit,
    leaseToken,
    new Date(Date.now() + options.leaseDurationMs),
  );
  for (const event of events) {
    try {
      await withSpan(
        'outbox.process',
        async () => {
          await handler(event);
          await repository.markProcessed(event.id, event.leaseToken);
        },
        { domain: 'outbox', operation: 'process' },
      );
      recordCounter('qc_outbox_events_total', 1, {
        domain: 'outbox',
        operation: 'process',
        outcome: 'success',
      });
    } catch (error) {
      await repository.markRetry(
        event.id,
        event.leaseToken,
        classifyFailure(error),
        new Date(Date.now() + outboxRetryDelayMs(event.attemptCount)),
        options.maxAttempts,
      );
      recordCounter('qc_outbox_events_total', 1, {
        domain: 'outbox',
        operation: 'process',
        outcome: 'error',
      });
    }
  }
  return events.length;
}
