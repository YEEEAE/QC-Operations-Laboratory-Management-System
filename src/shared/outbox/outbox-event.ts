export interface OutboxEventInput {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  dedupeKey?: string;
}
export interface OutboxEvent extends OutboxEventInput {
  id: string;
  attemptCount: number;
  availableAt: Date;
  leaseToken: string;
  leaseUntil: Date;
}

export type OutboxFailureClass =
  | 'VALIDATION'
  | 'AUTHORIZATION'
  | 'STALE_STATE'
  | 'DUPLICATE'
  | 'DEPENDENCY'
  | 'UNKNOWN';
