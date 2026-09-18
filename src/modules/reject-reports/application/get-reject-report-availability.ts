import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { RejectReportAvailability, RejectReportRepository } from '../ports/repository.js';

/**
 * Environment-level availability for Reject Reports.
 *
 * This is presentation/availability only: it never grants or withholds
 * authority — create/edit/void stay server-authorized by `authorize()`. It
 * exists so a deployment whose database is behind its build can say so
 * honestly instead of returning a generic 500.
 */
export class GetRejectReportAvailabilityUseCase {
  constructor(private readonly repository: RejectReportRepository) {}
  execute(input: { actor: ActorContext }): Promise<RejectReportAvailability> {
    if (input.actor.accountState !== 'ACTIVE') throw new AppError('AUTHZ_DENIED');
    return this.repository.availability();
  }
}
