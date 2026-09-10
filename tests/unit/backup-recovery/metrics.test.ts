import { describe, expect, it } from 'vitest';
import { createRecoveryMetrics, RPO_TARGET_SECONDS, RTO_TARGET_SECONDS } from '../../../src/modules/backup-recovery/domain/recovery-metrics.js';

describe('recovery metrics', () => {
  it('keeps targets separate from absent measurements', () => {
    expect(createRecoveryMetrics({})).toEqual({ rpoTargetSeconds: RPO_TARGET_SECONDS, rtoTargetSeconds: RTO_TARGET_SECONDS, status: 'UNVERIFIED' });
  });
  it('records measurements without claiming compliance', () => {
    expect(createRecoveryMetrics({ measuredRpoSeconds: 10, measuredRtoSeconds: 20 })).toMatchObject({ status: 'MEASURED', rpoTargetSeconds: 86400, rtoTargetSeconds: 14400 });
  });
  it('rejects invalid measurements', () => {
    expect(() => createRecoveryMetrics({ measuredRtoSeconds: -1 })).toThrow();
  });
});
