import { describe, expect, it } from 'vitest';
import { validateMeasurement } from '../../../src/modules/laboratory/domain/measurement';
import { transitionLab } from '../../../src/modules/laboratory/domain/lab-state';
const parameter = { id: 'parameter', code: 'observation', label: 'Observation', dataType: 'NUMERIC' as const, unit: 'fixture-unit', required: true, sourceReference: 'TEST-ONLY-CONTROLLED-FIXTURE', criteria: { reference: 'fixture-only' } };
describe('laboratory raw observations and controlled boundaries', () => {
  it('preserves exact decimal text without binary conversion or rounding', () => {
    const raw = '9007199254740993.000000000000000001';
    expect(validateMeasurement({ sampleId: 'sample', parameterId: 'parameter', raw, unit: 'fixture-unit' }, parameter).raw).toBe(raw);
  });
  it.each(['NaN', 'Infinity', '1e309', ''])('rejects invalid decimal %s', raw => {
    expect(() => validateMeasurement({ sampleId: 'sample', parameterId: 'parameter', raw, unit: 'fixture-unit' }, parameter)).toThrow();
  });
  it('rejects wrong units, parameters, and client official results', () => {
    for (const patch of [{unit:'wrong'}, {parameterId:'wrong'}, {result:'PASS'}, {calculatedValue:'1'}]) {
      expect(() => validateMeasurement({sampleId:'sample', parameterId:'parameter',raw:'1',unit:'fixture-unit',...patch}, parameter)).toThrow();
    }
  });
  it('allows only declared lifecycle intents', () => {
    expect(transitionLab('DRAFT','SUBMIT')).toBe('SUBMITTED');
    expect(transitionLab('RETURNED','RESUME')).toBe('DRAFT');
    expect(() => transitionLab('APPROVED','SAVE')).toThrow();
    expect(() => transitionLab('DRAFT','APPROVED' as never)).toThrow();
  });
});
