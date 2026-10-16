import { z } from 'zod';
import { AppError } from '../../../../shared/errors/app-error.js';

/**
 * Controlled digital form schema.
 *
 * schemaVersion 1 — verbatim transcription of a controlled paper report. The
 *   field vocabulary is intentionally narrow because the paper form defines it.
 * schemaVersion 2 — authoring shape. Adds the field types and per-field metadata
 *   an in-system author needs (dates, multi-line text, presentation choice,
 *   numeric bounds, validation rules, conditional visibility, specification
 *   links) plus the referential field types whose values must be verified
 *   against server-owned records.
 *
 * v1 semantics are unchanged. A record written under v1 keeps meaning exactly as
 * before; v2 is opt-in per template version.
 */
export const CONTROLLED_FORM_V1_TYPES = [
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

export const CONTROLLED_FORM_V2_ONLY_TYPES = [
  'TEXT_MULTILINE',
  'DATE',
  'DOCUMENT_REFERENCE',
  'EQUIPMENT_REFERENCE',
  'FILE_EVIDENCE',
] as const;

export const CONTROLLED_FORM_TYPES = [
  ...CONTROLLED_FORM_V1_TYPES,
  ...CONTROLLED_FORM_V2_ONLY_TYPES,
] as const;

export type ControlledFormType = (typeof CONTROLLED_FORM_TYPES)[number];

/** Field types whose value is a reference that only the server can resolve. */
export const REFERENTIAL_FIELD_TYPES = [
  'DOCUMENT_REFERENCE',
  'EQUIPMENT_REFERENCE',
  'FILE_EVIDENCE',
] as const;
type ReferentialFieldType = (typeof REFERENTIAL_FIELD_TYPES)[number];

const RECEIVING_KEYS = [
  'supplier',
  'purchaseOrderNo',
  'itemCode',
  'description',
  'lot',
  'qty',
  'receivingDate',
  'expiryDate',
] as const;

const KEY_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * v2-only per-field metadata. Every property here is either enforced at
 * validation time (minValue, maxValue, validationPattern) or displayed to the
 * inspector (description, relatedSpecification). Reserved-but-unexecuted
 * authoring properties are deliberately not part of the schema: storing a
 * default value or a conditional-visibility expression the runtime ignores
 * would misrepresent the inspection record.
 */
const v2ColumnMetadata = {
  description: z.string().max(2000).optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  validationPattern: z.string().max(500).optional(),
  relatedSpecification: z.string().max(500).optional(),
};

function buildColumn(types: readonly [string, ...string[]], withMetadata: boolean) {
  const base = z.object({
    key: z.string().regex(KEY_PATTERN),
    label: z.string(),
    dataType: z.enum(types).exclude(['TABLE']),
    unit: z.string().nullable().optional(),
    allowedValues: z.array(z.string()).optional(),
    required: z.boolean(),
  });
  return (withMetadata ? base.extend(v2ColumnMetadata) : base).strict();
}

function buildPoint(types: readonly [string, ...string[]], withMetadata: boolean) {
  const metadata = {
    requirementText: z.string().nullable(),
    criticalInspectionPoint: z.boolean().nullable(),
    resultRequired: z.boolean(),
    remarksAllowed: z.boolean(),
    columns: z.array(buildColumn(types, withMetadata)).optional(),
    equipmentReference: z.string().optional(),
    accuracyText: z.string().optional(),
  };
  const base = z.object({
    key: z.string().regex(KEY_PATTERN),
    label: z.string(),
    dataType: z.enum(types),
    unit: z.string().nullable().optional(),
    allowedValues: z.array(z.string()).optional(),
    required: z.boolean(),
    ...metadata,
  });
  return (withMetadata ? base.extend(v2ColumnMetadata) : base).strict();
}

function buildControlledForm(schemaVersion: 1 | 2) {
  const types =
    schemaVersion === 1
      ? ([...CONTROLLED_FORM_V1_TYPES] as unknown as readonly [string, ...string[]])
      : ([...CONTROLLED_FORM_TYPES] as unknown as readonly [string, ...string[]]);
  const withMetadata = schemaVersion === 2;
  const column = buildColumn(types, withMetadata);
  const point = buildPoint(types, withMetadata);
  return z
    .object({
      schemaVersion: z.literal(schemaVersion),
      docCode: z.string(),
      reportRevision: z.string(),
      sourceTitle: z.string(),
      sourceDate: z.string().nullable(),
      headerFields: z.array(
        column.extend({
          receivingKey: z.enum(RECEIVING_KEYS).optional(),
        }),
      ),
      sections: z.array(
        z
          .object({
            code: z.string(),
            title: z.string(),
            points: z.array(point),
          })
          .strict(),
      ),
      criticalInspectionColumn: z.boolean().optional(),
      aqlFields: z.array(z.string()),
      resultVocabulary: z.literal('PASS_FAIL_REMARK_NA'),
      finalDisposition: z.array(z.string()),
      reviewResponsibilities: z.array(z.string()),
    })
    .strict();
}

const controlledFormV1Schema = buildControlledForm(1);
const controlledFormV2Schema = buildControlledForm(2);

export type ControlledFormV1 = z.infer<typeof controlledFormV1Schema>;
export type ControlledFormV2 = z.infer<typeof controlledFormV2Schema>;

export const controlledFormSchema = z
  .discriminatedUnion('schemaVersion', [controlledFormV1Schema, controlledFormV2Schema])
  .superRefine((raw, ctx) => {
    const form = normalizeForm(raw);
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
    if (form.schemaVersion !== 2) return;
    const everyField: AnyField[] = [
      ...form.headerFields,
      ...form.sections.flatMap((s) => s.points),
      ...form.sections.flatMap((s) => s.points.flatMap((p) => p.columns ?? [])),
    ];
    for (const field of everyField) {
      if (field.validationPattern !== undefined && !isCompilablePattern(field.validationPattern))
        ctx.addIssue({ code: 'custom', message: 'Invalid validation pattern' });
      if (field.minValue !== undefined && field.maxValue !== undefined && field.minValue > field.maxValue)
        ctx.addIssue({ code: 'custom', message: 'Invalid numeric bound' });
      if (
        (field.minValue !== undefined || field.maxValue !== undefined) &&
        !['INTEGER', 'DECIMAL', 'MEASUREMENT'].includes(field.dataType)
      )
        ctx.addIssue({ code: 'custom', message: 'Numeric bounds require a numeric field' });
      if (field.dataType === 'OPTION' && !field.allowedValues?.length)
        ctx.addIssue({ code: 'custom', message: 'List fields require accepted values' });
    }
  });

export type ControlledForm = z.infer<typeof controlledFormSchema>;

/** Normalized field view shared by both schema versions. */
interface ScalarField {
  dataType: string;
  required: boolean;
  allowedValues?: string[] | undefined;
  validationPattern?: string | undefined;
  minValue?: number | undefined;
  maxValue?: number | undefined;
}
interface AnyField extends ScalarField {
  key: string;
  description?: string | undefined;
  relatedSpecification?: string | undefined;
}
interface AnyPoint extends AnyField {
  requirementText: string | null;
  resultRequired: boolean;
  remarksAllowed: boolean;
  columns?: AnyField[] | undefined;
}

/**
 * Widened structural view of a validated form.
 *
 * `controlledFormSchema` is a discriminated union, so TypeScript only exposes
 * members common to both versions. The schema itself remains the single source
 * of truth; this view only lets the validators read optional v2 metadata without
 * duplicating the schema per version.
 */
interface NormalizedForm {
  schemaVersion: 1 | 2;
  docCode: string;
  reportRevision: string;
  headerFields: Array<AnyField & { receivingKey?: string | undefined }>;
  sections: Array<{ code: string; title: string; points: AnyPoint[] }>;
  finalDisposition: string[];
}

function normalizeForm(form: ControlledForm): NormalizedForm {
  return form as unknown as NormalizedForm;
}

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

/**
 * Server-owned resolution for referential field values. When a value is present
 * for a referential field type and no verifier is supplied, validation fails
 * closed: a browser string is never accepted as proof that a document,
 * equipment item or evidence file exists.
 */
export interface ControlledFieldVerifiers {
  DOCUMENT_REFERENCE?: (reference: string) => boolean;
  EQUIPMENT_REFERENCE?: (reference: string) => boolean;
  FILE_EVIDENCE?: (reference: string) => boolean;
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

const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
const INTEGER = /^[+-]?\d+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  if (month < 1 || month > 12 || day < 1) return false;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function compileAuthorPattern(pattern: string): RegExp {
  try {
    return new RegExp(pattern);
  } catch {
    return reject();
  }
}

/** Schema-time check: an author-supplied pattern must be compilable. */
function isCompilablePattern(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

function validateScalar(
  field: ScalarField,
  value: string | boolean | undefined,
  complete: boolean,
  verifiers: ControlledFieldVerifiers,
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

  if ((REFERENTIAL_FIELD_TYPES as readonly string[]).includes(field.dataType)) {
    const verifier = verifiers[field.dataType as ReferentialFieldType];
    // Fail closed: an unresolvable reference is never trusted.
    if (!verifier || !verifier(value)) reject();
    return;
  }

  if (['DECIMAL', 'MEASUREMENT'].includes(field.dataType) && !DECIMAL.test(value)) reject();
  if (field.dataType === 'INTEGER' && !INTEGER.test(value)) reject();
  if (field.dataType === 'DATE' && !isRealIsoDate(value)) reject();
  if (field.dataType === 'OPTION' && !field.allowedValues?.includes(value)) reject();

  if (field.validationPattern !== undefined && !compileAuthorPattern(field.validationPattern).test(value))
    reject();

  if (field.minValue !== undefined || field.maxValue !== undefined) {
    if (!['INTEGER', 'DECIMAL', 'MEASUREMENT'].includes(field.dataType)) reject();
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) reject();
    if (field.minValue !== undefined && numeric < field.minValue) reject();
    if (field.maxValue !== undefined && numeric > field.maxValue) reject();
  }
}

export function validateControlledFormValues(
  schema: ControlledForm,
  input: unknown,
  complete = false,
  verifiers: ControlledFieldVerifiers = {},
): ControlledFormValues {
  const form = normalizeForm(schema);
  const parsed = valuesSchema.safeParse(input);
  if (!parsed.success) return reject();
  const values = parsed.data;
  const writable = new Map(
    form.headerFields.filter((f) => !f.receivingKey).map((f) => [f.key, f]),
  );
  for (const [key, value] of Object.entries(values.headers)) {
    const field = writable.get(key);
    if (!field) reject();
    else validateScalar(field, value, complete, verifiers);
  }
  if (complete)
    for (const field of writable.values())
      validateScalar(field, values.headers[field.key], true, verifiers);
  const points = new Map(form.sections.flatMap((s) => s.points).map((p) => [p.key, p]));
  for (const [key, entry] of Object.entries(values.points)) {
    const point = points.get(key);
    if (!point) return reject();
    if (point.dataType === 'TABLE') {
      if (entry.value !== undefined || (complete && point.required && !entry.rows?.length))
        reject();
      const columns = new Map<string, AnyField>((point.columns ?? []).map((c) => [c.key, c]));
      for (const row of entry.rows ?? []) {
        for (const [columnKey, value] of Object.entries(row)) {
          const c = columns.get(columnKey);
          if (!c) reject();
          else validateScalar(c, value, complete, verifiers);
        }
        if (complete)
          for (const [columnKey, c] of columns) validateScalar(c, row[columnKey], true, verifiers);
      }
    } else {
      if (entry.rows !== undefined) reject();
      if (point.dataType === 'PASS_FAIL_NA') {
        if (entry.value !== undefined) reject();
      } else if (point.dataType === 'READ_ONLY_SPECIFICATION') {
        if (entry.value !== undefined) reject();
      } else validateScalar(point, entry.value, complete, verifiers);
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
  if (complete && form.finalDisposition.length && !values.disposition) reject();
  if (values.disposition && !form.finalDisposition.includes(values.disposition)) reject();
  // Disposition is an inspector observation. It never assigns scientific final_result or releases Receiving.
  return values;
}
