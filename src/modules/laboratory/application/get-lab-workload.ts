import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { LabListFilter, LabRepository, LabWorkloadRead } from '../ports/repository.js';

/**
 * The laboratory workload read model.
 *
 * It answers "how much laboratory work is waiting in this state, for this
 * owner" with the register's own count and a bounded newest-first page, so a
 * dashboard card can display the full filtered population while its queue stays
 * bounded — and so the card can never disagree with the register page its own
 * link opens.
 *
 * Reading the laboratory register needs `PERM-LAB-VIEW`; a caller without it
 * gets an authorization error, which a consumer must report as "not available
 * for this account" rather than as a zero.
 */
export class GetLabWorkloadUseCase {
  constructor(private readonly repository: LabRepository) {}

  async execute(input: {
    actor: ActorContext;
    filter?: LabListFilter;
    /** The bound on the returned page; the count is never bounded by it. */
    limit: number;
  }): Promise<LabWorkloadRead> {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-LAB-VIEW',
        action: 'VIEW',
        entity: {
          type: 'LAB_TEST',
          id: 'workload',
          state: input.filter?.state ?? 'DRAFT',
          authorId: input.actor.id,
        },
        scope: { ownerId: input.actor.id },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    return this.repository.workload(input);
  }
}
