import type { RestoreRunType } from '../domain/backup-record.js';

/**
 * Contract boundary for a future controlled recovery orchestrator.
 *
 * NO implementation exists in this baseline. Executing a restore requires an
 * approved provider/policy decision (BACKUP-RECOVERY-PLAN.md deferred
 * decisions BKP-DD-008 through BKP-DD-016) and a real, tested backend.
 * Deliberately, no fake or simulated orchestrator is provided: the restore
 * request use case records intent only and never invokes this port.
 */
export interface RestoreIntent {
  backupRunId: string;
  restoreType: RestoreRunType;
  targetEnvironment: string;
  requestedBy: string;
  reason: string;
  requestId: string;
}

export interface RestoreOrchestrationReceipt {
  orchestrationRef: string;
}

export interface RecoveryOrchestrator {
  submitRestoreIntent(intent: RestoreIntent): Promise<RestoreOrchestrationReceipt>;
}
