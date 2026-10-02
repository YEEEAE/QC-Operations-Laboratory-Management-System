import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DatabaseTransaction } from '../../../shared/database/transaction.js';

export class ApproveVersionUseCase {
  async execute(input: { actor: ActorContext; versionId: string; expectedVersion: bigint; requestId: string; transaction?: DatabaseTransaction }): Promise<never> {
    // RD-019 / PD-32 have no approved source defining document approval authority
    // and its version-bound signature ceremony. Permission grants alone cannot
    // stand in for that authority or an electronic signature.
    throw new AppError('POLICY_SOURCE_REQUIRED', {
      userSafe: true,
      safeMetadata: { requestId: input.requestId },
    });
  }
}
