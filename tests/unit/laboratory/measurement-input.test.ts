import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { measurementInputValue } from '../../../src/modules/laboratory/domain/measurement-input.js';
import { validateMeasurement } from '../../../src/modules/laboratory/domain/measurement.js';

const executePage = readFileSync('src/pages/laboratory/tests/[labTestId]/execute.astro', 'utf8');

const parameter = (dataType: 'NUMERIC' | 'TEXT' | 'BOOLEAN') => ({
  id: 'parameter-1',
  code: 'observation',
  label: 'Observation',
  dataType,
  unit: null,
  required: true,
  sourceReference: 'TEST-ONLY-SOURCE',
  criteria: {},
});

describe('laboratory measurement input typing', () => {
  it('binds browser coercion and point remarks to each declared sample parameter', () => {
    expect(executePage).toContain('data-data-type={parameter.dataType}');
    expect(executePage).toContain('measurementInputValue(');
    expect(executePage).toContain('data-measurement-remarks');
    expect(executePage).toContain('remarksByPoint.get(');
    expect(executePage).toContain('remarksWithoutValue');
  });

  it.each(['true', 'false'])('preserves TEXT %s as text', (value) => {
    const raw = measurementInputValue('TEXT', value);
    expect(raw).toBe(value);
    expect(
      validateMeasurement(
        { sampleId: 'sample-1', parameterId: 'parameter-1', raw, unit: null },
        parameter('TEXT'),
      ).raw,
    ).toBe(value);
  });

  it.each([
    ['true', true],
    ['false', false],
  ])('converts declared BOOLEAN %s to a boolean', (value, expected) => {
    expect(measurementInputValue('BOOLEAN', value)).toBe(expected);
  });

  it('leaves invalid BOOLEAN strings for the server validator to reject', () => {
    expect(measurementInputValue('BOOLEAN', 'yes')).toBe('yes');
    expect(measurementInputValue('BOOLEAN', ' true ')).toBe(' true ');
    expect(() =>
      validateMeasurement(
        {
          sampleId: 'sample-1',
          parameterId: 'parameter-1',
          raw: measurementInputValue('BOOLEAN', 'yes'),
          unit: null,
        },
        parameter('BOOLEAN'),
      ),
    ).toThrow();
  });

  it.each([
    ['true', true],
    ['false', false],
  ])('accepts the declared BOOLEAN value %s', (value, expected) => {
    expect(
      validateMeasurement(
        {
          sampleId: 'sample-1',
          parameterId: 'parameter-1',
          raw: measurementInputValue('BOOLEAN', value),
          unit: null,
        },
        parameter('BOOLEAN'),
      ).raw,
    ).toBe(expected);
  });

  it('preserves numeric decimal strings without JS number conversion', () => {
    const value = '+9007199254740993.000000000000000001';
    expect(
      validateMeasurement(
        {
          sampleId: 'sample-1',
          parameterId: 'parameter-1',
          raw: measurementInputValue('NUMERIC', value),
          unit: null,
        },
        parameter('NUMERIC'),
      ).raw,
    ).toBe(value);
  });
});
