export interface IdempotencyRecord {
  key: string;
  fingerprint: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  response: unknown;
}
export interface IdempotencyRepository {
  find(key: string): Promise<IdempotencyRecord | undefined>;
  reserve(record: IdempotencyRecord): Promise<boolean>;
  complete(key: string, response: unknown): Promise<void>;
  fail(key: string): Promise<void>;
}
