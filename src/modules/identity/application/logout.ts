import { expiredCookie, SessionService } from './session-service.js';
export class LogoutUseCase {
  constructor(
    private readonly sessions: SessionService,
    private readonly revokeAllSessions = false,
  ) {}
  async execute(token: string | undefined): Promise<string> {
    if (token) await this.sessions.signOut(token, this.revokeAllSessions);
    return expiredCookie();
  }
}
