import { describe, expect, it } from 'vitest';
import {
  parseReportFilterValues,
  parseReportFilters,
} from '../../../src/modules/reporting/application/parse-report-filters.js';

describe('report filter URL contract', () => {
  it('parses the same valid filters regardless of the CSV/XLSX format parameter', () => {
    const screen = parseReportFilters(
      new URLSearchParams(
        'from=2026-03-01&to=2026-03-31&workflowState=PENDING&releaseSystem=false',
      ),
    );
    const exportFilters = parseReportFilters(
      new URLSearchParams(
        'format=csv&from=2026-03-01&to=2026-03-31&workflowState=PENDING&releaseSystem=false',
      ),
    );

    expect(exportFilters).toEqual(screen);
    expect(exportFilters.releaseSystem).toBe(false);
  });

  it('preserves every report filter for both page links and action exports', () => {
    const screen = parseReportFilters(
      new URLSearchParams(
        'from=2026-03-15&to=2026-03-15&lot=LOT-SCOPE&itemCode=ITEM-SCOPE&workflowState=INSPECTION_COMPLETE&inspectionResult=PASS&releaseSystem=true',
      ),
    );
    const actionExport = parseReportFilterValues({
      from: '2026-03-15',
      to: '2026-03-15',
      lot: 'LOT-SCOPE',
      itemCode: 'ITEM-SCOPE',
      workflowState: 'INSPECTION_COMPLETE',
      inspectionResult: 'PASS',
      releaseSystem: 'true',
    });

    expect(actionExport).toEqual(screen);
  });

  it.each([
    'releaseSystem=maybe',
    'from=2026-02-30',
    'from=2026-04-01&to=2026-03-01',
    'workflowState=UNKNOWN',
    'inspectionResult=UNKNOWN',
    'q=private-search',
    'from=2026-03-01&from=2026-03-02',
  ])('rejects an unsupported or ambiguous filter query: %s', (query) => {
    expect(() => parseReportFilters(new URLSearchParams(query))).toThrow();
  });
});
