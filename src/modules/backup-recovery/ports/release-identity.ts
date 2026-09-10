export interface BackupReleaseIdentity {
  readonly gitSha: string;
  readonly buildId: string;
  readonly releaseId: string;
  readonly migrationHead: string;
  readonly postgresVersion: string;
}

export interface ReleaseIdentitySource {
  getExactIdentity(): Promise<BackupReleaseIdentity>;
}
