import { describe, expect, it, vi } from 'vitest';
import { TransitionTaskUseCase } from '../../../src/modules/tasks/application/transition.js';
import type { Task } from '../../../src/modules/tasks/domain/model.js';
import type { TaskRepository } from '../../../src/modules/tasks/ports/repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor: ActorContext = {
  id: 'viewer-1',
  loginIdentity: 'viewer',
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [{ code: 'PERM-TASK-EDIT', scopes: ['GLOBAL'] }],
};

const heldTask: Task = {
  id: 'task-1',
  taskNo: 'TASK-1001',
  title: 'Review lab record',
  priority: 'NORMAL',
  state: 'ON_HOLD',
  currentAssigneeId: actor.id,
  createdBy: actor.id,
  createdAt: new Date('2026-09-30T10:00:00.000Z'),
  updatedAt: new Date('2026-09-30T10:00:00.000Z'),
  version: 1n,
  checklist: [],
  unresolvedMandatoryBlocker: false,
  requiredEvidencePresent: true,
};

describe('held task cancellation policy', () => {
  it('denies CANCEL on an existing readable task before any transition write', async () => {
    const get = vi.fn(async () => heldTask);
    const transition = vi.fn(async () => heldTask);
    const repository = { get, transition } as unknown as TaskRepository;
    const useCase = new TransitionTaskUseCase(repository);

    await expect(
      useCase.execute({
        actor,
        taskId: heldTask.id,
        expectedVersion: heldTask.version,
        action: 'CANCEL',
        reason: 'No longer needed',
        requestId: 'cancel-deny-1',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });

    expect(get).toHaveBeenCalledWith(heldTask.id, actor);
    expect(transition).not.toHaveBeenCalled();
  });

  it('allows the authorized resume path on the same existing record', async () => {
    const get = vi.fn(async () => heldTask);
    const transition = vi.fn(async () => ({ ...heldTask, state: 'IN_PROGRESS' as const }));
    const repository = { get, transition } as unknown as TaskRepository;
    const useCase = new TransitionTaskUseCase(repository);

    await expect(
      useCase.execute({
        actor,
        taskId: heldTask.id,
        expectedVersion: heldTask.version,
        action: 'RESUME',
        reason: 'Blocker resolved',
        requestId: 'resume-allowed-1',
      }),
    ).resolves.toMatchObject({ state: 'IN_PROGRESS' });
    expect(transition).toHaveBeenCalledOnce();
  });
});
