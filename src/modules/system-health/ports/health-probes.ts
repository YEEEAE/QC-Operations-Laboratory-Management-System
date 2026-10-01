/**
 * Sanitized dependency health contract for the authenticated system health view.
 *
 * Implementations must never surface raw infrastructure errors, credentials,
 * hostnames, or connection strings: on failure they return a fixed status
 * without exception details (OBSERVABILITY-ARCHITECTURE.md sections 53-54).
 */
export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN';

export interface OutboxWorkerDiagnostics {
  /** Time of this read-only diagnostic query. */
  checkedAt: Date;
  pendingCount: number;
  availableNowCount: number;
  retryingCount: number;
  maxAttemptCount: number;
  oldestPendingAt?: Date;
  oldestPendingAgeSeconds?: number;
  /** Event processing evidence only; this is not a process heartbeat. */
  lastProcessedAt?: Date;
  workerHeartbeat: 'NOT_RECORDED';
  channelDelivery: 'NOT_REPRESENTED';
}

export interface DependencyHealth {
  dependency: string;
  status: HealthStatus;
  checkedAt: Date;
  detail?: string;
  outboxDiagnostics?: OutboxWorkerDiagnostics;
}

export interface SystemHealthProbes {
  application(): DependencyHealth | Promise<DependencyHealth>;
  database(): DependencyHealth | Promise<DependencyHealth>;
  storage(): DependencyHealth | Promise<DependencyHealth>;
  outbox(): DependencyHealth | Promise<DependencyHealth>;
  aiProvider(): DependencyHealth | Promise<DependencyHealth>;
}
