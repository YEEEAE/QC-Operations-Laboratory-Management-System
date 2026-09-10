export interface BackupExecutionResult {
  readonly bytes: Uint8Array;
  readonly postgresVersion: string;
  readonly startedAt: Date;
  readonly completedAt: Date;
  readonly command: 'pg_dump';
}

export interface RestoreExecutionResult {
  readonly startedAt: Date;
  readonly completedAt: Date;
  readonly command: 'pg_restore';
}

export interface PostgresBackupExecutor {
  createLogicalBackup(input: { databaseUrl: string; requestId: string }): Promise<BackupExecutionResult>;
  restoreLogicalBackup(input: {
    bytes: Uint8Array;
    targetDatabaseUrl: string;
    requestId: string;
  }): Promise<RestoreExecutionResult>;
}
