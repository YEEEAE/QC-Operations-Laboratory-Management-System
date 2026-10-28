export interface Session {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly createdAt: Date;
  readonly lastSeenAt?: Date;
  readonly expiresAt: Date;
  readonly revokedAt?: Date;
  readonly revokedReason?: string;
  readonly version: bigint;
}

export function isSessionUsable(session: Session, now: Date, idleTimeoutMs: number): boolean {
  const lastActivity = session.lastSeenAt ?? session.createdAt;
  return !session.revokedAt &&
    session.expiresAt.getTime() > now.getTime() &&
    now.getTime() - lastActivity.getTime() < idleTimeoutMs;
}
