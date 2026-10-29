import type { ActorContext } from '../../../shared/authorization/types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { InProcessRepository } from '../ports/repository.js';
import { authorizeRun } from './authorization.js';
import type { InProcessWorkspaceView } from './workspace-view.js';
import { buildWorkspaceView } from './workspace-view.js';

export class GetInProcessWorkspaceUseCase {
  constructor(private readonly repository: InProcessRepository) {}

  async execute(input: { actor: ActorContext; runId: string }): Promise<InProcessWorkspaceView> {
    const workspace = await this.repository.getRun(input.runId);
    if (!workspace) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorizeRun({
      actor: input.actor,
      run: workspace.run,
      permission: 'PERM-INP-VIEW',
      action: 'VIEW',
    });
    return buildWorkspaceView({ ...workspace, actor: input.actor });
  }
}
