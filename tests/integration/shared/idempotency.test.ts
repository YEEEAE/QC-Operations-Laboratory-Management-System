import { describe, expect, it } from 'vitest';
import { executeIdempotently } from '../../../src/shared/idempotency/idempotency-service';
import type {
  IdempotencyRecord,
  IdempotencyRepository,
} from '../../../src/shared/idempotency/idempotency-repository';

class MemoryIdempotencyRepository implements IdempotencyRepository {
  readonly rows = new Map<string, IdempotencyRecord>();
  async find(key: string) {
    return this.rows.get(key);
  }
  async reserve(record: IdempotencyRecord) {
    if (this.rows.has(record.key)) return false;
    this.rows.set(record.key, record);
    return true;
  }
  async complete(key: string, response: unknown) {
    const row = this.rows.get(key)!;
    this.rows.set(key, { ...row, status: 'COMPLETED', response });
  }
  async fail(key: string) {
    const row = this.rows.get(key)!;
    this.rows.set(key, { ...row, status: 'FAILED' });
  }
}

describe('idempotent critical requests', () => {
  it('replay returns the same result without rerunning the mutation', async () => {
    const repository = new MemoryIdempotencyRepository();
    let calls = 0;
    const work = () => {
      calls += 1;
      return Promise.resolve({ mutationId: 'one' });
    };
    await expect(
      executeIdempotently(repository, 'k-1', { action: 'approve', id: 'r-1' }, work),
    ).resolves.toEqual({ mutationId: 'one' });
    await expect(
      executeIdempotently(repository, 'k-1', { action: 'approve', id: 'r-1' }, work),
    ).resolves.toEqual({ mutationId: 'one' });
    expect(calls).toBe(1);
  });
  it('rejects conflicting key reuse', async () => {
    const repository = new MemoryIdempotencyRepository();
    await executeIdempotently(repository, 'k-2', { value: 1 }, () => Promise.resolve('done'));
    await expect(
      executeIdempotently(repository, 'k-2', { value: 2 }, () => Promise.resolve('bad')),
    ).rejects.toMatchObject({ code: 'CONFLICT_DUPLICATE_COMMAND' });
  });
  it('concurrent reservations execute only one mutation', async () => {
    const repository = new MemoryIdempotencyRepository();
    let calls = 0;
    const work = async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 1));
      return 'ok';
    };
    const results = await Promise.allSettled([
      executeIdempotently(repository, 'k-3', { x: 1 }, work),
      executeIdempotently(repository, 'k-3', { x: 1 }, work),
    ]);
    expect(calls).toBe(1);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  });
});
