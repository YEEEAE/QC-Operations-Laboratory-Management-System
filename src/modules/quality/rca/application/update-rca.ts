import { AppError } from '../../../../shared/errors/app-error.js';
import { authorize } from '../../../../shared/authorization/authorize.js';
import { updateRca } from '../domain/rca.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { RcaRepository } from '../ports/repository.js';
export class UpdateRcaUseCase {
  constructor(
    private repo: RcaRepository,
    private now = () => new Date(),
  ) {}
  async execute(i: {
    actor: ActorContext;
    rcaId: string;
    expectedVersion: bigint;
    method?: string;
    analysis?: string;
    rootCause?: string;
    requestId: string;
  }) {
    const r = await this.repo.get(i.rcaId, i.actor);
    if (!r) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorize(
      {
        actor: i.actor,
        permission: 'PERM-RCA-EDIT',
        action: 'UPDATE',
        entity: { type: 'RCA', id: r.id, state: r.state },
        scope: { ownerId: r.createdBy },
        currentVersion: r.version,
        expectedVersion: i.expectedVersion,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    return this.repo.update({
      rca: updateRca(r, {
        method: i.method,
        analysis: i.analysis,
        rootCause: i.rootCause,
        now: this.now(),
      }),
      expectedVersion: i.expectedVersion,
      actor: i.actor,
      requestId: i.requestId,
    });
  }
}
