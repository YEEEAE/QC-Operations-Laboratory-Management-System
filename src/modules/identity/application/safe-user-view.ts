import type { User } from '../domain/user.js';

/**
 * Administration read contract for user records. Password hashes, session
 * tokens, and security evidence never leave the Domain — pages and actions
 * only receive this safe projection.
 */
export interface SafeUserView {
  id: string;
  loginIdentity: string;
  email?: string;
  displayName: string;
  accountState: User['accountState'];
  mustChangePassword: boolean;
  lastLoginAt?: Date;
  version: bigint;
}

export function toSafeUserView(user: User): SafeUserView {
  return {
    id: user.id,
    loginIdentity: user.loginIdentity,
    ...(user.email ? { email: user.email } : {}),
    displayName: user.displayName,
    accountState: user.accountState,
    mustChangePassword: user.mustChangePassword,
    ...(user.lastLoginAt ? { lastLoginAt: user.lastLoginAt } : {}),
    version: user.version,
  };
}
