import { authorize } from '../authorization/authorize.js';
import type { ActorContext } from '../authorization/types.js';
import { AppError } from '../errors/app-error.js';

export interface AuditQueryFilter {
  subjectType?: string;
  subjectId?: string;
  actorId?: string;
  action?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}
export interface AuditEventView {
  id: string;
  eventNo: bigint;
  occurredAt: Date;
  actorType: 'USER' | 'SYSTEM' | 'SERVICE';
  actorId?: string;
  subjectType: string;
  subjectId: string;
  action: string;
  oldState?: string;
  newState?: string;
  reason?: string;
  requestId: string;
  signatureId?: string;
}
export interface AuditQueryResult {
  events: AuditEventView[];
  total: number;
  limit: number;
  offset: number;
}
export interface AuditQuery {
  list(actor: ActorContext, filter: AuditQueryFilter): Promise<AuditQueryResult>;
}

/**
 * Canonical audit-read contract (F-07).
 *
 * Both the Dashboard Recent Activity timeline and the /audit history page read
 * audit history through this contract:
 * - same filter semantics (subject/actor/action/time window),
 * - same stable order (occurred_at DESC, event_no DESC),
 * - same allowlist view mapping (never payload/secrets),
 * - same pagination semantics (limit clamped 1..100, offset >= 0,
 *   total = full matching count, not page length).
 *
 * The two surfaces intentionally keep different authorization predicates:
 * - Dashboard shell requires a DASH permission and its activity timeline is
 *   additionally scoped to the actor's own events (actor_id = actor.id), so no
 *   cross-actor history leaks without audit permission.
 * - /audit requires the explicit PERM-ADM-AUDIT-VIEW permission and exposes
 *   the full filter set.
 * A qualifying event (actor's own event, actor holding both permissions) is
 * therefore visible identically on both surfaces; any other divergence is
 * policy, not drift. Denied queries throw AUTHZ_* and delivery pages map the
 * denial to the same empty state as "no matching events" so that existence of
 * history is never leaked through error codes.
 */
export const AUDIT_QUERY_DEFAULT_LIMIT = 50;
export const AUDIT_QUERY_MAX_LIMIT = 100;

export type NormalizedAuditQueryFilter = {
  subjectType?: string;
  subjectId?: string;
  actorId?: string;
  action?: string;
  from?: Date;
  to?: Date;
  limit: number;
  offset: number;
};

function cleanText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim().slice(0, 200);
  return trimmed.length ? trimmed : undefined;
}

export function normalizeAuditQueryFilter(filter: AuditQueryFilter): NormalizedAuditQueryFilter {
  const limit = Number.isFinite(filter.limit)
    ? Math.min(AUDIT_QUERY_MAX_LIMIT, Math.max(1, Math.floor(filter.limit as number)))
    : AUDIT_QUERY_DEFAULT_LIMIT;
  const offset = Number.isFinite(filter.offset)
    ? Math.max(0, Math.floor(filter.offset as number))
    : 0;
  const from = filter.from instanceof Date && !Number.isNaN(filter.from.getTime()) ? filter.from : undefined;
  const to = filter.to instanceof Date && !Number.isNaN(filter.to.getTime()) ? filter.to : undefined;
  return {
    subjectType: cleanText(filter.subjectType),
    subjectId: cleanText(filter.subjectId),
    actorId: cleanText(filter.actorId),
    action: cleanText(filter.action),
    from,
    to,
    limit,
    offset,
  };
}

/** Raw database shape (snake_case). Includes payload, which must never reach views. */
export interface AuditEventRow {
  id: string;
  event_no: bigint | number | string;
  occurred_at: Date | string;
  actor_type: string;
  actor_id: string | null;
  subject_type: string;
  subject_id: string;
  action: string;
  old_state: string | null;
  new_state: string | null;
  reason: string | null;
  request_id: string;
  signature_id: string | null;
}

function toBigint(value: bigint | number | string): bigint {
  if (typeof value === 'bigint') return value;
  return BigInt(value);
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Allowlist mapper: the only path from a stored audit row to a readable view.
 * Picks safe scalar fields; payload and any secret-bearing column are dropped
 * structurally (the view type has no payload member at all).
 */
export function mapAuditRowToView(row: AuditEventRow): AuditEventView {
  const actorType = row.actor_type === 'SYSTEM' || row.actor_type === 'SERVICE' ? row.actor_type : 'USER';
  return {
    id: String(row.id),
    eventNo: toBigint(row.event_no),
    occurredAt: toDate(row.occurred_at),
    actorType,
    actorId: row.actor_id == null ? undefined : String(row.actor_id),
    subjectType: String(row.subject_type),
    subjectId: String(row.subject_id),
    action: String(row.action),
    oldState: row.old_state ?? undefined,
    newState: row.new_state ?? undefined,
    reason: row.reason ?? undefined,
    requestId: String(row.request_id),
    signatureId: row.signature_id == null ? undefined : String(row.signature_id),
  };
}

export class AuditQueryService {
  constructor(private readonly repository: AuditQuery) {}
  async list(actor: ActorContext, filter: AuditQueryFilter): Promise<AuditQueryResult> {
    const decision = authorize({
      actor,
      permission: 'PERM-ADM-AUDIT-VIEW',
      action: 'VIEW',
      entity: { type: 'AUDIT_EVENT', id: actor.id, state: 'ACTIVE', domain: 'AUDIT' },
      scope: { domain: 'AUDIT' },
      currentVersion: 1,
      expectedVersion: 1,
      businessCondition: true,
    });
    if (!decision.allowed) throw new AppError(decision.code ?? 'AUTHZ_DENIED');
    const normalized = normalizeAuditQueryFilter(filter);
    return this.repository.list(actor, normalized);
  }
}
