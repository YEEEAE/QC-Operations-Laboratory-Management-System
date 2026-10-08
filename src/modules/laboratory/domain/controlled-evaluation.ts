import { AppError } from '../../../shared/errors/app-error.js';
import type { LabTest } from './lab-test.js';
import { evaluateParameterAcceptance } from './parameter-acceptance.js';

/** Method-declared aggregation only. Missing, unknown or incomplete policy denies. */
export function evaluateControlledTest(test: LabTest) {
  const policy = test.context.source.evaluationPolicy;
  if (!policy || typeof policy !== 'object') throw new AppError('AUTHZ_DENIED');
  const source = policy as Record<string, unknown>;
  if (
    source.ruleType !== 'ALL_PARAMETERS_ALL_SAMPLES' ||
    source.onAnyFail !== 'FAIL' ||
    source.onIncomplete !== 'HOLD' ||
    source.onAllPass !== 'PASS' ||
    source.sourceReference !== test.context.sourceReference ||
    source.version !== test.context.versionNo ||
    !test.context.contentHash ||
    !test.samples.length
  )
    throw new AppError('AUTHZ_DENIED');
  const outcomes: ('PASS' | 'FAIL' | null)[] = [];
  for (const sample of test.samples)
    for (const parameter of test.context.parameters) {
      const rows = test.measurements.filter(
        (row) => row.sampleId === sample.id && row.parameterId === parameter.id,
      );
      if (rows.length > 1) throw new AppError('AUTHZ_DENIED');
      const measurement = rows[0];
      if (!measurement) {
        outcomes.push(null);
        continue;
      }
      const value = measurement.calculatedValue ?? measurement.raw;
      const unit =
        measurement.calculatedValue !== null && measurement.calculatedValue !== undefined
          ? measurement.calculatedUnit
          : measurement.unit;
      if (unit !== parameter.unit) throw new AppError('AUTHZ_DENIED');
      outcomes.push(
        evaluateParameterAcceptance({
          value,
          dataType: parameter.dataType,
          ruleType: parameter.acceptanceRuleType ?? null,
          rulePayload: parameter.criteria,
        }),
      );
    }
  if (!outcomes.length) throw new AppError('AUTHZ_DENIED');
  const result: 'PASS' | 'FAIL' | 'HOLD' = outcomes.includes('FAIL')
    ? 'FAIL'
    : outcomes.includes(null)
      ? 'HOLD'
      : 'PASS';
  return {
    result,
    sourceReference: test.context.sourceReference,
    contentHash: test.context.contentHash,
  };
}
