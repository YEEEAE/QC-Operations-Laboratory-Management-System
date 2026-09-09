import { describe, expect, it } from 'vitest';
import { CreateDocumentVersionChangeRequestUseCase } from '../../../src/modules/change-requests/application/create-document-version-change-request.js';
import { CreateChangeRequestUseCase } from '../../../src/modules/change-requests/application/create-change-request.js';
import type {
  ChangeRequestAggregate,
  ChangeRequestRepository,
} from '../../../src/modules/change-requests/ports/repository.js';
import type {
  ChangeTargetSource,
  DocumentVersionChangeTarget,
} from '../../../src/modules/change-requests/ports/change-target-source.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const requesterId = '01900000-0000-7000-8000-000000000201';
const outsiderId = '01900000-0000-7000-8000-000000000202';
const versionId = '01900000-0000-7000-8000-000000000203';

const actor = (
  id: string,
  codes: ActorContext['permissions'][number]['code'][] = [],
  scopes: readonly ('OWN' | 'ASSIGNED' | 'GLOBAL')[] = ['OWN', 'ASSIGNED'],
): ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles: ['MANAGER'],
  permissions: codes.map((code) => ({ code, scopes })),
});

const requester = actor(requesterId, ['PERM-CHG-CREATE', 'PERM-DOC-VIEW']);
const outsider = actor(outsiderId, ['PERM-CHG-CREATE']);

function target(version = 7n): DocumentVersionChangeTarget {
  return {
    id: versionId,
    documentId: '01900000-0000-7000-8000-000000000204',
    documentNo: 'DOC-2026-001',
    documentType: 'WI',
    title: 'Controlled work instruction',
    revision: 'B',
    changeSummary: 'Current summary',
    contentHash: 'hash-current',
    state: 'EFFECTIVE',
    version,
  };
}

function source(current: DocumentVersionChangeTarget, visible = true): ChangeTargetSource {
  return {
    async listChangeTargets() {
      return visible ? [current] : [];
    },
    async loadChangeTarget(input) {
      if (!visible || input.id !== current.id) {
        const error = new Error('denied') as Error & { code?: string };
        error.code = 'AUTHZ_SCOPE_DENIED';
        throw error;
      }
      return current;
    },
  };
}

function repository(): ChangeRequestRepository & { created?: ChangeRequestAggregate } {
  const state: { created?: ChangeRequestAggregate } = {};
  return {
    get created() {
      return state.created;
    },
    async create(input) {
      state.created = input.aggregate;
      return input.aggregate;
    },
    async createForDocumentVersion(input) {
      state.created = input.aggregate;
      return input.aggregate;
    },
    async get() {
      return undefined;
    },
    async list() {
      return [];
    },
    async findTransitionByRequestId() {
      return undefined;
    },
    async updateDraft() {
      throw new Error('not used');
    },
    async transition() {
      throw new Error('not used');
    },
    async recordApplicationAttempt() {
      throw new Error('not used');
    },
  };
}

describe('contextual DOCUMENT_VERSION change requests (Prompt 2)', () => {
  it('derives target id/version, snapshot, current value, and data type server-side', async () => {
    const repo = repository();
    const useCase = new CreateDocumentVersionChangeRequestUseCase(repo, source(target()));
    const created = await useCase.execute({
      actor: requester,
      changeNo: 'CR-2026-0101',
      reason: 'Correct the controlled revision reference.',
      documentVersionId: versionId,
      expectedDocumentVersion: 7n,
      changeField: 'revision',
      // A hostile client cannot smuggle its own snapshot, version, hash, or
      // data type: only the proposed value travels from the operator.
      proposedValue: 'C',
      requestId: 'ctx-1',
    });
    expect(created.changeRequest.targetType).toBe('DOCUMENT_VERSION');
    expect(created.changeRequest.targetId).toBe(versionId);
    expect(created.changeRequest.targetVersion).toBe(7n);
    expect(created.changeRequest.targetSnapshot).toMatchObject({
      documentNo: 'DOC-2026-001',
      revision: 'B',
      state: 'EFFECTIVE',
      version: '7',
    });
    expect(created.changes).toHaveLength(1);
    expect(created.changes[0]).toMatchObject({
      fieldPath: 'revision',
      currentValue: 'B',
      proposedValue: 'C',
      dataType: 'text',
    });
    expect(repo.created?.changeRequest.targetSnapshot).toMatchObject({ revision: 'B' });
  });

  it('rejects every non-allowlisted field server-side', async () => {
    const useCase = new CreateDocumentVersionChangeRequestUseCase(repository(), source(target()));
    await expect(
      useCase.execute({
        actor: requester,
        changeNo: 'CR-2026-0102',
        reason: 'Attempt an arbitrary field.',
        documentVersionId: versionId,
        expectedDocumentVersion: 7n,
        changeField: 'title',
        proposedValue: 'Hacked',
        requestId: 'ctx-denied',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('rejects the raw bypass path for non-allowlisted DOCUMENT_VERSION fields', async () => {
    const useCase = new CreateChangeRequestUseCase(repository());
    // The legacy use case validates synchronously before returning its
    // promise, so the denial surfaces as a synchronous throw here (the Astro
    // Action `run()` wrapper still converts it into a safe BAD_REQUEST).
    try {
      await useCase.execute({
        actor: requester,
        changeNo: 'CR-2026-0103',
        targetType: 'DOCUMENT_VERSION',
        targetId: versionId,
        targetVersion: 7n,
        reason: 'Raw bypass attempt.',
        targetSnapshot: { revision: 'B' },
        changes: [
          {
            fieldPath: 'title',
            currentValue: 'Controlled work instruction',
            proposedValue: 'Hacked',
            dataType: 'text',
          },
        ],
        requestId: 'raw-denied',
      });
      expect.unreachable('raw non-allowlisted DOCUMENT_VERSION fields must be rejected');
    } catch (error) {
      expect(error).toMatchObject({ code: 'VALIDATION_FAILED' });
    }
  });

  it('rejects unauthorized targets without leaking controlled detail', async () => {
    const useCase = new CreateDocumentVersionChangeRequestUseCase(
      repository(),
      source(target(), false),
    );
    await expect(
      useCase.execute({
        actor: outsider,
        changeNo: 'CR-2026-0104',
        reason: 'No view grant on the target.',
        documentVersionId: versionId,
        expectedDocumentVersion: 7n,
        changeField: 'revision',
        proposedValue: 'C',
        requestId: 'ctx-unauthorized',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_SCOPE_DENIED' });
  });

  it('rejects stale expected versions (optimistic concurrency)', async () => {
    const useCase = new CreateDocumentVersionChangeRequestUseCase(repository(), source(target(8n)));
    await expect(
      useCase.execute({
        actor: requester,
        changeNo: 'CR-2026-0105',
        reason: 'Operator previewed an older version.',
        documentVersionId: versionId,
        expectedDocumentVersion: 7n,
        changeField: 'contentHash',
        proposedValue: 'hash-next',
        requestId: 'ctx-stale',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
  });
});
