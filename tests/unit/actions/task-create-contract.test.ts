import { ActionError } from 'astro:actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../src/actions/index.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const { createRepositoryWrite } = vi.hoisted(() => ({ createRepositoryWrite: vi.fn() }));
vi.mock('../../../src/modules/tasks/application/dependencies.js', async (importOriginal) => {
  const { CreateTaskUseCase } = await import('../../../src/modules/tasks/application/create.js');
  const repository = {
    create: createRepositoryWrite,
    get: vi.fn(),
    list: vi.fn(),
    updateDraft: vi.fn(),
    transition: vi.fn(),
  };
  const original =
    await importOriginal<typeof import('../../../src/modules/tasks/application/dependencies.js')>();
  return {
    ...original,
    tasksActionDependencies: () => ({ create: new CreateTaskUseCase(repository as never) }),
  };
});

function actionContext(actor: ActorContext) {
  const context = {
    locals: { actor, requestContext: { requestId: 'task-create-contract' } },
    cookies: { get: () => undefined, set: () => undefined },
  };
  Reflect.set(context, Symbol.for('astro.actionAPIContext'), true);
  return context;
}

describe('task create action contract', () => {
  beforeEach(() => createRepositoryWrite.mockClear());

  it('denies a valid request from an authenticated actor without create authority', async () => {
    const actor: ActorContext = {
      id: '01900000-0000-7000-8000-000000000029',
      accountState: 'ACTIVE',
      roles: ['EMPLOYEE'],
      permissions: [],
    };
    const outcome = await (
      server.tasks.createTask as unknown as (input: unknown) => Promise<{
        data?: unknown;
        error?: unknown;
      }>
    ).bind(actionContext(actor))({
      taskNo: 'TASK-ACTION-DENIED',
      title: 'Denied probe',
      priority: 'HIGH',
    });

    expect(outcome.data).toBeUndefined();
    expect(outcome.error).toBeInstanceOf(ActionError);
    expect((outcome.error as ActionError).code).toBe('BAD_REQUEST');
    expect((outcome.error as ActionError).message).toBe('errors.authz_permission_missing');
    expect(createRepositoryWrite).not.toHaveBeenCalled();
  });
});
