import { AppError } from '../../../shared/errors/app-error.js';
export interface Parameter {
  id: string; code: string; label: string; dataType: 'NUMERIC'|'TEXT'|'BOOLEAN'; unit: string|null;
  required: boolean; sourceReference: string; criteria: Readonly<Record<string,unknown>>;
  precisionGuidance?: string; roundingReference?: string;
}
export interface MeasurementInput { sampleId:string; parameterId:string; raw:string|boolean; unit:string|null; remarks?:string }
export interface Measurement extends MeasurementInput { id:string; enteredBy:string; enteredAt:string }
export function validateMeasurement(input: MeasurementInput, parameter: Parameter): MeasurementInput {
  const allowed = ['sampleId','parameterId','raw','unit','remarks'];
  if (Object.keys(input).some(key => !allowed.includes(key)) || input.parameterId !== parameter.id || input.unit !== parameter.unit || !parameter.sourceReference.trim()) throw new AppError('VALIDATION_FAILED');
  if (parameter.dataType === 'NUMERIC' && (typeof input.raw !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(input.raw))) throw new AppError('VALIDATION_FAILED');
  if (parameter.dataType === 'TEXT' && (typeof input.raw !== 'string' || !input.raw.trim())) throw new AppError('VALIDATION_FAILED');
  if (parameter.dataType === 'BOOLEAN' && typeof input.raw !== 'boolean') throw new AppError('VALIDATION_FAILED');
  if (!['NUMERIC','TEXT','BOOLEAN'].includes(parameter.dataType)) throw new AppError('VALIDATION_FAILED');
  return {...input};
}
