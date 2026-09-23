import { assertSafeAuditPayload, assertSafeAuditText, type AuditEventInput } from './audit-event';
import type { AuditRepository } from './audit-repository';
export class AuditService {
  constructor(private readonly repository: AuditRepository) {}
  async record(event: AuditEventInput): Promise<void> {
    assertSafeAuditPayload(event.payload);
    assertSafeAuditText(event.reason);
    await this.repository.append(event);
  }
}
