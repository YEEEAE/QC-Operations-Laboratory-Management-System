import { AppError } from '../../../../shared/errors/app-error.js';
import { authorize } from '../../../../shared/authorization/authorize.js';
import { parsePageInput } from '../../../../shared/pagination/page.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { CalibrationListFilter, CalibrationRepository } from '../ports/repository.js';
export class ListCalibrationsUseCase {
  constructor(private readonly repository: CalibrationRepository) {}
  execute(input: { actor: ActorContext; filter?: CalibrationListFilter }) {
    this.authorize(input);
    return this.repository.list(input);
  }
  executePage(input: { actor: ActorContext; filter?: CalibrationListFilter; page?: import('../../../../shared/pagination/page.js').PageInput }) {
    this.authorize(input);
    if (!this.repository.listPage) throw new AppError('SYSTEM_DATABASE_UNAVAILABLE', { userSafe: true });
    return this.repository.listPage({ ...input, page: parsePageInput(input.page) });
  }
  private authorize(input: { actor: ActorContext; filter?: CalibrationListFilter }) {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-CAL-VIEW',
        action: 'VIEW',
        entity: {
          type: 'CALIBRATION_RECORD',
          id: 'list',
          state: input.filter?.state ?? 'DRAFT',
          ownerId: input.actor.id,
        },
        scope: { ownerId: input.actor.id },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
  }
}
