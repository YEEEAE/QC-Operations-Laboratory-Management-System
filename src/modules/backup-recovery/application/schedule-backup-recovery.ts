import { createHash } from 'node:crypto';
import type { BackupReleaseIdentity } from '../ports/release-identity.js';
import type { BackupScheduler, ScheduledRecoveryCommand } from '../ports/scheduler.js';

function requestId(schedule: string, now: Date, release: BackupReleaseIdentity): string {
  return createHash('sha256')
    .update(`${schedule}\0${now.toISOString()}\0${release.releaseId}`)
    .digest('hex');
}

export class CalendarBackupScheduler implements BackupScheduler {
  nextDailyBackup(now: Date, release: BackupReleaseIdentity): ScheduledRecoveryCommand {
    return { schedule: 'daily-backup', requestId: requestId('daily-backup', now, release), release, targetEnvironment: 'test' };
  }

  nextMonthlyDrill(now: Date, release: BackupReleaseIdentity): ScheduledRecoveryCommand {
    return { schedule: 'monthly-isolated-restore-drill', requestId: requestId('monthly-isolated-restore-drill', now, release), release, targetEnvironment: 'test' };
  }
}
