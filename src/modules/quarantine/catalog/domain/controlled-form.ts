import { z } from 'zod';
import { AppError } from '../../../../shared/errors/app-error.js';

const types = [
  'PASS_FAIL_NA',
  'OPTION',
  'TEXT',
  'INTEGER',
  'DECIMAL',
  'MEASUREMENT',
  'YES_NO',
  'REMARK',
  'TABLE',
  'READ_ONLY_SPECIFICATION',
] as const;
const column = z
  .object({
    key: z.string().regex(/^[A-Za-z0-9_-]+$/),
    label: z.string(),
    dataType: z.enum(types).exclude(['TABLE']),
    unit: z.string().nullable().optional(),
    allowedValues: z.array(z.string()).optional(),
    required: z.boolean(),
  })
  .strict();
export const controlledFormSchema = z
  .object({
    schemaVersion: z.literal(1),
    docCode: z.string(),
    reportRevision: z.string(),
    sourceTitle: z.string(),
    sourceDate: z.string().nullable(),
    headerFields: z.array(
      column.extend({
        receivingKey: z
          .enum([
            'supplier',
            'purchaseOrderNo',
            'itemCode',
            'description',
            'lot',
            'qty',
            'receivingDate',
            'expiryDate',
          ])
          .optional(),
      }),
    ),
    sections: z.array(
      z
        .object({
          code: z.string(),
          title: z.string(),
          points: z.array(
            column.extend({
              dataType: z.enum(types),
              requirementText: z.string().nullable(),
              criticalInspectionPoint: z.boolean().nullable(),
              resultRequired: z.boolean(),
              remarksAllowed: z.boolean(),
              columns: z.array(column).optional(),
              equipmentReference: z.string().optional(),
              accuracyText: z.string().optional(),
            }),
          ),
        })
        .strict(),
    ),
    criticalInspectionColumn: z.boolean().optional(),
    aqlFields: z.array(z.string()),
    resultVocabulary: z.literal('PASS_FAIL_REMARK_NA'),
    finalDisposition: z.array(z.string()),
    reviewResponsibilities: z.array(z.string()),
  })
  .strict()
  .superRefine((form, ctx) => {
    const unique = (keys: string[]) => new Set(keys).size === keys.length;
    if (
      !unique(form.headerFields.map((f) => f.key)) ||
      !unique(form.sections.map((s) => s.code)) ||
      !unique(form.sections.flatMap((s) => s.points).map((p) => p.key))
    )
      ctx.addIssue({ code: 'custom', message: 'Duplicate controlled schema key' });
    for (const point of form.sections.flatMap((s) => s.points))
      if (
        point.dataType === 'TABLE' &&
        (!point.columns?.length || !unique(point.columns.map((c) => c.key)))
      )
        ctx.addIssue({ code: 'custom', message: 'Invalid controlled table' });
  });
export type ControlledForm = z.infer<typeof controlledFormSchema>;
export interface ControlledFormEntry {
  value?: string | boolean;
  result?: 'PASS' | 'FAIL' | 'REMARK' | 'NA';
  remarks?: string;
  sampleLevel?: string;
  sampleSize?: string;
  rows?: Array<Record<string, string | boolean>>;
}
export interface ControlledFormValues {
  headers: Record<string, string | boolean>;
  points: Record<string, ControlledFormEntry>;
  generalRemarks?: string;
  disposition?: string;
}
const valuesSchema = z
  .object({
    headers: z.record(z.string(), z.union([z.string().max(2000), z.boolean()])),
    points: z.record(
      z.string(),
      z
        .object({
          value: z.union([z.string().max(2000), z.boolean()]).optional(),
          result: z.enum(['PASS', 'FAIL', 'REMARK', 'NA']).optional(),
          remarks: z.string().max(2000).optional(),
          sampleLevel: z.string().max(100).optional(),
          sampleSize: z.string().regex(/^\d+$/).max(100).optional(),
          rows: z
            .array(z.record(z.string(), z.union([z.string().max(2000), z.boolean()])))
            .max(1000)
            .optional(),
        })
        .strict(),
    ),
    generalRemarks: z.string().max(4000).optional(),
    disposition: z.string().optional(),
  })
  .strict();
const reject = (): never => {
  throw new AppError('VALIDATION_FAILED', { userSafe: true });
};
function validateScalar(
  field: { dataType: (typeof types)[number]; required: boolean; allowedValues?: string[] },
  value: string | boolean | undefined,
  complete: boolean,
) {
  if (value === undefined || value === '') {
    if (complete && field.required) reject();
    return;
  }
  if (field.dataType === 'READ_ONLY_SPECIFICATION') reject();
  if (field.dataType === 'YES_NO') {
    if (typeof value !== 'boolean') reject();
    return;
  }
  if (typeof value !== 'string') return reject();
  if (
    ['DECIMAL', 'MEASUREMENT'].includes(field.dataType) &&
    !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)
  )
    reject();
  if (field.dataType === 'INTEGER' && !/^[+-]?\d+$/.test(value)) reject();
  if (field.dataType === 'OPTION' && !field.allowedValues?.includes(value)) reject();
}
export function validateControlledFormValues(
  schema: ControlledForm,
  input: unknown,
  complete = false,
): ControlledFormValues {
  const parsed = valuesSchema.safeParse(input);
  if (!parsed.success) return reject();
  const values = parsed.data;
  const writable = new Map(
    schema.headerFields.filter((f) => !f.receivingKey).map((f) => [f.key, f]),
  );
  for (const [key, value] of Object.entries(values.headers)) {
    const field = writable.get(key);
    if (!field) reject();
    else validateScalar(field, value, complete);
  }
  if (complete)
    for (const field of writable.values()) validateScalar(field, values.headers[field.key], true);
  const points = new Map(schema.sections.flatMap((s) => s.points).map((p) => [p.key, p]));
  for (const [key, entry] of Object.entries(values.points)) {
    const point = points.get(key);
    if (!point) return reject();
    if (point.dataType === 'TABLE') {
      if (entry.value !== undefined || (complete && point.required && !entry.rows?.length))
        reject();
      const columns = new Map(point.columns?.map((c) => [c.key, c]) ?? []);
      for (const row of entry.rows ?? []) {
        for (const [columnKey, value] of Object.entries(row)) {
          const c = columns.get(columnKey);
          if (!c) reject();
          else validateScalar(c, value, complete);
        }
        if (complete) for (const c of columns.values()) validateScalar(c, row[c.key], true);
      }
    } else {
      if (entry.rows !== undefined) reject();
      if (point.dataType === 'PASS_FAIL_NA') {
        if (entry.value !== undefined) reject();
      } else if (point.dataType === 'READ_ONLY_SPECIFICATION') {
        if (entry.value !== undefined) reject();
      } else validateScalar(point, entry.value, complete);
    }
    if (
      complete &&
      point.dataType !== 'TABLE' &&
      point.dataType !== 'READ_ONLY_SPECIFICATION' &&
      (!entry.sampleLevel?.trim() || !entry.sampleSize)
    )
      reject();
    if (complete && point.resultRequired && !entry.result) reject();
    if (entry.result === 'REMARK' && !entry.remarks?.trim()) reject();
    if (entry.remarks && !point.remarksAllowed) reject();
  }
  if (complete)
    for (const point of points.values())
      if (
        point.required &&
        point.dataType !== 'READ_ONLY_SPECIFICATION' &&
        !values.points[point.key]
      )
        reject();
  if (complete && schema.finalDisposition.length && !values.disposition) reject();
  if (values.disposition && !schema.finalDisposition.includes(values.disposition)) reject();
  // Disposition is an inspector observation. It never assigns scientific final_result or releases Receiving.
  return values;
}
