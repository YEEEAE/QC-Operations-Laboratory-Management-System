import type { AuditEventInput } from './audit-event';
export interface AuditRepository {
  append(event: AuditEventInput): Promise<void>;
}
