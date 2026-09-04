import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { InspectionResultEntry, FinalResult } from '../domain/inspection-result.js';
import type { InspectionRepository } from '../ports/repository.js';

export class SaveInspectionDraftUseCase {
  constructor(private readonly repo: InspectionRepository) {}
  async execute(i: { actor: ActorContext; id: string; expectedVersion: bigint; results: readonly InspectionResultEntry[]; finalResult?: FinalResult; requestId: string }) {
    const x = await this.repo.get(i.id, i.actor);
    if (!x) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (i.finalResult !== undefined || i.results.some((result) => result.result !== undefined)) throw new AppError('AUTHZ_DENIED', { userSafe: true, messageKey: 'errors.official_result_must_come_from_approved_source' });
    authorize({ actor: i.actor, permission: 'PERM-INSP-EDIT-DRAFT', action: 'EDIT', entity: { type: 'INSPECTION_REPORT', id: x.id, state: x.state, authorId: x.authorId, executorId: x.authorId }, scope: { ownerId: x.authorId, assigneeId: x.authorId }, currentVersion: x.version, expectedVersion: i.expectedVersion, businessCondition: x.state === 'DRAFT' }, { throwOnDeny: true });
    return this.repo.saveDraft({ ...i, finalResult: undefined });
  }
}
