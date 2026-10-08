import { describe, expect, it, vi } from 'vitest';
import { validateReading } from '../../../src/modules/laboratory/domain/reading.js';
import { convertMeasurement } from '../../../src/modules/laboratory/domain/unit-conversion.js';
import {
  validateMeasurement,
  type Parameter,
} from '../../../src/modules/laboratory/domain/measurement.js';
import { evaluateControlledTest } from '../../../src/modules/laboratory/domain/controlled-evaluation.js';
import type { LabTest } from '../../../src/modules/laboratory/domain/lab-test.js';
import { SaveMeasurementsUseCase } from '../../../src/modules/laboratory/application/save-measurements.js';
import { PostgresControlledLabSources } from '../../../src/modules/laboratory/infrastructure/postgres-controlled-sources.js';
vi.mock('../../../src/modules/laboratory/application/lab-authorization.js', () => ({
  authorizeLab: vi.fn(),
}));
const parameter: Parameter = {
  id: 'p',
  code: 'P',
  label: 'Synthetic',
  dataType: 'NUMERIC',
  unit: 'target',
  required: true,
  sourceReference: 'SYNTHETIC',
  criteria: { max: '1.0' },
  acceptanceRuleType: 'MAX_LIMIT',
  unitConversionRules: [
    {
      ruleType: 'EXACT_AFFINE',
      fromUnit: 'input',
      toUnit: 'target',
      factor: '0.1',
      offset: '0.00',
      sourceReference: 'SYNTHETIC',
      version: '1',
    },
  ],
};
const input = { sampleId: 's', parameterId: 'p', raw: '0.100000000000000001', unit: 'input' };
describe('controlled science technical contract (synthetic authority)', () => {
  it('run replicates deny alternate units until a traceable conversion path exists', () => {
    expect(() => validateReading({ ...input, readingIndex: 1 }, parameter)).toThrow();
  });
  it('keeps exact original and converted decimal trace', () => {
    expect(validateMeasurement(input, parameter)).toEqual(input);
    expect(convertMeasurement(input, parameter)).toMatchObject({
      calculatedValue: '0.0100000000000000001',
      calculatedUnit: 'target',
      calculationInputs: {
        originalInput: input.raw,
        originalUnit: 'input',
        factor: '0.1',
        offset: '0.00',
        version: '1',
      },
    });
  });
  it('denies missing rule, malformed factor, ambiguous rule and source mismatch', () => {
    for (const rules of [
      null,
      [{ ...(parameter.unitConversionRules as object[])[0], factor: 0.1 }],
      [{ ...(parameter.unitConversionRules as object[])[0], sourceReference: 'OTHER' }],
      [
        ...(parameter.unitConversionRules as object[]),
        ...(parameter.unitConversionRules as object[]),
      ],
    ]) {
      expect(() =>
        validateMeasurement(input, { ...parameter, unitConversionRules: rules }),
      ).toThrow();
    }
  });
  const test = {
    context: {
      sourceReference: 'SYNTHETIC',
      versionNo: '1',
      contentHash: 'hash',
      parameters: [parameter],
      source: {
        evaluationPolicy: {
          ruleType: 'ALL_PARAMETERS_ALL_SAMPLES',
          onAnyFail: 'FAIL',
          onIncomplete: 'HOLD',
          onAllPass: 'PASS',
          sourceReference: 'SYNTHETIC',
          version: '1',
        },
      },
    },
    samples: [{ id: 's' }],
    measurements: [
      { sampleId: 's', parameterId: 'p', raw: '1.000000000000000001', unit: 'target' },
    ],
  } as unknown as LabTest;
  it('evaluates exact frozen criteria only with explicit aggregation', () => {
    expect(evaluateControlledTest(test).result).toBe('FAIL');
    expect(evaluateControlledTest({ ...test, measurements: [] }).result).toBe('HOLD');
  });
  it('denies missing, foreign, malformed policy and mismatched units', () => {
    for (const evaluationPolicy of [
      null,
      {},
      { ...(test.context.source.evaluationPolicy as object), sourceReference: 'OTHER' },
    ])
      expect(() =>
        evaluateControlledTest({
          ...test,
          context: { ...test.context, source: { evaluationPolicy } },
        }),
      ).toThrow();
    expect(() =>
      evaluateControlledTest({
        ...test,
        measurements: [{ ...test.measurements[0]!, unit: 'other' }],
      }),
    ).toThrow();
  });
  it('connected save use case persists original evidence and conversion trace', async () => {
    const existing = { ...test, id: 't', version: 1n, samples: [], measurements: [] };
    const save = vi.fn(async (_before, after) => after);
    const useCase = new SaveMeasurementsUseCase({ get: async () => existing, save } as never);
    const saved = await useCase.execute({
      actor: { id: 'actor' } as never,
      id: 't',
      expectedVersion: 1n,
      samples: [{ id: 's', identifier: 'sample' }],
      measurements: [input],
      requestId: 'request',
    });
    expect(saved.measurements[0]).toMatchObject({
      raw: input.raw,
      unit: 'input',
      calculatedValue: '0.0100000000000000001',
      calculationRuleReference: 'SYNTHETIC',
      calculationRuleVersion: '1',
    });
    expect(save).toHaveBeenCalledOnce();
  });
  it('connected provider evaluates frozen matching source and denies changed source', async () => {
    const context = { ...test.context, equipment: [] };
    const record = { ...test, context };
    const provider = new PostgresControlledLabSources({} as never);
    const resolve = vi.spyOn(provider, 'resolve').mockResolvedValue(context);
    expect((await provider.evaluate(record)).result).toBe('FAIL');
    resolve.mockResolvedValue({ ...context, contentHash: 'changed' });
    await expect(provider.evaluate(record)).rejects.toThrow();
  });
});
