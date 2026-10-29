import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { InProcessRepository } from '../ports/repository.js';
import type { PermissionCode } from '../../../shared/authorization/permissions.js';
import type { ActorContext, EntityContext, ScopeContext } from '../../../shared/authorization/types.js';
import type { InProcessRun } from '../domain/read-model.js';

/** The run is the authorization entity; the shift and line are its scope. */
export function runEntity(run: InProcessRun): EntityContext {
  return {
    type: 'IN_PROCESS_RUN',
    id: run.id,
    state: run.state,
    ownerId: run.operatorId,
    shiftId: run.shiftCode,
    departmentId: run.productionLine,
  };
}

export function runScope(run: InProcessRun): ScopeContext {
  return {
    ownerId: run.operatorId,
    shiftId: run.shiftCode,
    departmentId: run.productionLine,
  };
}

/** Loads the run and enforces the run-scoped permission for a write. */
export async function loadAuthorizedRun(input: {
  repository: InProcessRepository;
  actor: ActorContext;
  runId: string;
  permission: PermissionCode;
  action: string;
}) {
  const workspace = await input.repository.getRun(input.runId);
  if (!workspace) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
  authorizeRun({
    actor: input.actor,
    run: workspace.run,
    permission: input.permission,
    action: input.action,
  });
  return workspace;
}

export function authorizeRun(input: {
  actor: ActorContext;
  run: InProcessRun;
  permission: PermissionCode;
  action: string;
  businessCondition?: boolean;
}): void {
  authorize(
    {
      actor: input.actor,
      permission: input.permission,
      action: input.action,
      entity: runEntity(input.run),
      scope: runScope(input.run),
      currentVersion: input.run.version,
      expectedVersion: input.run.version,
      businessCondition: input.businessCondition ?? true,
    },
    { throwOnDeny: true },
  );
}
