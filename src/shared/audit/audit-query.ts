import { authorize } from '../authorization/authorize.js';
import type { ActorContext } from '../authorization/types.js';
import { AppError } from '../errors/app-error.js';

export interface AuditQueryFilter { subjectType?: string; subjectId?: string; actorId?: string; action?: string; from?: Date; to?: Date; limit?: number; }
export interface AuditEventView { id: string; eventNo: bigint; occurredAt: Date; actorType: 'USER' | 'SYSTEM' | 'SERVICE'; actorId?: string; subjectType: string; subjectId: string; action: string; oldState?: string; newState?: string; reason?: string; requestId: string; signatureId?: string; }
export interface AuditQueryResult { events: AuditEventView[]; total: number; }
export interface AuditQuery { list(actor: ActorContext, filter: AuditQueryFilter): Promise<AuditQueryResult>; }

export class AuditQueryService {
  constructor(private readonly repository: AuditQuery) {}
  async list(actor: ActorContext, filter: AuditQueryFilter): Promise<AuditQueryResult> {
    const decision = authorize({ actor, permission: 'PERM-ADM-AUDIT-VIEW', action: 'VIEW', entity: { type: 'AUDIT_EVENT', id: actor.id, state: 'ACTIVE', domain: 'AUDIT' }, scope: { domain: 'AUDIT' }, currentVersion: 1, expectedVersion: 1, businessCondition: true });
    if (!decision.allowed) throw new AppError(decision.code ?? 'AUTHZ_DENIED');
    return this.repository.list(actor, { ...filter, limit: Math.min(100, Math.max(1, filter.limit ?? 50)) });
  }
}
