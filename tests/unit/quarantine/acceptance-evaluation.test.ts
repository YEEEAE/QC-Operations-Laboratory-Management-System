import { describe, expect, it } from 'vitest';
import {
  compareDecimal,
  evaluateEnumAcceptance,
  evaluateNumericAcceptance,
  evaluateEquipmentVerification,
} from '../../../src/modules/quarantine/inspection/domain/acceptance-evaluation.js';
import { isAcceptanceRuleType } from '../../../src/modules/quarantine/inspection/domain/inspection-point.js';

/**
 * QC-DATA-002 5/7 — numeric evaluation against approved machine-readable
 * limits, server-side only. Precision: the exact decimal string is compared
 * without binary floating-point conversion.
 */
describe('exact-decimal comparison (no float precision loss)', () => {
  it('orders values correctly across scales', () => {
    expect(compareDecimal('1.5', '2')).toBe(-1);
    expect(compareDecimal('2.0', '2')).toBe(0);
    expect(compareDecimal('2.0000000001', '2')).toBe(1);
    expect(compareDecimal('-0.5', '0.5')).toBe(-1);
    expect(compareDecimal('-2', '-1.5')).toBe(-1);
  });

  it('preserves precision beyond Number.MAX_SAFE_INTEGER', () => {
    expect(compareDecimal('9007199254740993.0000000001', '9007199254740993')).toBe(1);
    expect(compareDecimal('9007199254740993', '9007199254740992.9999')).toBe(1);
  });

  it('treats trailing zeros as equal', () => {
    expect(compareDecimal('6.20', '6.2')).toBe(0);
    expect(compareDecimal('6.200', '6.2')).toBe(0);
  });
});

describe('numeric acceptance evaluation (BR-INSP-006)', () => {
  it('evaluates an inclusive range: 5.4 within 5.0-6.0 is PASS', () => {
    // Paper form: pH Determination, requirement 5.0 - 6.0.
    const evaluation = evaluateNumericAcceptance({
      numericValue: '5.4',
      ruleType: 'RANGE_INCLUSIVE',
      rulePayload: { lower: '5.0', upper: '6.0' },
    });
    expect(evaluation).toEqual({ ruleType: 'RANGE_INCLUSIVE', result: 'PASS' });
  });

  it('evaluates an inclusive range boundary as PASS', () => {
    const evaluation = evaluateNumericAcceptance({
      numericValue: '6.0',
      ruleType: 'RANGE_INCLUSIVE',
      rulePayload: { lower: '5.0', upper: '6.0' },
    });
    expect(evaluation?.result).toBe('PASS');
  });

  it('evaluates an exclusive range boundary as FAIL', () => {
    const evaluation = evaluateNumericAcceptance({
      numericValue: '6.0',
      ruleType: 'RANGE_EXCLUSIVE',
      rulePayload: { lower: '5.0', upper: '6.0' },
    });
    expect(evaluation?.result).toBe('FAIL');
  });

  it('out-of-range value is FAIL', () => {
    const evaluation = evaluateNumericAcceptance({
      numericValue: '9.2',
      ruleType: 'RANGE_INCLUSIVE',
      rulePayload: { lower: '5.5', upper: '9.0' },
    });
    expect(evaluation?.result).toBe('FAIL');
  });

  it('max/min limits evaluate one-sided', () => {
    expect(
      evaluateNumericAcceptance({
        numericValue: '4.2',
        ruleType: 'MAX_LIMIT',
        rulePayload: { max: '4.5' },
      })?.result,
    ).toBe('PASS');
    expect(
      evaluateNumericAcceptance({
        numericValue: '4.6',
        ruleType: 'MAX_LIMIT',
        rulePayload: { max: '4.5' },
      })?.result,
    ).toBe('FAIL');
    expect(
      evaluateNumericAcceptance({
        numericValue: '10.01',
        ruleType: 'MIN_LIMIT',
        rulePayload: { min: '10' },
      })?.result,
    ).toBe('PASS');
  });

  it('returns undefined when no machine-readable rule is approved', () => {
    // Requirement prose is never parsed; the human result is authoritative.
    expect(
      evaluateNumericAcceptance({
        numericValue: '5.4',
        ruleType: null as never,
        rulePayload: null,
      }),
    ).toBeUndefined();
    expect(
      evaluateNumericAcceptance({
        numericValue: '5.4',
        ruleType: 'FREE_TEXT_PROSE' as never,
        rulePayload: { prose: 'good and without damage' },
      }),
    ).toBeUndefined();
  });

  it('returns undefined on malformed bounds (fail-closed, no invented criteria)', () => {
    expect(
      evaluateNumericAcceptance({
        numericValue: '5.4',
        ruleType: 'RANGE_INCLUSIVE',
        rulePayload: { lower: '5.0' }, // upper missing
      }),
    ).toBeUndefined();
    expect(
      evaluateNumericAcceptance({
        numericValue: '5.4',
        ruleType: 'RANGE_INCLUSIVE',
        rulePayload: { lower: 'five', upper: 'six' },
      }),
    ).toBeUndefined();
    expect(
      evaluateNumericAcceptance({
        numericValue: 'not-a-number',
        ruleType: 'RANGE_INCLUSIVE',
        rulePayload: { lower: '5.0', upper: '6.0' },
      }),
    ).toBeUndefined();
  });

  it('enum rules evaluate against the approved allowed list', () => {
    expect(
      evaluateEnumAcceptance('Acceptable', 'ENUM_ALLOWED', {
        allowed: ['Acceptable', 'Not acceptable'],
      })?.result,
    ).toBe('PASS');
    expect(
      evaluateEnumAcceptance('Broken', 'ENUM_ALLOWED', {
        allowed: ['Acceptable', 'Not acceptable'],
      })?.result,
    ).toBe('FAIL');
    expect(evaluateEnumAcceptance('', 'ENUM_ALLOWED', { allowed: ['Acceptable'] })).toBeUndefined();
    expect(isAcceptanceRuleType('RANGE_INCLUSIVE')).toBe(true);
    expect(isAcceptanceRuleType('GUESS')).toBe(false);
  });
});

describe('equipment measurement verification (11)', () => {
  it('computes the difference server-side and applies the approved tolerance', () => {
    const evaluation = evaluateEquipmentVerification({
      standardReading: '100.0',
      equipmentReading: '100.02',
      tolerance: '0.05',
    });
    expect(evaluation?.difference).toBe('0.02');
    expect(evaluation?.result).toBe('PASS');
  });

  it('fails when the difference exceeds tolerance', () => {
    const evaluation = evaluateEquipmentVerification({
      standardReading: '100.0',
      equipmentReading: '100.10',
      tolerance: '0.05',
    });
    expect(evaluation?.result).toBe('FAIL');
  });

  it('handles negative differences symmetrically', () => {
    const evaluation = evaluateEquipmentVerification({
      standardReading: '100.0',
      equipmentReading: '99.96',
      tolerance: '0.05',
    });
    expect(evaluation?.difference).toBe('-0.04');
    expect(evaluation?.result).toBe('PASS');
  });

  it('returns undefined on non-numeric input (never guesses)', () => {
    expect(
      evaluateEquipmentVerification({
        standardReading: '100.0',
        equipmentReading: 'n/a',
        tolerance: '0.05',
      }),
    ).toBeUndefined();
  });
});
