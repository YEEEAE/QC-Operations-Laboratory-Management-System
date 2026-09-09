/**
 * Presentation-only POST-baseline helpers for mutation forms (F-04 / F-05).
 *
 * These helpers do transport parsing (trimming, FormData access, JSON text
 * parsing) and map Astro Action failures to user-safe summaries. They contain
 * no business rules, no SQL, no policy values, and no authorization logic:
 * server-side reauthorization still happens inside the Astro Action and its
 * use case via `Astro.locals.actor`.
 *
 * Failure mapping is structural on purpose (no `instanceof`): after SSR
 * bundling, runtime constructors are not reliable across the client/server
 * boundary.
 */
export type FormFailureKind =
  'validation' | 'auth' | 'conflict' | 'dependency' | 'unavailable' | 'unknown';

export interface ClassifiedFailure {
  kind: FormFailureKind;
  /** Field names reported by Astro input validation, when available. */
  inputFields: string[];
}

export interface RequiredField {
  name: string;
  label: string;
}

export interface FormFailure {
  kind: FormFailureKind;
  summary: string;
  recovery: string | null;
  fieldErrors: Record<string, string>;
  firstInvalidField: string | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidLike(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

/**
 * Extract the new record id from an Astro Action result without trusting
 * arbitrary shapes. Only uuid-like ids are accepted so redirects stay
 * internal and identifier-shaped. Supports both `{ id }` results and the
 * change-request `{ changeRequest: { id } }` aggregate shape.
 */
export function extractDetailId(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null;
  const record = data as Record<string, unknown>;
  const nested = record.changeRequest;
  const candidate =
    typeof nested === 'object' && nested !== null
      ? (nested as Record<string, unknown>).id
      : record.id;
  return isUuidLike(candidate) ? candidate : null;
}

/** Trimmed string value, or an empty string when absent. */
export function field(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

/** Trimmed string value, or `undefined` when blank. */
export function optionalField(formData: FormData, key: string): string | undefined {
  const value = field(formData, key);
  return value ? value : undefined;
}

/**
 * Date value for an optional date/datetime input. Blank stays `undefined`
 * (so optional schemas are not tripped); unparseable text becomes an
 * Invalid Date, which the Action input schema rejects as a validation
 * failure instead of silently coercing.
 */
export function optionalDate(formData: FormData, key: string): Date | undefined {
  const value = field(formData, key);
  if (!value) return undefined;
  return new Date(value);
}

/**
 * Transport-level validation signal for values that cannot even be shaped
 * into Action input (non-numeric bigint text, malformed JSON text).
 * Carries the field name so the form can highlight it.
 */
export class TransportValidationError extends Error {
  readonly field: string;
  constructor(field: string) {
    super(`transport validation failed: ${field}`);
    this.name = 'TransportValidationError';
    this.field = field;
  }
}

export function parseBigintField(text: string, fieldName: string): bigint {
  try {
    return BigInt(text.trim());
  } catch {
    throw new TransportValidationError(fieldName);
  }
}

/** Parse a required JSON-object textarea (change-request snapshot). */
export function parseJsonField(text: string, fieldName: string): Record<string, unknown> {
  const trimmed = text.trim();
  if (!trimmed) throw new TransportValidationError(fieldName);
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new TransportValidationError(fieldName);
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof TransportValidationError) throw error;
    throw new TransportValidationError(fieldName);
  }
}

/**
 * Parse a free-form value textarea (change-request current/proposed value):
 * blank stays `undefined`, JSON parses to its value, anything else is kept
 * as the literal string the operator typed.
 */
export function parseJsonValue(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

function messageOf(error: unknown): string {
  if (typeof error !== 'object' || error === null) return '';
  const message = (error as { message?: unknown }).message;
  const code = (error as { code?: unknown }).code;
  const parts: string[] = [];
  if (typeof message === 'string') parts.push(message);
  if (typeof code === 'string') parts.push(code);
  return parts.join(' ').toLowerCase();
}

function inputFieldNames(error: unknown): string[] {
  if (typeof error !== 'object' || error === null) return [];
  const candidate = error as { type?: unknown; fields?: unknown; issues?: unknown };
  if (candidate.type !== 'AstroActionInputError') return [];
  if (candidate.fields && typeof candidate.fields === 'object') {
    return Object.keys(candidate.fields);
  }
  if (Array.isArray(candidate.issues)) {
    const names = new Set<string>();
    for (const issue of candidate.issues) {
      const path = (issue as { path?: unknown }).path;
      if (Array.isArray(path) && typeof path[0] === 'string') names.add(path[0]);
    }
    return [...names];
  }
  return [];
}

export function classifyFailure(error: unknown): ClassifiedFailure {
  if (error instanceof TransportValidationError) {
    return { kind: 'validation', inputFields: [error.field] };
  }
  const fields = inputFieldNames(error);
  if (fields.length > 0) return { kind: 'validation', inputFields: fields };
  const message = messageOf(error);
  if (/auth|permission|sod|denied|reauth|session|unauthorized|forbidden/.test(message)) {
    return { kind: 'auth', inputFields: [] };
  }
  if (/conflict|duplicate|already.exists|already_exists|stale/.test(message)) {
    return { kind: 'conflict', inputFields: [] };
  }
  if (/not.found|not_found|unknown|dependency|no such|does not exist/.test(message)) {
    return { kind: 'dependency', inputFields: [] };
  }
  if (/validation|invalid|required|uuid|input|format|too large|too_large/.test(message)) {
    return { kind: 'validation', inputFields: [] };
  }
  if (/unavailable|timeout|system_|internal|try again|temporar/.test(message)) {
    return { kind: 'unavailable', inputFields: [] };
  }
  return { kind: 'unknown', inputFields: [] };
}

export interface FailureCopyInput {
  /** Singular entity noun, e.g. "Task". Lowercased automatically where needed. */
  entity: string;
  requiredFields: readonly RequiredField[];
  /** Retained raw values keyed by field name. */
  values: Record<string, string>;
  listHref: string;
  listLabel: string;
}

const lowerFirst = (value: string): string =>
  value ? value.charAt(0).toLowerCase() + value.slice(1) : value;

export function toFormFailure(error: unknown, input: FailureCopyInput): FormFailure {
  const { kind, inputFields } = classifyFailure(error);
  const entity = lowerFirst(input.entity);
  const labelOf = (name: string): string =>
    input.requiredFields.find((item) => item.name === name)?.label ?? name;

  const fieldErrors: Record<string, string> = {};
  if (kind === 'validation') {
    for (const name of inputFields) {
      fieldErrors[name] = `Check the ${labelOf(name)}.`;
    }
    if (inputFields.length === 0) {
      for (const { name } of input.requiredFields) {
        if (!input.values[name]) fieldErrors[name] = 'This field is required.';
      }
    }
  }

  let summary: string;
  let recovery: string | null;
  switch (kind) {
    case 'validation':
      summary = `This ${entity} could not be created. Review the highlighted fields and try again.`;
      recovery =
        Object.keys(fieldErrors).length === 0
          ? 'If every field looks correct, check formats such as dates, numbers, and identifiers, then try again.'
          : null;
      break;
    case 'auth':
      summary = `You are not authorized to create this ${entity}.`;
      recovery = 'This action needs an explicit permission. Your entries are preserved below.';
      break;
    case 'conflict':
      summary = `This ${entity} conflicts with an existing record.`;
      recovery =
        'A record with the same identifying number may already exist. Change the number, or check the list before trying again. Your other entries are preserved below.';
      break;
    case 'dependency':
      summary = 'A referenced record could not be found.';
      recovery =
        'Verify the equipment, template, or target identifier and try again. Your entries are preserved below.';
      break;
    case 'unavailable':
      summary = 'The service is temporarily unavailable.';
      recovery = 'Nothing was saved. Your entries are preserved below — try again in a moment.';
      break;
    default:
      summary = `This ${entity} could not be created.`;
      recovery = 'Your entries are preserved below. Try again, or return to the list.';
      break;
  }

  const ordered = [...input.requiredFields.map((item) => item.name), ...Object.keys(fieldErrors)];
  const firstInvalidField = ordered.find((name) => fieldErrors[name]) ?? null;

  return { kind, summary, recovery, fieldErrors, firstInvalidField };
}

export function detailHref(listHref: string, id: string): string {
  return `${listHref}/${id}`;
}
