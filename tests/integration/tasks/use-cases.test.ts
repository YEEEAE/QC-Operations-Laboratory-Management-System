import { describe, expect, it } from 'vitest';
import { CreateTaskUseCase } from '../../../src/modules/tasks/application/create.js';
import { TransitionTaskUseCase } from '../../../src/modules/tasks/application/transition.js';
import type { TaskRepository } from '../../../src/modules/tasks/ports/repository.js';
import type { Task } from '../../../src/modules/tasks/domain/model.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor: ActorContext = { id: '01900000-0000-7000-8000-000000000001', accountState: 'ACTIVE', roles: ['EMPLOYEE'], permissions: [{ code: 'PERM-TASK-CREATE', scopes: ['OWN'] }, { code: 'PERM-TASK-COMPLETE', scopes: ['OWN'] }] };
function repo(): TaskRepository & { task?: Task } { const state: { task?: Task } = {}; return { async create({ task }) { state.task = task; return task; }, async get() { return state.task; }, async list() { return state.task ? [state.task] : []; }, async updateDraft() { throw new Error('not used'); }, async transition(input) { state.task = { ...state.task!, state: 'COMPLETED', version: state.task!.version + 1n }; return state.task; }, get task() { return state.task; } }; }
describe('Tasks use cases', () => { it('creates a draft through the repository port', async () => { const repository = repo(); const task = await new CreateTaskUseCase(repository, () => new Date('2026-01-01T00:00:00Z')).execute({ actor, taskNo: 'TASK-1', title: 'Work', priority: 'HIGH', requestId: 'test' }); expect(task.state).toBe('DRAFT'); }); it('denies a transition without the required permission', async () => { const repository = repo(); await new CreateTaskUseCase(repository).execute({ actor, taskNo: 'TASK-2', title: 'Work', priority: 'HIGH', requestId: 'test' }); await expect(new TransitionTaskUseCase(repository).execute({ actor, taskId: repository.task!.id, expectedVersion: 1n, action: 'ACTIVATE', requestId: 'test' })).rejects.toThrow(); }); });
