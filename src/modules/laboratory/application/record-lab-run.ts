import { AppError } from '../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import {
  assertCalculationApplicable,
  computeCalculation,
  parseCalculationRule,
} from '../domain/calculation.js';
import { assertBatches, assertBatchSamples, type LabBatch } from '../domain/lab-batch.js';
import type { LabSample, LabTest } from '../domain/lab-test.js';
import type { Measurement, Parameter } from '../domain/measurement.js';
import { evaluateParameterAcceptance } from '../domain/parameter-acceptance.js';
import {
  assertUniqueReadings,
  numericReadingValue,
  validateReading,
  type Reading,
  type ReadingInput,
} from '../domain/reading.js';
import {
  deriveSampleResult,
  type LabSampleResultRecord,
  type ParameterOutcome,
} from '../domain/sample-result.js';
import type { LabRepository } from '../ports/repository.js';
import { authorizeLab } from './lab-authorization.js';

/**
 * QC-DATA-003 — record one Test Batch / Run of a laboratory test.
 *
 * One controlled action captures the run's identity, its samples, every
 * replicated reading and — for parameters whose approved template carries a
 * machine-readable rule — the calculated observation, then derives the
 * run-level sample results from the approved per-parameter outcomes.
 *
 * Fail-closed properties:
 *  - the record must be `DRAFT`, and the actor needs both the draft-edit and
 *    measurement-entry permissions with a current version;
 *  - a reading is validated against the approved parameter (data type, unit,
 *    source reference), never against browser input;
 *  - `(sample, parameter, readingIndex)` is unique inside one submission, so a
 *    duplicate replicate is an operator error rather than a silent overwrite;
 *  - nothing is calculated or accepted without an approved rule: no rule means
 *    no derived value and the reviewer owns the outcome;
 *  - submitting readings for a `(sample, parameter)` replaces exactly that
 *    group, so re-entering a run is idempotent and never disturbs other
 *    parameters, samples or earlier runs.
 */
/**
 * One replicate as the operator submits it: the sample it belongs to is named
 * by its identifier inside the run, so the run entry never depends on surrogate
 * ids the operator cannot see.
 */
export interface ReadingSubmission extends Omit<ReadingInput, 'sampleId'> {
  sampleIdentifier: string;
}

export interface RecordLabRunInput {
  actor: ActorContext;
  id: string;
  expectedVersion: bigint;
  run: {
    /** Continue an existing run; omitted when the operator starts a new one. */
    batchId?: string;
    batchNo: string;
    label?: string | null;
    startedAt?: string;
    completedAt?: string | null;
  };
  samples: readonly { identifier: string }[];
  readings: readonly ReadingSubmission[];
  requestId: string;
}

interface GroupObservation {
  measurement: Measurement | null;
  outcome: ParameterOutcome;
}

export class RecordLabRunUseCase {
  constructor(
    private readonly repository: LabRepository,
    private readonly now = () => new Date(),
  ) {}

  async execute(input: RecordLabRunInput): Promise<LabTest> {
    const test = await this.repository.get(input.id, input.actor);
    if (!test) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    // The state is checked first so a record that is no longer a draft reports
    // the real reason instead of a permission denial it would also have.
    if (test.state !== 'DRAFT') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    authorizeLab(input.actor, test, 'PERM-LAB-EDIT-DRAFT', 'SAVE', input.expectedVersion);
    authorizeLab(input.actor, test, 'PERM-LAB-ENTER-MEASUREMENT', 'SAVE', input.expectedVersion);

    const at = this.now().toISOString();
    const actorId = input.actor.id;
    const batch = this.resolveRun(input.run, test.batches ?? [], at);
    const batches = [
      ...(test.batches ?? []).filter((existing) => existing.id !== batch.id),
      batch,
    ].sort((left, right) => left.sequence - right.sequence);
    assertBatches(batches);

    const samples = this.resolveSamples(input.samples, test.samples, batch.id);
    assertBatchSamples(samples, batches);
    const readings = this.resolveReadings(
      input.readings,
      samples,
      test.context.parameters,
      batch.id,
      at,
      actorId,
    );

    // Replace exactly the (sample, parameter) groups this submission covers.
    const touched = new Set(
      readings.map((reading) => groupKey(reading.sampleId, reading.parameterId)),
    );
    const nextReadings = [
      ...(test.readings ?? []).filter(
        (reading) =>
          reading.batchId !== batch.id ||
          !touched.has(groupKey(reading.sampleId, reading.parameterId)),
      ),
      ...readings,
    ];

    const observations = new Map<string, GroupObservation>();
    for (const key of touched) {
      const [sampleId, parameterId] = key.split(':') as [string, string];
      observations.set(
        key,
        this.observe(
          test.context.parameters.find((parameter) => parameter.id === parameterId)!,
          sampleId,
          batch.id,
          nextReadings,
          at,
          actorId,
        ),
      );
    }

    const nextMeasurements = [
      ...test.measurements.filter(
        (measurement) =>
          measurement.batchId !== batch.id ||
          !touched.has(groupKey(measurement.sampleId, measurement.parameterId)),
      ),
      ...[...observations.values()]
        .map((observation) => observation.measurement)
        .filter((measurement): measurement is Measurement => measurement !== null),
    ];

    // Derived sample results for every sample this submission observed.
    const touchedSamples = [...new Set(readings.map((reading) => reading.sampleId))];
    const nextResults = [
      ...(test.sampleResults ?? []).filter(
        (result) => result.batchId !== batch.id || !touchedSamples.includes(result.sampleId),
      ),
      ...this.deriveResults(test, batch.id, touchedSamples, nextReadings, at, actorId),
    ];

    return this.repository.save(
      test,
      {
        ...test,
        batches,
        samples,
        readings: nextReadings,
        measurements: nextMeasurements,
        sampleResults: nextResults,
        version: test.version + 1n,
        updatedAt: at,
      },
      { actor: input.actor, requestId: input.requestId, action: 'SAVE' },
    );
  }

  /** Resolve an existing run or start the next one; the sequence is per test. */
  private resolveRun(
    run: RecordLabRunInput['run'],
    existing: readonly LabBatch[],
    at: string,
  ): LabBatch {
    const batchNo = run.batchNo.trim();
    if (!batchNo) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const current = run.batchId
      ? existing.find((batch) => batch.id === run.batchId)
      : existing.find((batch) => batch.batchNo === batchNo);
    if (run.batchId && !current) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (existing.some((batch) => batch.batchNo === batchNo && batch.id !== current?.id))
      throw new AppError('CONFLICT_DUPLICATE_COMMAND', {
        userSafe: true,
        messageKey: 'errors.run_number_already_exists',
      });
    if (current)
      return {
        ...current,
        batchNo,
        label: run.label ?? current.label ?? null,
        completedAt: run.completedAt ?? current.completedAt ?? null,
      };
    return {
      id: uuidv7(),
      batchNo,
      label: run.label ?? null,
      sequence: existing.reduce((max, batch) => Math.max(max, batch.sequence), 0) + 1,
      startedAt: run.startedAt ?? at,
      completedAt: run.completedAt ?? null,
    };
  }

  /**
   * Identify the run's samples by their identifier inside the run. Re-entering a
   * run reuses the sample row it already created instead of duplicating it, and
   * samples of other runs are never touched.
   */
  private resolveSamples(
    submitted: readonly { identifier: string }[],
    existing: readonly LabSample[],
    batchId: string,
  ): LabSample[] {
    if (!submitted.length)
      throw new AppError('VALIDATION_FAILED', {
        userSafe: true,
        messageKey: 'errors.run_requires_samples',
      });
    const runSamples: LabSample[] = [];
    for (const sample of submitted) {
      const identifier = sample.identifier.trim();
      if (!identifier) throw new AppError('VALIDATION_FAILED', { userSafe: true });
      if (runSamples.some((candidate) => candidate.identifier === identifier))
        throw new AppError('VALIDATION_FAILED', {
          userSafe: true,
          messageKey: 'errors.duplicate_sample_identifier',
        });
      const prior = existing.find(
        (candidate) => candidate.batchId === batchId && candidate.identifier === identifier,
      );
      runSamples.push({ id: prior?.id ?? uuidv7(), identifier, batchId });
    }
    const untouched = existing.filter(
      (sample) =>
        sample.batchId !== batchId || !runSamples.some((candidate) => candidate.id === sample.id),
    );
    return [...untouched, ...runSamples];
  }

  /**
   * Validate every submitted replicate against the approved parameter, and
   * refuse a reading whose sample is not a sample of this run.
   */
  private resolveReadings(
    submitted: readonly ReadingSubmission[],
    samples: readonly LabSample[],
    parameters: readonly Parameter[],
    batchId: string,
    at: string,
    actorId: string,
  ): Reading[] {
    const resolved = submitted.map((reading) => {
      const identifier = reading.sampleIdentifier.trim();
      const sample = samples.find(
        (candidate) => candidate.batchId === batchId && candidate.identifier === identifier,
      );
      if (!sample)
        throw new AppError('VALIDATION_FAILED', {
          userSafe: true,
          messageKey: 'errors.reading_sample_not_in_run',
        });
      return { ...reading, sampleId: sample.id };
    });
    assertUniqueReadings(resolved);
    return resolved.map((reading) => {
      const parameter = parameters.find((candidate) => candidate.id === reading.parameterId);
      if (!parameter) throw new AppError('VALIDATION_FAILED', { userSafe: true });
      return {
        ...validateReading(reading, parameter),
        id: uuidv7(),
        batchId,
        enteredBy: actorId,
        enteredAt: at,
      };
    });
  }

  /**
   * One reported observation plus its approved-rule outcome for a
   * `(sample, parameter)` group. When no single value is defined — several
   * readings and no approved calculation rule — the group carries no
   * measurement and no outcome, and the reviewer owns it.
   */
  private observe(
    parameter: Parameter,
    sampleId: string,
    batchId: string,
    readings: readonly Reading[],
    at: string,
    actorId: string,
  ): GroupObservation {
    const group = readings.filter(
      (reading) =>
        reading.batchId === batchId &&
        reading.sampleId === sampleId &&
        reading.parameterId === parameter.id,
    );
    const rule = parseCalculationRule(parameter.calculationRule, parameter.sourceReference);
    if (rule) assertCalculationApplicable(parameter);
    const numeric = group
      .map((reading) => numericReadingValue(reading.raw))
      .filter((value): value is string => value !== undefined);
    const calculation =
      rule && numeric.length === group.length && numeric.length
        ? computeCalculation(rule, numeric)
        : undefined;
    const singleRaw = group.length === 1 ? group[0]!.raw : null;
    const observation = calculation ? calculation.value : singleRaw;
    const outcome: ParameterOutcome = {
      parameterId: parameter.id,
      required: parameter.required,
      result: evaluateParameterAcceptance({
        value: observation,
        dataType: parameter.dataType,
        ruleType: parameter.acceptanceRuleType ?? null,
        rulePayload: parameter.criteria,
      }),
    };
    if (!calculation && singleRaw === null) return { measurement: null, outcome };
    return {
      measurement: {
        id: uuidv7(),
        sampleId,
        parameterId: parameter.id,
        batchId,
        raw: calculation ? null : singleRaw,
        unit: parameter.unit,
        calculatedValue: calculation ? calculation.value : null,
        calculatedUnit: calculation ? parameter.unit : null,
        calculationRuleReference: calculation ? rule!.sourceReference : null,
        calculationRuleVersion: calculation ? rule!.version : null,
        calculationInputs: calculation
          ? {
              ruleType: calculation.ruleType,
              decimals: rule!.decimals,
              readings: calculation.inputs,
            }
          : null,
        enteredBy: actorId,
        enteredAt: at,
      },
      outcome,
    };
  }

  /**
   * Derive the sample results of the observed samples from the approved outcome
   * of every parameter of the bound template version. A sample with no approved
   * outcome at all carries no derived result.
   */
  private deriveResults(
    test: LabTest,
    batchId: string,
    sampleIds: readonly string[],
    readings: readonly Reading[],
    at: string,
    actorId: string,
  ): LabSampleResultRecord[] {
    const results: LabSampleResultRecord[] = [];
    for (const sampleId of sampleIds) {
      const outcomes: ParameterOutcome[] = test.context.parameters.map(
        (parameter) => this.observe(parameter, sampleId, batchId, readings, at, actorId).outcome,
      );
      const result = deriveSampleResult(outcomes);
      if (!result) continue;
      results.push({
        id: uuidv7(),
        batchId,
        sampleId,
        result,
        source: 'SYSTEM_EVALUATION',
        sourceReference: test.context.sourceReference,
        contentHash: test.context.contentHash,
        // Every approved parameter is listed, including the ones no formal rule
        // could evaluate: that is exactly why the result may be HOLD, and the
        // reviewer must be able to see which parameter carries no outcome.
        derivedFrom: {
          parameters: outcomes.map((outcome) => ({
            parameterId: outcome.parameterId,
            required: outcome.required,
            result: outcome.result,
          })),
        },
        evaluatedAt: at,
        evaluatedBy: actorId,
      });
    }
    return results;
  }
}

function groupKey(sampleId: string, parameterId: string): string {
  return `${sampleId}:${parameterId}`;
}
