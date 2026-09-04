import { AppError } from '../errors/app-error';

export function assertCurrentVersion(expected: number | bigint, actual: number | bigint): void {
  if (expected !== actual) {
    throw new AppError('CONFLICT_STALE_VERSION', {
      safeMetadata: { currentVersion: Number(actual) },
    });
  }
}

export function nextVersion(version: number | bigint): bigint {
  const next = BigInt(version) + 1n;
  if (next <= 0n) throw new AppError('CONFLICT_STALE_VERSION');
  return next;
}
