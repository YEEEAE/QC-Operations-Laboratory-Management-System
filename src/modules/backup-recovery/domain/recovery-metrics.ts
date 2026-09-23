export interface RecoveryMetrics {
  readonly objectives: {
    readonly rpo: { readonly status: 'NOT_APPROVED'; readonly reason: string };
    readonly rto: { readonly status: 'NOT_APPROVED'; readonly reason: string };
  };
  readonly measuredRpoSeconds?: number;
  readonly measuredRtoSeconds?: number;
  readonly status: 'NOT_MEASURED' | 'PARTIALLY_MEASURED' | 'MEASURED';
}

export function createRecoveryMetrics(input: {
  incidentStartedAt?: Date;
  recoveredDataAsOf?: Date;
  recoveryStartedAt?: Date;
  recoveryValidatedAt?: Date;
}): RecoveryMetrics {
  const times = [
    input.incidentStartedAt,
    input.recoveredDataAsOf,
    input.recoveryStartedAt,
    input.recoveryValidatedAt,
  ];
  if (times.some((value) => value !== undefined && !Number.isFinite(value.getTime())))
    throw new Error('Recovery evidence timestamps must be valid dates.');
  const measuredRpoSeconds =
    input.incidentStartedAt && input.recoveredDataAsOf
      ? Math.ceil((input.incidentStartedAt.getTime() - input.recoveredDataAsOf.getTime()) / 1000)
      : undefined;
  const measuredRtoSeconds =
    input.incidentStartedAt && input.recoveryValidatedAt
      ? Math.ceil((input.recoveryValidatedAt.getTime() - input.incidentStartedAt.getTime()) / 1000)
      : undefined;
  if (measuredRpoSeconds !== undefined && measuredRpoSeconds < 0)
    throw new Error('Recovered data timestamp cannot be later than incident start.');
  if (measuredRtoSeconds !== undefined && measuredRtoSeconds < 0)
    throw new Error('Recovery validation cannot be earlier than incident start.');
  if (
    input.recoveryStartedAt &&
    input.recoveryValidatedAt &&
    input.recoveryStartedAt > input.recoveryValidatedAt
  )
    throw new Error('Recovery validation cannot be earlier than recovery work start.');
  const measuredCount =
    Number(measuredRpoSeconds !== undefined) + Number(measuredRtoSeconds !== undefined);
  return {
    objectives: {
      rpo: {
        status: 'NOT_APPROVED',
        reason: 'PD-26 remains open; business owner approval is required.',
      },
      rto: {
        status: 'NOT_APPROVED',
        reason: 'PD-27 remains open; business owner approval is required.',
      },
    },
    ...(measuredRpoSeconds === undefined ? {} : { measuredRpoSeconds }),
    ...(measuredRtoSeconds === undefined ? {} : { measuredRtoSeconds }),
    status:
      measuredCount === 0
        ? 'NOT_MEASURED'
        : measuredCount === 2
          ? 'MEASURED'
          : 'PARTIALLY_MEASURED',
  };
}
