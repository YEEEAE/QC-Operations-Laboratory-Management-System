import { createHash } from 'node:crypto';
import { AppError } from '../errors/app-error';
import { stableJson } from '../json/stable-stringify';
import type { IdempotencyRepository } from './idempotency-repository';

export { stableJson };

export function fingerprint(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex');
}

export async function executeIdempotently<T>(
  repository: IdempotencyRepository,
  key: string,
  command: unknown,
  work: () => Promise<T>,
): Promise<T> {
  const digest = fingerprint(command);
  const existing = await repository.find(key);
  if (existing) {
    if (existing.fingerprint !== digest) throw new AppError('CONFLICT_DUPLICATE_COMMAND');
    if (existing.status === 'COMPLETED') return existing.response as T;
    throw new AppError('CONFLICT_DUPLICATE_COMMAND');
  }
  const reserved = await repository.reserve({
    key,
    fingerprint: digest,
    status: 'IN_PROGRESS',
    response: null,
  });
  if (!reserved) return executeIdempotently(repository, key, command, work);
  try {
    const result = await work();
    await repository.complete(key, result);
    return result;
  } catch (error) {
    await repository.fail(key);
    throw error;
  }
}
