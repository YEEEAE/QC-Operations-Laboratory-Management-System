import { describe, expect, it } from 'vitest';
import { GetQuarantineOverviewUseCase } from '../../../src/modules/quarantine/application/get-quarantine-overview.js';
import { GetQuarantineAdminUseCase } from '../../../src/modules/quarantine/application/get-quarantine-admin.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor: ActorContext = { id: '01900000-0000-7000-8000-000000000001', accountState: 'ACTIVE', roles: ['SUPERVISOR'], permissions: [{ code: 'PERM-QUAR-VIEW', scopes: ['GLOBAL'] }, { code: 'PERM-ADM-TEMPLATES', scopes: ['GLOBAL'] }] };
describe('Quarantine read models', () => {
  it('requires explicit Quarantine view permission and exposes PASS separately from release', async () => {
    const result = await new GetQuarantineOverviewUseCase({ async get() { return { generatedAt: new Date(), scopeLabel: 'scope', metrics: [{ key: 'pass-not-released', label: 'PASS / not released', value: 1, definition: 'separate', href: '/', tone: 'success' }], attention: [], distributions: [] }; } }).execute({ actor });
    expect(result.metrics[0]?.key).toBe('pass-not-released');
  });
  it('requires the dedicated domain-admin permission', async () => {
    const result = await new GetQuarantineAdminUseCase({ async getAdmin() { return { generatedAt: new Date(), templates: [], receivingByState: [] }; } }).execute({ actor });
    expect(result.templates).toEqual([]);
  });
});
