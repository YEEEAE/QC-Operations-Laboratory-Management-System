import { z, type ZodType } from 'zod';
import { AppError } from '../errors/app-error';
export function parseUuid(value: unknown): string {
  const result = commonParse(value, z.uuid(), 'VALIDATION_INVALID_UUID');
  return result;
}
export function parseDateOnly(value: unknown): string {
  return commonParse(
    value,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((v) => {
        const parsed = new Date(`${v}T00:00:00Z`);
        return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === v;
      }, 'invalid date'),
    'VALIDATION_INVALID_DATE',
  );
}
export function parseQuery<T>(value: unknown, schema: ZodType<T>): T {
  return commonParse(value, schema, 'VALIDATION_INVALID_QUERY');
}
function commonParse<T>(
  value: unknown,
  schema: ZodType<T>,
  code: 'VALIDATION_INVALID_UUID' | 'VALIDATION_INVALID_DATE' | 'VALIDATION_INVALID_QUERY',
): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new AppError(code, { fieldErrors: { value: [code] } });
  return result.data;
}
