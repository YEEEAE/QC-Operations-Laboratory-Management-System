import { describe, expect, it, vi } from 'vitest';
import { CloseCapaUseCase } from '../../../src/modules/quality/capa/application/close-capa.js';
import type { Capa } from '../../../src/modules/quality/capa/domain/capa.js';
import type { CapaRepository } from '../../../src/modules/quality/capa/ports/repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { ReauthenticationVerifier } from '../../../src/modules/e-signatures/ports/repository.js';

const capa: Capa = {
  id: '00000000-0000-0000-0000-000000000001', capaNo: 'CAPA-1', state: 'IN_PROGRESS',
  title: 'Test', description: 'Test', ownerId: 'u1', verificationRequired: true,
  effectivenessRequired: true, createdBy: 'u1', createdAt: new Date(), updatedAt: new Date(), version: 1n,
  actions: [{ id: 'a1', capaId: '00000000-0000-0000-0000-000000000001', sequenceNo: 1, description: 'Action', ownerId: 'u1', state: 'OPEN', version: 1n }],
};
const actor = (roles: string[] = ['SUPERVISOR'], permissions = ['PERM-CAPA-CLOSE']): ActorContext => ({
  id: 'u1', accountState: 'ACTIVE', roles,
  permissions: permissions.map((code) => ({ code: code as ActorContext['permissions'][number]['code'], scopes: ['OWN'] })),
});
const makeRepo = (): CapaRepository & { close: ReturnType<typeof vi.fn> } => ({
  create: vi.fn(), get: vi.fn(async () => capa), list: vi.fn(), transition: vi.fn(), close: vi.fn(async () => ({ ...capa, state: 'CLOSED' as const, version: 2n })),
});
const verifier: ReauthenticationVerifier = { verify: vi.fn(async () => true) };

describe('CloseCapaUseCase', () => {
  it('closes an eligible CAPA despite incomplete actions/effectiveness', async () => {
    const repo = makeRepo();
    const result = await new CloseCapaUseCase(repo, verifier).execute({ actor: actor(), id: capa.id, expectedVersion: 1n, reason: 'Approved P-04 exception', reauthenticationSecret: 'secret', requestId: 'req-1' });
    expect(result.state).toBe('CLOSED');
    expect(repo.close).toHaveBeenCalledOnce();
    expect(repo.close.mock.calls[0][0].signature.action).toBe('CLOSE');
  });

  it.each([
    ['Employee', ['EMPLOYEE']], ['Manager', ['MANAGER']], ['Admin', ['ADMIN']], ['yazeed without Supervisor', ['SYSTEM_OWNER']],
  ])('%s is denied', async (_name, roles) => {
    const repo = makeRepo();
    await expect(new CloseCapaUseCase(repo, verifier).execute({ actor: actor(roles), id: capa.id, expectedVersion: 1n, reason: 'reason', reauthenticationSecret: 'secret', requestId: 'req-2' })).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    expect(repo.close).not.toHaveBeenCalled();
  });

  it('denies missing permission, inactive account, failed reauth, and missing reason', async () => {
    const repo = makeRepo();
    await expect(new CloseCapaUseCase(repo, verifier).execute({ actor: actor(['SUPERVISOR'], []), id: capa.id, expectedVersion: 1n, reason: 'reason', reauthenticationSecret: 'secret', requestId: 'req-3' })).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    await expect(new CloseCapaUseCase(repo, verifier).execute({ actor: { ...actor(), accountState: 'INACTIVE' }, id: capa.id, expectedVersion: 1n, reason: 'reason', reauthenticationSecret: 'secret', requestId: 'req-4' })).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    vi.mocked(verifier.verify).mockResolvedValueOnce(false);
    await expect(new CloseCapaUseCase(repo, verifier).execute({ actor: actor(), id: capa.id, expectedVersion: 1n, reason: 'reason', reauthenticationSecret: 'secret', requestId: 'req-5' })).rejects.toMatchObject({ code: 'AUTH_REAUTH_REQUIRED' });
    await expect(new CloseCapaUseCase(repo, verifier).execute({ actor: actor(), id: capa.id, expectedVersion: 1n, reason: ' ', reauthenticationSecret: 'secret', requestId: 'req-6' })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});
