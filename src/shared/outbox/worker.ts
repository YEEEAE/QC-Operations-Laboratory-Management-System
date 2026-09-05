import type { OutboxRepository } from './outbox-repository';
import { withSpan, recordCounter } from '../observability/telemetry';

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
  limit = 20,
): Promise<number> {
  const events = await repository.claim(limit);
  for (const event of events) {
    try {
      await withSpan(
        'outbox.process',
        async () => {
          await handler(event);
          await repository.markProcessed(event.id);
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
        error instanceof Error ? error.message : 'outbox handler failed',
        new Date(Date.now() + 30_000),
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
