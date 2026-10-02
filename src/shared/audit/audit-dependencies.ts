import { getDatabase } from '../database/database.js';
import { AuditQueryService, type AuditActorLabelResolver } from './audit-query.js';
import { PostgresAuditQuery } from './postgres-audit-query.js';

export function auditQueryDependencies(actorLabels?: AuditActorLabelResolver) {
  return { list: new AuditQueryService(new PostgresAuditQuery(getDatabase()), actorLabels) };
}
