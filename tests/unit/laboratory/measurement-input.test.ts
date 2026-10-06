import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { measurementInputValue } from '../../../src/modules/laboratory/application/measurement-input.js';
import { decodeMeasurementPost } from '../../../src/modules/laboratory/application/measurement-post.js';
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

describe('native laboratory measurement transport', () => {
  const test = {
    samples: [{ id: 'sample-1', identifier: 'S1' }],
    context: {
      templateVersionId: 'v1',
      versionNo: '1',
      methodReference: 'TEST-ONLY',
      sourceReference: 'TEST-ONLY',
      contentHash: 'test-only',
      requirementsReference: 'TEST-ONLY',
      source: {},
      documents: [],
      equipment: [],
      parameters: [parameter('TEXT')],
    },
  };
  const data = (raw: string, remarks = '') => {
    const form = new FormData();
    form.set('expectedVersion', '1');
    form.set('intent', 'save');
    form.set('value-sample-1:parameter-1', raw);
    form.set('remarks-sample-1:parameter-1', remarks);
    return form;
  };
  it.each(['true', 'false', '+0009007199254740993.000000000000000001', 'N/A'])(
    'preserves declared TEXT %s and point remarks',
    (raw) => {
      expect(decodeMeasurementPost(test, data(raw, 'Exact note'))).toEqual([
        {
          sampleId: 'sample-1',
          parameterId: 'parameter-1',
          raw,
          unit: null,
          remarks: 'Exact note',
        },
      ]);
    },
  );
  it('keeps blank unrecorded and rejects remarks without an observation', () => {
    expect(decodeMeasurementPost(test, data(''))).toEqual([]);
    expect(() => decodeMeasurementPost(test, data('', 'Do not discard'))).toThrow();
  });
  it.each(['raw', 'unit', 'dataType', 'value-other:parameter-1'])(
    'rejects forged metadata or point %s',
    (key) => {
      const form = data('true');
      form.set(key, 'forged');
      expect(() => decodeMeasurementPost(test, form)).toThrow();
    },
  );
  it('rejects duplicate values and missing fields', () => {
    const duplicate = data('true');
    duplicate.append('value-sample-1:parameter-1', 'false');
    expect(() => decodeMeasurementPost(test, duplicate)).toThrow();
    const missing = data('true');
    missing.delete('remarks-sample-1:parameter-1');
    expect(() => decodeMeasurementPost(test, missing)).toThrow();
  });
  it('uses the server BOOLEAN declaration and preserves invalid input for validation', () => {
    const boolean = { ...test, context: { ...test.context, parameters: [parameter('BOOLEAN')] } };
    expect(decodeMeasurementPost(boolean, data('false'))[0]?.raw).toBe(false);
    expect(() =>
      validateMeasurement(decodeMeasurementPost(boolean, data('yes'))[0]!, parameter('BOOLEAN')),
    ).toThrow();
  });
  it('requires native POST and keeps the opened version and failed values', () => {
    expect(executePage).toContain('method="post"');
    expect(executePage).toContain('decodeMeasurementPost(test, submitted)');
    expect(executePage).toContain('name="expectedVersion" value={openedVersion}');
    expect(executePage).toContain('if (submitted) return String(submitted.get');
  });
});
