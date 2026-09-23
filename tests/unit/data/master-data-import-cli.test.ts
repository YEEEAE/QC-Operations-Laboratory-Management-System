import { describe, expect, it } from 'vitest';

import { parseArgs, parseDatasetFile } from '../../../scripts/data/run-master-data-import.js';

describe('master-data import CLI', () => {
  it('rejects a dataset envelope that declares a different entity', () => {
    expect(() =>
      parseDatasetFile(
        JSON.stringify({ entityKey: 'supplier', records: [{ supplier_name: 'Synthetic' }] }),
        'equipment',
      ),
    ).toThrow(/does not match requested entity/);
  });

  it('accepts the requested entity and an optional reconciliation report path', () => {
    expect(
      parseDatasetFile(
        JSON.stringify({ entityKey: 'equipment', records: [{ equipment_no: 'FIX-1' }] }),
        'equipment',
      ),
    ).toEqual([{ equipment_no: 'FIX-1' }]);
    expect(
      parseArgs(['--entity', 'equipment', '--dataset', 'dataset.json', '--report', 'report.json']),
    ).toEqual({
      entityKey: 'equipment',
      datasetPath: 'dataset.json',
      reportPath: 'report.json',
      apply: false,
    });
  });
});
