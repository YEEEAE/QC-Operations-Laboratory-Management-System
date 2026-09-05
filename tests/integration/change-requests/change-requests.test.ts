import { describe, expect, it } from 'vitest';
import {
  CHANGE_REQUEST_ACTIONS,
  createChangeRequest,
  transitionChangeRequest,
  type ChangeRequest,
} from '../../../src/modules/change-requests/domain/change-request.js';
import { CreateChangeRequestUseCase } from '../../../src/modules/change-requests/application/create-change-request.js';
import { GetChangeRequestUseCase } from '../../../src/modules/change-requests/application/get-change-request.js';
import { ListChangeRequestsUseCase } from '../../../src/modules/change-requests/application/list-change-requests.js';
import { TransitionChangeRequestUseCase } from '../../../src/modules/change-requests/application/transition-change-request.js';
import type { ChangeRequestRepository } from '../../../src/modules/change-requests/ports/repository.js';
import type { ChangeRequestAggregate } from '../../../src/modules/change-requests/ports/repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const requesterId = '01900000-0000-7000-8000-000000000101';
const reviewerId = '01900000-0000-7000-8000-000000000102';
const approverId = '01900000-0000-7000-8000-000000000103';
const requestId = '01900000-0000-7000-8000-000000000104';
const targetId = '01900000-0000-7000-8000-000000000105';

const actor = (id: string, codes: ActorContext['permissions'][number]['code'][] = [], scopes: readonly ('OWN' | 'ASSIGNED' | 'GLOBAL')[] = ['OWN', 'ASSIGNED']) : ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles: ['MANAGER'],
  permissions: codes.map((code) => ({ code, scopes })),
});

const requester = actor(requesterId, ['PERM-CHG-VIEW', 'PERM-CHG-CREATE', 'PERM-CHG-EDIT-DRAFT', 'PERM-CHG-SUBMIT', 'PERM-CHG-APPROVE', 'PERM-APR-APPROVE']);
const reviewer = actor(reviewerId, ['PERM-CHG-VIEW', 'PERM-CHG-REVIEW', 'PERM-CHG-RETURN', 'PERM-APR-VIEW-ASSIGNED', 'PERM-APR-REVIEW', 'PERM-APR-RETURN'], ['GLOBAL']);
const approver = actor(approverId, ['PERM-CHG-VIEW', 'PERM-CHG-APPROVE', 'PERM-CHG-REJECT', 'PERM-APR-VIEW-ASSIGNED', 'PERM-APR-APPROVE', 'PERM-APR-REJECT'], ['GLOBAL']);

const now = new Date('2026-09-05T10:00:00.000Z');

function draft(): ChangeRequestAggregate {
  return {
    changeRequest: createChangeRequest({
      id: requestId,
      changeNo: 'CR-2026-0001',
      targetType: 'DOCUMENT_VERSION',
      targetId,
      targetVersion: 4n,
      reason: 'Correct controlled metadata after verified source review.',
      targetSnapshot: { title: 'Original title', revision: '4' },
      requestedBy: requesterId,
      now,
    }),
    changes: [
      {
        id: '01900000-0000-7000-8000-000000000106',
        fieldPath: 'title',
        currentValue: 'Original title',
        proposedValue: 'Corrected title',
        dataType: 'text',
        position: 1,
      },
    ],
    history: [],
    applicationAttempts: [],
  };
}

function repository(initial = draft()): ChangeRequestRepository & { current: ChangeRequestAggregate } {
  let current = initial;
  const decisions = new Map<string, { request: ChangeRequest; action: (typeof CHANGE_REQUEST_ACTIONS)[number]; expectedVersion: bigint }>();
  return {
    get current() {
      return current;
    },
    async create(input) {
      current = { ...input.aggregate };
      return current;
    },
    async get() {
      return current;
    },
    async list() {
      return [current];
    },
    async findTransitionByRequestId(input) {
      const replay = decisions.get(input.requestId);
      return replay && { action: replay.action, expectedVersion: replay.expectedVersion };
    },
    async updateDraft(input) {
      if (current.changeRequest.version !== input.expectedVersion || current.changeRequest.state !== 'DRAFT') throw new Error('stale');
      current = { ...current, changeRequest: { ...current.changeRequest, reason: input.reason, version: input.expectedVersion + 1n } };
      return current;
    },
    async transition(input) {
      const replay = decisions.get(input.requestId);
      if (replay) return { ...current, changeRequest: replay.request };
      if (current.changeRequest.version !== input.expectedVersion) throw new Error('stale');
      current = { ...current, changeRequest: transitionChangeRequest(current.changeRequest, { action: input.action, reason: input.reason, now: input.now }) };
      decisions.set(input.requestId, { request: current.changeRequest, action: input.action, expectedVersion: input.expectedVersion });
      return current;
    },
    async recordApplicationAttempt() {
      throw new Error('not used in this test');
    },
  };
}

describe('change requests', () => {
  it('defines only explicit lifecycle actions and rejects arbitrary target states', () => {
    expect(CHANGE_REQUEST_ACTIONS).toEqual([
      'SUBMIT',
      'START_REVIEW',
      'RETURN',
      'RESUME',
      'APPROVE',
      'REJECT',
      'CANCEL',
      'START_APPLY',
      'APPLY_SUCCESS',
      'APPLICATION_FAILED',
    ]);
    expect(() => transitionChangeRequest(draft().changeRequest, { action: 'APPROVE' as never, now })).toThrowError();
  });

  it('creates a draft through the change-request permission, not a target-domain write', async () => {
    const repo = repository();
    const created = await new CreateChangeRequestUseCase(repo).execute({
      actor: requester,
      changeNo: 'CR-2026-0002',
      targetType: 'DOCUMENT_VERSION',
      targetId,
      targetVersion: 4n,
      reason: 'Correct controlled metadata after verified source review.',
      targetSnapshot: { title: 'Original title' },
      changes: [{ fieldPath: 'title', currentValue: 'Original title', proposedValue: 'Corrected title', dataType: 'text' }],
      requestId: 'create-1',
    });
    expect(created.changeRequest.state).toBe('DRAFT');
    expect(repo.current.changes[0].fieldPath).toBe('title');
  });

  it('requires current version, explicit permissions, and SoD for controlled review and approval', async () => {
    const repo = repository();
    const useCase = new TransitionChangeRequestUseCase(repo, { now: () => now });
    await useCase.execute({ actor: requester, id: requestId, action: 'SUBMIT', expectedVersion: 1n, requestId: 'submit-1' });
    await useCase.execute({ actor: reviewer, id: requestId, action: 'START_REVIEW', expectedVersion: 2n, requestId: 'review-1' });
    await expect(useCase.execute({ actor: requester, id: requestId, action: 'APPROVE', expectedVersion: 3n, requestId: 'approve-self' })).rejects.toMatchObject({ code: 'AUTHZ_SOD_VIOLATION' });
    await expect(useCase.execute({ actor: approver, id: requestId, action: 'APPROVE', expectedVersion: 2n, requestId: 'approve-stale' })).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    const approved = await useCase.execute({ actor: approver, id: requestId, action: 'APPROVE', expectedVersion: 3n, requestId: 'approve-1' });
    expect(approved.changeRequest.state).toBe('APPROVED');
    expect(approved.changeRequest.targetVersion).toBe(4n);
  });

  it('does not allow a user to apply an approved request or choose an arbitrary final state', async () => {
    const repo = repository();
    const useCase = new TransitionChangeRequestUseCase(repo, { now: () => now });
    await expect(useCase.execute({ actor: approver, id: requestId, action: 'START_APPLY', expectedVersion: 1n, requestId: 'apply-user' })).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    expect(repo.current.changeRequest.state).toBe('DRAFT');
  });

  it('returns safe impact/history context and does not leak records outside the actor scope', async () => {
    const repo = repository();
    const get = new GetChangeRequestUseCase(repo);
    const list = new ListChangeRequestsUseCase(repo);
    const detail = await get.execute({ actor: requester, id: requestId });
    expect(detail.changes).toHaveLength(1);
    expect(detail.changeRequest.targetSnapshot).toEqual({ title: 'Original title', revision: '4' });
    expect(await list.execute({ actor: requester })).toHaveLength(1);
    await expect(get.execute({ actor: actor('01900000-0000-7000-8000-000000000199', ['PERM-CHG-VIEW']), id: requestId })).rejects.toMatchObject({ code: 'AUTHZ_SCOPE_DENIED' });
  });

  it('replays the same transition without creating a second history mutation', async () => {
    const repo = repository();
    const useCase = new TransitionChangeRequestUseCase(repo, { now: () => now });
    const first = await useCase.execute({ actor: requester, id: requestId, action: 'SUBMIT', expectedVersion: 1n, requestId: 'same-request' });
    const second = await useCase.execute({ actor: requester, id: requestId, action: 'SUBMIT', expectedVersion: 1n, requestId: 'same-request' });
    expect(second.changeRequest.version).toBe(first.changeRequest.version);
  });
});
