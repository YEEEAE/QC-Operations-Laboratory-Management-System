import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../../src/shared/database/database.js', () => ({ getDatabase: () => ({}) }));
import { laboratoryActionDependencies } from '../../../src/modules/laboratory/application/dependencies.js';
import { PostgresLabRepository } from '../../../src/modules/laboratory/infrastructure/postgres-repository.js';
import { PostgresControlledLabSources } from '../../../src/modules/laboratory/infrastructure/postgres-controlled-sources.js';
import type { LabTest } from '../../../src/modules/laboratory/domain/lab-test.js';

afterEach(() => vi.restoreAllMocks());
describe('CA-F-00 actual Retest dependency wiring', () => {
  it('does not override the fail-closed policy; valid original and authority reach the source gate', async () => {
    // A readable existing record and both canonical permissions ensure this is
    // not a missing-record/shape rejection masquerading as policy evidence.
    const original = {
      id: '01900000-0000-7000-8000-000000000001',
      state: 'APPROVED',
      authorId: '01900000-0000-7000-8000-000000000002',
      version: 3n,
    } as LabTest;
    vi.spyOn(PostgresLabRepository.prototype, 'get').mockResolvedValue(original);
    const create = vi.spyOn(PostgresLabRepository.prototype, 'create');
    const resolve = vi.spyOn(PostgresControlledLabSources.prototype, 'resolve');
    await expect(
      laboratoryActionDependencies().retest.execute({
        actor: {
          id: '01900000-0000-7000-8000-000000000003',
          roles: ['SUPERVISOR'],
          accountState: 'ACTIVE',
          permissions: [
            { code: 'PERM-LAB-RETEST', scopes: ['GLOBAL'] },
            { code: 'PERM-LAB-AUTHORIZE-RETEST', scopes: ['GLOBAL'] },
          ],
        },
        originalId: original.id,
        reason: 'Recorded request',
        requestId: 'fixture-wiring',
      }),
    ).rejects.toMatchObject({ code: 'POLICY_SOURCE_REQUIRED' });
    expect(resolve).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(original.version).toBe(3n);
  });
});
