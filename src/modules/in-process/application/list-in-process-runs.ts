import { AppError } from '../../../shared/errors/app-error.js';
import { actorHasScope } from '../../../shared/authorization/scope-evaluator.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { InProcessRunSummary, InProcessSourceCatalogue } from '../domain/read-model.js';
import type { InProcessRepository } from '../ports/repository.js';

const viewGrant = (actor: ActorContext) =>
  actor.permissions.find((grant) => grant.code === 'PERM-INP-VIEW' && grant.active !== false);

export class ListInProcessRunsUseCase {
  constructor(private readonly repository: InProcessRepository) {}

  async execute(input: { actor: ActorContext }): Promise<readonly InProcessRunSummary[]> {
    const grant = viewGrant(input.actor);
    if (!grant) throw new AppError('AUTHZ_PERMISSION_MISSING', { userSafe: true });
    const rows = await this.repository.listRuns();
    // Register rows follow the same scope evaluator as a record read: a narrow
    // OWN/SHIFT/DEPARTMENT grant never sees another operator's or shift's run.
    return rows.filter((row) => {
      const scope = {
        ownerId: row.operatorId,
        shiftId: row.shiftCode,
        departmentId: row.productionLine,
      };
      return actorHasScope(
        input.actor,
        {
          type: 'IN_PROCESS_RUN',
          id: row.id,
          state: row.state,
          ownerId: row.operatorId,
          shiftId: row.shiftCode,
          departmentId: row.productionLine,
        },
        scope,
        grant,
      );
    });
  }
}

export class GetInProcessSourceCatalogueUseCase {
  constructor(private readonly repository: InProcessRepository) {}

  async execute(input: { actor: ActorContext }): Promise<InProcessSourceCatalogue> {
    if (!viewGrant(input.actor))
      throw new AppError('AUTHZ_PERMISSION_MISSING', { userSafe: true });
    return this.repository.listSourceCatalogue();
  }
}
