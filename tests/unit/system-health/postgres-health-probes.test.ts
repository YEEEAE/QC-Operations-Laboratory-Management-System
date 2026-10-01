import { describe, expect, it, vi } from 'vitest';
import type { Kysely } from 'kysely';
import { PostgresSystemHealthProbes } from '../../../src/modules/system-health/infrastructure/postgres-health-probes.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';

function probeWithRow(row: unknown, failure?: Error) {
  const executeTakeFirst = vi.fn(async () => {
    if (failure) throw failure;
    return row;
  });
  const database = {
    selectFrom: vi.fn(() => ({
      select: (build: (expression: object) => unknown) => {
        build({});
        return { executeTakeFirst };
      },
    })),
  } as unknown as Kysely<DatabaseSchema>;
  return { probe: new PostgresSystemHealthProbes(database).outbox(), executeTakeFirst };
}

describe('PostgresSystemHealthProbes outbox diagnostics', () => {
  it('measures pending age, delayed/available messages, retries, and latest processing without inventing worker health', async () => {
    const checkedAt = new Date('2026-10-01T12:00:00.000Z');
    vi.setSystemTime(checkedAt);
    try {
      const { probe } = probeWithRow({
        pending: '3',
        oldestPendingAt: new Date('2026-10-01T11:58:30.000Z'),
        availableNow: '2',
        retrying: '1',
        maxAttemptCount: '4',
        lastProcessedAt: new Date('2026-10-01T11:59:00.000Z'),
      });

      const result = await probe;
      expect(result).toMatchObject({
        status: 'DEGRADED',
        checkedAt,
        outboxDiagnostics: {
          checkedAt,
          pendingCount: 3,
          availableNowCount: 2,
          retryingCount: 1,
          maxAttemptCount: 4,
          oldestPendingAgeSeconds: 90,
          workerHeartbeat: 'NOT_RECORDED',
          channelDelivery: 'NOT_REPRESENTED',
        },
      });
      expect(result.outboxDiagnostics?.lastProcessedAt).toEqual(
        new Date('2026-10-01T11:59:00.000Z'),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps an empty queue healthy without claiming an observed worker heartbeat', async () => {
    const { probe } = probeWithRow({
      pending: '0',
      oldestPendingAt: null,
      availableNow: '0',
      retrying: '0',
      maxAttemptCount: '0',
      lastProcessedAt: null,
    });

    const result = await probe;
    expect(result.status).toBe('HEALTHY');
    expect(result.outboxDiagnostics).toMatchObject({
      pendingCount: 0,
      availableNowCount: 0,
      retryingCount: 0,
      maxAttemptCount: 0,
      workerHeartbeat: 'NOT_RECORDED',
      channelDelivery: 'NOT_REPRESENTED',
    });
    expect(result.outboxDiagnostics?.oldestPendingAt).toBeUndefined();
  });

  it('reports invalid aggregate values as UNKNOWN and a failed provider read as UNAVAILABLE', async () => {
    const invalid = await probeWithRow({
      pending: 'not-a-number',
      oldestPendingAt: null,
      availableNow: '0',
      retrying: '0',
      maxAttemptCount: '0',
      lastProcessedAt: null,
    }).probe;
    expect(invalid.status).toBe('UNKNOWN');

    const inconsistent = await probeWithRow({
      pending: '1',
      oldestPendingAt: null,
      availableNow: '2',
      retrying: '0',
      maxAttemptCount: '0',
      lastProcessedAt: null,
    }).probe;
    expect(inconsistent.status).toBe('UNKNOWN');

    const missingAggregate = await probeWithRow(undefined).probe;
    expect(missingAggregate.status).toBe('UNKNOWN');

    const unavailable = await probeWithRow({}, new Error('private connection details')).probe;
    expect(unavailable.status).toBe('UNAVAILABLE');
    expect(JSON.stringify(unavailable)).not.toContain('private connection details');
  });
});
