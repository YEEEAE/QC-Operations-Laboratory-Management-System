import type { AccountState } from './account-state.js';

export interface User {
  readonly id: string;
  readonly loginIdentity: string;
  readonly email?: string;
  readonly displayName: string;
  readonly passwordHash: string;
  readonly accountState: AccountState;
  readonly mustChangePassword: boolean;
  readonly lastLoginAt?: Date;
  readonly version: bigint;
}

export function isSharedAccount(user: User): boolean {
  return /^shared([._-]|$)/i.test(user.loginIdentity) || /^generic([._-]|$)/i.test(user.loginIdentity);
}
