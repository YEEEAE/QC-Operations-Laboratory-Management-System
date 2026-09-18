import { getDatabase } from '../../../shared/database/database.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import { PostgresRejectReportRepository } from '../infrastructure/postgres-repository.js';
import { CreateIssueSlipUseCase } from './create-issue-slip.js';
import { UpdateIssueSlipDraftUseCase } from './update-issue-slip-draft.js';
import { IssueIssueSlipUseCase } from './issue-issue-slip.js';
import { ConfirmIssueSlipApprovalUseCase } from './confirm-issue-slip-approval.js';
import { ReverseIssueSlipApprovalUseCase } from './reverse-issue-slip-approval.js';
import { GetIssueSlipUseCase } from './get-issue-slip.js';
import { ListIssueSlipsUseCase } from './list-issue-slips.js';
import { CreateDailyRejectUseCase } from './create-daily-reject.js';
import { UpdateDailyRejectDraftUseCase } from './update-daily-reject-draft.js';
import { FinalizeDailyRejectUseCase } from './finalize-daily-reject.js';
import { GetDailyRejectUseCase } from './get-daily-reject.js';
import { ListDailyRejectsUseCase } from './list-daily-rejects.js';
import { VoidRejectReportUseCase } from './void-reject-report.js';
import { GetRejectDashboardUseCase } from './get-reject-dashboard.js';

export function rejectReportReadDependencies() {
  const repository = new PostgresRejectReportRepository(getDatabase());
  return {
    getIssueSlip: new GetIssueSlipUseCase(repository),
    listIssueSlips: new ListIssueSlipsUseCase(repository),
    getDailyReject: new GetDailyRejectUseCase(repository),
    listDailyRejects: new ListDailyRejectsUseCase(repository),
    dashboard: new GetRejectDashboardUseCase(repository),
  };
}

export function rejectReportActionDependencies() {
  const database = getDatabase();
  const repository = new PostgresRejectReportRepository(
    database,
    new PostgresAuditRepository(database),
    new PostgresOutboxRepository(database),
  );
  return {
    createIssueSlip: new CreateIssueSlipUseCase(repository),
    updateIssueSlipDraft: new UpdateIssueSlipDraftUseCase(repository),
    issueIssueSlip: new IssueIssueSlipUseCase(repository),
    confirmApproval: new ConfirmIssueSlipApprovalUseCase(repository),
    reverseApproval: new ReverseIssueSlipApprovalUseCase(repository),
    createDailyReject: new CreateDailyRejectUseCase(repository),
    updateDailyRejectDraft: new UpdateDailyRejectDraftUseCase(repository),
    finalizeDailyReject: new FinalizeDailyRejectUseCase(repository),
    voidReport: new VoidRejectReportUseCase(repository),
  };
}
