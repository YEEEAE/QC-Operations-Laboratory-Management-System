import type { MeasurementInput, Parameter } from './measurement.js';
import { decimalScale, fromScaled, isNumericLiteral, toScaled } from './exact-decimal.js';

/** Exact affine arithmetic only; factors and offsets belong to the controlled method. */
export function convertMeasurement(input: MeasurementInput, parameter: Parameter) {
  if (input.unit === parameter.unit) return undefined;
  if (
    parameter.dataType !== 'NUMERIC' ||
    typeof input.raw !== 'string' ||
    !isNumericLiteral(input.raw) ||
    !Array.isArray(parameter.unitConversionRules)
  )
    return undefined;
  const matches = parameter.unitConversionRules.filter((candidate: unknown) => {
    if (!candidate || typeof candidate !== 'object') return false;
    const rule = candidate as Record<string, unknown>;
    return rule.fromUnit === input.unit && rule.toUnit === parameter.unit;
  });
  if (matches.length !== 1) return undefined;
  const rule = matches[0] as Record<string, unknown>;
  if (
    rule.ruleType !== 'EXACT_AFFINE' ||
    rule.sourceReference !== parameter.sourceReference ||
    typeof rule.version !== 'string' ||
    !rule.version.trim() ||
    typeof rule.factor !== 'string' ||
    !isNumericLiteral(rule.factor) ||
    typeof rule.offset !== 'string' ||
    !isNumericLiteral(rule.offset)
  )
    return undefined;
  const scale = decimalScale(input.raw) + decimalScale(rule.factor);
  const product =
    toScaled(input.raw, decimalScale(input.raw)) * toScaled(rule.factor, decimalScale(rule.factor));
  const resultScale = Math.max(scale, decimalScale(rule.offset));
  const value = fromScaled(
    product * 10n ** BigInt(resultScale - scale) + toScaled(rule.offset, resultScale),
    resultScale,
  );
  return {
    calculatedValue: value,
    calculatedUnit: parameter.unit,
    calculationRuleReference: parameter.sourceReference,
    calculationRuleVersion: rule.version,
    calculationInputs: {
      ruleType: 'EXACT_AFFINE',
      originalInput: input.raw,
      originalUnit: input.unit,
      targetUnit: parameter.unit,
      factor: rule.factor,
      offset: rule.offset,
      sourceReference: parameter.sourceReference,
      version: rule.version,
    },
  };
}
