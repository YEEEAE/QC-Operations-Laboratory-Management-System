import { describe, expect, it } from 'vitest';
import {
  comparisonRows,
  criteriaText,
  entryParameters,
} from '../../../src/modules/laboratory/application/lab-presentation.js';
import type { LabTest } from '../../../src/modules/laboratory/domain/lab-test.js';
import type { Measurement, Parameter } from '../../../src/modules/laboratory/domain/measurement.js';

function parameter(overrides: Partial<Parameter> = {}): Parameter {
  return {
    id: 'p-1',
    code: 'ph',
    label: 'pH',
    dataType: 'NUMERIC',
    unit: 'pH',
    required: true,
    sourceReference: 'TEST-ONLY-SOURCE',
    criteria: { lower: '5.0', upper: '6.0' },
    acceptanceRuleType: 'RANGE_INCLUSIVE',
    ...overrides,
  };
}

function measurement(overrides: Partial<Measurement> = {}): Measurement {
  return {
    id: 'm-1',
    sampleId: 's-1',
    parameterId: 'p-1',
    raw: '5.5',
    unit: 'pH',
    enteredBy: 'u-1',
    enteredAt: '2026-09-21T00:00:00.000Z',
    ...overrides,
  };
}

function test(overrides: Partial<LabTest> = {}): LabTest {
  return {
    id: 't-1',
    samples: [
      { id: 's-1', identifier: 'SMPL-001' },
      { id: 's-2', identifier: 'SMPL-002' },
    ],
    measurements: [],
    context: {
      parameters: [parameter()],
    },
    ...overrides,
  } as unknown as LabTest;
}

describe('criteriaText — verbatim rendering of approved acceptance payloads (QC-100-FINAL-038)', () => {
  it('renders each approved rule type from its stored payload', () => {
    expect(criteriaText(parameter())).toBe('Between 5.0 and 6.0 (inclusive)');
    expect(criteriaText(parameter({ acceptanceRuleType: 'RANGE_EXCLUSIVE' }))).toBe(
      'Above 5.0 and below 6.0 (exclusive)',
    );
    expect(
      criteriaText(parameter({ acceptanceRuleType: 'MAX_LIMIT', criteria: { max: '1.0' } })),
    ).toBe('At most 1.0');
    expect(
      criteriaText(parameter({ acceptanceRuleType: 'MIN_LIMIT', criteria: { min: '98.0' } })),
    ).toBe('At least 98.0');
    expect(
      criteriaText(parameter({ acceptanceRuleType: 'EQUALS', criteria: { expected: 'Clear' } })),
    ).toBe('Must equal Clear');
    expect(
      criteriaText(
        parameter({
          dataType: 'BOOLEAN',
          acceptanceRuleType: 'EQUALS',
          criteria: { expected: true },
        }),
      ),
    ).toBe('Must be Yes');
    expect(
      criteriaText(
        parameter({
          dataType: 'TEXT',
          acceptanceRuleType: 'ENUM_ALLOWED',
          criteria: { allowed: ['A', 'B'] },
        }),
      ),
    ).toBe('One of: A, B');
  });

  it('never invents a threshold: malformed payloads fall back to the verbatim stored criteria', () => {
    expect(criteriaText(parameter({ acceptanceRuleType: 'MAX_LIMIT', criteria: {} }))).toBe(
      'No approved criteria recorded',
    );
    expect(criteriaText(parameter({ acceptanceRuleType: null, criteria: {} }))).toBe(
      'No approved criteria recorded',
    );
    expect(
      criteriaText(
        parameter({ acceptanceRuleType: 'UNKNOWN_RULE', criteria: { note: 'per SOP-7 §3' } }),
      ),
    ).toBe('Approved criteria: {"note":"per SOP-7 §3"}');
  });
});

describe('entryParameters — point-of-entry context (QC-100-FINAL-038)', () => {
  it('carries unit, required flag, precision guidance, source reference and criteria text', () => {
    const [entry] = entryParameters(
      test({
        context: {
          parameters: [parameter({ precisionGuidance: 'Record to 0.01' })],
        } as unknown as LabTest['context'],
      }),
    );
    expect(entry).toMatchObject({
      id: 'p-1',
      unit: 'pH',
      required: true,
      precisionGuidance: 'Record to 0.01',
      sourceReference: 'TEST-ONLY-SOURCE',
      criteriaText: 'Between 5.0 and 6.0 (inclusive)',
    });
  });

  it('renders no precision guidance when the frozen context carries none', () => {
    const [entry] = entryParameters(test());
    expect(entry.precisionGuidance).toBeNull();
  });
});

describe('comparisonRows — observed vs approved criteria (QC-100-FINAL-038)', () => {
  it('evaluates PASS/FAIL only from the approved rule on the frozen context', () => {
    const rows = comparisonRows(
      test({
        measurements: [
          measurement({ raw: '5.5' }),
          measurement({ id: 'm-2', sampleId: 's-2', raw: '7.0' }),
        ],
      }),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      sampleIdentifier: 'SMPL-001',
      observed: '5.5',
      outcome: 'PASS',
      criteriaText: 'Between 5.0 and 6.0 (inclusive)',
    });
    expect(rows[1]).toMatchObject({ observed: '7.0', outcome: 'FAIL' });
  });

  it('yields REVIEWER_DECISION when the parameter carries no approved rule', () => {
    const rows = comparisonRows(
      test({
        context: {
          parameters: [parameter({ acceptanceRuleType: null, criteria: {} })],
        } as unknown as LabTest['context'],
        measurements: [measurement({ raw: '5.5' })],
        samples: [{ id: 's-1', identifier: 'SMPL-001' }],
      }),
    );
    expect(rows[0].outcome).toBe('REVIEWER_DECISION');
    expect(rows[0].criteriaText).toBe('No approved criteria recorded');
  });

  it('yields NOT_RECORDED when no value was captured', () => {
    const rows = comparisonRows(test({ samples: [{ id: 's-1', identifier: 'SMPL-001' }] }));
    expect(rows[0]).toMatchObject({ observed: null, outcome: 'NOT_RECORDED' });
  });

  it('prefers the approved-rule calculated value and marks it calculated', () => {
    const rows = comparisonRows(
      test({
        samples: [{ id: 's-1', identifier: 'SMPL-001' }],
        measurements: [measurement({ raw: null, calculatedValue: '5.50', calculatedUnit: 'pH' })],
      }),
    );
    expect(rows[0]).toMatchObject({
      observed: '5.50',
      calculated: true,
      unit: 'pH',
      outcome: 'PASS',
    });
  });

  it('renders booleans as Yes/No but evaluates the rule against the stored value', () => {
    const rows = comparisonRows(
      test({
        samples: [{ id: 's-1', identifier: 'SMPL-001' }],
        context: {
          parameters: [
            parameter({
              dataType: 'BOOLEAN',
              unit: null,
              acceptanceRuleType: 'EQUALS',
              criteria: { expected: true },
            }),
          ],
        } as unknown as LabTest['context'],
        measurements: [measurement({ raw: true, unit: null })],
      }),
    );
    expect(rows[0]).toMatchObject({ observed: 'Yes', outcome: 'PASS' });
  });
});
