import type { OutboxEvent, OutboxEventInput } from './outbox-event';
export interface OutboxRepository {
  enqueue(event: OutboxEventInput): Promise<void>;
  claim(limit: number): Promise<OutboxEvent[]>;
  markProcessed(id: string): Promise<void>;
  markRetry(id: string, error: string, availableAt: Date): Promise<void>;
}
