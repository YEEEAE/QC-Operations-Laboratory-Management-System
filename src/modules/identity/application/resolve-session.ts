import { AppError } from '../../../shared/errors/app-error.js';
import { SessionService } from './session-service.js';
export class ResolveSessionUseCase { constructor(private readonly sessions: SessionService) {} async execute(token: string | undefined) { if (!token) throw new AppError('AUTH_REQUIRED', { userSafe: true }); return this.sessions.resolve(token); } }
