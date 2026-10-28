import type { OutboxEvent, OutboxEventInput, OutboxFailureClass } from './outbox-event';
export interface OutboxRepository {
  enqueue(event: OutboxEventInput): Promise<void>;
  claim(limit: number, leaseToken: string, leaseUntil: Date): Promise<OutboxEvent[]>;
  markProcessed(id: string, leaseToken: string): Promise<void>;
  markRetry(
    id: string,
    leaseToken: string,
    failureClass: OutboxFailureClass,
    availableAt: Date,
    maxAttempts: number,
  ): Promise<void>;
}
