import { describe, expect, it } from 'vitest';
import { createRecoveryMetrics } from '../../../src/modules/backup-recovery/domain/recovery-metrics.js';

describe('recovery metrics', () => {
  it('shows objectives as unapproved until policy decisions are closed', () => {
    expect(createRecoveryMetrics({})).toMatchObject({
      objectives: { rpo: { status: 'NOT_APPROVED' }, rto: { status: 'NOT_APPROVED' } },
      status: 'NOT_MEASURED',
    });
  });
  it('derives actual intervals only from evidence timestamps and does not claim compliance', () => {
    expect(
      createRecoveryMetrics({
        incidentStartedAt: new Date('2026-09-10T00:01:00Z'),
        recoveredDataAsOf: new Date('2026-09-10T00:00:50Z'),
        recoveryStartedAt: new Date('2026-09-10T00:02:00Z'),
        recoveryValidatedAt: new Date('2026-09-10T00:02:20Z'),
      }),
    ).toMatchObject({
      status: 'MEASURED',
      measuredRpoSeconds: 10,
      measuredRtoSeconds: 80,
      objectives: { rpo: { status: 'NOT_APPROVED' }, rto: { status: 'NOT_APPROVED' } },
    });
  });
  it('rejects evidence timestamps that produce negative intervals', () => {
    expect(() =>
      createRecoveryMetrics({
        incidentStartedAt: new Date('2026-09-10T00:00:00Z'),
        recoveredDataAsOf: new Date('2026-09-10T00:01:00Z'),
      }),
    ).toThrow();
    expect(() =>
      createRecoveryMetrics({
        recoveryStartedAt: new Date('2026-09-10T00:01:00Z'),
        recoveryValidatedAt: new Date('2026-09-10T00:00:00Z'),
      }),
    ).toThrow();
  });
  it('rounds measured intervals upward to whole seconds for the recovery evidence schema', () => {
    expect(
      createRecoveryMetrics({
        incidentStartedAt: new Date('2026-09-10T00:00:00.000Z'),
        recoveryStartedAt: new Date('2026-09-10T00:00:00.000Z'),
        recoveryValidatedAt: new Date('2026-09-10T00:00:00.001Z'),
      }),
    ).toMatchObject({ status: 'PARTIALLY_MEASURED', measuredRtoSeconds: 1 });
  });
});
