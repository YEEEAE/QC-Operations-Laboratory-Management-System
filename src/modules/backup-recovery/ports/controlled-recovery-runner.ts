/**
 * Controlled recovery execution boundary (OPS-01).
 *
 * A restore intent is not execution. This port is the only accepted shape for
 * a future controlled runner; an implementation may act only after
 * `requireRecoveryProcedureAuthorization` resolves an APPROVED, environment
 * scoped recovery procedure from server-side records.
 *
 * No implementation in this baseline executes anything: the shipped runner
 * returns a blocked outcome for every request, so production restore remains
 * fail-closed even if a caller holds every permission.
 */
export interface RecoveryExecutionIntent {
  restoreRunId: string;
  backupRunId: string;
  environment: string;
  requestedBy: string;
  reason: string;
  requestId: string;
}

export type RecoveryExecutionOutcome =
  | {
      status: 'BLOCKED';
      reason:
        | 'RECOVERY_PROCEDURE_NOT_APPROVED'
        | 'RECOVERY_EXECUTION_NOT_IMPLEMENTED'
        | 'PRODUCTION_RESTORE_PROHIBITED';
    }
  | { status: 'NOT_AVAILABLE' };

export interface ControlledRecoveryRunner {
  /** Never executes a restore; returns an explicit blocked/not-available state. */
  prepare(intent: RecoveryExecutionIntent): Promise<RecoveryExecutionOutcome>;
}
