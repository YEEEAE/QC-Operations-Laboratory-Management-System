export interface CredentialMutation {
  userId: string;
  passwordHash: string;
  expectedVersion: bigint;
  actorId: string;
  at: Date;
  mustChangePassword: boolean;
  reason: 'PASSWORD_CHANGE' | 'PASSWORD_RESET';
  action: 'CHANGE_PASSWORD' | 'ADMIN_RESET_PASSWORD';
  requestId: string;
}

/** Commits credential, session invalidation, and its audit record as one unit. */
export interface CredentialMutationCommit {
  execute(input: CredentialMutation): Promise<void>;
}
