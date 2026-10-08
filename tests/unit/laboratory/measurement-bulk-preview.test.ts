import { describe, expect, it } from 'vitest';
import {
  previewBulkMeasurements,
  bulkMeasurementPreviewForm,
} from '../../../src/modules/laboratory/application/measurement-bulk-preview.js';
import { decodeMeasurementPost } from '../../../src/modules/laboratory/application/measurement-post.js';
import type { LabTest } from '../../../src/modules/laboratory/domain/lab-test.js';
const header = 'Sample\tParameter\tValue\tUnit\tRemarks\n';
const test: Pick<LabTest, 'samples' | 'context' | 'measurements'> = {
  samples: [
    { id: 'sample-1', identifier: 'S1' },
    { id: 'sample-2', identifier: 'S2' },
  ],
  context: {
    templateVersionId: 'template-1',
    versionNo: '1',
    methodReference: 'SYNTHETIC-ONLY',
    sourceReference: 'SYNTHETIC-ONLY',
    contentHash: 'test-only',
    requirementsReference: 'test-only',
    source: {},
    documents: [],
    equipment: [],
    parameters: [
      {
        id: 'number',
        code: 'N',
        label: 'Numeric',
        dataType: 'NUMERIC',
        unit: 'mm',
        required: true,
        sourceReference: 'SYNTHETIC',
        criteria: {},
      },
      {
        id: 'boolean',
        code: 'B',
        label: 'Boolean',
        dataType: 'BOOLEAN',
        unit: null,
        required: true,
        sourceReference: 'SYNTHETIC',
        criteria: {},
      },
      {
        id: 'text',
        code: 'T',
        label: 'Text',
        dataType: 'TEXT',
        unit: null,
        required: false,
        sourceReference: 'SYNTHETIC',
        criteria: {},
      },
    ],
  },
  measurements: [
    {
      id: 'old',
      sampleId: 'sample-2',
      parameterId: 'number',
      raw: '2.00',
      unit: 'mm',
      remarks: 'Keep this note',
      enteredBy: 'test-only',
      enteredAt: '2026-10-08T00:00:00Z',
    },
  ],
};
describe('Excel clipboard measurement preview', () => {
  it('keeps exact numeric text and declared Boolean typing, including text true', () => {
    const result = previewBulkMeasurements(
      test,
      header +
        'S1\tN\t+9007199254740993.000000000000000001\tmm\tExact\nS1\tB\tfalse\t\t\nS1\tT\ttrue\t\t',
    );
    expect(result.map((m) => m.raw)).toEqual([
      '+9007199254740993.000000000000000001',
      false,
      'true',
    ]);
  });
  it('supports Excel quoted tabs, line breaks, quotes and CRLF without trimming observations', () => {
    const result = previewBulkMeasurements(
      test,
      header + 'S1\tT\t" First\tline\nsecond ""quoted"" "\t\t"Note\nline"\r\n',
    );
    expect(result[0]?.raw).toBe(' First\tline\nsecond "quoted" ');
    expect(result[0]?.remarks).toBe('Note\nline');
  });
  it.each([
    'S1\tN\t1\tcm\t',
    'S1\tN\tNaN\tmm\t',
    'S1\tB\tyes\t\t',
    'Other\tN\t1\tmm\t',
    'S1\tOther\t1\tmm\t',
    'S1\tN\t1\tmm',
    'S1\tN\t1\tmm\t\nS1\tN\t2\tmm\t',
    'S1\tT\t"unclosed\t\t',
    'S1\tT\t"quoted"forged\t\t',
    'S1\tT\tbare"quote\t\t',
  ])('rejects invalid, forged, duplicate or malformed rows: %s', (row) => {
    expect(() => previewBulkMeasurements(test, header + row)).toThrow();
  });
  it('rejects absent/wrong headers and empty imports', () => {
    for (const value of [
      '',
      header,
      'S1\tN\t1\tmm\t',
      header.replace('Value', 'Raw') + 'S1\tN\t1\tmm\t',
    ])
      expect(() => previewBulkMeasurements(test, value)).toThrow();
  });
  it('rejects ambiguous sample identifiers and parameter codes', () => {
    expect(() =>
      previewBulkMeasurements(
        { ...test, samples: [...test.samples, { id: 'third', identifier: 'S1' }] },
        header + 'S1\tN\t1\tmm\t',
      ),
    ).toThrow();
    expect(() =>
      previewBulkMeasurements(
        {
          ...test,
          context: {
            ...test.context,
            parameters: [
              ...test.context.parameters,
              { ...test.context.parameters[0]!, id: 'duplicate' },
            ],
          },
        },
        header + 'S1\tN\t1\tmm\t',
      ),
    ).toThrow();
  });
  it('builds native manual-entry fields, keeps untouched observations and the opened version', () => {
    const form = bulkMeasurementPreviewForm(test, header + 'S1\tN\t1.00\tmm\tNew note', '7');
    expect(form.get('expectedVersion')).toBe('7');
    expect(decodeMeasurementPost(test, form)).toEqual([
      { sampleId: 'sample-1', parameterId: 'number', raw: '1.00', unit: 'mm', remarks: 'New note' },
      {
        sampleId: 'sample-2',
        parameterId: 'number',
        raw: '2.00',
        unit: 'mm',
        remarks: 'Keep this note',
      },
    ]);
    expect(test.measurements[0]?.raw).toBe('2.00');
  });
  it('rejects the whole preview when a later row fails; original measurements stay untouched', () => {
    const before = structuredClone(test);
    expect(() =>
      bulkMeasurementPreviewForm(test, header + 'S1\tN\t1\tmm\t\nS2\tN\tbad\tmm\t', '1'),
    ).toThrow();
    expect(test).toEqual(before);
  });
});
