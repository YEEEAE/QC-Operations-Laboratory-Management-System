export const RPO_TARGET_SECONDS = 24 * 60 * 60;
export const RTO_TARGET_SECONDS = 4 * 60 * 60;

export interface RecoveryMetrics {
  readonly rpoTargetSeconds: typeof RPO_TARGET_SECONDS;
  readonly rtoTargetSeconds: typeof RTO_TARGET_SECONDS;
  readonly measuredRpoSeconds?: number;
  readonly measuredRtoSeconds?: number;
  readonly status: 'UNVERIFIED' | 'MEASURED';
}

export function createRecoveryMetrics(input: {
  measuredRpoSeconds?: number;
  measuredRtoSeconds?: number;
}): RecoveryMetrics {
  for (const value of [input.measuredRpoSeconds, input.measuredRtoSeconds]) {
    if (value !== undefined && (!Number.isInteger(value) || value < 0))
      throw new Error('Recovery measurements must be non-negative integers.');
  }
  return {
    rpoTargetSeconds: RPO_TARGET_SECONDS,
    rtoTargetSeconds: RTO_TARGET_SECONDS,
    ...(input.measuredRpoSeconds === undefined
      ? {}
      : { measuredRpoSeconds: input.measuredRpoSeconds }),
    ...(input.measuredRtoSeconds === undefined
      ? {}
      : { measuredRtoSeconds: input.measuredRtoSeconds }),
    status:
      input.measuredRpoSeconds === undefined && input.measuredRtoSeconds === undefined
        ? 'UNVERIFIED'
        : 'MEASURED',
  };
}
