import type { LabTest } from '../domain/lab-test.js';
import type { Measurement, Parameter } from '../domain/measurement.js';
import { evaluateParameterAcceptance } from '../domain/parameter-acceptance.js';

/**
 * QC-100-FINAL-038 — presentation-only derivations for the laboratory
 * execution and review surfaces.
 *
 * Boundaries (do not cross):
 * - Criteria text is rendered verbatim from the approved acceptance-rule
 *   payload in the frozen controlled context. No threshold is invented and
 *   requirement prose is never parsed into a limit.
 * - PASS/FAIL here comes only from `evaluateParameterAcceptance` applied to
 *   the approved rule the template actually carries. A parameter without a
 *   formal rule yields `REVIEWER_DECISION` — the human reviewer owns it, and
 *   the official `scientificResult` still comes from the approved evaluation
 *   source at stage-1 approval.
 */

const bound = (payload: Record<string, unknown>, key: string): string | undefined => {
  const raw = payload[key];
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return undefined;
};

/** Human-readable rendering of the approved acceptance criteria — verbatim from the frozen context. */
export function criteriaText(parameter: Parameter): string {
  const payload = parameter.criteria ?? {};
  switch (parameter.acceptanceRuleType) {
    case 'RANGE_INCLUSIVE': {
      const lower = bound(payload, 'lower');
      const upper = bound(payload, 'upper');
      if (lower !== undefined && upper !== undefined)
        return `Between ${lower} and ${upper} (inclusive)`;
      break;
    }
    case 'RANGE_EXCLUSIVE': {
      const lower = bound(payload, 'lower');
      const upper = bound(payload, 'upper');
      if (lower !== undefined && upper !== undefined)
        return `Above ${lower} and below ${upper} (exclusive)`;
      break;
    }
    case 'MAX_LIMIT': {
      const max = bound(payload, 'max');
      if (max !== undefined) return `At most ${max}`;
      break;
    }
    case 'MIN_LIMIT': {
      const min = bound(payload, 'min');
      if (min !== undefined) return `At least ${min}`;
      break;
    }
    case 'EQUALS': {
      const expected = payload.expected;
      if (typeof expected === 'boolean') return expected ? 'Must be Yes' : 'Must be No';
      const value = bound(payload, 'expected');
      if (value !== undefined) return `Must equal ${value}`;
      break;
    }
    case 'ENUM_ALLOWED': {
      const allowed = payload.allowed;
      if (Array.isArray(allowed) && allowed.every((value) => typeof value === 'string'))
        return `One of: ${(allowed as string[]).join(', ')}`;
      break;
    }
  }
  // Fallback: show the approved payload as stored — never a paraphrase that
  // could read as an invented limit.
  const json = JSON.stringify(parameter.criteria ?? {});
  return json && json !== '{}' ? `Approved criteria: ${json}` : 'No approved criteria recorded';
}


/** Entry-surface descriptor for one controlled parameter (unit + guidance at the point of entry). */
export interface EntryParameter {
  id: string;
  code: string;
  label: string;
  dataType: 'NUMERIC' | 'TEXT' | 'BOOLEAN';
  unit: string | null;
  required: boolean;
  precisionGuidance: string | null;
  sourceReference: string;
  criteriaText: string;
}

export function entryParameters(test: LabTest): EntryParameter[] {
  return test.context.parameters.map((parameter) => ({
    id: parameter.id,
    code: parameter.code,
    label: parameter.label,
    dataType: parameter.dataType,
    unit: parameter.unit,
    required: parameter.required,
    precisionGuidance: parameter.precisionGuidance ?? null,
    sourceReference: parameter.sourceReference,
    criteriaText: criteriaText(parameter),
  }));
}

export type ComparisonOutcome = 'PASS' | 'FAIL' | 'REVIEWER_DECISION' | 'NOT_RECORDED';

export interface ComparisonRow {
  sampleId: string;
  sampleIdentifier: string;
  parameterId: string;
  parameterCode: string;
  parameterLabel: string;
  required: boolean;
  unit: string | null;
  /** Observed value as captured, or the approved-rule calculated value when one exists. */
  observed: string | null;
  /** True when `observed` is the calculated value from an approved calculation rule. */
  calculated: boolean;
  criteriaText: string;
  outcome: ComparisonOutcome;
}

function observedOf(
  measurement: Measurement | undefined,
): { observed: string | null; calculated: boolean } {
  if (!measurement) return { observed: null, calculated: false };
  if (measurement.calculatedValue !== null && measurement.calculatedValue !== undefined)
    return { observed: measurement.calculatedValue, calculated: true };
  const raw = measurement.raw;
  if (raw === null || raw === undefined) return { observed: null, calculated: false };
  return { observed: typeof raw === 'boolean' ? (raw ? 'Yes' : 'No') : raw, calculated: false };
}

/**
 * Review-surface comparison rows: observed value next to the approved
 * criteria, with an outcome only where the frozen context carries an approved
 * acceptance rule. Everything else is explicitly the reviewer's decision.
 */
export function comparisonRows(test: LabTest): ComparisonRow[] {
  const rows: ComparisonRow[] = [];
  for (const sample of test.samples) {
    for (const parameter of test.context.parameters) {
      const measurement = test.measurements.find(
        (m) => m.sampleId === sample.id && m.parameterId === parameter.id,
      );
      const { observed, calculated } = observedOf(measurement);
      let outcome: ComparisonOutcome;
      if (observed === null) {
        outcome = 'NOT_RECORDED';
      } else {
        // Raw boolean values are rendered as Yes/No for display; the approved
        // rule is evaluated against the stored value, not the display text.
        const ruleInput =
          measurement && !calculated && typeof measurement.raw === 'boolean'
            ? measurement.raw
            : observed;
        const evaluated = evaluateParameterAcceptance({
          value: ruleInput,
          dataType: parameter.dataType,
          ruleType: parameter.acceptanceRuleType ?? null,
          rulePayload: parameter.criteria,
        });
        outcome = evaluated ?? 'REVIEWER_DECISION';
      }
      rows.push({
        sampleId: sample.id,
        sampleIdentifier: sample.identifier,
        parameterId: parameter.id,
        parameterCode: parameter.code,
        parameterLabel: parameter.label,
        required: parameter.required,
        unit: measurement?.calculatedUnit ?? measurement?.unit ?? parameter.unit,
        observed,
        calculated,
        criteriaText: criteriaText(parameter),
        outcome,
      });
    }
  }
  return rows;
}
