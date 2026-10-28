import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { LabRepository } from '../ports/repository.js';

export class GetRetestOutcomesUseCase {
  constructor(private readonly repository: LabRepository) {}
  async execute(input: { actor: ActorContext; originalId: string }) {
    const original = await this.repository.get(input.originalId, input.actor);
    if (!original) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (original.originalTestId) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    return { original, retests: await this.repository.retests(original.id, input.actor) };
  }
}
