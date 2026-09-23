import { AppError } from '../errors/app-error';
export interface AuditEventInput {
  actorType: 'USER' | 'SYSTEM' | 'SERVICE';
  actorId?: string;
  subjectType: string;
  subjectId: string;
  action: string;
  transitionId?: string;
  oldState?: string;
  newState?: string;
  reason?: string;
  requestId: string;
  signatureId?: string;
  payload?: Record<string, unknown>;
}
const forbidden = /password|token|secret|cookie|authorization/i;
const personalDataKey =
  /(?:^|_)(?:email|e_mail|phone|telephone|mobile|address|name|date_of_birth|birth_date|national_id|ssn)(?:_|$)/i;
const forbiddenValue =
  /(?:\b(?:bearer|basic)\s+\S+|\b(?:password|passphrase|token|secret|api[_-]?key|authorization)\s*[:=]\s*\S+|-----BEGIN [A-Z ]*PRIVATE KEY-----|\beyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)/i;

/** Technical bounds shared by audit writes and read/export projections. */
export const AUDIT_PAYLOAD_LIMITS = Object.freeze({
  maxDepth: 8,
  maxNodes: 1_000,
  maxArrayLength: 100,
  maxObjectKeys: 100,
  maxStringLength: 4_096,
  maxBytes: 16_384,
});

function rejectAuditPayload(): never {
  // Never include the rejected key/value in the error; it may itself be sensitive.
  throw new AppError('VALIDATION_FAILED');
}

/** Applies the same sensitive-value checks to the separately stored reason. */
export function assertSafeAuditText(value: string | undefined): void {
  if (value === undefined) return;
  if (
    typeof value !== 'string' ||
    value.length > AUDIT_PAYLOAD_LIMITS.maxStringLength ||
    forbiddenValue.test(value)
  )
    rejectAuditPayload();
}

/**
 * Rejects rather than redacts: payload fields are audit evidence, so silently
 * removing a field could make the event misleading. This deliberately accepts
 * JSON data only and does not mutate valid input.
 */
export function assertSafeAuditPayload(
  payload: unknown,
): asserts payload is Record<string, unknown> | undefined {
  if (payload === undefined) return;
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload))
    rejectAuditPayload();

  const ancestors = new WeakSet<object>();
  let nodes = 0;
  const visit = (value: unknown, depth: number, key?: string): void => {
    nodes += 1;
    if (nodes > AUDIT_PAYLOAD_LIMITS.maxNodes || depth > AUDIT_PAYLOAD_LIMITS.maxDepth)
      rejectAuditPayload();
    if (key) {
      const normalizedKey = key
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[.-]/g, '_')
        .toLowerCase();
      if (forbidden.test(key) || personalDataKey.test(normalizedKey)) rejectAuditPayload();
    }
    if (typeof value === 'string') {
      if (value.length > AUDIT_PAYLOAD_LIMITS.maxStringLength || forbiddenValue.test(value))
        rejectAuditPayload();
      return;
    }
    if (value === null || typeof value === 'boolean') return;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) rejectAuditPayload();
      return;
    }
    if (typeof value !== 'object') rejectAuditPayload();
    if (ancestors.has(value)) rejectAuditPayload();
    ancestors.add(value);
    if (Array.isArray(value)) {
      if (value.length > AUDIT_PAYLOAD_LIMITS.maxArrayLength) rejectAuditPayload();
      for (let index = 0; index < value.length; index += 1) {
        if (!(index in value)) rejectAuditPayload();
        visit(value[index], depth + 1);
      }
    } else {
      const prototype = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype !== null) rejectAuditPayload();
      const entries = Object.entries(value);
      if (entries.length > AUDIT_PAYLOAD_LIMITS.maxObjectKeys) rejectAuditPayload();
      for (const [childKey, childValue] of entries) visit(childValue, depth + 1, childKey);
    }
    ancestors.delete(value);
  };

  visit(payload, 0);
  let serialized: string;
  try {
    serialized = JSON.stringify(payload);
  } catch {
    rejectAuditPayload();
  }
  if (Buffer.byteLength(serialized, 'utf8') > AUDIT_PAYLOAD_LIMITS.maxBytes) rejectAuditPayload();
}
