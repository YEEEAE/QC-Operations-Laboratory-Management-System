import { describe, it, expect, vi } from 'vitest';
import { ApplyApprovedChangeRequestUseCase } from '../../../src/modules/change-requests/application/apply-approved-change-request.js';
import { authorizeChangeRequestApply } from '../../../src/modules/change-requests/application/authorization.js';
import type {
  ChangeRequestRepository,
  ChangeRequestAggregate,
} from '../../../src/modules/change-requests/ports/repository.js';
import type { DocumentRepository } from '../../../src/modules/documents/ports/repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { DatabaseTransaction } from '../../../src/shared/database/transaction.js';
vi.mock('../../../src/modules/documents/application/authorization.js', () => ({
  authorizeDocument: vi.fn(),
}));
const actor: ActorContext = {
  id: 'operator',
  accountState: 'ACTIVE',
  roles: [],
  permissions: [
    { code: 'PERM-CHG-VIEW', scopes: ['GLOBAL'] },
    { code: 'PERM-CHG-APPLY', scopes: ['GLOBAL'] },
    { code: 'PERM-DOC-EDIT-DRAFT', scopes: ['GLOBAL'] },
  ],
};
const transaction = {} as DatabaseTransaction;
function fixture(state = 'DRAFT') {
  const request = {
    id: 'request',
    requestedBy: 'requester',
    state: 'APPROVED',
    version: 3n,
    targetType: 'DOCUMENT_VERSION',
    targetId: 'target',
    targetVersion: 1n,
    targetSnapshot: { state, documentId: 'document', contentHash: 'a'.repeat(64) },
  };
  const aggregate = {
    changeRequest: request,
    changes: [{ fieldPath: 'revision', currentValue: 'R1', proposedValue: 'R2', dataType: 'text' }],
    applicationAttempts: [],
    history: [],
  } as unknown as ChangeRequestAggregate;
  const updateDraft = vi.fn(async () => ({ version: 2n }));
  const documents = {
    getVersion: vi.fn(async () => ({
      id: 'target',
      state,
      version: 1n,
      documentId: 'document',
      revision: 'R1',
      contentHash: 'a'.repeat(64),
    })),
    getDocument: vi.fn(async () => ({ id: 'document' })),
    updateDraft,
  } as unknown as DocumentRepository;
  const repository = {
    get: vi.fn(async () => aggregate),
    recordApplicationAttempt: vi.fn(),
    applyApproved: vi.fn(async (input) => {
      await input.apply(aggregate, transaction);
      return aggregate;
    }),
  } as unknown as ChangeRequestRepository;
  return {
    aggregate,
    documents,
    repository,
    updateDraft,
    usecase: new ApplyApprovedChangeRequestUseCase(repository, () => documents),
  };
}
const command = { actor, id: 'request', expectedVersion: 3n, requestId: 'command' };
describe('owning-domain approved change application', () => {
  it('admits APPLIED only as verified replay and rechecks current grants', () => {
    const f = fixture();
    const applied = { ...f.aggregate.changeRequest, state: 'APPLIED' as const, version: 5n };
    expect(() => authorizeChangeRequestApply(applied, actor, 3n)).toThrow();
    expect(() => authorizeChangeRequestApply(applied, actor, 3n, true)).not.toThrow();
    expect(() =>
      authorizeChangeRequestApply(
        applied,
        {
          ...actor,
          permissions: actor.permissions.filter((grant) => grant.code !== 'PERM-CHG-APPLY'),
        },
        3n,
        true,
      ),
    ).toThrow();
    expect(() =>
      authorizeChangeRequestApply(applied, { ...actor, accountState: 'DISABLED' }, 3n, true),
    ).toThrow();
  });
  it('requires the current request version on a new attempt', () => {
    const f = fixture();
    expect(() => authorizeChangeRequestApply(f.aggregate.changeRequest, actor, 2n)).toThrow();
  });
  it('denies a real VIEW + DOC-EDIT actor without CHG-APPLY before any write or attempt', async () => {
    const f = fixture();
    const reader = {
      ...actor,
      permissions: actor.permissions.filter((grant) => grant.code !== 'PERM-CHG-APPLY'),
    };
    await expect(f.usecase.execute({ ...command, actor: reader })).rejects.toMatchObject({
      code: 'AUTHZ_PERMISSION_MISSING',
    });
    expect(f.repository.applyApproved).not.toHaveBeenCalled();
    expect(f.repository.recordApplicationAttempt).not.toHaveBeenCalled();
    expect(f.updateDraft).not.toHaveBeenCalled();
  });
  it('dispatches allowed draft metadata through Documents with the shared transaction', async () => {
    const f = fixture();
    await f.usecase.execute(command);
    expect(f.updateDraft).toHaveBeenCalledWith(
      expect.objectContaining({ revision: 'R2', expectedVersion: 1n }),
      transaction,
    );
  });
  it.each(['APPROVED', 'EFFECTIVE'])(
    'keeps %s historical versions frozen without mutation evidence',
    async (state) => {
      const f = fixture(state);
      await expect(f.usecase.execute(command)).rejects.toThrow();
      expect(f.updateDraft).not.toHaveBeenCalled();
      expect(f.repository.recordApplicationAttempt).not.toHaveBeenCalled();
    },
  );
  it('refuses a changed target before dispatch', async () => {
    const f = fixture();
    vi.mocked(f.documents.getVersion).mockResolvedValue({ id: 'target', version: 2n } as never);
    await expect(f.usecase.execute(command)).rejects.toThrow();
    expect(f.updateDraft).not.toHaveBeenCalled();
    expect(f.repository.recordApplicationAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        attempt: expect.objectContaining({ result: 'FAILED', errorCode: 'CONFLICT_STALE_VERSION' }),
      }),
    );
  });
  it('refuses a non-allowlisted field without target mutation', async () => {
    const f = fixture();
    (f.aggregate.changes[0] as { fieldPath: string }).fieldPath = 'state';
    await expect(f.usecase.execute(command)).rejects.toThrow();
    expect(f.updateDraft).not.toHaveBeenCalled();
  });
});
