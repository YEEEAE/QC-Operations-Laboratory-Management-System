import { describe, expect, it } from 'vitest';
import { createReportProvenance } from '../../../src/modules/reporting/application/report-provenance.js';
import { QUARANTINE_AGING_REPORT } from '../../../src/modules/reporting/domain/report-definition.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor: ActorContext = {
  id: 'owner-1',
  loginIdentity: 'report-owner',
  accountState: 'ACTIVE',
  roles: ['Employee'],
  permissions: [],
};

describe('shared report provenance', () => {
  it('normalizes scope, filter order, UTC generation time, count, source, and sort', () => {
    const provenance = createReportProvenance(
      QUARANTINE_AGING_REPORT,
      actor,
      {
        releaseSystem: true,
        inspectionResult: 'PASS',
        lot: 'LOT-7',
        from: '2026-03-01',
      },
      2,
      new Date('2026-09-23T12:00:00.000Z'),
    );

    expect(provenance).toEqual({
      report: 'quarantine-aging — Quarantine receiving register',
      generatedAt: '2026-09-23T12:00:00.000Z',
      generatedBy: 'report-owner',
      scope: 'Records created by this account (OWN scope)',
      period: '2026-03-01 to Present',
      filters: 'from=2026-03-01; lot=LOT-7; inspectionResult=PASS; releaseSystem=true',
      count: 2,
      status: 'UNAPPROVED REPORT COPY — informational; not a controlled record',
      source: 'qc.receiving_items',
      sort: 'Receiving date descending, then stable record id descending',
    });
  });
});
