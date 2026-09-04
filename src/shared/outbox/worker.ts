import type { OutboxRepository } from './outbox-repository';
export type OutboxHandler = (
  event: Awaited<ReturnType<OutboxRepository['claim']>>[number],
) => Promise<void>;
export async function processOutboxBatch(
  repository: OutboxRepository,
  handler: OutboxHandler,
  limit = 20,
): Promise<number> {
  const events = await repository.claim(limit);
  for (const event of events) {
    try {
      await handler(event);
      await repository.markProcessed(event.id);
    } catch (error) {
      await repository.markRetry(
        event.id,
        error instanceof Error ? error.message : 'outbox handler failed',
        new Date(Date.now() + 30_000),
      );
    }
  }
  return events.length;
}
