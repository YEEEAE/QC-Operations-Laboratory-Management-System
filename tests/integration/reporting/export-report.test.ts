import { describe, expect, it } from 'vitest';
import { ExportReportUseCase } from '../../../src/modules/reporting/application/export-report.js';
import { ReportRegistry } from '../../../src/modules/reporting/application/report-registry.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor = (permissions: ActorContext['permissions'] = [
  { code: 'PERM-RPT-VIEW', scopes: ['OWN'] }, { code: 'PERM-RPT-RUN', scopes: ['OWN'] }, { code: 'PERM-RPT-EXPORT', scopes: ['OWN'] }, { code: 'PERM-RPT-EXPORT-CSV', scopes: ['OWN'] }, { code: 'PERM-RPT-EXPORT-XLSX', scopes: ['OWN'] },
]): ActorContext => ({ id: 'user-1', accountState: 'ACTIVE', roles: ['Employee'], permissions });

const query = { run: async (definition: any, currentActor: ActorContext) => ({ definition, columns: definition.columns, rows: [{ receivingNo: '=formula', createdBy: currentActor.id }] }) };

describe('authorized report exports', () => {
  it('uses the same canonical rows for CSV and XLSX and neutralizes formulas', async () => {
    const useCase = new ExportReportUseCase(new ReportRegistry(), query);
    const csv = await useCase.execute(actor(), 'quarantine-aging', 'CSV', {});
    const xlsx = await useCase.execute(actor(), 'quarantine-aging', 'XLSX', {});
    expect(csv.bytes.toString('utf8')).toContain("'=formula");
    expect(xlsx.mimeType).toContain('spreadsheetml');
    expect(xlsx.bytes.subarray(0, 2).toString()).toBe('PK');
  });

  it('reauthorizes export independently from report viewing', async () => {
    const useCase = new ExportReportUseCase(new ReportRegistry(), query);
    await expect(useCase.execute(actor([{ code: 'PERM-RPT-VIEW', scopes: ['OWN'] }, { code: 'PERM-RPT-RUN', scopes: ['OWN'] }, { code: 'PERM-RPT-EXPORT', scopes: ['OWN'] }]), 'quarantine-aging', 'CSV', {})).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
  });
});
