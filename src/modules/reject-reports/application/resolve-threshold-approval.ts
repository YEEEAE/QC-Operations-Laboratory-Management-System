import type { ActorContext } from '../../../shared/authorization/types.js';
import type { DatabaseTransaction } from '../../../shared/database/transaction.js';
import type { RejectReportRepository } from '../ports/repository.js';

export class ResolveThresholdApprovalUseCase {
  constructor(private readonly repository: RejectReportRepository) {}
  execute(input: { entryId: string; expectedVersion: bigint; actor: ActorContext;
    action: 'APPROVE' | 'REJECT' | 'RETURN'; reason?: string; requestId: string;
    transaction: DatabaseTransaction }) {
    return this.repository.resolveThresholdApproval(input);
  }
}
