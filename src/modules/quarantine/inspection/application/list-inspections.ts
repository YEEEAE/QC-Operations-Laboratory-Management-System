import { AppError } from '../../../../shared/errors/app-error.js';
import { authorize } from '../../../../shared/authorization/authorize.js';
import { parsePageInput } from '../../../../shared/pagination/page.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { InspectionRepository } from '../ports/repository.js';
import type { Inspection } from '../domain/inspection.js';
export class ListInspectionsUseCase {
  constructor(private readonly repo: InspectionRepository) {}
  executePage(i: Parameters<InspectionRepository['list']>[0] & { page?: import('../../../../shared/pagination/page.js').PageInput }) {
    this.authorize(i);
    if (!this.repo.listPage) throw new AppError('SYSTEM_DATABASE_UNAVAILABLE', { userSafe: true });
    return this.repo.listPage({ ...i, page: parsePageInput(i.page) });
  }
  execute(i: {
    actor: ActorContext;
    assignedTo?: string;
    state?: Inspection['state'];
    finalResult?: Inspection['finalResult'];
    ownership?: 'mine';
  }) {
    this.authorize(i);
    return this.repo.list(i);
  }
  private authorize(i: Parameters<InspectionRepository['list']>[0]) {
    authorize(
      {
        actor: i.actor,
        permission: 'PERM-INSP-VIEW',
        action: 'VIEW',
        entity: {
          type: 'INSPECTION_REPORT',
          id: 'list',
          state: i.state ?? 'DRAFT',
          authorId: i.actor.id,
          executorId: i.actor.id,
        },
        scope: { ownerId: i.actor.id },
        currentVersion: 1,
        expectedVersion: 1,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
  }
}
