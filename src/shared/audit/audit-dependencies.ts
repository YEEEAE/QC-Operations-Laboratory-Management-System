import { getDatabase } from '../database/database.js';
import { AuditQueryService } from './audit-query.js';
import { PostgresAuditQuery } from './postgres-audit-query.js';

export function auditQueryDependencies() {
  return { list: new AuditQueryService(new PostgresAuditQuery(getDatabase())) };
}
