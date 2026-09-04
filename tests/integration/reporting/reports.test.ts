import { describe, expect, it } from 'vitest';
import { ReportRegistry } from '../../../src/modules/reporting/application/report-registry.js';
import { RunReportUseCase } from '../../../src/modules/reporting/application/run-report.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { ReportQuery } from '../../../src/modules/reporting/ports/report-query.js';

const actor = (permissions: ActorContext['permissions'] = [{ code: 'PERM-RPT-VIEW', scopes: ['OWN'] }, { code: 'PERM-RPT-RUN', scopes: ['OWN'] }]): ActorContext => ({ id: 'user-1', accountState: 'ACTIVE', roles: ['Employee'], permissions });

describe('report registry and canonical datasets', () => {
  it('rejects an unknown report code', () => {
    expect(() => new ReportRegistry().get('arbitrary-table')).toThrowErrorMatchingObject({ code: 'RESOURCE_NOT_FOUND' });
  });

  it('passes the authenticated actor and server-validated filters to the canonical query', async () => {
    const calls: unknown[] = [];
    const query: ReportQuery = { run: async (definition, currentActor, filters) => { calls.push({ definition, currentActor, filters }); return { definition, columns: definition.columns, rows: [{ receivingNo: 'R-1' }] }; } };
    const result = await new RunReportUseCase(new ReportRegistry(), query).execute(actor(), 'quarantine-aging', { from: '2026-01-01' });
    expect(result.rows).toHaveLength(1);
    expect((calls[0] as { currentActor: ActorContext }).currentActor.id).toBe('user-1');
  });

  it('denies report execution without the explicit run permission', async () => {
    const query: ReportQuery = { run: async () => { throw new Error('must not query'); } };
    await expect(new RunReportUseCase(new ReportRegistry(), query).execute(actor([{ code: 'PERM-RPT-VIEW', scopes: ['OWN'] }]), 'quarantine-aging', {})).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
  });
});
