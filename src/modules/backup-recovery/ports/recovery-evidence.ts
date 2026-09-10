export interface RecoveryEvidenceInput {
  readonly backupRunId: string;
  readonly restoreRunId?: string;
  readonly result: 'VERIFIED' | 'VERIFICATION_FAILED' | 'BLOCKED';
  readonly sourceEnvironment: string;
  readonly targetEnvironment: string;
  readonly reason: string;
  readonly requestId: string;
  readonly releaseId: string;
  readonly gitSha: string;
  readonly buildId: string;
  readonly migrationHead: string;
  readonly postgresVersion: string;
  readonly startedAt: Date;
  readonly completedAt?: Date;
  readonly measuredRpoSeconds?: number;
  readonly measuredRtoSeconds?: number;
  readonly databaseValidation: 'PASS' | 'FAIL';
  readonly objectValidation: 'PASS' | 'FAIL';
  readonly securityValidation: 'PASS' | 'FAIL';
  readonly businessValidation: 'PASS' | 'FAIL';
  readonly sessionInvalidation?: 'PASS' | 'NOT_APPLICABLE' | 'FAIL';
  readonly knownGaps: readonly string[];
}

export interface RecoveryEvidenceRepository {
  append(input: RecoveryEvidenceInput): Promise<{ id: string }>;
  listForBackup(backupRunId: string): Promise<readonly RecoveryEvidenceInput[]>;
}
