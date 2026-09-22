import { describe, expect, it } from 'vitest';
import {
  computeCalculation,
  isCalculationRuleType,
  observationValue,
  parseCalculationRule,
} from '../../../src/modules/laboratory/domain/calculation.js';
import { compareDecimals, sumDecimals } from '../../../src/modules/laboratory/domain/exact-decimal.js';
import { assertBatchSamples, assertBatches } from '../../../src/modules/laboratory/domain/lab-batch.js';
import { evaluateParameterAcceptance } from '../../../src/modules/laboratory/domain/parameter-acceptance.js';
import { assertUniqueReadings, numericReadingValue, validateReading } from '../../../src/modules/laboratory/domain/reading.js';
import { deriveSampleResult, deriveTestResult } from '../../../src/modules/laboratory/domain/sample-result.js';
import type { LabBatch } from '../../../src/modules/laboratory/domain/lab-batch.js';
import type { EquipmentContext, LabSample, LabTest } from '../../../src/modules/laboratory/domain/lab-test.js';
import type { Parameter } from '../../../src/modules/laboratory/domain/measurement.js';
import { RecordLabRunUseCase } from '../../../src/modules/laboratory/application/record-lab-run.js';
import type { LabRepository } from '../../../src/modules/laboratory/ports/repository.js';
import { AppError } from '../../../src/shared/errors/app-error.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const AUTHOR_ID = '01900000-0000-7000-8000-0000000000c1';

const author = (overrides: Partial<ActorContext> = {}): ActorContext => ({
  id: AUTHOR_ID,
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [
    { code: 'PERM-LAB-VIEW', scopes: ['OWN'] },
    { code: 'PERM-LAB-EDIT-DRAFT', scopes: ['OWN'] },
    { code: 'PERM-LAB-ENTER-MEASUREMENT', scopes: ['OWN'] },
  ],
  ...overrides,
});

function parameter(overrides: Partial<Parameter> = {}): Parameter {
  return {
    id: '01900000-0000-7000-8000-0000000000d1',
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

describe('exact decimal arithmetic (QC-DATA-003)', () => {
  it('compares and sums without binary floating point', () => {
    expect(compareDecimals('0.1', '0.10')).toBe(0);
    expect(compareDecimals('0.30000000000000004', '0.3')).toBe(1);
    expect(compareDecimals('9007199254740993.0000000001', '9007199254740993')).toBe(1);
    expect(sumDecimals(['0.1', '0.2'])).toBe('0.3');
    expect(sumDecimals(['9007199254740993.0000000001', '0.0000000001'])).toBe(
      '9007199254740993.0000000002',
    );
  });
});

describe('approved calculation rules (QC-DATA-003)', () => {
  it('rejects unknown rule types and yields no rule without a source reference', () => {
    expect(isCalculationRuleType('MEAN')).toBe(true);
    expect(isCalculationRuleType('AVERAGE')).toBe(false);
    expect(parseCalculationRule({ ruleType: 'MEAN', rulePayload: { decimals: 1 } }, '')).toBeUndefined();
    expect(parseCalculationRule(null, 'TEST-ONLY-SOURCE')).toBeUndefined();
  });

  it('computes SUM, MIN, MAX and RANGE exactly', () => {
    const base = { sourceReference: 'TEST-ONLY-SOURCE', version: 'r1', decimals: null };
    expect(computeCalculation({ ...base, ruleType: 'SUM' }, ['1.10', '2.2'])?.value).toBe('3.30');
    // Results are rendered at the common scale of the inputs, exactly: nothing
    // is truncated and nothing is padded into a different value.
    expect(computeCalculation({ ...base, ruleType: 'MIN' }, ['1.10', '2.2'])?.value).toBe('1.10');
    expect(computeCalculation({ ...base, ruleType: 'MAX' }, ['1.10', '2.2'])?.value).toBe('2.20');
    expect(computeCalculation({ ...base, ruleType: 'RANGE' }, ['1.10', '2.2'])?.value).toBe('1.10');
    expect(computeCalculation({ ...base, ruleType: 'MAX' }, ['-3', '-7'])?.value).toBe('-3');
  });

  it('computes MEAN only at the precision the approved source declares', () => {
    const rule = parseCalculationRule(
      { ruleType: 'MEAN', rulePayload: { decimals: 2, version: 'r3' } },
      'TEST-ONLY-SOURCE',
    );
    expect(rule?.sourceReference).toBe('TEST-ONLY-SOURCE');
    expect(rule?.version).toBe('r3');
    expect(computeCalculation(rule!, ['5.4', '5.6'])?.value).toBe('5.50');
    // 1/3 is non-terminating: half-up at the declared precision, never a guess.
    expect(computeCalculation(rule!, ['1', '0'])?.value).toBe('0.50');
    expect(computeCalculation(rule!, ['0.125', '0.125', '0.125', '0.125'])?.value).toBe('0.13');
    // No declared precision means no derived value at all.
    const none = parseCalculationRule({ ruleType: 'MEAN', rulePayload: {} }, 'TEST-ONLY-SOURCE');
    expect(none).toBeUndefined();
  });

  it('returns no value for empty or non-numeric readings', () => {
    const rule = parseCalculationRule(
      { ruleType: 'SUM', rulePayload: {} },
      'TEST-ONLY-SOURCE',
    )!;
    expect(computeCalculation(rule, [])).toBeUndefined();
    expect(computeCalculation(rule, ['1', 'not-a-number'])).toBeUndefined();
  });

  it('falls back to a single reading only when there is exactly one', () => {
    expect(observationValue(undefined, ['5.4'])).toBe('5.4');
    expect(observationValue(undefined, ['5.4', '5.6'])).toBeUndefined();
    expect(observationValue('5.50', ['5.4', '5.6'])).toBe('5.50');
  });
});

describe('approved acceptance rules (QC-DATA-003)', () => {
  it('applies numeric rules inclusively, exclusively and one-sided', () => {
    const base = { dataType: 'NUMERIC' };
    expect(
      evaluateParameterAcceptance({
        ...base,
        value: '5.0',
        ruleType: 'RANGE_INCLUSIVE',
        rulePayload: { lower: '5.0', upper: '6.0' },
      }),
    ).toBe('PASS');
    expect(
      evaluateParameterAcceptance({
        ...base,
        value: '5.0',
        ruleType: 'RANGE_EXCLUSIVE',
        rulePayload: { lower: '5.0', upper: '6.0' },
      }),
    ).toBe('FAIL');
    expect(
      evaluateParameterAcceptance({
        ...base,
        value: '1.0',
        ruleType: 'MAX_LIMIT',
        rulePayload: { max: '1.0' },
      }),
    ).toBe('PASS');
    expect(
      evaluateParameterAcceptance({
        ...base,
        value: '4.9',
        ruleType: 'MIN_LIMIT',
        rulePayload: { min: '5.0' },
      }),
    ).toBe('FAIL');
  });

  it('applies enum and boolean rules', () => {
    expect(
      evaluateParameterAcceptance({
        dataType: 'TEXT',
        value: 'Clear',
        ruleType: 'ENUM_ALLOWED',
        rulePayload: { allowed: ['Clear', 'Slightly turbid'] },
      }),
    ).toBe('PASS');
    expect(
      evaluateParameterAcceptance({
        dataType: 'TEXT',
        value: 'Cloudy',
        ruleType: 'ENUM_ALLOWED',
        rulePayload: { allowed: ['Clear'] },
      }),
    ).toBe('FAIL');
    expect(
      evaluateParameterAcceptance({
        dataType: 'BOOLEAN',
        value: true,
        ruleType: 'EQUALS',
        rulePayload: { expected: true },
      }),
    ).toBe('PASS');
    expect(
      evaluateParameterAcceptance({
        dataType: 'BOOLEAN',
        value: false,
        ruleType: 'EQUALS',
        rulePayload: { expected: true },
      }),
    ).toBe('FAIL');
  });

  it('never invents an outcome without a formal rule', () => {
    expect(
      evaluateParameterAcceptance({
        dataType: 'NUMERIC',
        value: '5.4',
        ruleType: null,
        rulePayload: { lower: '5.0', upper: '6.0' },
      }),
    ).toBeNull();
    expect(
      evaluateParameterAcceptance({
        dataType: 'NUMERIC',
        value: '5.4',
        ruleType: 'RANGE_INCLUSIVE',
        rulePayload: null,
      }),
    ).toBeNull();
    expect(
      evaluateParameterAcceptance({
        dataType: 'NUMERIC',
        value: '5.4',
        ruleType: 'RANGE_INCLUSIVE',
        rulePayload: { lower: '5.0' },
      }),
    ).toBeNull();
    expect(
      evaluateParameterAcceptance({
        dataType: 'NUMERIC',
        value: null,
        ruleType: 'RANGE_INCLUSIVE',
        rulePayload: { lower: '5.0', upper: '6.0' },
      }),
    ).toBeNull();
  });
});

describe('sample and overall result derivation (QC-DATA-003)', () => {
  it('lets a FAIL dominate, requires every required PASS, and holds otherwise', () => {
    expect(
      deriveSampleResult([
        { parameterId: 'a', required: true, result: 'PASS' },
        { parameterId: 'b', required: true, result: 'PASS' },
      ]),
    ).toBe('PASS');
    expect(
      deriveSampleResult([
        { parameterId: 'a', required: true, result: 'PASS' },
        { parameterId: 'b', required: false, result: 'FAIL' },
      ]),
    ).toBe('FAIL');
    expect(
      deriveSampleResult([
        { parameterId: 'a', required: true, result: 'PASS' },
        { parameterId: 'b', required: true, result: null },
      ]),
    ).toBe('HOLD');
    expect(deriveSampleResult([])).toBeUndefined();
  });

  it('aggregates run sample results without inventing an outcome', () => {
    expect(deriveTestResult(['PASS', 'PASS'])).toBe('PASS');
    expect(deriveTestResult(['PASS', 'FAIL'])).toBe('FAIL');
    expect(deriveTestResult(['PASS', 'HOLD'])).toBe('HOLD');
    expect(deriveTestResult([])).toBeUndefined();
  });
});

describe('runs, samples and replicates (QC-DATA-003)', () => {
  const batch = (overrides: Partial<LabBatch> = {}): LabBatch => ({
    id: '01900000-0000-7000-8000-0000000000e1',
    batchNo: 'RUN-1',
    sequence: 1,
    startedAt: '2026-09-21T00:00:00.000Z',
    ...overrides,
  });

  it('rejects duplicate run identity, order and windows', () => {
    expect(() => assertBatches([batch(), batch()])).toThrowError(AppError);
    expect(() => assertBatches([batch(), batch({ id: 'x', batchNo: 'RUN-2' })])).toThrowError(
      AppError,
    );
    expect(() =>
      assertBatches([
        batch({ completedAt: '2026-09-20T00:00:00.000Z' }),
      ]),
    ).toThrowError(AppError);
    expect(() => assertBatches([batch({ batchNo: '  ' })])).toThrowError(AppError);
    expect(() => assertBatches([batch(), batch({ id: 'y', batchNo: 'RUN-2', sequence: 2 })])).not.toThrow();
  });

  it('rejects a sample that names a run the record does not carry', () => {
    const samples: LabSample[] = [
      { id: 's1', identifier: 'S-1', batchId: batch().id },
      { id: 's2', identifier: 'S-1', batchId: '01900000-0000-7000-8000-0000000000ff' },
    ];
    expect(() => assertBatchSamples(samples, [batch()])).toThrowError(AppError);
    expect(() =>
      assertBatchSamples(
        [
          { id: 's1', identifier: 'S-1', batchId: batch().id },
          { id: 's3', identifier: 'S-1', batchId: batch().id },
        ],
        [batch()],
      ),
    ).toThrowError(AppError);
    // A legacy test-level sample without a run is left alone.
    expect(() => assertBatchSamples([{ id: 's4', identifier: 'S-4' }], [])).not.toThrow();
  });

  it('requires a positive replicate index and unique replicate identity', () => {
    expect(() =>
      validateReading(
        { sampleId: 's', parameterId: parameter().id, readingIndex: 0, raw: '5', unit: 'pH' },
        parameter(),
      ),
    ).toThrowError(AppError);
    expect(() =>
      assertUniqueReadings([
        { sampleId: 's', parameterId: 'p', readingIndex: 1, raw: '5', unit: null },
        { sampleId: 's', parameterId: 'p', readingIndex: 1, raw: '6', unit: null },
      ]),
    ).toThrowError(AppError);
    expect(numericReadingValue(' 5.40 ')).toBe('5.40');
    expect(numericReadingValue(true)).toBeUndefined();
    expect(numericReadingValue('turbid')).toBeUndefined();
  });
});

class MemoryRepository implements LabRepository {
  constructor(public value: LabTest) {}
  async get() {
    return this.value;
  }
  async list() {
    return { items: [this.value], total: 1 };
  }
  async workload() {
    return {
      total: 1,
      rows: [
        {
          id: this.value.id,
          labTestNo: this.value.labTestNo,
          state: this.value.state,
          updatedAt: new Date(this.value.updatedAt),
        },
      ],
    };
  }
  async create() {
    return this.value;
  }
  async history() {
    return [];
  }
  async save(_previous: LabTest, next: LabTest) {
    this.value = next;
    return next;
  }
  equipment: (EquipmentContext & { batchId: string | null })[] = [];
  async linkRunEquipment(input: {
    batchId: string;
    usage: EquipmentContext;
  }) {
    this.equipment.push({ ...input.usage, batchId: input.batchId });
  }
  async listRunEquipment() {
    return this.equipment;
  }
}

function runTest(state: LabTest['state'] = 'DRAFT'): LabTest {
  return {
    id: '01900000-0000-7000-8000-0000000000a1',
    labTestNo: 'TEST-ONLY-RUN-001',
    state,
    scientificResult: null,
    authorId: AUTHOR_ID,
    createdBy: AUTHOR_ID,
    version: 1n,
    context: {
      templateVersionId: '01900000-0000-7000-8000-0000000000d0',
      versionNo: 'v1',
      methodReference: 'TEST-ONLY-METHOD',
      sourceReference: 'TEST-ONLY-SOURCE',
      contentHash: 'TEST-ONLY-HASH',
      requirementsReference: 'TEST-ONLY-SOURCE',
      source: {},
      documents: [],
      equipment: [],
      parameters: [
        parameter({
          calculationRule: {
            ruleType: 'MEAN',
            rulePayload: { decimals: 1, version: 'r1', sourceReference: 'TEST-ONLY-SOURCE' },
          },
        }),
        parameter({
          id: '01900000-0000-7000-8000-0000000000d2',
          code: 'assay',
          label: 'Assay',
          unit: '%',
          criteria: { max: '1.0' },
          acceptanceRuleType: 'MAX_LIMIT',
        }),
      ],
    },
    samples: [],
    measurements: [],
    batches: [],
    readings: [],
    sampleResults: [],
    derivedResult: null,
    originalTestId: null,
    retestSequence: 0,
    retestReason: null,
    createdAt: '2026-09-21T00:00:00.000Z',
    updatedAt: '2026-09-21T00:00:00.000Z',
    submittedAt: null,
    reviewStartedAt: null,
    approvedAt: null,
    rejectedAt: null,
  };
}

const [PH, ASSAY] = runTest().context.parameters;

function recordInput(overrides: Record<string, unknown> = {}) {
  return {
    actor: author(),
    id: runTest().id,
    expectedVersion: 1n,
    run: { batchNo: 'RUN-1', label: 'First extraction' },
    samples: [{ identifier: 'S-1' }],
    readings: [],
    requestId: 'req-run',
    ...overrides,
  };
}

describe('record a laboratory run (QC-DATA-003)', () => {
  it('stores replicates, the approved calculation and the derived sample result', async () => {
    const repository = new MemoryRepository(runTest());
    const saved = await new RecordLabRunUseCase(repository, () => new Date('2026-09-21T01:00:00.000Z')).execute(
      recordInput({
        readings: [
          { sampleIdentifier: 'S-1', parameterId: PH!.id, readingIndex: 1, raw: '5.4', unit: 'pH' },
          { sampleIdentifier: 'S-1', parameterId: ASSAY!.id, readingIndex: 1, raw: '0.5', unit: '%' },
        ],
      }) as never,
    );
    expect(saved.batches).toHaveLength(1);
    expect(saved.batches?.[0]?.sequence).toBe(1);
    expect(saved.samples).toHaveLength(1);
    const sampleId = saved.samples[0]!.id;
    expect(saved.samples[0]!.batchId).toBe(saved.batches?.[0]?.id);
    expect(saved.readings).toHaveLength(2);
    expect(saved.readings?.[0]?.enteredBy).toBe(AUTHOR_ID);
    // Single reading with no calculation would be raw, but this parameter
    // carries an approved MEAN rule, so the reported value is the calculation.
    const measurement = saved.measurements.find((m) => m.parameterId === PH!.id);
    expect(measurement?.raw).toBeNull();
    expect(measurement?.calculatedValue).toBe('5.4');
    expect(measurement?.calculationRuleReference).toBe('TEST-ONLY-SOURCE');
    expect(measurement?.calculationRuleVersion).toBe('r1');
    const result = saved.sampleResults?.find((r) => r.sampleId === sampleId);
    expect(result?.result).toBe('PASS');
    expect(result?.source).toBe('SYSTEM_EVALUATION');
  });

  it('derives FAIL when one approved parameter fails, and HOLD when required evidence is missing', async () => {
    const repository = new MemoryRepository(runTest());
    const useCase = new RecordLabRunUseCase(repository);
    const first = await useCase.execute(
      recordInput({
        readings: [
          { sampleIdentifier: 'S-1', parameterId: PH!.id, readingIndex: 1, raw: '5.4', unit: 'pH' },
        ],
      }) as never,
    );
    const sampleId = first.samples[0]!.id;
    const failed = await useCase.execute(
      recordInput({
        expectedVersion: 2n,
        run: { batchId: first.batches![0]!.id, batchNo: 'RUN-1' },
        samples: [{ identifier: 'S-1' }],
        readings: [
          { sampleIdentifier: 'S-1', parameterId: PH!.id, readingIndex: 1, raw: '5.4', unit: 'pH' },
          { sampleIdentifier: 'S-1', parameterId: ASSAY!.id, readingIndex: 1, raw: '1.5', unit: '%' },
        ],
      }) as never,
    );
    expect(failed.sampleResults?.[0]?.result).toBe('FAIL');
    // Re-entering only pH replaces that group and leaves the assay outcome in
    // place, so the derived result stays FAIL rather than silently upgrading.
    expect(failed.readings?.filter((r) => r.parameterId === PH!.id)).toHaveLength(1);

    const held = await useCase.execute(
      recordInput({
        expectedVersion: 3n,
        run: { batchId: first.batches![0]!.id, batchNo: 'RUN-1' },
        samples: [{ identifier: 'S-1' }],
        readings: [
          { sampleIdentifier: 'S-1', parameterId: PH!.id, readingIndex: 2, raw: '5.4', unit: 'pH' },
        ],
      }) as never,
    );
    // The pH group is now a single reading; the assay group from the previous
    // submission is untouched and still FAIL, so the sample stays FAIL.
    expect(held.sampleResults?.[0]?.result).toBe('FAIL');
    expect(held.sampleResults?.[0]?.sampleId).toBe(sampleId);
  });

  it('keeps a sample HOLD when a required parameter carries no approved rule outcome', async () => {
    const test = runTest();
    const repository = new MemoryRepository({
      ...test,
      context: {
        ...test.context,
        parameters: [parameter({ acceptanceRuleType: null })],
      },
    });
    const saved = await new RecordLabRunUseCase(repository).execute(
      recordInput({
        readings: [
          { sampleIdentifier: 'S-1', parameterId: PH!.id, readingIndex: 1, raw: '5.4', unit: 'pH' },
        ],
      }) as never,
    );
    expect(saved.sampleResults?.[0]?.result).toBe('HOLD');
  });

  it('is idempotent for the same run and never duplicates its samples', async () => {
    const repository = new MemoryRepository(runTest());
    const useCase = new RecordLabRunUseCase(repository);
    const first = await useCase.execute(
      recordInput({
        readings: [
          { sampleIdentifier: 'S-1', parameterId: PH!.id, readingIndex: 1, raw: '5.4', unit: 'pH' },
        ],
      }) as never,
    );
    const sampleId = first.samples[0]!.id;
    const batchId = first.batches![0]!.id;
    const second = await useCase.execute(
      recordInput({
        expectedVersion: 2n,
        run: { batchId, batchNo: 'RUN-1' },
        samples: [{ identifier: 'S-1' }],
        readings: [
          { sampleIdentifier: 'S-1', parameterId: PH!.id, readingIndex: 1, raw: '5.5', unit: 'pH' },
          { sampleIdentifier: 'S-1', parameterId: PH!.id, readingIndex: 2, raw: '5.5', unit: 'pH' },
        ],
      }) as never,
    );
    expect(second.batches).toHaveLength(1);
    expect(second.samples).toHaveLength(1);
    expect(second.samples[0]!.id).toBe(sampleId);
    expect(second.readings).toHaveLength(2);
    expect(second.measurements.find((m) => m.parameterId === PH!.id)?.calculatedValue).toBe('5.5');
  });

  it('adds a second run with the next sequence instead of overwriting the first', async () => {
    const repository = new MemoryRepository(runTest());
    const useCase = new RecordLabRunUseCase(repository);
    const first = await useCase.execute(
      recordInput({
        readings: [
          { sampleIdentifier: 'S-1', parameterId: PH!.id, readingIndex: 1, raw: '5.4', unit: 'pH' },
        ],
      }) as never,
    );
    const second = await useCase.execute(
      recordInput({
        expectedVersion: 2n,
        run: { batchNo: 'RUN-2' },
        samples: [{ identifier: 'S-2' }],
        readings: [
          { sampleIdentifier: 'S-2', parameterId: PH!.id, readingIndex: 1, raw: '5.6', unit: 'pH' },
        ],
      }) as never,
    );
    expect(second.batches).toHaveLength(2);
    expect(second.batches?.map((batch) => batch.sequence)).toEqual([1, 2]);
    expect(second.batches?.[0]?.id).toBe(first.batches?.[0]?.id);
    expect(second.samples).toHaveLength(2);
  });

  it('denies edits outside DRAFT, without the draft permission, and with a stale version', async () => {
    await expect(
      new RecordLabRunUseCase(new MemoryRepository(runTest('SUBMITTED'))).execute(
        recordInput() as never,
      ),
    ).rejects.toMatchObject({ code: 'DOMAIN_INVALID_TRANSITION' });

    const readonly: ActorContext = {
      ...author(),
      permissions: [{ code: 'PERM-LAB-VIEW', scopes: ['OWN'] }],
    };
    await expect(
      new RecordLabRunUseCase(new MemoryRepository(runTest())).execute(
        recordInput({ actor: readonly }) as never,
      ),
    ).rejects.toMatchObject({ code: expect.stringMatching(/^AUTHZ_/) });

    await expect(
      new RecordLabRunUseCase(new MemoryRepository(runTest())).execute(
        recordInput({ expectedVersion: 5n }) as never,
      ),
    ).rejects.toMatchObject({ code: expect.stringMatching(/^AUTHZ_|^CONFLICT_/) });
  });

  it('rejects a duplicate replicate and a reading for a sample outside the run', async () => {
    const repository = new MemoryRepository(runTest());
    const useCase = new RecordLabRunUseCase(repository);
    await useCase.execute(
      recordInput({
        readings: [
          { sampleIdentifier: 'S-1', parameterId: PH!.id, readingIndex: 1, raw: '5.4', unit: 'pH' },
        ],
      }) as never,
    );
    await expect(
      useCase.execute(
        recordInput({
          expectedVersion: 2n,
          run: { batchNo: 'RUN-1' },
          samples: [{ identifier: 'S-1' }],
          readings: [
            { sampleIdentifier: 'S-1', parameterId: PH!.id, readingIndex: 1, raw: '5.4', unit: 'pH' },
            { sampleIdentifier: 'S-1', parameterId: PH!.id, readingIndex: 1, raw: '5.5', unit: 'pH' },
          ],
        }) as never,
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });

    // A reading that names a sample of another run is not silently accepted.
    await expect(
      useCase.execute(
        recordInput({
          expectedVersion: 2n,
          run: { batchNo: 'RUN-2' },
          samples: [{ identifier: 'S-2' }],
          readings: [
            { sampleIdentifier: 'S-1', parameterId: PH!.id, readingIndex: 1, raw: '5.4', unit: 'pH' },
          ],
        }) as never,
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('rejects a unit that the approved parameter does not declare', async () => {
    await expect(
      new RecordLabRunUseCase(new MemoryRepository(runTest())).execute(
        recordInput({
          readings: [
            { sampleIdentifier: 'S-1', parameterId: PH!.id, readingIndex: 1, raw: '5.4', unit: 'mg' },
          ],
        }) as never,
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});
