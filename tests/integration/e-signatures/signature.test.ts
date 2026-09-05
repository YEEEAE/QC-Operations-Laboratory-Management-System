import { describe, expect, it, vi } from 'vitest';
import { SignControlledActionUseCase } from '../../../src/modules/e-signatures/application/sign-controlled-action.js';
import type { SignatureEvidenceRepository } from '../../../src/modules/e-signatures/ports/repository.js';
import type { SignControlledActionInput } from '../../../src/modules/e-signatures/application/sign-controlled-action.js';
import type { SignatureEvidence } from '../../../src/modules/e-signatures/domain/signature-evidence.js';

const actorId = '01900000-0000-7000-8000-000000000021';
const subjectId = '01900000-0000-7000-8000-000000000022';
const base: Omit<SignControlledActionInput, 'reauthenticationSecret' | 'persist'> = {
  actor: {
    id: actorId,
    accountState: 'ACTIVE' as const,
    roles: ['MANAGER'],
    permissions: [{ code: 'PERM-ESIG-SIGN' as const, scopes: ['GLOBAL' as const] }],
  },
  subjectType: 'DOCUMENT_VERSION',
  subjectId,
  subjectVersion: 3n,
  action: 'APPROVE',
  meaning: 'Approve document version 3',
  snapshotHash: 'hash-v3',
  requestId: 'req-signature',
};

function repository(): SignatureEvidenceRepository & { rows: SignatureEvidence[] } {
  const rows: SignatureEvidence[] = [];
  return {
    async create(input: Parameters<SignatureEvidenceRepository['create']>[0]) {
      rows.push(input);
      return input;
    },
    async get(id: string) {
      return rows.find((row) => row.id === id);
    },
    rows,
  };
}

describe('controlled e-signature', () => {
  it('reauthenticates and binds evidence to actor/action/version/time without storing the secret', async () => {
    const repo = repository();
    const verifier = { verify: vi.fn(async () => true) };
    const result = await new SignControlledActionUseCase(repo, verifier).execute({
      ...base,
      reauthenticationSecret: 'password-value',
    });
    expect(verifier.verify).toHaveBeenCalledWith(
      expect.objectContaining({ actorId, secret: 'password-value' }),
    );
    expect(result).toMatchObject({
      actorId,
      subjectType: 'DOCUMENT_VERSION',
      subjectId,
      subjectVersion: 3n,
      action: 'APPROVE',
      meaning: 'Approve document version 3',
      snapshotHash: 'hash-v3',
      reauthMethod: 'PASSWORD',
    });
    expect(
      JSON.stringify(result, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
    ).not.toContain('password-value');
  });

  it('can prepare evidence for an outer transaction without persisting it early', async () => {
    const repo = repository();
    const result = await new SignControlledActionUseCase(repo, {
      verify: async () => true,
    }).execute({ ...base, persist: false, reauthenticationSecret: 'password-value' });
    expect(result.id).toBeTruthy();
    expect(repo.rows).toHaveLength(0);
  });

  it('rejects wrong reauthentication and missing snapshot integrity', async () => {
    await expect(
      new SignControlledActionUseCase(repository(), { verify: async () => false }).execute({
        ...base,
        reauthenticationSecret: 'wrong',
      }),
    ).rejects.toMatchObject({ code: 'AUTH_REAUTH_REQUIRED' });
    await expect(
      new SignControlledActionUseCase(repository(), { verify: async () => true }).execute({
        ...base,
        snapshotHash: '',
        reauthenticationSecret: 'password-value',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});
