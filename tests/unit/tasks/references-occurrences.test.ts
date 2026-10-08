import { describe, expect, it, vi } from 'vitest';
import {
  taskOccurrence,
  assertOccurrenceReplay,
} from '../../../src/modules/tasks/application/occurrence.js';
import { taskRecordSource } from '../../../src/modules/tasks/application/record-source.js';
import { CreateTaskUseCase } from '../../../src/modules/tasks/application/create.js';
import { GetTaskUseCase } from '../../../src/modules/tasks/application/get.js';
import { createDraftTask } from '../../../src/modules/tasks/domain/model.js';
import { AppError } from '../../../src/shared/errors/app-error.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { TaskRepository } from '../../../src/modules/tasks/ports/repository.js';

const actor: ActorContext = {
  id: '01900000-0000-7000-8000-000000000001',
  loginIdentity: 'operator',
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [
    { code: 'PERM-TASK-CREATE', scopes: ['OWN'] },
    { code: 'PERM-TASK-VIEW', scopes: ['OWN'] },
  ],
};
const base = {
  taskNo: 'T-100',
  title: 'Review record',
  priority: 'NORMAL',
  ownerId: actor.id,
  ruleId: 'MONTHLY-REVIEW',
  occurrenceKey: '2026-10-08T00:00:00.000Z',
};
const reference = { type: 'LAB_TEST' as const, id: '01900000-0000-7000-8000-000000000002' };
const draft = () =>
  createDraftTask({
    ...base,
    id: '01900000-0000-7000-8000-000000000003',
    createdBy: actor.id,
    now: new Date(),
    specializedRecord: reference,
    recurrence: taskOccurrence(base),
  });

describe('explicit recurrence request contract', () => {
  it('normalizes content and excludes retry timestamps from equivalence', () => {
    expect(taskOccurrence({ ...base, title: '  Review record  ', description: '  ' })).toEqual(
      taskOccurrence(base),
    );
  });
  it.each(['title', 'taskNo', 'priority', 'ownerId'] as const)(
    'binds %s to the occurrence fingerprint',
    (field) => {
      expect(taskOccurrence({ ...base, [field]: 'changed' })?.fingerprint).not.toBe(
        taskOccurrence(base)?.fingerprint,
      );
    },
  );
  it('binds related reference and assignee', () => {
    expect(taskOccurrence({ ...base, specializedRecord: reference })?.fingerprint).not.toBe(
      taskOccurrence(base)?.fingerprint,
    );
    expect(taskOccurrence({ ...base, currentAssigneeId: 'other' })?.fingerprint).not.toBe(
      taskOccurrence(base)?.fingerprint,
    );
  });
  it.each([
    { ruleId: undefined },
    { occurrenceKey: undefined },
    { occurrenceKey: '2026-02-30T00:00:00.000Z' },
    { occurrenceKey: '2026-10-08T03:00:00.000+03:00' },
    { ruleId: '../arbitrary' },
  ])('rejects invalid or partial keys: %j', (overrides) => {
    expect(() => taskOccurrence({ ...base, ...overrides })).toThrow(AppError);
  });
  it('permits ordinary creation without occurrence', () => {
    expect(
      taskOccurrence({ ...base, ruleId: undefined, occurrenceKey: undefined }),
    ).toBeUndefined();
  });
  it('returns current original state on replay and refuses changed owner/payload', () => {
    const task = { ...draft(), state: 'COMPLETED' as const };
    expect(() => assertOccurrenceReplay(task, taskOccurrence(base)!, actor.id)).not.toThrow();
    expect(() =>
      assertOccurrenceReplay(task, taskOccurrence({ ...base, title: 'changed' })!, actor.id),
    ).toThrow(AppError);
    expect(() => assertOccurrenceReplay(task, taskOccurrence(base)!, 'other')).toThrow(AppError);
  });
});

describe('Task reference application boundary', () => {
  it('resolves owning application visibility before the Task write', async () => {
    const order: string[] = [];
    const create = vi.fn(async ({ task }) => {
      order.push('task-write');
      return task;
    });
    const assertVisible = vi.fn(async () => {
      order.push('foreign-read');
    });
    await new CreateTaskUseCase({ create } as unknown as TaskRepository, undefined, {
      assertVisible,
    }).execute({
      ...base,
      actor,
      specializedRecord: reference,
      recurrenceRuleId: base.ruleId,
      requestId: 'req',
    });
    expect(order).toEqual(['foreign-read', 'task-write']);
    expect(create.mock.calls[0]?.[0].task).toMatchObject({
      createdBy: actor.id,
      specializedRecord: reference,
      state: 'DRAFT',
    });
  });
  it('fails closed on unavailable/denied foreign references without any Task mutation', async () => {
    const create = vi.fn();
    const repository = { create } as unknown as TaskRepository;
    const assertVisible = vi.fn(async () => {
      throw new AppError('AUTHZ_DENIED');
    });
    await expect(
      new CreateTaskUseCase(repository, undefined, { assertVisible }).execute({
        ...base,
        actor,
        specializedRecord: reference,
        requestId: 'req',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    await expect(
      new CreateTaskUseCase(repository).execute({
        ...base,
        actor,
        specializedRecord: reference,
        requestId: 'req',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(create).not.toHaveBeenCalled();
  });
  it('blocks inactive actors before foreign reads', async () => {
    const assertVisible = vi.fn();
    await expect(
      new CreateTaskUseCase({} as TaskRepository, undefined, { assertVisible }).execute({
        ...base,
        actor: { ...actor, accountState: 'DISABLED' },
        specializedRecord: reference,
        requestId: 'req',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(assertVisible).not.toHaveBeenCalled();
  });
  it('rechecks foreign visibility when another Task viewer opens details', async () => {
    const task = draft();
    const repository = {
      get: vi.fn(async () => task),
      getIdentityLabels: vi.fn(async () => ({ owner: 'Owner', assignee: 'Unassigned' })),
      listHistory: vi.fn(async () => []),
    } as unknown as TaskRepository;
    const assertVisible = vi.fn(async () => {
      throw new AppError('AUTHZ_DENIED');
    });
    const result = await new GetTaskUseCase(repository, { assertVisible }).execute({
      actor,
      taskId: task.id,
    });
    expect(result.specializedRecordHref).toBeUndefined();
    expect(result.specializedRecordUnavailable).toBe(false);
    expect(assertVisible).toHaveBeenCalledOnce();
  });
});

describe('owning source preflight', () => {
  it('denies missing or inactive owning grants before contacting the provider', async () => {
    await expect(taskRecordSource().assertVisible({ actor, reference })).rejects.toMatchObject({
      code: 'AUTHZ_DENIED',
    });
    await expect(
      taskRecordSource().assertVisible({
        actor: {
          ...actor,
          permissions: [{ code: 'PERM-LAB-VIEW', scopes: ['GLOBAL'], active: false }],
        },
        reference,
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });
  it('rejects malformed record identities before contacting the provider', async () => {
    await expect(
      taskRecordSource().assertVisible({
        actor: { ...actor, permissions: [{ code: 'PERM-LAB-VIEW', scopes: ['GLOBAL'] }] },
        reference: { ...reference, id: 'forged' },
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});
