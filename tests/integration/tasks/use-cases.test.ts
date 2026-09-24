import { describe, expect, it } from 'vitest';
import { CreateTaskUseCase } from '../../../src/modules/tasks/application/create.js';
import { TransitionTaskUseCase } from '../../../src/modules/tasks/application/transition.js';
import type { TaskRepository } from '../../../src/modules/tasks/ports/repository.js';
import type { Task } from '../../../src/modules/tasks/domain/model.js';
import { transitionTask } from '../../../src/modules/tasks/domain/state.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor: ActorContext = {
  id: '01900000-0000-7000-8000-000000000001',
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [
    { code: 'PERM-TASK-CREATE', scopes: ['OWN'] },
    { code: 'PERM-TASK-EDIT', scopes: ['OWN'] },
    { code: 'PERM-TASK-BLOCK', scopes: ['OWN'] },
    { code: 'PERM-TASK-COMPLETE', scopes: ['OWN'] },
    { code: 'PERM-TASK-REOPEN', scopes: ['OWN'] },
  ],
};
function repo(): TaskRepository & { task?: Task } {
  const state: { task?: Task } = {};
  return {
    async create({ task }) {
      state.task = task;
      return task;
    },
    async get() {
      return state.task;
    },
    async list() {
      const items = state.task ? [state.task] : [];
      return {
        items: items.map((task) => ({
          ...task,
          ownerDisplayName: 'Task owner',
          assigneeDisplayName: 'Unassigned',
        })),
        total: items.length,
      };
    },
    async getIdentityLabels() {
      return { owner: 'Task owner', assignee: 'Unassigned' };
    },
    async listHistory() {
      return [];
    },
    async updateDraft() {
      throw new Error('not used');
    },
    async transition(input) {
      state.task = transitionTask(
        state.task!,
        input.action,
        new Date('2026-01-01T00:00:00Z'),
        input.reason,
      );
      return state.task;
    },
    get task() {
      return state.task;
    },
  };
}
describe('Tasks use cases', () => {
  it('creates a draft through the repository port', async () => {
    const repository = repo();
    const task = await new CreateTaskUseCase(
      repository,
      () => new Date('2026-01-01T00:00:00Z'),
    ).execute({ actor, taskNo: 'TASK-1', title: 'Work', priority: 'HIGH', requestId: 'test' });
    expect(task.state).toBe('DRAFT');
  });
  it('denies a transition without the required permission', async () => {
    const repository = repo();
    await new CreateTaskUseCase(repository).execute({
      actor,
      taskNo: 'TASK-2',
      title: 'Work',
      priority: 'HIGH',
      requestId: 'test',
    });
    const actorWithoutCreate: ActorContext = {
      ...actor,
      permissions: [{ code: 'PERM-TASK-COMPLETE', scopes: ['OWN'] }],
    };
    await expect(
      new TransitionTaskUseCase(repository).execute({
        actor: actorWithoutCreate,
        taskId: repository.task!.id,
        expectedVersion: 1n,
        action: 'ACTIVATE',
        requestId: 'test',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
  });

  it('denies task creation without create permission before writing', async () => {
    const repository = repo();
    const actorWithoutCreate: ActorContext = {
      ...actor,
      permissions: [{ code: 'PERM-TASK-COMPLETE', scopes: ['OWN'] }],
    };

    expect(() =>
      new CreateTaskUseCase(repository).execute({
        actor: actorWithoutCreate,
        taskNo: 'TASK-DENIED-CREATE',
        title: 'Must not be persisted',
        priority: 'HIGH',
        requestId: 'denied-create',
      }),
    ).toThrow(expect.objectContaining({ code: 'AUTHZ_PERMISSION_MISSING' }));
    expect(repository.task).toBeUndefined();
  });

  it('denies assignment without the separate assignment permission before writing', async () => {
    const repository = repo();
    expect(() =>
      new CreateTaskUseCase(repository).execute({
        actor,
        taskNo: 'TASK-DENIED-ASSIGN',
        title: 'Assignment must stay unauthorized',
        priority: 'HIGH',
        currentAssigneeId: '01900000-0000-7000-8000-000000000099',
        requestId: 'denied-assignment',
      }),
    ).toThrow(expect.objectContaining({ code: 'AUTHZ_PERMISSION_MISSING' }));
    expect(repository.task).toBeUndefined();
  });

  it('records the requested lifecycle through activate, start, hold, resume, complete, and reopen', async () => {
    const repository = repo();
    const task = await new CreateTaskUseCase(
      repository,
      () => new Date('2026-01-01T00:00:00Z'),
    ).execute({
      actor,
      taskNo: 'TASK-LIFECYCLE',
      title: 'Workflow check',
      priority: 'UNSPECIFIED',
      requestId: 'task-lifecycle',
    });
    const transitions = [
      ['ACTIVATE', 'OPEN', undefined],
      ['START', 'IN_PROGRESS', undefined],
      ['HOLD', 'ON_HOLD', 'Waiting for access'],
      ['RESUME', 'IN_PROGRESS', undefined],
      ['COMPLETE', 'COMPLETED', undefined],
      ['REOPEN', 'IN_PROGRESS', 'Follow-up required'],
    ] as const;
    let version = task.version;
    for (const [action, expectedState, reason] of transitions) {
      const updated = await new TransitionTaskUseCase(repository).execute({
        actor,
        taskId: task.id,
        expectedVersion: version,
        action,
        reason,
        requestId: `task-${action.toLowerCase()}`,
      });
      expect(updated.state).toBe(expectedState);
      version = updated.version;
    }
    expect(version).toBe(7n);
  });

  it('denies a stale version and does not call the repository to write', async () => {
    const repository = repo();
    await new CreateTaskUseCase(repository).execute({
      actor,
      taskNo: 'TASK-STALE',
      title: 'Work',
      priority: 'LOW',
      requestId: 'stale',
    });
    const transition = new TransitionTaskUseCase(repository);
    await expect(
      transition.execute({
        actor,
        taskId: repository.task!.id,
        expectedVersion: 0n,
        action: 'ACTIVATE',
        requestId: 'stale-version',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    expect(repository.task?.state).toBe('DRAFT');
    expect(repository.task?.version).toBe(1n);
  });
});
