import { describe, expect, it } from 'vitest';
import { reportSnapshotRef } from '../../../src/modules/reporting/application/report-snapshot.js';
import { QUARANTINE_AGING_REPORT } from '../../../src/modules/reporting/domain/report-definition.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor: ActorContext = {
  id: 'owner-a',
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [],
};
const dataset = {
  definition: QUARANTINE_AGING_REPORT,
  columns: QUARANTINE_AGING_REPORT.columns,
  rows: [{ receivingNo: 'R-1', qty: '9007199254740993.0001' }],
  sourceRowIds: ['row-1'],
};

describe('report snapshot binding', () => {
  it('is deterministic and changes with actor, filters, or returned row values', () => {
    const ref = reportSnapshotRef(dataset, actor, { from: '2026-03-01', lot: 'LOT-1' });
    expect(ref).toMatch(/^[a-f0-9]{64}$/);
    expect(reportSnapshotRef(dataset, actor, { lot: 'LOT-1', from: '2026-03-01' })).toBe(ref);
    expect(
      reportSnapshotRef(dataset, { ...actor, id: 'owner-b' }, { from: '2026-03-01', lot: 'LOT-1' }),
    ).not.toBe(ref);
    expect(reportSnapshotRef(dataset, actor, { from: '2026-03-02', lot: 'LOT-1' })).not.toBe(ref);
    expect(
      reportSnapshotRef({ ...dataset, rows: [{ receivingNo: 'R-1', qty: '1' }] }, actor, {
        from: '2026-03-01',
        lot: 'LOT-1',
      }),
    ).not.toBe(ref);
    expect(
      reportSnapshotRef({ ...dataset, sourceRowIds: ['row-2'] }, actor, {
        from: '2026-03-01',
        lot: 'LOT-1',
      }),
    ).not.toBe(ref);
  });
});
