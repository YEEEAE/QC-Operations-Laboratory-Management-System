export interface BackupExecutionResult {
  readonly bytes: Uint8Array;
  readonly postgresVersion: string;
  readonly schemaChecksum: string;
  readonly migrationLedger: readonly { version: string; name: string; checksum: string }[];
  readonly fileObjects: readonly {
    fileId: string;
    storageProvider: string;
    storageKey: string;
    sizeBytes: number;
    sha256: string;
  }[];
  readonly controlledDocumentVersions: readonly {
    documentId: string;
    documentNo: string;
    documentType: string;
    versionId: string;
    revision: string;
    state: string;
    contentHash: string;
    fileIds: readonly string[];
  }[];
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
  createLogicalBackup(input: {
    databaseUrl: string;
    requestId: string;
  }): Promise<BackupExecutionResult>;
  restoreLogicalBackup(input: {
    bytes: Uint8Array;
    targetDatabaseUrl: string;
    sourceDatabaseName: string;
    requestId: string;
  }): Promise<RestoreExecutionResult>;
}
