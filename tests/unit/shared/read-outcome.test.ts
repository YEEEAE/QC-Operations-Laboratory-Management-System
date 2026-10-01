import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../src/shared/errors/app-error.js';
import { readOutcome } from '../../../src/shared/errors/read-outcome.js';

describe('readOutcome', () => {
  it('keeps a successful primary read when a related source fails', async () => {
    const primary = [{ id: 'ncr-1' }];
    const [primaryResult, relatedResult] = await Promise.all([
      readOutcome(async () => primary),
      readOutcome(async () => {
        throw new AppError('SYSTEM_DATABASE_UNAVAILABLE');
      }),
    ]);

    expect(primaryResult).toEqual({ status: 'AVAILABLE', value: primary });
    expect(relatedResult).toEqual({ status: 'UNAVAILABLE' });
  });

  it('withholds values and counts on missing or denied reads without exposing existence', async () => {
    const reads = [
      readOutcome(async () => {
        throw new AppError('RESOURCE_NOT_FOUND');
      }),
      readOutcome(async () => {
        throw new AppError('AUTHZ_SCOPE_DENIED');
      }),
    ];

    await expect(Promise.all(reads)).resolves.toEqual([
      { status: 'NOT_VISIBLE' },
      { status: 'NOT_VISIBLE' },
    ]);
  });

  it('fails closed on an unknown provider error and preserves isolated siblings', async () => {
    const failedRead = vi.fn(async () => {
      throw new Error('private provider details');
    });
    const [failed, sibling] = await Promise.all([
      readOutcome(failedRead),
      readOutcome(async () => [{ id: 'visible' }]),
    ]);

    expect(failed).toEqual({ status: 'UNAVAILABLE' });
    expect(JSON.stringify(failed)).not.toContain('private provider details');
    expect(sibling).toEqual({ status: 'AVAILABLE', value: [{ id: 'visible' }] });
  });
});
