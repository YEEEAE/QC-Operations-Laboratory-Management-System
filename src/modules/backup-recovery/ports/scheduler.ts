import type { BackupReleaseIdentity } from './release-identity.js';

export type BackupScheduleName = 'daily-backup' | 'monthly-isolated-restore-drill';

export interface ScheduledRecoveryCommand {
  readonly schedule: BackupScheduleName;
  readonly requestId: string;
  readonly release: BackupReleaseIdentity;
  readonly targetEnvironment: 'test';
}

export interface BackupScheduler {
  nextDailyBackup(now: Date, release: BackupReleaseIdentity): ScheduledRecoveryCommand;
  nextMonthlyDrill(now: Date, release: BackupReleaseIdentity): ScheduledRecoveryCommand;
}
